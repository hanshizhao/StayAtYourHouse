# 房间卡片原型 — 实施参考

> 从 Pencil 原型文件提取的结构化数据，供实施时直接引用。

## 页面整体布局

| 参数 | 值 |
|------|-----|
| 页面宽度 | 1440px |
| 页面内边距 | 32px 上下, 48px 左右 |
| 内容区宽度 | 1344px |
| 区域间距 | 24px (gap) |
| 背景 | #FFFFFF |

## 页面标题栏

- 布局: horizontal, space-between, align-center
- 内边距: 无（由页面 gap 控制）
- 标题: fontSize=24, fontWeight=600, fill=#1A1A1A
- 新增按钮: fill=#0052D9, padding=[10,20], cornerRadius=6, 文字=#FFFFFF fontSize=14

## 筛选栏

- 布局: horizontal, gap=12, alignItems=center
- 每个筛选项: padding=[8,12], height=36, cornerRadius=6, border=1px #D1D5DB
- 筛选文字: fontSize=14, fill=#4B5563
- 下拉图标: lucide chevron-down, 14x14, fill=#4B5563

## 统计摘要

- 文字: fontSize=13, fill=#9CA3AF
- 靠右对齐

## 卡片网格

- 布局: horizontal, gap=16
- 每行 3 张卡片
- 卡片宽度: fill_container（自适应，约 437px）
- 卡片间距: 16px

## 单张卡片结构

### 外层

- cornerRadius: 8
- fill: #FFFFFF
- stroke: 1px #E5E7EB inside
- 布局: vertical, gap=0

### 头部 (Header)

- 布局: horizontal, space-between, align-center
- 内边距: [16, 20]
- 高度: 57px
- 房间标题: fontSize=16, fontWeight=600, fill=#1A1A1A
- 状态标签:

| 状态 | 标签背景 | 文字颜色 | 文字 |
|------|---------|---------|------|
| 已出租 | #FEF3C7 | #D97706 | 已出租 |
| 空置 | #DCFCE7 | #16A34A | 空置 |
| 装修中 | #DBEAFE | #2563EB | 装修中 |
| 已收回 | #F3F4F6 | #6B7280 | 已收回 |

- 标签样式: padding=[4,10], cornerRadius=12, fontSize=12, fontWeight=500

### 分割线

- height: 1px, fill: #E5E7EB

### 中部 (Middle)

- 布局: horizontal, gap=0
- 内边距: [16, 20]
- 高度: 162px
- 左右两栏各 width=fill_container

#### 左栏 — 房东租约

- 布局: vertical, gap=8
- 内边距: [0, 12, 0, 0]
- 右边框: 1px #E5E7EB
- 标题: "房东租约", fontSize=12, fontWeight=500, fill=#9CA3AF
- 金额: fontSize=18, fontWeight=600, fill=#1A1A1A
- 金额单位: fontSize=12, fill=#9CA3AF
- 到期日期: fontSize=13, fill=#4B5563
- 租约状态标签:

| 状态 | 标签背景 | 文字颜色 | 文字 |
|------|---------|---------|------|
| 正常 | #DCFCE7 | #16A34A | 正常 |
| 即将到期 | #FEF3C7 | #D97706 | 即将到期 |
| 已逾期 | #FEE2E2 | #DC2626 | 已逾期 N天 |
| 无租约 | 无标签 | -- | -- |

- 标签样式: padding=[2,8], cornerRadius=10, fontSize=11, fontWeight=500
- 无数据时: 居中显示灰色文字, fontSize=14, fill=#9CA3AF

#### 右栏 — 租客租约

- 布局: vertical, gap=8
- 内边距: [0, 0, 0, 12]
- 标题: "租客租约", fontSize=12, fontWeight=500, fill=#9CA3AF
- 租客姓名: fontSize=14, fontWeight=500, fill=#1A1A1A
- 其余同左栏（金额、日期、标签）
- 无数据时: 居中显示"暂无租客", fontSize=14, fill=#9CA3AF

### 底部 (Bottom)

- 布局: horizontal, space-between, align-center
- 内边距: [12, 20]
- 高度: 67px

#### 利润区域

- 布局: vertical, gap=4
- 标签: "实际利润"/"预期利润", fontSize=11, fill=#9CA3AF
- 金额:
  - 盈利: fill=#16A34A, 显示如"+¥500/月"
  - 亏损: fill=#DC2626, 显示如"-¥500/月"
  - 无数据: fill=#9CA3AF, 显示"--"
- 金额字体: fontSize=16, fontWeight=600

#### 操作按钮

- 布局: horizontal, gap=4
- 每个按钮: padding=[6,8], cornerRadius=4
- 图标: 16x16, lucide
- 编辑: pencil, fill=#6B7280
- 房东租约: file-text, fill=#6B7280
- 维修: wrench, fill=#6B7280
- 删除: trash-2, fill=#EF4444

## 分页器

- 居中, gap=8, padding=[16, 0, 0, 0]
- 页码按钮: padding=[6,12], cornerRadius=4
- 当前页: fill=#0052D9, 文字=#FFFFFF
- 其他页: 无背景, 文字=#4B5563
- 翻页按钮: padding=[6,10], border=1px #D1D5DB, fontSize=13

## 设计 Token 汇总

### 颜色

| Token | 色值 | 用途 |
|-------|------|------|
| 主文字 | #1A1A1A | 标题、金额 |
| 次要文字 | #4B5563 | 日期 |
| 辅助文字 | #9CA3AF | 标签、单位、占位 |
| 主色 | #0052D9 | 按钮、当前页码 |
| 成功绿 | #16A34A | 正常状态、盈利 |
| 警告黄 | #D97706 | 已出租、即将到期 |
| 危险红 | #DC2626 | 已逾期、亏损 |
| 操作灰 | #6B7280 | 图标按钮 |
| 边框 | #E5E7EB | 卡片边框、分割线 |
| 输入边框 | #D1D5DB | 筛选框、分页按钮边框 |
| 标签绿底 | #DCFCE7 | 正常标签背景、空置标签背景 |
| 标签黄底 | #FEF3C7 | 已出租标签背景、即将到期标签背景 |
| 标签红底 | #FEE2E2 | 已逾期标签背景 |

### 间距

| 场景 | 值 |
|------|-----|
| 页面内边距 | 48px 水平, 32px 垂直 |
| 区域间距 | 24px |
| 卡片间距 | 16px |
| 卡片头部内边距 | 16px 垂直, 20px 水平 |
| 卡片中区内边距 | 16px 垂直, 20px 水平 |
| 卡片底区内边距 | 12px 垂直, 20px 水平 |
| 左右栏内边距 | 12px (靠近分割线一侧) |
| 内容行间距(栏内) | 8px |

### 圆角

| 场景 | 值 |
|------|-----|
| 卡片 | 8px |
| 状态标签 | 12px |
| 租约标签 | 10px |
| 按钮 | 6px |
| 图标按钮 | 4px |

### 字号

| 场景 | 大小 | 粗细 |
|------|------|------|
| 页面标题 | 24px | 600 |
| 卡片标题 | 16px | 600 |
| 金额 | 18px | 600 |
| 利润金额 | 16px | 600 |
| 日期/姓名 | 13-14px | normal/500 |
| 标签/小字 | 11-12px | 500 |
| 筛选文字 | 14px | normal |
