#!/bin/bash
#
# workflow-auto.sh
# 自动执行 workflow-next → workflow-review → workflow-verify 循环
# 每个步骤使用 claude -p 独立会话，避免上下文累积导致质量下降
#
# 注意：每个步骤可能需要 5-15 分钟，期间终端无输出是正常的
#       日志会在步骤完成后一次性写入
#
# 用法: bash workflow-auto.sh
# 停止: Ctrl+C
#

set -uo pipefail

FEATURE_LIST=".claude-workflow/feature_list.json"
LOG_DIR=".claude-workflow/auto-logs"
MAX_RETRY=2
STEP_INTERVAL=10
RETRY_INTERVAL=30
MAX_CONSECUTIVE_FAILURES=3

mkdir -p "$LOG_DIR"

if [ ! -f "$FEATURE_LIST" ]; then
  echo "错误: 未找到 $FEATURE_LIST，请先运行 /workflow-init"
  exit 1
fi

log_file="$LOG_DIR/auto-$(date '+%Y%m%d-%H%M%S').log"

log() {
  local level=$1
  local message=$2
  local timestamp=$(date '+%H:%M:%S')
  echo "[$timestamp] [$level] $message" | tee -a "$log_file"
}

# 从 feature_list.json 解析当前工作流状态
# 输出格式: COMMAND|FEAT_ID|DESCRIPTION
get_workflow_status() {
  PYTHONIOENCODING=utf-8 python -c "
import json, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
try:
    data = json.load(open('$FEATURE_LIST', encoding='utf-8'))
except Exception as e:
    print(f'ERROR|_|解析失败: {e}')
    sys.exit(0)

features = data.get('features', [])
in_progress = [f for f in features if f.get('status') == 'in_progress']
pending = [f for f in features if f.get('status') == 'pending']
completed_count = len([f for f in features if f.get('status') in ('completed', 'passed')])
total_count = len(features)

if not in_progress and not pending:
    print(f'ALL_DONE|_|全部完成 ({completed_count}/{total_count})')
elif in_progress:
    feat = in_progress[0]
    fid = feat['id']
    desc = feat.get('description', '')
    review = feat.get('review', {}).get('status')
    if review == 'passed':
        cmd = 'workflow-verify'
    else:
        cmd = 'workflow-review'
    print(f'{cmd}|{fid}|{desc}')
elif pending:
    feat = pending[0]
    fid = feat['id']
    desc = feat.get('description', '')
    print(f'workflow-next|{fid}|{desc}')
" 2>&1
}

# 显示当前工作流状态（带格式）
show_status() {
  local status_line
  status_line=$(get_workflow_status)
  local cmd=$(echo "$status_line" | cut -d'|' -f1)
  local feat_id=$(echo "$status_line" | cut -d'|' -f2)
  local feat_desc=$(echo "$status_line" | cut -d'|' -f3)

  # 获取进度统计
  local stats
  stats=$(PYTHONIOENCODING=utf-8 python -c "
import json, io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
data = json.load(open('$FEATURE_LIST', encoding='utf-8'))
features = data.get('features', [])
done = len([f for f in features if f.get('status') in ('completed', 'passed')])
print(f'{done}/{len(features)}')
" 2>/dev/null || echo "?/?")

  echo "" | tee -a "$log_file"
  echo "┌─────────────────────────────────────────────" | tee -a "$log_file"
  if [ "$cmd" = "ALL_DONE" ]; then
    echo "│  状态: ALL DONE" | tee -a "$log_file"
    echo "│  进度: $stats" | tee -a "$log_file"
  else
    echo "│  命令: /$cmd" | tee -a "$log_file"
    echo "│  FEAT: $feat_id" | tee -a "$log_file"
    echo "│  内容: $feat_desc" | tee -a "$log_file"
    echo "│  进度: $stats" | tee -a "$log_file"
  fi
  echo "└─────────────────────────────────────────────" | tee -a "$log_file"
  echo "" | tee -a "$log_file"
}

echo ""
echo "========================================"
echo "  Workflow Auto Runner"
echo "  每个步骤约需 5-15 分钟，请耐心等待"
echo "  日志目录: $LOG_DIR"
echo "========================================"
echo ""

log "INFO" "开始自动执行 workflow"
show_status

step=0
fail_count=0

while true; do
  # 解析当前状态
  status_line=$(get_workflow_status)
  current_cmd=$(echo "$status_line" | cut -d'|' -f1)
  current_feat=$(echo "$status_line" | cut -d'|' -f2)
  current_desc=$(echo "$status_line" | cut -d'|' -f3)

  if [ "$current_cmd" = "ALL_DONE" ]; then
    show_status
    log "SUCCESS" "所有 FEAT 已完成！"
    exit 0
  fi

  step=$((step + 1))
  log "INFO" "=== 步骤 #$step: /$current_cmd ($current_feat) ==="

  retry=0
  ok=false
  step_log="$LOG_DIR/step-${step}-${current_feat}-$(date '+%Y%m%d-%H%M%S').log"

  while [ $retry -le $MAX_RETRY ]; do
    if [ $retry -gt 0 ]; then
      log "WARNING" "重试第 $retry 次..."
      sleep $RETRY_INTERVAL
    fi

    # 将 prompt 写入临时文件
    PROMPT_FILE=$(mktemp)
    cat > "$PROMPT_FILE" << 'PROMPT_EOF'
请按以下步骤操作：

1. 读取 .claude-workflow/feature_list.json，判断当前工作流状态
2. 根据状态执行对应的 workflow 命令（只执行一个）：
   - 如果有 status 为 pending 的 FEAT 且没有正在进行的 FEAT → 执行 /workflow-next
   - 如果当前 FEAT 的代码已实现待审查 → 执行 /workflow-review
   - 如果当前 FEAT 已审查待验证 → 执行 /workflow-verify
   - 如果所有 FEAT 都已完成（completed 或 passed）→ 只输出 ALL_DONE 不执行任何命令

注意：只执行一个命令，不要连续执行多个。
PROMPT_EOF

    RUN_START=$(date +%s)
    show_status
    log "INFO" "开始执行 /$current_cmd ($current_feat)... (预计 5-15 分钟，期间无输出是正常的)"

    if claude -p \
      --dangerously-skip-permissions \
      --allowed-tools "Bash Edit Read Write Glob Grep Agent Skill TaskCreate TaskGet TaskList TaskUpdate WebSearch WebFetch mcp__pencil__*" \
      < "$PROMPT_FILE" > "$step_log" 2>&1; then

      RUN_END=$(date +%s)
      RUN_DURATION=$((RUN_END - RUN_START))
      MINUTES=$((RUN_DURATION / 60))
      SECONDS=$((RUN_DURATION % 60))

      # 显示输出
      cat "$step_log"

      if grep -q "ALL_DONE" "$step_log" 2>/dev/null; then
        log "SUCCESS" "所有 FEAT 已完成！"
        rm -f "$PROMPT_FILE"
        exit 0
      fi

      log "SUCCESS" "/$current_cmd ($current_feat) 完成 (耗时 ${MINUTES}分${SECONDS}秒)"
      ok=true
      fail_count=0
    else
      RUN_END=$(date +%s)
      RUN_DURATION=$((RUN_END - RUN_START))
      MINUTES=$((RUN_DURATION / 60))
      SECONDS=$((RUN_DURATION % 60))
      retry=$((retry + 1))
      log "ERROR" "/$current_cmd ($current_feat) 失败 (耗时 ${MINUTES}分${SECONDS}秒)"
    fi

    rm -f "$PROMPT_FILE"
  done

  if [ "$ok" = false ]; then
    fail_count=$((fail_count + 1))
    log "ERROR" "/$current_cmd ($current_feat) 失败 (连续失败: $fail_count/$MAX_CONSECUTIVE_FAILURES)"

    if [ $fail_count -ge $MAX_CONSECUTIVE_FAILURES ]; then
      log "ERROR" "连续 $MAX_CONSECUTIVE_FAILURES 次步骤失败，停止执行。请手动检查。"
      exit 1
    fi

    sleep 60
  else
    log "INFO" "${STEP_INTERVAL}秒后继续下一步..."
    sleep $STEP_INTERVAL
  fi
done
