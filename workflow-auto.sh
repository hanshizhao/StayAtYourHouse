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
MAX_REVIEW_ROUNDS=5
REVIEW_RETRY_INTERVAL=15
MAX_ERROR_LINES=15
MAX_OUTPUT_LINES=10

mkdir -p "$LOG_DIR"

if [ ! -f "$FEATURE_LIST" ]; then
  echo "错误: 未找到 $FEATURE_LIST，请先运行 /workflow-init"
  exit 1
fi

log_file="$LOG_DIR/auto-$(date '+%Y%m%d-%H%M%S').log"

_log() {
  local level=$1
  local message=$2
  local timestamp=$(date '+%H:%M:%S')
  echo "[$timestamp] [$level] $message" >> "$log_file"
}

ts() {
  date '+%H:%M:%S'
}

print_step_header() {
  local step_num=$1
  local cmd=$2
  local feat_id=$3
  local feat_desc=$4
  local stats=$5
  local feat_status="${6:-}"

  local block="━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "[$(ts)] $block"
  echo "[$(ts)]   步骤 #$step_num: $(cmd_label "$cmd" "$feat_status") (/$cmd)"
  echo "[$(ts)]   功能: $feat_id - $feat_desc"
  echo "[$(ts)]   进度: $stats"
  echo "[$(ts)] $block"
  echo ""

  _log "INFO" "=== 步骤 #$step_num: /$cmd - $(cmd_label "$cmd" "$feat_status") ($feat_id) ==="
}

print_retry() {
  local retry=$1
  local max=$2
  echo "[$(ts)]   ↻ 重试 $retry/$max..."
  _log "WARNING" "重试第 $retry 次"
}

print_result() {
  local ok=$1
  local minutes=$2
  local seconds=$3

  if [ "$ok" = true ]; then
    echo "[$(ts)]   ✓ 完成 /$current_cmd ($current_feat) (耗时 ${minutes}分${seconds}秒)"
  else
    echo "[$(ts)]   ✗ 失败 /$current_cmd ($current_feat) (耗时 ${minutes}分${seconds}秒)"
  fi
  echo ""

  local timestamp
  timestamp=$(ts)
  _log "$( [ "$ok" = true ] && echo 'SUCCESS' || echo 'ERROR' )" \
    "/$current_cmd ($current_feat) $( [ "$ok" = true ] && echo '完成' || echo '失败' ) (耗时 ${minutes}分${seconds}秒) [$timestamp]"
}

print_no_progress() {
  local minutes=$1
  local seconds=$2
  local step_log=$3
  echo "[$(ts)]   ⚠ 未推进 /$current_cmd ($current_feat) (耗时 ${minutes}分${seconds}秒)"
  echo "[$(ts)]   步骤退出码为0但工作流状态未变更"
  echo ""
  print_step_output "$step_log"
  _log "WARNING" "/$current_cmd ($current_feat) 未推进 (耗时 ${minutes}分${seconds}秒)"
}

print_error_detail() {
  local step_log=$1
  if [ -f "$step_log" ]; then
    echo "  ┌─ 错误详情 (最后 ${MAX_ERROR_LINES} 行) ──────────────────"
    tail -n "$MAX_ERROR_LINES" "$step_log" | sed 's/^/  │ /'
    echo "  └───────────────────────────────────────────"
    echo ""
  fi
}

print_step_output() {
  local step_log=$1
  if [ -f "$step_log" ] && [ -s "$step_log" ]; then
    echo "  ┌─ 步骤输出 (最后 ${MAX_OUTPUT_LINES} 行) ──────────────────"
    tail -n "$MAX_OUTPUT_LINES" "$step_log" | sed 's/^/  │ /'
    echo "  └───────────────────────────────────────────"
    echo ""
  fi
}

print_summary() {
  local total=$1
  local done=$2

  local block="━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "[$(ts)] $block"
  echo "[$(ts)]   全部完成! 进度: $done/$total"
  echo "[$(ts)] $block"
}

# 从 feature_list.json 解析当前工作流状态
# 状态机: pending → in_progress → review-loop → reviewed → passed
#         review 循环内: 审查→修复→再审查 (最多 MAX_REVIEW_ROUNDS 轮)
#         verify 不通过 → failed → workflow-next (它能处理 failed)
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
reviewed = [f for f in features if f.get('status') == 'reviewed']
in_progress = [f for f in features if f.get('status') == 'in_progress']
fixing = [f for f in features if f.get('status') == 'fixing']
failed = [f for f in features if f.get('status') == 'failed']
pending = [f for f in features if f.get('status') == 'pending']
completed_count = len([f for f in features if f.get('status') in ('completed', 'passed')])
total_count = len(features)

if not reviewed and not in_progress and not fixing and not failed and not pending:
    print(f'ALL_DONE|_|全部完成 ({completed_count}/{total_count})')
elif reviewed:
    feat = reviewed[0]
    print(f'workflow-verify|{feat[\"id\"]}|{feat.get(\"description\", \"\")}')
elif in_progress:
    feat = in_progress[0]
    print(f'review-loop|{feat[\"id\"]}|{feat.get(\"description\", \"\")}')
elif fixing:
    feat = fixing[0]
    print(f'review-loop|{feat[\"id\"]}|{feat.get(\"description\", \"\")}')
elif failed:
    feat = failed[0]
    print(f'workflow-next|{feat[\"id\"]}|{feat.get(\"description\", \"\")}')
elif pending:
    feat = pending[0]
    print(f'workflow-next|{feat[\"id\"]}|{feat.get(\"description\", \"\")}')
" 2>&1
}

get_progress() {
  PYTHONIOENCODING=utf-8 python -c "
import json, io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
data = json.load(open('$FEATURE_LIST', encoding='utf-8'))
features = data.get('features', [])
done = len([f for f in features if f.get('status') in ('completed', 'passed')])
total = len(features)
print(f'{done}/{total}')
" 2>/dev/null || echo "?/?"
}

get_total_count() {
  PYTHONIOENCODING=utf-8 python -c "
import json, io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
data = json.load(open('$FEATURE_LIST', encoding='utf-8'))
print(len(data.get('features', [])))
" 2>/dev/null || echo "?"
}

get_done_count() {
  PYTHONIOENCODING=utf-8 python -c "
import json, io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
data = json.load(open('$FEATURE_LIST', encoding='utf-8'))
features = data.get('features', [])
print(len([f for f in features if f.get('status') in ('completed', 'passed')]))
" 2>/dev/null || echo "?"
}

check_all_done() {
  PYTHONIOENCODING=utf-8 python -c "
import json, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
data = json.load(open('$FEATURE_LIST', encoding='utf-8'))
features = data.get('features', [])
print('true' if features and all(f.get('status') in ('completed', 'passed') for f in features) else 'false')
" 2>/dev/null
}

get_feat_status() {
  local feat_id="$1"
  PYTHONIOENCODING=utf-8 python -c "
import json, io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
data = json.load(open('$FEATURE_LIST', encoding='utf-8'))
for f in data.get('features', []):
    if f['id'] == '$feat_id':
        print(f.get('status', '?'))
        break
" 2>/dev/null
}

# 自动提交未提交的代码（防止步骤间代码丢失）
# 参数: $1=feat_id, $2=步骤描述(如 "next"/"review"/"fix"/"verify")
auto_commit() {
  local feat_id="$1"
  local step_desc="$2"

  # 检查是否有未提交的变更
  local changes
  changes=$(git status --porcelain 2>/dev/null | grep -v '^?? .claude-workflow/auto-logs/' || true)

  if [ -z "$changes" ]; then
    return 0
  fi

  local file_count
  file_count=$(echo "$changes" | wc -l | tr -d ' ')

  echo "[$(ts)]   📦 检测到 $file_count 个未提交的变更，正在自动提交..."
  _log "INFO" "自动提交: $file_count 个文件 ($feat_id $step_desc)"

  # 暂存所有变更（排除 auto-logs 目录）
  echo "$changes" | while IFS= read -r line; do
    local file_path
    file_path=$(echo "$line" | sed 's/^...//')
    # 跳过 auto-logs 目录
    if [[ "$file_path" != .claude-workflow/auto-logs/* ]]; then
      git add "$file_path" 2>/dev/null
    fi
  done

  # 检查暂存区是否有内容
  local staged
  staged=$(git diff --cached --name-only 2>/dev/null || true)
  if [ -z "$staged" ]; then
    echo "[$(ts)]   📦 无需提交（暂存区为空）"
    return 0
  fi

  # 生成提交消息并提交
  local commit_msg="feat: ${feat_id} ${step_desc}"
  if git commit -m "$commit_msg" 2>/dev/null; then
    local commit_hash
    commit_hash=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
    echo "[$(ts)]   📦 已提交: $commit_hash ($file_count 文件)"
    _log "SUCCESS" "自动提交成功: $commit_hash ($feat_id $step_desc, $file_count 文件)"
  else
    echo "[$(ts)]   ⚠ 自动提交失败（可能是 pre-commit hook 阻止）"
    _log "WARNING" "自动提交失败 ($feat_id $step_desc)"
  fi
}

# 更新指定 FEAT 的顶级 status 字段
update_feat_status() {
  local feat_id="$1"
  local new_status="$2"
  PYTHONIOENCODING=utf-8 python -c "
import json, io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
with open('$FEATURE_LIST', encoding='utf-8') as f:
    data = json.load(f)
for feat in data.get('features', []):
    if feat['id'] == '$feat_id':
        feat['status'] = '$new_status'
        break
with open('$FEATURE_LIST', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
print('ok')
" 2>/dev/null
}

# 获取指定 FEAT 的审查结果
# 输出格式: status|critical|important|minor
# 例如: passed|0|0|0 或 fixing|1|2|3
get_review_issues() {
  local feat_id="$1"
  PYTHONIOENCODING=utf-8 python -c "
import json, io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
data = json.load(open('$FEATURE_LIST', encoding='utf-8'))
for f in data.get('features', []):
    if f['id'] == '$feat_id':
        review = f.get('review', {})
        status = review.get('status', 'none')
        issues = review.get('issues', {})
        c = issues.get('critical', 0)
        i = issues.get('important', 0)
        m = issues.get('minor', 0)
        print(f'{status}|{c}|{i}|{m}')
        break
" 2>/dev/null
}

# 从审查日志文件中 fallback 解析审查结果
# 输出格式与 get_review_issues 相同: status|critical|important|minor
parse_review_from_log() {
  local log_path="$1"
  PYTHONIOENCODING=utf-8 python -c "
import re, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
try:
    with open('$log_path', encoding='utf-8') as f:
        content = f.read()
    c = i = m = 0
    for level in ['Critical', 'Important', 'Minor']:
        pattern = r'[│|]\s*' + level + r'\s*[│|]\s*(\d+)\s*[│|]'
        match = re.search(pattern, content, re.IGNORECASE)
        if match:
            val = int(match.group(1))
            if level == 'Critical': c = val
            elif level == 'Important': i = val
            else: m = val
    status = 'fixing' if c > 0 or i > 0 else 'passed'
    print(f'{status}|{c}|{i}|{m}')
except Exception:
    pass
" 2>/dev/null
}

# 获取指定 FEAT 的审查问题详情（用于构造修复提示和显示）
# 输出: 具体问题描述文本
get_review_issue_details() {
  local feat_id="$1"
  PYTHONIOENCODING=utf-8 python -c "
import json, io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
data = json.load(open('$FEATURE_LIST', encoding='utf-8'))
for f in data.get('features', []):
    if f['id'] == '$feat_id':
        review = f.get('review', {})
        lines = []
        for level in ['critical_issues', 'important_issues', 'minor_issues']:
            issues = review.get(level, [])
            if issues:
                tag = level.replace('_issues', '').upper()
                for issue in issues:
                    lines.append(f'[{tag}] {issue}')
        for level in ['critical', 'important', 'minor']:
            count = review.get('issues', {}).get(level, 0)
            if count > 0:
                tag = level.upper()
                issues_list = review.get(f'{level}_issues', [])
                if not issues_list:
                    lines.append(f'[{tag}] 存在 {count} 个{tag}级别问题（详情请查看 review 记录）')
        print('\\n'.join(lines) if lines else '无具体问题描述')
        break
" 2>/dev/null
}

# 获取已通过的审查维度列表
# 输出: 逗号分隔的维度名称（如 "安全,验证,性能"）
get_review_dimensions() {
  local feat_id="$1"
  PYTHONIOENCODING=utf-8 python -c "
import json, io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
data = json.load(open('$FEATURE_LIST', encoding='utf-8'))
for f in data.get('features', []):
    if f['id'] == '$feat_id':
        dims = f.get('review', {}).get('checked_dimensions', {})
        passed = [k for k, v in dims.items() if v is True]
        print(','.join(passed) if passed else '无')
        break
" 2>/dev/null
}

# Review 循环: 审查 → 修复 → 再审查 → ... 直到通过或达到上限
# 参数: feat_id, feat_desc, step_num
# 返回: 0=通过, 1=达到上限
run_review_loop() {
  local feat_id="$1"
  local feat_desc="$2"
  local step_num="$3"

  local loop_start=$(date +%s)
  local round=0
  declare -a important_history

  while [ $round -lt $MAX_REVIEW_ROUNDS ]; do
    round=$((round + 1))

    echo "[$(ts)]   🔄 Review 循环: $feat_id - 第 $round/$MAX_REVIEW_ROUNDS 轮"
    _log "INFO" "Review 循环第 $round 轮 ($feat_id)"

    # ---- 审查阶段 ----
    echo "[$(ts)]   ⏳ workflow-review $(echo "$feat_id" | tr '[:upper:]' '[:lower:]')"
    echo "          (预计 5-15 分钟，期间终端无输出是正常的)"
    _log "INFO" "开始审查 /workflow-review ($feat_id)..."

    local review_log="$LOG_DIR/step-${step_num}-${feat_id}-review-r${round}-$(date '+%Y%m%d-%H%M%S').log"
    local review_start=$(date +%s)

    local REVIEW_PROMPT=$(mktemp)

    if [ $round -eq 1 ]; then
      cat > "$REVIEW_PROMPT" << REVIEW_EOF
请执行 /workflow-review 来审查 $feat_id ($feat_desc)。

严格的约束条件（必须遵守）：
1. 只执行 /workflow-review 这一个命令
2. 审查完成后必须更新 feature_list.json 中的 review 字段
3. review.status 应为 "passed"（无问题）或 "fixing"（有问题）
4. review.issues 必须准确反映各级别问题数量，格式：{"critical": N, "important": N, "minor": N}
5. 必须填写各级别问题详情数组，每条问题包含文件路径、行号和修复建议：
   - review.critical_issues: ["文件:行号 - 问题描述 | 修复建议", ...]
   - review.important_issues: ["文件:行号 - 问题描述 | 修复建议", ...]
   - review.minor_issues: ["文件:行号 - 问题描述", ...]
6. 不要执行 /workflow-next 或 /workflow-verify
7. 不要开始其他 FEAT 的工作

【首次审查】这是第 1 轮审查，请确保一次性覆盖所有审查维度。
审查维度清单（每个维度都必须检查并在 review.checked_dimensions 中记录）：
  安全 → 输入验证 → DI 注册 → 事务处理 → 架构设计 → 性能 → 错误处理 → 命名规范
REVIEW_EOF
    else
      local prev_issues=$(get_review_issues "$feat_id")
      local prev_c=$(echo "$prev_issues" | cut -d'|' -f2)
      local prev_i=$(echo "$prev_issues" | cut -d'|' -f3)
      local prev_dimensions=$(get_review_dimensions "$feat_id")

      cat > "$REVIEW_PROMPT" << REVIEW_EOF
请执行 /workflow-review 来审查 $feat_id ($feat_desc)。

严格的约束条件（必须遵守）：
1. 只执行 /workflow-review 这一个命令
2. 审查完成后必须更新 feature_list.json 中的 review 字段
3. review.status 应为 "passed"（无问题）或 "fixing"（有问题）
4. review.issues 必须准确反映各级别问题数量，格式：{"critical": N, "important": N, "minor": N}
5. 必须填写各级别问题详情数组，每条问题包含文件路径、行号和修复建议：
   - review.critical_issues: ["文件:行号 - 问题描述 | 修复建议", ...]
   - review.important_issues: ["文件:行号 - 问题描述 | 修复建议", ...]
   - review.minor_issues: ["文件:行号 - 问题描述", ...]
6. 不要执行 /workflow-next 或 /workflow-verify
7. 不要开始其他 FEAT 的工作

【第 ${round} 轮审查 — 范围限定】
上一轮发现问题: Critical=${prev_c:-0}, Important=${prev_i:-0}
已通过的审查维度: ${prev_dimensions}

本轮审查范围：
  1. 验证上一轮发现的 Critical/Important 问题是否已正确修复
  2. 检查修复是否引入了新的 Critical/Important 问题（仅限已修改的代码区域）
  3. 不需要重新审查已通过维度的其他代码
  4. 在 review.checked_dimensions 中更新维度状态
REVIEW_EOF
    fi

    if timeout 1800 claude -p \
      --dangerously-skip-permissions \
      --allowed-tools "Bash Edit Read Write Glob Grep Agent Skill TaskCreate TaskGet TaskList TaskUpdate WebSearch WebFetch mcp__pencil__*" \
      < "$REVIEW_PROMPT" > "$review_log" 2>&1; then

      # 等待文件系统同步（Windows NTFS 缓存延迟）
      sleep 2

      local review_end=$(date +%s)
      local review_dur=$((review_end - review_start))
      local review_min=$((review_dur / 60))
      local review_sec=$((review_dur % 60))

      echo "[$(ts)]   ✓ 审查完成 (耗时 ${review_min}分${review_sec}秒)"
      _log "INFO" "审查完成 (耗时 ${review_min}分${review_sec}秒)"

      # 解析审查结果（带重试，应对文件系统延迟）
      local review_result=""
      local parse_attempt=0
      local max_parse_attempts=3
      local parse_retry_sleep=5

      while [ $parse_attempt -lt $max_parse_attempts ]; do
        parse_attempt=$((parse_attempt + 1))
        review_result=$(get_review_issues "$feat_id")
        local test_status=$(echo "$review_result" | cut -d'|' -f1)
        if [ -n "$test_status" ]; then
          break
        fi
        if [ $parse_attempt -lt $max_parse_attempts ]; then
          echo "[$(ts)]   ⚠ 审查结果解析为空，${parse_retry_sleep}秒后重试 ($parse_attempt/$max_parse_attempts)..."
          _log "WARNING" "审查结果解析为空 ($feat_id) 第 $round 轮，重试 $parse_attempt/$max_parse_attempts"
          sleep $parse_retry_sleep
        fi
      done

      # Fallback: 从审查日志文件解析
      if [ -z "$(echo "$review_result" | cut -d'|' -f1)" ] && [ -f "$review_log" ] && [ -s "$review_log" ]; then
        echo "[$(ts)]   ⚠ feature_list.json 解析失败，尝试从日志文件解析..."
        _log "WARNING" "Fallback: 从日志文件解析审查结果 ($feat_id)"
        review_result=$(parse_review_from_log "$review_log")
      fi

      local review_status=$(echo "$review_result" | cut -d'|' -f1)
      local issue_c=$(echo "$review_result" | cut -d'|' -f2)
      local issue_i=$(echo "$review_result" | cut -d'|' -f3)
      local issue_m=$(echo "$review_result" | cut -d'|' -f4)

      # 默认值处理
      issue_c=${issue_c:-0}
      issue_i=${issue_i:-0}
      issue_m=${issue_m:-0}

      # 所有方式都失败
      if [ -z "$review_status" ]; then
        echo "[$(ts)]   ⚠ 无法解析审查结果（已重试 $max_parse_attempts 次），跳到下一轮"
        _log "WARNING" "审查结果解析为空 ($feat_id) 第 $round 轮（已重试 $max_parse_attempts 次）"
        rm -f "$REVIEW_PROMPT"
        continue
      fi

      echo "[$(ts)]   📋 审查结果: critical=$issue_c, important=$issue_i, minor=$issue_m"

      # 追踪 Important 数量趋势
      important_history+=($issue_i)

      # 收敛检测：连续 3 轮 Important <= 2 且不递增
      if [ ${#important_history[@]} -ge 3 ]; then
        local hist_len=${#important_history[@]}
        local ih1=${important_history[$((hist_len-3))]}
        local ih2=${important_history[$((hist_len-2))]}
        local ih3=${important_history[$((hist_len-1))]}

        if [ "$ih1" -le 2 ] && [ "$ih2" -le 2 ] && [ "$ih3" -le 2 ]; then
          echo "[$(ts)]   📊 收敛检测：连续 3 轮 Important <= 2，判定为已收敛"
          _log "INFO" "收敛检测触发 ($feat_id): Important 历史 ${important_history[*]}"

          auto_commit "$feat_id" "review-converged"

          update_feat_status "$feat_id" "reviewed"
          _log "SUCCESS" "Review 循环通过（收敛检测）: $feat_id"

          local loop_end=$(date +%s)
          local loop_dur=$((loop_end - loop_start))
          local loop_min=$((loop_dur / 60))
          local loop_sec=$((loop_dur % 60))
          echo "[$(ts)]   ✓ Review 循环通过 (共 $round 轮, 总耗时 ${loop_min}分${loop_sec}秒)"

          rm -f "$REVIEW_PROMPT"
          return 0
        fi
      fi

      # 打印审查发现的问题详情
      local issue_details=$(get_review_issue_details "$feat_id")
      if [ -n "$issue_details" ] && [ "$issue_details" != "无具体问题描述" ]; then
        echo "[$(ts)]   📝 审查发现的问题:"
        echo "$issue_details" | while IFS= read -r line; do
          echo "          $line"
        done
      fi

      # 全部通过: 无任何问题
      if [ "$issue_c" = "0" ] && [ "$issue_i" = "0" ] && [ "$issue_m" = "0" ]; then
        echo "[$(ts)]   → 全部通过!"

        update_feat_status "$feat_id" "reviewed"
        _log "SUCCESS" "Review 循环通过: $feat_id"

        local loop_end=$(date +%s)
        local loop_dur=$((loop_end - loop_start))
        local loop_min=$((loop_dur / 60))
        local loop_sec=$((loop_dur % 60))
        echo "[$(ts)]   ✓ Review 循环通过 (共 $round 轮, 总耗时 ${loop_min}分${loop_sec}秒)"

        rm -f "$REVIEW_PROMPT"
        return 0
      fi

      # 只有 Minor 问题: 修复后直接通过（不再循环审查）
      if [ "$issue_c" = "0" ] && [ "$issue_i" = "0" ] && [ "$issue_m" -gt 0 ]; then
        echo "[$(ts)]   → 有 $issue_m 个 minor 问题需要修复"
        _log "INFO" "发现 $issue_m 个 minor 问题 ($feat_id)，修复后直接通过"

        # 检查是否达到上限
        if [ $round -lt $MAX_REVIEW_ROUNDS ]; then
          local minor_issue_details=$(get_review_issue_details "$feat_id")
          local minor_fix_log="$LOG_DIR/step-${step_num}-${feat_id}-fix-minor-r${round}-$(date '+%Y%m%d-%H%M%S').log"

          local MINOR_FIX_PROMPT=$(mktemp)
          cat > "$MINOR_FIX_PROMPT" << MINOR_FIX_EOF
$feat_id ($feat_desc) 的代码审查发现了以下 Minor 级别问题，请逐一修复：

$minor_issue_details

请执行以下操作：
1. 读取 .claude-workflow/feature_list.json，查看 $feat_id 的 review 记录，找出所有 Minor 级别问题
2. 逐一修复 Minor 级别的问题
3. 修复完成后，确保代码可以正常构建
4. 不要执行 /workflow-review、/workflow-next 或 /workflow-verify
5. 不要修改 feature_list.json 中的状态
6. 不要开始其他 FEAT 的工作

严格约束：
- 只做 Minor 问题修复工作，不要更改工作流状态
- Minor 修复是尽力而为，如果某个问题无法安全修复则跳过
MINOR_FIX_EOF

          local minor_fix_start=$(date +%s)

          if timeout 1800 claude -p \
            --dangerously-skip-permissions \
            --allowed-tools "Bash Edit Read Write Glob Grep Agent Skill TaskCreate TaskGet TaskList TaskUpdate WebSearch WebFetch mcp__pencil__*" \
            < "$MINOR_FIX_PROMPT" > "$minor_fix_log" 2>&1; then

            local minor_fix_end=$(date +%s)
            local minor_fix_dur=$((minor_fix_end - minor_fix_start))
            local minor_fix_min=$((minor_fix_dur / 60))
            local minor_fix_sec=$((minor_fix_dur % 60))

            echo "[$(ts)]   ✓ Minor 修复完成 (耗时 ${minor_fix_min}分${minor_fix_sec}秒)"
            _log "INFO" "Minor 修复完成 ($feat_id, 耗时 ${minor_fix_min}分${minor_fix_sec}秒)"
          else
            local minor_fix_end=$(date +%s)
            local minor_fix_dur=$((minor_fix_end - minor_fix_start))
            local minor_fix_min=$((minor_fix_dur / 60))
            local minor_fix_sec=$((minor_fix_dur % 60))

            echo "[$(ts)]   ⚠ Minor 修复失败，跳过直接通过 (耗时 ${minor_fix_min}分${minor_fix_sec}秒)"
            _log "WARNING" "Minor 修复失败 ($feat_id)，跳过"
          fi

          rm -f "$MINOR_FIX_PROMPT"
        else
          echo "[$(ts)]   → 达到轮次上限，跳过 minor 修复直接通过"
        fi

        # 通过条件: critical=0 且 important=0（minor 修复尽力而为）
        echo "[$(ts)]   → 通过! (critical=0, important=0, minor 已尝试修复)"

        update_feat_status "$feat_id" "reviewed"
        _log "SUCCESS" "Review 循环通过: $feat_id (minor 已尝试修复)"

        local loop_end=$(date +%s)
        local loop_dur=$((loop_end - loop_start))
        local loop_min=$((loop_dur / 60))
        local loop_sec=$((loop_dur % 60))
        echo "[$(ts)]   ✓ Review 循环通过 (共 $round 轮, 总耗时 ${loop_min}分${loop_sec}秒)"

        rm -f "$REVIEW_PROMPT"
        return 0
      fi

      # 有 Critical 或 Important 问题: 需要修复后重新审查
      echo "[$(ts)]   → 需要修复 (critical=$issue_c, important=$issue_i, minor=$issue_m)"
      _log "WARNING" "审查发现问题: critical=$issue_c, important=$issue_i, minor=$issue_m"

      # 检查是否达到上限
      if [ $round -ge $MAX_REVIEW_ROUNDS ]; then
        rm -f "$REVIEW_PROMPT"
        break
      fi

      # ---- 修复阶段 ----
      echo "[$(ts)]   ⏳ 修复中..."
      _log "INFO" "开始修复 ($feat_id)..."

      local fix_issue_details=$(get_review_issue_details "$feat_id")
      local fix_log="$LOG_DIR/step-${step_num}-${feat_id}-fix-r${round}-$(date '+%Y%m%d-%H%M%S').log"
      local fix_start=$(date +%s)

      local FIX_PROMPT=$(mktemp)
      cat > "$FIX_PROMPT" << FIX_EOF
$feat_id ($feat_desc) 的代码审查发现了以下问题，请逐一修复：

$fix_issue_details

请执行以下操作：
1. 读取 .claude-workflow/feature_list.json，查看 $feat_id 的 review 记录，找出所有问题
2. 逐一修复 Critical、Important 和 Minor 级别的问题
3. 修复完成后，确保代码可以正常构建
4. 不要执行 /workflow-review、/workflow-next 或 /workflow-verify
5. 不要修改 feature_list.json 中的状态
6. 不要开始其他 FEAT 的工作

严格约束：
- 只做修复工作，不要更改工作流状态
- 修复必须针对 Critical、Important 和 Minor 级别的具体问题
- 【最小变更原则】只修改与问题直接相关的代码，不要重构无关代码
- 【防引入约束】修复后自检：运行构建命令确认无编译错误，确认修复不引入新的问题
- 如果某个问题的修复可能影响其他已通过的功能，在修复前先评估影响范围
FIX_EOF

      if timeout 1800 claude -p \
        --dangerously-skip-permissions \
        --allowed-tools "Bash Edit Read Write Glob Grep Agent Skill TaskCreate TaskGet TaskList TaskUpdate WebSearch WebFetch mcp__pencil__*" \
        < "$FIX_PROMPT" > "$fix_log" 2>&1; then

        local fix_end=$(date +%s)
        local fix_dur=$((fix_end - fix_start))
        local fix_min=$((fix_dur / 60))
        local fix_sec=$((fix_dur % 60))

        echo "[$(ts)]   ✓ 修复完成 (耗时 ${fix_min}分${fix_sec}秒)"
        _log "INFO" "修复完成 (耗时 ${fix_min}分${fix_sec}秒)"
      else
        local fix_end=$(date +%s)
        local fix_dur=$((fix_end - fix_start))
        local fix_min=$((fix_dur / 60))
        local fix_sec=$((fix_dur % 60))

        echo "[$(ts)]   ✗ 修复失败 (耗时 ${fix_min}分${fix_sec}秒)"
        print_error_detail "$fix_log"
        _log "ERROR" "修复失败 ($feat_id) 第 $round 轮"
      fi

      rm -f "$FIX_PROMPT"

      # 轮次间隔
      if [ $round -lt $MAX_REVIEW_ROUNDS ]; then
        echo "[$(ts)]   ${REVIEW_RETRY_INTERVAL}秒后开始下一轮审查..."
        sleep $REVIEW_RETRY_INTERVAL
      fi
    else
      local review_end=$(date +%s)
      local review_dur=$((review_end - review_start))
      local review_min=$((review_dur / 60))
      local review_sec=$((review_dur % 60))

      echo "[$(ts)]   ✗ 审查失败 (耗时 ${review_min}分${review_sec}秒)"
      print_error_detail "$review_log"
      _log "ERROR" "审查失败 ($feat_id) 第 $round 轮"

      # 审查本身执行失败，等一下重试
      if [ $round -lt $MAX_REVIEW_ROUNDS ]; then
        echo "[$(ts)]   ${RETRY_INTERVAL}秒后重试..."
        sleep $RETRY_INTERVAL
      fi
    fi

    rm -f "$REVIEW_PROMPT"
  done

  # 达到上限
  local final_result=$(get_review_issues "$feat_id")
  local final_c=$(echo "$final_result" | cut -d'|' -f2)
  local final_i=$(echo "$final_result" | cut -d'|' -f3)
  local final_m=$(echo "$final_result" | cut -d'|' -f4)
  final_c=${final_c:-0}
  final_i=${final_i:-0}
  final_m=${final_m:-0}

  echo ""
  echo "[$(ts)]   ✗ Review 循环达到 $MAX_REVIEW_ROUNDS 轮上限，仍有问题未解决"
  echo "[$(ts)]   📋 最终审查结果: critical=$final_c, important=$final_i, minor=$final_m"
  echo "[$(ts)]   📄 日志目录: $LOG_DIR"
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  Review 循环超限，停止执行，请人工介入"
  echo "  FEAT: $feat_id"
  echo "  剩余问题: critical=$final_c, important=$final_i, minor=$final_m"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  _log "ERROR" "Review 循环超限 ($feat_id): critical=$final_c, important=$final_i, minor=$final_m"

  return 1
}

cmd_label() {
  local cmd=$1
  local feat_status="${2:-}"
  case "$cmd" in
    workflow-next)
      case "$feat_status" in
        failed) echo "修复验证失败" ;;
        *)      echo "实现新功能" ;;
      esac
      ;;
    workflow-review)
      case "$feat_status" in
        fixing) echo "修复后重新审查" ;;
        *)      echo "代码审查" ;;
      esac
      ;;
    workflow-verify) echo "测试验证" ;;
    *)               echo "$1" ;;
  esac
}

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Workflow Auto Runner"
echo "  每个步骤约需 5-15 分钟，请耐心等待"
echo "  日志目录: $LOG_DIR"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

step=0
fail_count=0
last_feat=""

while true; do
  # 解析当前状态
  status_line=$(get_workflow_status)
  current_cmd=$(echo "$status_line" | cut -d'|' -f1)
  current_feat=$(echo "$status_line" | cut -d'|' -f2)
  current_desc=$(echo "$status_line" | cut -d'|' -f3)

  if [ "$current_cmd" = "ALL_DONE" ]; then
    total=$(get_total_count)
    done=$(get_done_count)
    print_summary "$total" "$done"
    _log "SUCCESS" "所有 FEAT 已完成！"
    exit 0
  fi

  # Review 循环: 使用专用的审查-修复循环处理
  if [ "$current_cmd" = "review-loop" ]; then
    step=$((step + 1))
    stats=$(get_progress)

    print_step_header "$step" "workflow-review" "$current_feat" "$current_desc" "$stats" "in_progress"

    if run_review_loop "$current_feat" "$current_desc" "$step"; then
      # Review 循环通过，状态已由脚本更新为 reviewed
      fail_count=0
      new_stats=$(get_progress)
      echo "[$(ts)]   当前进度: $new_stats"
      echo "[$(ts)]   ${STEP_INTERVAL}秒后继续下一步..."
      _log "INFO" "${STEP_INTERVAL}秒后继续下一步"
      sleep $STEP_INTERVAL
    else
      # Review 循环超限，停止
      exit 1
    fi
    continue
  fi

  step=$((step + 1))
  stats=$(get_progress)

  # 保存步骤前的功能状态，用于显示状态变更和操作标签
  pre_feat_status=$(get_feat_status "$current_feat")

  # 只有功能变更时才打印完整头部
  if [ "$current_feat" != "$last_feat" ]; then
    print_step_header "$step" "$current_cmd" "$current_feat" "$current_desc" "$stats" "$pre_feat_status"
  else
    echo "[$(ts)]   继续: $(cmd_label "$current_cmd" "$pre_feat_status") ($current_feat) [重试]"
    echo ""
    _log "INFO" "=== 步骤 #$step: /$current_cmd ($current_feat) [重试] ==="
  fi
  last_feat="$current_feat"

  retry=0
  ok=false
  step_log="$LOG_DIR/step-${step}-${current_feat}-$(date '+%Y%m%d-%H%M%S').log"

  while [ $retry -le $MAX_RETRY ]; do
    if [ $retry -gt 0 ]; then
      print_retry "$retry" "$MAX_RETRY"
      sleep $RETRY_INTERVAL
    fi

    echo "[$(ts)]   ⏳ $current_cmd $(echo "$current_feat" | tr '[:upper:]' '[:lower:]')"
    echo "          (预计 5-15 分钟，期间终端无输出是正常的)"
    _log "INFO" "开始执行 /$current_cmd ($current_feat)..."

    RUN_START=$(date +%s)

    PROMPT_FILE=$(mktemp)
    cat > "$PROMPT_FILE" << PROMPT_EOF
请执行 /$current_cmd 来处理 $current_feat ($current_desc)。

严格的约束条件（必须遵守）：
1. 只执行 /$current_cmd 这一个命令，不要连续执行多个
2. 状态转换必须遵循工作流规范：
   - /workflow-next 只能将状态设为 in_progress（禁止直接设为 completed/passed/reviewed）
   - /workflow-review 审查通过后状态应变为 reviewed（不是 completed/passed）
   - /workflow-verify 验证通过后状态才能变为 passed
3. 每个 FEAT 必须走完 next → review → verify 完整流程才能标记为 passed
4. 如果所有 FEAT 都已完成（completed 或 passed），只输出 ALL_DONE
PROMPT_EOF

    if timeout 1800 claude -p \
      --dangerously-skip-permissions \
      --allowed-tools "Bash Edit Read Write Glob Grep Agent Skill TaskCreate TaskGet TaskList TaskUpdate WebSearch WebFetch mcp__pencil__*" \
      < "$PROMPT_FILE" > "$step_log" 2>&1; then

      RUN_END=$(date +%s)
      RUN_DURATION=$((RUN_END - RUN_START))
      MINUTES=$((RUN_DURATION / 60))
      secs=$((RUN_DURATION % 60))

      if [ "$(check_all_done)" = "true" ]; then
        print_result true "$MINUTES" "$secs"
        auto_commit "$current_feat" "verify-final"
        total=$(get_total_count)
        done=$(get_done_count)
        print_summary "$total" "$done"
        rm -f "$PROMPT_FILE"
        _log "SUCCESS" "所有 FEAT 已完成！"
        exit 0
      fi

      post_step_status=$(get_workflow_status)
      if [ "$post_step_status" = "$status_line" ]; then
        print_no_progress "$MINUTES" "$secs" "$step_log"
        _log "WARNING" "状态未推进: $status_line"
        retry=$((retry + 1))
      else
        print_result true "$MINUTES" "$secs"
        # 显示步骤输出摘要
        print_step_output "$step_log"
        # 显示功能状态变更
        post_feat_status=$(get_feat_status "$current_feat")
        # 只在 verify 通过（状态变为 passed/completed）时提交代码
        if [ "$post_feat_status" = "passed" ] || [ "$post_feat_status" = "completed" ]; then
          auto_commit "$current_feat" "$current_cmd"
        fi
        echo "[$(ts)]   $current_feat 状态: $pre_feat_status → $post_feat_status"
        # 显示下一步
        post_cmd=$(echo "$post_step_status" | cut -d'|' -f1)
        post_feat=$(echo "$post_step_status" | cut -d'|' -f2)
        if [ "$post_feat" != "$current_feat" ]; then
          echo "[$(ts)]   → 进入下一功能: $post_feat"
        else
          echo "[$(ts)]   → 下一步: $(cmd_label "$post_cmd" "$post_feat_status")"
        fi
        _log "INFO" "状态推进: $status_line → $post_step_status"
        ok=true
        fail_count=0
        break
      fi
    else
      RUN_END=$(date +%s)
      RUN_DURATION=$((RUN_END - RUN_START))
      MINUTES=$((RUN_DURATION / 60))
      secs=$((RUN_DURATION % 60))

      print_result false "$MINUTES" "$secs"
      print_error_detail "$step_log"
      retry=$((retry + 1))
    fi

    rm -f "$PROMPT_FILE"
  done

  if [ "$ok" = false ]; then
    fail_count=$((fail_count + 1))

    echo "[$(ts)]   ⚠ 连续失败: $fail_count/$MAX_CONSECUTIVE_FAILURES"
    echo ""

    _log "ERROR" "/$current_cmd ($current_feat) 步骤失败 (连续失败: $fail_count/$MAX_CONSECUTIVE_FAILURES)"

    if [ $fail_count -ge $MAX_CONSECUTIVE_FAILURES ]; then
      echo ""
      echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      echo "  连续 $MAX_CONSECUTIVE_FAILURES 次步骤失败，停止执行"
      echo "  请检查日志: $step_log"
      echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      _log "ERROR" "连续 $MAX_CONSECUTIVE_FAILURES 次步骤失败，停止执行"
      exit 1
    fi

    echo "[$(ts)]   等待 60 秒后重试..."
    sleep 60
  else
    new_stats=$(get_progress)
    echo "[$(ts)]   当前进度: $new_stats"
    echo "[$(ts)]   ${STEP_INTERVAL}秒后继续下一步..."
    _log "INFO" "${STEP_INTERVAL}秒后继续下一步"
    sleep $STEP_INTERVAL
  fi
done
