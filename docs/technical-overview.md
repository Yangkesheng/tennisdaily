# 网球日记小程序技术文档

> 本文档用于说明当前小程序的产品定位、技术架构、主要功能、核心数据模型和代码结构。可直接复制到飞书文档作为项目技术说明。

---

## 1. 项目概述

网球日记是一个面向网球爱好者的微信小程序，当前阶段聚焦在“快速记录打球”这个核心闭环。

### 1.1 产品目标

- 快速记录每一次打球
- 展示本月打球概览
- 查看最近一次打球记录
- 查看历史记录
- 通过日历查看打球日期
- 为后续装备管理、花费统计、云同步或自建后端打基础

### 1.2 当前阶段定位

当前仍属于 MVP 阶段，优先保证：

- 记录流程足够快
- 表单字段不复杂
- 本地数据模型稳定
- 页面结构清晰易维护

当前数据读写使用微信本地存储：

```text
wx.getStorageSync / wx.setStorageSync
```

后续如接入 Go 后端或云端同步，优先通过 `services/session-service.ts` 替换数据读写实现，页面层尽量不大改。

---

## 2. 技术栈

### 2.1 前端

- 微信原生小程序
- TypeScript
- WXML
- WXSS
- Skyline 渲染引擎
- 自定义导航栏组件

### 2.2 当前数据层

- 微信本地存储
- 存储 key：`tennis_sessions`
- 无后端依赖

### 2.3 后续后端规划

后续可接入自建 Go 后端，建议方向：

- Go
- Gin / Echo
- PostgreSQL
- JWT / 微信小程序登录
- REST API

但当前前端仍以本地存储稳定 MVP 为主。

---

## 3. 目录结构

当前核心目录如下：

```text
miniprogram/
  app.json                 小程序全局配置
  app.ts                   小程序入口
  app.wxss                 全局样式
  components/
    navigation-bar/        自定义导航栏组件
  models/
    session.ts             打球记录相关 TypeScript 类型定义
  services/
    session-service.ts     打球记录本地存储读写服务
  pages/
    index/                 首页统计页
    calendar/              日历页
    session-edit/          新增/编辑记录页
    session-list/          历史记录列表页
    logs/                  默认日志页/保留页
    login/                 登录页/预留页
  utils/
    util.ts                通用工具函数
```

---

## 4. 页面结构与路由

页面配置位于：

```text
miniprogram/app.json
```

当前页面顺序：

```json
{
  "pages": [
    "pages/index/index",
    "pages/calendar/calendar",
    "pages/session-edit/session-edit",
    "pages/session-list/session-list",
    "pages/logs/logs"
  ]
}
```

### 4.1 TabBar

当前底部 TabBar 包含两个页面：

| Tab | 页面 | 说明 |
|---|---|---|
| 统计 | `pages/index/index` | 首页统计、最近打球、快速新增入口 |
| 日历 | `pages/calendar/calendar` | 年度日历，标记有打球记录的日期 |

### 4.2 页面职责

| 页面 | 路径 | 主要职责 |
|---|---|---|
| 首页 | `pages/index/index` | 展示本月统计、近几场手感、最近一次打球、点击 + 新增记录 |
| 日历 | `pages/calendar/calendar` | 展示全年日历，标记有记录日期，点击日期查看当天记录 |
| 新增/编辑记录 | `pages/session-edit/session-edit` | 创建或编辑一条打球记录 |
| 记录列表 | `pages/session-list/session-list` | 查看全部/近 30 天/指定日期记录，支持编辑和删除 |

---

## 5. 核心业务模型

业务类型定义位于：

```text
miniprogram/models/session.ts
```

### 5.1 打球类型

```ts
export type TennisSessionType =
  | ''
  | 'training'
  | 'singles'
  | 'doubles'
  | 'singlesMatch'
  | 'doublesMatch'
```

含义：

| 值 | 展示文案 |
|---|---|
| `doubles` | 双打 |
| `singles` | 单打 |
| `training` | 训练 |
| `singlesMatch` | 单打比赛 |
| `doublesMatch` | 双打比赛 |
| `''` | 未分类 |

### 5.2 比赛成绩

```ts
export type MatchRank =
  | ''
  | 'champion'
  | 'runnerUp'
  | 'semiFinal'
  | 'quarterFinal'
  | 'groupStage'
```

含义：

| 值 | 展示文案 |
|---|---|
| `champion` | 冠军 |
| `runnerUp` | 亚军 |
| `semiFinal` | 四强 |
| `quarterFinal` | 八强 |
| `groupStage` | 小组赛 |
| `''` | 无成绩 |

只有当类型为：

- 单打比赛
- 双打比赛

时，页面才展示成绩选择栏。

### 5.3 TennisSession

```ts
export interface TennisSession {
  id: string
  date: string
  durationMinutes: number
  rating: number
  courtName: string
  partner: string
  type: TennisSessionType
  matchRank: MatchRank
  cost: number
  racketName: string
  shoeName: string
  note: string
  createdAt: number
  updatedAt: number
}
```

字段说明：

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | string | 记录唯一 ID，当前使用时间戳生成 |
| `date` | string | 打球日期，格式 `YYYY-MM-DD` |
| `durationMinutes` | number | 打球时长，单位分钟 |
| `rating` | number | 今日手感，1-5 分 |
| `courtName` | string | 场地名称 |
| `partner` | string | 搭档字段，当前页面已取消输入，但模型仍保留以兼容旧数据 |
| `type` | TennisSessionType | 打球类型 |
| `matchRank` | MatchRank | 比赛成绩 |
| `cost` | number | 花费 |
| `racketName` | string | 球拍 |
| `shoeName` | string | 球鞋 |
| `note` | string | 备注，当前页面暂未重点使用 |
| `createdAt` | number | 创建时间戳 |
| `updatedAt` | number | 更新时间戳 |

### 5.4 SessionDraft

`SessionDraft` 用于新增/编辑表单，与 `TennisSession` 相比没有：

- `id`
- `createdAt`
- `updatedAt`

```ts
export interface SessionDraft {
  date: string
  durationMinutes: number
  rating: number
  courtName: string
  partner: string
  type: TennisSessionType
  matchRank: MatchRank
  cost: number
  racketName: string
  shoeName: string
  note: string
}
```

### 5.5 SessionStats

```ts
export interface SessionStats {
  monthCount: number
  monthMinutes: number
  monthCost: number
  totalCount: number
}
```

用于首页统计展示。

---

## 6. 数据服务设计

数据读写服务位于：

```text
miniprogram/services/session-service.ts
```

该文件是当前前端数据层的核心，页面不直接操作本地存储，而是通过 service 统一读写。

### 6.1 存储 key

```ts
const STORAGE_KEY = 'tennis_sessions'
```

所有打球记录以数组形式保存在本地存储中。

### 6.2 默认草稿

```ts
export const createDefaultSessionDraft = (): SessionDraft => {
  return {
    date: getTodayText(),
    durationMinutes: 120,
    rating: 3,
    courtName: '',
    partner: '',
    type: 'doubles',
    matchRank: '',
    cost: 0,
    racketName: '',
    shoeName: '',
    note: '',
  }
}
```

默认值策略：

- 日期默认为今天
- 时长默认 120 分钟
- 手感默认 3 分
- 类型默认双打
- 其他字段可不填

这符合“30 秒快速记录”的产品原则。

### 6.3 核心方法

| 方法 | 说明 |
|---|---|
| `getTodayText()` | 获取今天日期，格式 `YYYY-MM-DD` |
| `createDefaultSessionDraft()` | 创建新增表单默认值 |
| `listSessions()` | 获取全部记录，并按日期/创建时间倒序排序 |
| `saveSession(draft)` | 新增记录 |
| `updateSession(id, draft)` | 更新记录 |
| `deleteSession(id)` | 删除记录 |
| `getSessionById(id)` | 获取单条记录 |
| `listSessionsByDate(date)` | 获取指定日期记录 |
| `listRecentSessions(days)` | 获取最近 N 天记录 |
| `getLatestSession()` | 获取最近一条记录 |
| `getSessionStats()` | 获取本月统计和总记录数 |

### 6.4 排序规则

记录排序逻辑：

1. 按日期倒序
2. 如果日期相同，按创建时间倒序

```ts
const sortSessions = (sessions: TennisSession[]) => {
  return sessions.sort((a, b) => {
    const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime()

    if (dateDiff !== 0) {
      return dateDiff
    }

    return b.createdAt - a.createdAt
  })
}
```

---

## 7. 首页功能说明

首页代码位于：

```text
miniprogram/pages/index/
  index.ts
  index.wxml
  index.wxss
  index.json
```

### 7.1 首页展示内容

首页包括：

1. 标题和年份
2. 本月统计卡片
3. 近几场手感趋势
4. 最近打球卡片
5. 底部 `+` 快速新增按钮

### 7.2 统计数据

首页通过 `getSessionStats()` 获取：

- 本月打球场数
- 本月打球时长
- 本月花费
- 总记录数

本月时长会转换成小时展示：

```ts
monthHoursText: (stats.monthMinutes / 60).toFixed(1)
```

### 7.3 近几场手感

首页使用最近 5 条记录生成手感趋势：

- 按时间倒序取 5 条
- 再反转成从旧到新展示
- rating 越高，柱状图越高

手感等级：

| rating | level |
|---|---|
| 4-5 | high |
| 3 | normal |
| 1-2 | low |

### 7.4 最近打球

最近打球卡片展示：

- 日期
- 时长
- 类型
- 比赛成绩
- 场地
- 球拍
- 球鞋

比赛类型展示成绩，例如：

```text
双打比赛 冠军
单打比赛 亚军
```

类型标签颜色已与记录列表保持一致：浅绿色背景 + 深绿色文字。

### 7.5 新增入口

首页底部 `+` 按钮：

```ts
goCreateSession() {
  wx.navigateTo({
    url: '/pages/session-edit/session-edit',
  })
}
```

当前新增表单不是写在首页底部，而是独立页面。

---

## 8. 新增/编辑记录页说明

页面位于：

```text
miniprogram/pages/session-edit/
  session-edit.ts
  session-edit.wxml
  session-edit.wxss
  session-edit.json
```

### 8.1 页面定位

该页面同时用于：

- 新增打球记录
- 编辑已有打球记录

通过路由参数判断：

| 参数 | 含义 |
|---|---|
| 无参数 | 新增记录，日期默认今天 |
| `date` | 新增记录，日期使用指定日期 |
| `id` | 编辑指定记录 |

### 8.2 页面结构

表单顺序：

1. 日期
2. 今日手感
3. 类型
4. 成绩，仅比赛类型展示
5. 时长
6. 场地
7. 花费
8. 球拍
9. 球鞋
10. 保存按钮

### 8.3 类型选择

类型按钮顺序：

```text
双打、单打、训练、单打比赛、双打比赛
```

### 8.4 成绩选择

当类型为以下任一项时展示成绩栏：

- 单打比赛
- 双打比赛

成绩选项：

```text
冠军、亚军、四强、八强、小组赛
```

如果切换到非比赛类型，自动清空 `matchRank`。

### 8.5 时长选择

当前支持：

- 60 分钟
- 120 分钟
- 自定义

自定义时展示数字输入框。

### 8.6 今日手感

使用 1-5 星选择，文案如下：

| 分数 | 文案 |
|---|---|
| 1 | 网球满天飞 |
| 2 | 状态有些迷 |
| 3 | 中规中矩吧 |
| 4 | 甜区率很高 |
| 5 | 今天我是阿卡 |

### 8.7 保存逻辑

```ts
submitSession() {
  if (this.data.sessionId) {
    updateSession(this.data.sessionId, this.data.draft)
  } else {
    saveSession(this.data.draft)
  }

  wx.showToast({
    title: this.data.sessionId ? '已保存' : '已记录',
    icon: 'success',
    complete: () => {
      wx.navigateBack()
    },
  })
}
```

### 8.8 布局策略

编辑页采用独立原生页面，而不是首页原位弹窗。

页面结构：

```text
edit-page
  edit-scroll         表单滚动区
    edit-content
  bottom-action-area  固定保存按钮区
```

这样可以避免新增表单字段变多后出现怪异滚动或按钮先露出的问题。

---

## 9. 记录列表页说明

页面位于：

```text
miniprogram/pages/session-list/
  session-list.ts
  session-list.wxml
  session-list.wxss
  session-list.json
```

### 9.1 入口来源

记录列表可从多个入口进入：

| 入口 | 路由 | 说明 |
|---|---|---|
| 首页最近打球 | `/pages/session-list/session-list` | 查看全部记录 |
| 首页全部记录统计 | `/pages/session-list/session-list?range=recent` | 查看近 30 天记录 |
| 日历日期点击 | `/pages/session-list/session-list?date=YYYY-MM-DD` | 查看指定日期记录 |

### 9.2 数据筛选

```ts
const sessions = dateFilter
  ? listSessionsByDate(dateFilter)
  : rangeFilter === 'recent'
    ? listRecentSessions(30)
    : listSessions()
```

标题规则：

| 条件 | 标题 |
|---|---|
| date 参数 | 指定日期 |
| range=recent | 近 30 天 |
| 无参数 | 记录 |

### 9.3 展示内容

每条记录展示：

- 日期
- 类型，比赛类型带成绩
- 时长
- 场地
- 搭档，旧数据兼容
- 球拍
- 球鞋
- 花费
- 备注

类型展示示例：

```text
双打
单打
训练
单打比赛 冠军
双打比赛 亚军
```

### 9.4 删除交互

记录列表支持左滑删除：

- 手指左滑时露出删除按钮
- 超过一半距离后保持打开
- 点击删除后弹确认框
- 确认后调用 `deleteSession(id)` 删除本地记录

---

## 10. 日历页说明

页面位于：

```text
miniprogram/pages/calendar/
  calendar.ts
  calendar.wxml
  calendar.wxss
  calendar.json
```

### 10.1 页面功能

日历页展示当前年份 12 个月，每个月按自然日排列。

有打球记录的日期会被标记。

### 10.2 活跃日期计算

```ts
const getActiveDates = (sessions: TennisSession[]) => {
  return Array.from(new Set(sessions.map((session) => session.date)))
}
```

### 10.3 点击日期

点击日期后跳转到当天记录列表：

```ts
wx.navigateTo({
  url: `/pages/session-list/session-list?date=${date}`,
})
```

---

## 11. UI 风格说明

### 11.1 整体风格

当前首页、编辑页、记录列表页使用统一的紫绿玻璃风格。

背景渐变：

```css
background: linear-gradient(135deg, #ebdff2 0%, #f3f1f6 55%, #e2ebd9 100%);
```

### 11.2 玻璃卡片

主要卡片使用半透明白色 + 内描边 + 毛玻璃：

```css
background: rgba(255, 255, 255, 0.52);
box-shadow: inset 0 0 0 1rpx rgba(255, 255, 255, 0.8);
backdrop-filter: blur(20px);
```

### 11.3 类型标签

类型标签采用绿色胶囊样式：

```css
background: #e8f4ee;
color: #1f7a4d;
border-radius: 999rpx;
```

### 11.4 首页底部新增按钮

首页底部固定 `+` 按钮：

- 固定在底部中间
- 白色半透明背景
- 蓝色加号
- 胶囊/圆角视觉

### 11.5 编辑页保存按钮

编辑页底部保存按钮固定在页面底部动作区，不参与表单内容滚动。

---

## 12. 当前功能清单

### 已实现

- 首页本月统计
- 首页最近一次打球
- 首页近几场手感趋势
- 新增打球记录
- 编辑打球记录
- 删除打球记录
- 查看全部记录
- 查看近 30 天记录
- 查看指定日期记录
- 年度日历打球日期标记
- 本地存储持久化
- 比赛类型成绩记录
- 统一紫绿玻璃 UI 风格

### 暂未实现/后续规划

- Go 后端 API
- 微信登录
- 云端同步
- 装备管理
- 装备使用次数/寿命统计
- 更完整的月度/年度统计
- 数据导出
- 多设备同步

---

## 13. 当前数据流

### 13.1 新增记录流程

```text
首页点击 +
  -> navigateTo session-edit
  -> createDefaultSessionDraft()
  -> 用户选择/输入
  -> submitSession()
  -> saveSession(draft)
  -> wx.setStorageSync
  -> navigateBack
  -> 首页 show 生命周期刷新数据
```

### 13.2 首页刷新流程

```text
index page show
  -> refreshData()
  -> getSessionStats()
  -> listSessions()
  -> getLatestSession()
  -> createRatingTrend()
  -> setData()
```

### 13.3 编辑记录流程

```text
记录列表点击某条记录
  -> navigateTo session-edit?id=xxx
  -> getSessionById(id)
  -> 填充 draft
  -> submitSession()
  -> updateSession(id, draft)
  -> wx.setStorageSync
  -> navigateBack
```

### 13.4 删除记录流程

```text
记录列表左滑
  -> 点击删除
  -> wx.showModal 确认
  -> deleteSession(id)
  -> refreshSessions()
```

---

## 14. 后续接入 Go 后端建议

当前页面层已经基本通过 `services/session-service.ts` 访问数据。

后续接入 Go 后端时建议：

1. 保留页面层调用 service 的方式
2. 在 service 层新增远程 API 实现
3. 不要在页面中直接写 `wx.request`
4. 先实现登录、记录 CRUD、最近记录、本月统计
5. 保持本地优先，网络同步失败不阻塞用户记录

### 14.1 推荐 API

```text
POST   /api/auth/wechat-login
GET    /api/sessions
POST   /api/sessions
GET    /api/sessions/:id
PUT    /api/sessions/:id
DELETE /api/sessions/:id
GET    /api/sessions/latest
GET    /api/stats/month
```

### 14.2 推荐数据库枚举

如果后端数据库使用数字枚举，建议：

#### session type

| 数字 | 含义 |
|---|---|
| 1 | 双打 |
| 2 | 单打 |
| 3 | 训练 |
| 4 | 单打比赛 |
| 5 | 双打比赛 |

#### match rank

| 数字 | 含义 |
|---|---|
| 0 | 无 |
| 1 | 冠军 |
| 2 | 亚军 |
| 3 | 四强 |
| 4 | 八强 |
| 5 | 小组赛 |

前端页面层不建议直接散落数字，应通过 constants/mapper 转换。

---

## 15. 已知代码改进点

### 15.1 类型展示逻辑重复

当前首页和记录列表页都各自实现了：

- `getSessionTypeLabel`
- `getMatchRankLabel`
- `getSessionTypeDisplay`

后续建议抽到公共工具：

```text
miniprogram/utils/session-display.ts
```

### 15.2 编辑页代码缩进需要整理

`session-edit.ts` 当前部分缩进不够统一，功能正常，但建议后续格式化。

### 15.3 partner 字段历史兼容

页面已经取消搭档输入框，但模型和列表展示仍保留 `partner` 字段，用于兼容旧数据。后续如果确定不再使用，可做数据迁移后删除。

### 15.4 后端接入前需统一数据协议

如果 Go 后端使用数字枚举，前端当前字符串格式需要通过 mapper 转换，避免直接大面积修改页面判断逻辑。

---

## 16. 小结

当前小程序已经完成打球记录 MVP 的核心闭环：

```text
首页统计 -> 快速新增 -> 本地保存 -> 历史查看 -> 日历回顾
```

当前架构保持简单：

```text
pages -> services -> wx storage
```

这对 MVP 很合适。后续如果接入 Go 后端，推荐继续保持 service 层作为数据访问边界，将本地存储替换或扩展为远程 API，同步能力逐步增强，避免破坏现有快速记录体验。
