# 个人记录接口文档

## 1. 背景

“我的”页优化后包含「个人记录」入口，个人记录页需要展示：

- 连续打球天数
- 最长单次打球时长
- 单月最高打球时长
- 最早记录
- 累计场次、累计时长、累计花费

为了避免前端拉全量记录自行统计，新增个人记录统计接口，由后端统一计算并返回。

---

## 2. 接口定义

### Method

```http
GET
```

### Path

```http
/api/stats/records
```

### 请求示例

```http
GET /api/stats/records
Authorization: Bearer <token>
```

---

## 3. 鉴权规则

该接口需要登录。

请求头：

```http
Authorization: Bearer <token>
```

后端从 JWT 中解析当前用户 ID，只返回当前用户自己的数据。

未登录或 token 无效：

```json
{
  "code": 40101,
  "message": "unauthorized",
  "data": null
}
```

---

## 4. 请求参数

无 query 参数、无请求体。

---

## 5. 响应格式

沿用统一响应格式：

```json
{
  "code": 0,
  "message": "ok",
  "data": {}
}
```

---

## 6. 响应示例

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "totalCount": 86,
    "totalMinutes": 10280,
    "totalCost": 5800,
    "currentStreakDays": 4,
    "longestStreakDays": 18,
    "longestSessionMinutes": 240,
    "longestSessionDate": "2026-06-13 19:30",
    "bestMonthYear": 2026,
    "bestMonthMonth": 6,
    "bestMonthMinutes": 1440,
    "bestMonthSessionCount": 12,
    "maxSessionsPerDay": 3,
    "maxSessionsPerDayDate": "2026-06-13",
    "bestMonthCostYear": 2026,
    "bestMonthCostMonth": 6,
    "bestMonthCost": 1280,
    "championCount": 3,
    "runnerUpCount": 2,
    "earliestSessionDate": "2024-03-02 19:00"
  }
}
```

---

## 7. 字段说明

| 字段 | 类型 | 说明 |
|---|---|---|
| totalCount | number | 累计打球记录数 |
| totalMinutes | number | 累计打球总分钟数 |
| totalCost | number | 累计总花费（打球 + 球拍 + 穿线 + 球鞋） |
| currentStreakDays | number | 当前连续打球天数；无记录或已断为 0 |
| longestStreakDays | number | 历史最长连续打球天数；无记录为 0 |
| longestSessionMinutes | number | 最长单次打球时长，单位分钟；无记录为 0 |
| longestSessionDate | string | 最长单次发生时间 `YYYY-MM-DD HH:mm`；无记录为空字符串 |
| bestMonthYear | number | 单月最高时长所在年份；无记录为 0 |
| bestMonthMonth | number | 单月最高时长所在月份 `1-12`；无记录为 0 |
| bestMonthMinutes | number | 单月最高时长合计，单位分钟 |
| bestMonthSessionCount | number | 单月最高时长所在月份的打球记录数 |
| maxSessionsPerDay | number | 单日最高场次；无记录为 0 |
| maxSessionsPerDayDate | string | 单日最高场次发生的日期 `YYYY-MM-DD`；无记录为空字符串 |
| bestMonthCostYear | number | 单月最高花费所在年份；无记录为 0 |
| bestMonthCostMonth | number | 单月最高花费所在月份 `1-12`；无记录为 0 |
| bestMonthCost | number | 单月最高花费合计（仅打球消费 `cost`） |
| championCount | number | 冠军次数（`match_rank = 1`） |
| runnerUpCount | number | 亚军次数（`match_rank = 2`） |
| earliestSessionDate | string | 最早打球记录时间 `YYYY-MM-DD HH:mm`；无记录为空字符串 |

---

## 8. 统计口径

### 8.1 通用规则

- 统计时区统一使用 `Asia/Shanghai`
- 按 `tennis_sessions.date` 统计，不按创建时间
- 只统计未删除记录（软删除过滤）

### 8.2 累计花费

```text
totalCost = 打球消费 + 球拍购买费用 + 穿线费用 + 球鞋购买费用
```

其中：

- 打球消费：`tennis_sessions.cost` 全量合计
- 球拍购买费用：`racket.purchase_price` 全量合计
- 穿线费用：`racket_stringing_record.cost` 全量合计
- 球鞋购买费用：`my_shoes.purchase_price` 全量合计

与现有统计口径保持一致。

### 8.3 连续打球天数

- 从今天往前，连续有打球记录的天数
- 今天还没记录时不打断：昨天有记录则从昨天开始往前计算
- 昨天也没有记录：连续天数为 0
- 同一天多次打球按一天计

### 8.4 历史最长连续

- 全部历史记录中，连续有打球记录的最长天数
- 同一天多次打球按一天计

### 8.5 最长单次

- 单场 `duration_minutes` 最大值
- 多场并列时，取最早达成该记录的一场

### 8.6 单月最高时长

- 按自然月聚合 `duration_minutes` 合计，取合计最高的月份
- 多个月份并列时，取较早月份
- `bestMonthSessionCount` 为该月打球记录数

### 8.7 单日最高场次

- 按自然日聚合记录数，取单日场次最高的日期
- 多天并列时，取较早日期

### 8.8 单月最高花费

- 按自然月聚合 `tennis_sessions.cost` 合计，取合计最高的月份
- 多个月份并列时，取较早月份
- 仅统计打球消费，不含装备与穿线费用

### 8.9 比赛成绩

- `championCount`：`match_rank = 1`（冠军）的记录数
- `runnerUpCount`：`match_rank = 2`（亚军）的记录数

### 8.10 最早记录

- 第一条打球记录的日期时间（`date` 升序的第一条）

---

## 9. 边界情况

| 场景 | 返回 |
|---|---|
| 无任何记录 | `totalCount=0`，其余数值为 0，日期字段为空字符串 |
| 今天没打、昨天打了 | `currentStreakDays` 正常延续 |
| 昨天也没打 | `currentStreakDays=0` |
| 同一天多场 | 连续天数按天去重 |
| 跨月 / 跨年 | 单月最高按自然月聚合，不受影响 |
| 未来日期记录 | 不影响连续天数（只看今天及以前） |
| 非比赛记录 | 不影响冠军/亚军次数（只统计 `match_rank` 对应值） |

---

## 10. 前端接入

前端通过 service 层调用，页面不直接请求后端：

```text
pages/records
  -> services/records-api-service.ts
  -> request.ts（统一鉴权、统一响应解析）
  -> GET /api/stats/records
```

涉及文件：

- `miniprogram/models/records.ts`：`PersonalRecords` 类型定义
- `miniprogram/services/records-api-service.ts`：接口请求与字段归一化
- `miniprogram/pages/records/records.*`：个人记录页
- `miniprogram/pages/profile/profile.*`：“我的”页展示与入口
