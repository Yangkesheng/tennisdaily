# 网球日记小程序 - Agent 开发指南

---

# 一、项目定位

这是一个面向网球爱好者的微信小程序，用来记录和回顾用户的网球生活。

当前产品的核心场景是：用户打完球后，用尽可能少的操作快速记录一次打球经历；之后可以在首页、历史列表、日历和统计页面里回看自己的训练、比赛、花费和手感变化。

核心目标：

- 快速记录每一次打球
- 查看历史打球记录
- 通过日历查看打球日期
- 查看本月/年度统计和趋势
- 管理网球装备及装备使用情况
- 统计网球投入，包括时间、费用、频率等
- 形成长期网球日记，帮助用户看到坚持和成长

项目本质不是：

- 社交平台
- AI 教练
- 约球工具
- 复杂赛事管理系统
- 专业训练分析系统

而是：

> 一个以“快速记录”为核心的个人网球生活日志产品。

产品判断标准：

> 用户刚打完球、很累，也应该能在 10 秒左右完成记录。

因此所有功能都要服务于：少输入、快选择、可回顾、长期坚持。

---

# 二、当前阶段
当前目标：

1. 保持前端 10 秒快速记录体验
2. 通过 `miniprogram/services` 接入已部署的 Go 后端 API
3. 记录数据读写以 Go 后端为准
4. 不允许页面层直接调用 `wx.request`
5. 不允许为了接入后端重写页面结构或引入重型状态管理

核心原则：

> 后端接入是数据层升级，不是重做产品。

---

# 三、技术栈

## 前端

- 微信原生小程序
- TypeScript
- Skyline 渲染引擎
- WXSS

## 后端

- Go
- Gin
- MySQL
- GORM
- JWT / 微信小程序登录
- REST API

后端详细开发规则参考：

```text
AGENTS.go-backend.md
docs/AGENTS.go-backend.md
```

---

# 四、核心开发原则

## 1. 一切以“快速记录”为核心

用户打完球很累。

必须保证：

> 10 秒内完成一次记录

因此：

优先：

- 默认值
- 最近使用
- 快速选择
- 少输入

避免：

- 多步骤页面
- 复杂表单
- 强制填写大量字段
- 因网络慢导致无法记录

---

## 2. 不过度设计
禁止：

- 复杂架构
- 微服务思想
- 重型状态管理
- 过度抽象
- 为接入 API 大面积重构页面
- 前端做复杂计算

优先：

- 简单
- 可维护
- 易理解
- AI 易生成
- 页面层少改动，service 层逐步替换

---

## 3. 类型安全

所有业务数据必须使用 TypeScript interface。

禁止大量使用：

```ts
any
```

必须为核心业务对象定义 interface，例如：

- 打球记录
- 装备
- 统计结果
- API 响应
- 页面展示数据
- 本地模型与远程模型 mapper

---

# 五、功能优先级

## 第一阶段：已完成/保持稳定

1. 首页展示本月概览和最近一次打球
2. 30 秒内新增一次打球记录
3. 查看历史打球记录
4. 已接入 Go 后端保存数据
5. 日历查看打球日期
6. 日历支持月视图/年视图
7. 日历支持年份、月份快速选择
8. 编辑/删除打球记录

## 第二阶段：当前重点

1. 接入 Go 后端健康检查
2. 接入微信登录和 token 管理
3. 查询远程打球记录列表
4. 新增记录写入远程 API
5. 编辑/删除记录调用远程 API
6. 首页最近记录、本月统计接入远程 API
7. 服务端异常时直接提示错误，不做本地缓存兜底

## 第三阶段：后续再做

- 装备管理
- 装备使用统计
- 花费统计增强
- 多设备同步
- 增量同步
- 数据导出
- 更完整的月度/年度统计

---

# 六、目录约定

```text
miniprogram/
  models/       业务类型定义
  services/     API 请求、鉴权、mapper 等数据读写逻辑
  pages/        页面
  utils/        通用工具函数

docs/
  technical-overview.md     当前前端技术文档
  AGENTS.go-backend.md      Go 后端 Agent 文档副本
```

如果后端代码后续放入同一仓库，推荐目录：

```text
backend/
  cmd/
  internal/
  migrations/
  AGENTS.md
```

---

# 七、前端数据访问规则

## 1. 页面层不得直接请求后端

页面层只允许调用：

```text
miniprogram/services/*
```

禁止页面直接调用：

```ts
wx.request(...)
```

正确方向：

```text
pages -> services -> request -> Go API
```

---

## 2. 请求必须统一封装

后端 API 请求必须通过统一 request service 处理：

- baseUrl
- token
- header
- 错误处理
- 响应格式解析

不要在每个业务 service 中重复写 `wx.request` 细节。

---

## 3. 登录态统一管理

微信登录和 token 存储必须由 auth service 管理。

建议：

```text
miniprogram/services/auth-service.ts
miniprogram/services/request.ts
miniprogram/services/api-config.ts
```

业务页面不直接处理 token 拼接。

---

## 4. 服务端为记录数据源

打球记录的新增、查询、编辑、删除、统计都以 Go 后端 API 为准。

要求：

- 页面层不得直接读写 `tennis_sessions` 本地缓存
- service 层不得在服务器失败时静默写入本地缓存
- 服务器读写失败时应直接给出友好错误提示
- 当前开发阶段不考虑历史本地数据兼容问题
- 不要为了兼容历史本地数据保留正常 CRUD 流程之外的本地存储逻辑

## 5. 日历数据规则

日历页支持月视图和年视图：

- 月视图查询：`GET /api/sessions/calendar?year=YYYY&month=M`
- 年视图查询：`GET /api/sessions/calendar?year=YYYY`

要求：

- 从月视图点击具体日期进入新增/列表，返回后仍刷新月接口
- 从年视图点击具体日期进入新增/列表，返回后仍刷新年接口
- 年视图中页面层不得为了某个月份日期点击而退化成月接口
- 年份、月份选择属于轻量交互，不应引入复杂状态管理
- 不支持选择未来年份；当前年份下不支持选择未来月份

---

# 八、前后端数据协议规则

## 1. API 响应格式

后端统一响应格式：

```json
{
  "code": 0,
  "message": "ok",
  "data": {}
}
```

前端 request service 必须统一解析该结构。

---

## 2. 字段命名

API JSON 字段使用 camelCase：

```json
{
  "durationMinutes": 120,
  "matchRank": 1,
  "courtName": "奥森网球场"
}
```

数据库字段使用 snake_case：

```text
duration_minutes
match_rank
court_name
```

---

## 3. 枚举映射

当前前端本地模型仍使用字符串：

```ts
type: 'doublesMatch'
matchRank: 'champion'
```

后端推荐使用数字枚举：

### session type

| 数字 | 含义 | 前端字符串 |
|---|---|---|
| 1 | 双打 | `doubles` |
| 2 | 单打 | `singles` |
| 3 | 训练 | `training` |
| 4 | 单打比赛 | `singlesMatch` |
| 5 | 双打比赛 | `doublesMatch` |

### match rank

| 数字 | 含义 | 前端字符串 |
|---|---|---|
| 0 | 无 | `''` |
| 1 | 冠军 | `champion` |
| 2 | 亚军 | `runnerUp` |
| 3 | 四强 | `semiFinal` |
| 4 | 八强 | `quarterFinal` |
| 5 | 小组赛 | `groupStage` |

要求：

- 页面层不能直接散落后端数字枚举
- WXML 中不要出现类似 `draft.type === 5` 的业务魔法数字
- 必须通过 constants / mapper 转换
- 如果后端返回 `typeLabel` / `matchRankLabel`，展示层可以直接使用

---

# 九、API 接入顺序

接入 Go 后端时必须按小步验证，不要一次性全量替换。

推荐顺序：

1. health check
2. 微信登录
3. 查询记录列表
4. 新增记录
5. 编辑记录
6. 删除记录
7. 最近一次记录
9. 日历页月视图/年视图远程 API 保持一致：月视图返回后请求 `calendar?year=YYYY&month=M`，年视图返回后请求 `calendar?year=YYYY`

每一步都必须保证：

- 首页可正常打开
- 新增记录入口可用
- 网络失败时有合理提示
- 不静默写入本地缓存

---

# 十、删除与同步规则

后端打球记录删除采用逻辑删除（Soft Delete）。

前端仍调用：

```text
DELETE /api/sessions/:id
```

后端通过 `deleted_at` 标记删除。

未来做多设备同步时：

- 前端需要能识别远端 `deleted_at`
- A 设备删除记录后，B 设备增量同步时应能感知删除事件
- 不建议依赖物理删除作为业务删除方案

---

# 十一、日期与时间规则

前端打球日期格式：

```text
YYYY-MM-DD
```

后端保存为 DATE。

Go 后端解析日期时不应依赖 `time.Time` 默认 JSON 反序列化，因为默认需要 RFC3339。

后端 service 层应使用：

```go
time.ParseInLocation("2006-01-02", req.Date, loc)
```

统计自然月时，前后端必须注意时区一致，建议使用 `Asia/Shanghai`。

---

# 十二、当前实现策略

当前实现策略从：

```text
纯本地 wx.getStorageSync / wx.setStorageSync
```

升级为：

```text
Go API 作为记录数据唯一读写入口
```

具体要求：

1. 页面结构保持稳定
2. 数据读写通过 service 层 API
3. 记录 CRUD 不再使用本地 storage 兜底
4. 后端不可用时直接提示友好错误
5. 当前开发阶段不考虑历史本地数据兼容问题
6. 快速记录体验优先，但不牺牲服务端数据一致性

---

# 十三、禁止事项

禁止：

- 页面直接调用 `wx.request`
- 页面中散落后端数字枚举
- 为接入后端大面积重写 UI
- 在服务器失败时静默写入本地缓存
- 直接在页面层读写本地记录数据
- 为兼容历史本地数据保留正常 CRUD 流程之外的本地存储逻辑
- 引入重型状态管理
- 引入复杂同步架构作为第一步
- 把后端错误直接暴露成生硬技术文案

---

# 十四、推荐新增前端文件

Go 后端接入时，建议逐步新增：

```text
miniprogram/services/api-config.ts
miniprogram/services/request.ts
miniprogram/services/auth-service.ts
miniprogram/services/session-api-mapper.ts
miniprogram/services/session-api-service.ts
```

其中：

| 文件 | 职责 |
|---|---|
| `api-config.ts` | 管理 API baseUrl 和环境配置 |
| `request.ts` | 统一封装 wx.request |
| `auth-service.ts` | 微信登录、token 管理 |
| `session-api-mapper.ts` | 本地模型与后端模型转换 |
| `session-api-service.ts` | 远程打球记录 API |

---

# 十五、小结

当前项目已经进入前后端联调阶段。

开发时必须牢记：

```text
小程序 pages
  -> miniprogram/services
  -> Go REST API
  -> MySQL
```

但产品体验仍然第一：

> 打完球后 30 秒内完成一次记录。
