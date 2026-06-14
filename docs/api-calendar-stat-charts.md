# 日历统计图表接口文档

## 1. 背景

日历页目前已支持按月展示打球日期，并通过 `🎾` 标记有记录的日期。

接下来日历页的「统计」页签希望使用图表展示当前月份的统计数据，包括：

- 打球频率
- 手感趋势
- 消费构成
- 月度概览

为了避免前端拉全量记录自行统计，建议后端在现有日历接口中增加统计和图表字段。

核心原则：

- 日历页按当前年月展示数据
- 日历 tab 和统计 tab 共用同一个月份
- 前端只负责展示和少量 ViewModel 转换
- 统计口径以后端为准
- 不引入复杂同步或重型图表依赖

---

## 2. 接口定义

### Method

```http
GET
```

### Path

```http
/api/sessions/calendar
```

### 示例

```http
GET /api/sessions/calendar?year=2026&month=6
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

## 4. Query 参数

| 参数 | 类型 | 必填 | 示例 | 说明 |
|---|---|---:|---|---|
| `year` | number | 是 | `2026` | 查询年份 |
| `month` | number | 是 | `6` | 查询月份，范围 `1-12` |

### 参数规则

- `year` 建议范围：`2000-2100`
- `month` 范围：`1-12`
- `year` 和 `month` 建议都必填
- 日期统计按自然月
- 时区统一使用 `Asia/Shanghai`

---

## 5. 响应格式

沿用统一响应结构：

```json
{
  "code": 0,
  "message": "ok",
  "data": {}
}
```

---

## 6. 成功响应示例

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "year": 2026,
    "month": 6,
    "activeDayCount": 4,
    "days": [
      {
        "date": "2026-06-03",
        "count": 1
      },
      {
        "date": "2026-06-08",
        "count": 2
      },
      {
        "date": "2026-06-15",
        "count": 1
      },
      {
        "date": "2026-06-22",
        "count": 4
      }
    ],
    "summary": {
      "sessionCount": 8,
      "activeDayCount": 4,
      "totalMinutes": 960,
      "averageMinutes": 120,
      "averageRating": 3.8,
      "sessionCost": 320,
      "racketCost": 1280,
      "stringingCost": 260,
      "totalCost": 1860
    },
    "charts": {
      "weeklySessions": [
        {
          "label": "第1周",
          "count": 1
        },
        {
          "label": "第2周",
          "count": 2
        },
        {
          "label": "第3周",
          "count": 1
        },
        {
          "label": "第4周",
          "count": 4
        },
        {
          "label": "第5周",
          "count": 0
        }
      ],
      "ratingTrend": [
        {
          "date": "2026-06-03",
          "rating": 3
        },
        {
          "date": "2026-06-08",
          "rating": 4
        },
        {
          "date": "2026-06-15",
          "rating": 5
        },
        {
          "date": "2026-06-22",
          "rating": 3
        }
      ],
      "expenseBreakdown": [
        {
          "label": "打球",
          "value": 320
        },
        {
          "label": "球拍",
          "value": 1280
        },
        {
          "label": "穿线",
          "value": 260
        }
      ]
    }
  }
}
```

---

## 7. 空数据响应示例

当前月份没有打球记录、没有球拍购买、没有穿线费用时：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "year": 2026,
    "month": 6,
    "activeDayCount": 0,
    "days": [],
    "summary": {
      "sessionCount": 0,
      "activeDayCount": 0,
      "totalMinutes": 0,
      "averageMinutes": 0,
      "averageRating": 0,
      "sessionCost": 0,
      "racketCost": 0,
      "stringingCost": 0,
      "totalCost": 0
    },
    "charts": {
      "weeklySessions": [
        {
          "label": "第1周",
          "count": 0
        },
        {
          "label": "第2周",
          "count": 0
        },
        {
          "label": "第3周",
          "count": 0
        },
        {
          "label": "第4周",
          "count": 0
        },
        {
          "label": "第5周",
          "count": 0
        }
      ],
      "ratingTrend": [],
      "expenseBreakdown": [
        {
          "label": "打球",
          "value": 0
        },
        {
          "label": "球拍",
          "value": 0
        },
        {
          "label": "穿线",
          "value": 0
        }
      ]
    }
  }
}
```

注意：

- `days` 空数据返回 `[]`，不要返回 `null`
- `charts.ratingTrend` 空数据返回 `[]`
- `charts.weeklySessions` 建议始终返回完整周数组，方便前端稳定展示
- `summary` 建议始终返回完整零值对象

---

## 8. 字段说明

### 8.1 顶层字段

| 字段 | 类型 | 说明 |
|---|---|---|
| `year` | number | 查询年份 |
| `month` | number | 查询月份 |
| `activeDayCount` | number | 当前月有打球记录的自然日数量 |
| `days` | array | 当前月有打球记录的日期列表 |
| `summary` | object | 当前月统计摘要 |
| `charts` | object | 当前月图表数据 |

---

### 8.2 `days`

| 字段 | 类型 | 说明 |
|---|---|---|
| `date` | string | 日期，格式 `YYYY-MM-DD` |
| `count` | number | 当天打球记录数 |

说明：

- 只返回有打球记录的日期
- 如果一天有多条打球记录，`count` 返回当天记录数
- 前端日历 tab 根据 `days[].date` 标记 `🎾`

---

### 8.3 `summary`

| 字段 | 类型 | 说明 |
|---|---|---|
| `sessionCount` | number | 当前月打球记录数 |
| `activeDayCount` | number | 当前月打球自然日数量，建议与顶层 `activeDayCount` 一致 |
| `totalMinutes` | number | 当前月累计打球分钟数 |
| `averageMinutes` | number | 当前月平均每次打球分钟数，`sessionCount = 0` 时返回 `0` |
| `averageRating` | number | 当前月平均手感评分，范围 `0-5`，无记录时返回 `0` |
| `sessionCost` | number | 当前月打球消费，来自打球记录 cost |
| `racketCost` | number | 当前月球拍购买费用 |
| `stringingCost` | number | 当前月穿线费用 |
| `totalCost` | number | 当前月总消费，`sessionCost + racketCost + stringingCost` |

---

### 8.4 `charts.weeklySessions`

按周统计当前月打球次数，用于统计页签「打球频率」柱状图。

| 字段 | 类型 | 说明 |
|---|---|---|
| `label` | string | 周标签，例如 `第1周` |
| `count` | number | 该周打球记录数 |

建议：

- 按自然月内周序号返回
- 一个月通常返回 5 条，必要时可返回 6 条
- 周起始建议与前端日历一致：周一开始，周日结束
- `count` 统计记录数，不是打球日数

示例：

```json
[
  { "label": "第1周", "count": 1 },
  { "label": "第2周", "count": 2 },
  { "label": "第3周", "count": 0 },
  { "label": "第4周", "count": 4 },
  { "label": "第5周", "count": 1 }
]
```

---

### 8.5 `charts.ratingTrend`

当前月手感趋势，用于统计页签「手感趋势」柱状图。

| 字段 | 类型 | 说明 |
|---|---|---|
| `date` | string | 打球日期，格式 `YYYY-MM-DD` |
| `rating` | number | 手感评分，范围 `1-5` |

建议：

- 按 `date ASC, created_at ASC` 返回，前端直接从左到右展示
- 如果当前月记录很多，建议最多返回最近或按时间顺序返回 8-10 条
- 第一版推荐最多返回 8 条，避免小屏图表过挤

可选规则：

```text
当前月记录数 <= 8：返回全部
当前月记录数 > 8：返回最近 8 条，并按时间升序返回
```

---

### 8.6 `charts.expenseBreakdown`

当前月消费构成，用于统计页签「消费构成」横向占比条。

| 字段 | 类型 | 说明 |
|---|---|---|
| `label` | string | 消费类型，建议固定为 `打球`、`球拍`、`穿线` |
| `value` | number | 对应消费金额 |

建议固定返回 3 项：

```json
[
  { "label": "打球", "value": 320 },
  { "label": "球拍", "value": 1280 },
  { "label": "穿线", "value": 260 }
]
```

即使某项为 0，也返回对应项，方便前端稳定展示。

---

## 9. 统计口径

### 9.1 时间范围

统计自然月，时区统一使用：

```text
Asia/Shanghai
```

月份范围采用左闭右开：

```text
[startDate, endDate)
```

例如查询 2026 年 6 月：

```text
startDate = 2026-06-01
endDate = 2026-07-01
```

---

### 9.2 打球记录

数据表：

```text
tennis_sessions
```

过滤条件：

```sql
user_id = 当前用户 ID
AND deleted_at IS NULL
AND date >= startDate
AND date < endDate
```

字段来源：

| 统计字段 | 来源 |
|---|---|
| `sessionCount` | `COUNT(*)` |
| `activeDayCount` | `COUNT(DISTINCT date)` |
| `totalMinutes` | `SUM(duration_minutes)` |
| `averageMinutes` | `AVG(duration_minutes)` |
| `averageRating` | `AVG(rating)` |
| `sessionCost` | `SUM(cost)` |
| `days[].count` | `GROUP BY date COUNT(*)` |
| `weeklySessions[].count` | 按周归类后统计记录数 |
| `ratingTrend` | 当前月记录的 `date` 和 `rating` |

---

### 9.3 球拍购买费用

数据表建议：

```text
rackets
```

字段建议：

```text
purchase_price
purchase_date
```

过滤条件：

```sql
user_id = 当前用户 ID
AND deleted_at IS NULL
AND purchase_date >= startDate
AND purchase_date < endDate
```

统计：

```sql
COALESCE(SUM(purchase_price), 0) AS racket_cost
```

注意：不建议使用 `created_at` 代替 `purchase_date`，否则补录历史球拍时统计不准确。

---

### 9.4 穿线费用

数据表建议：

```text
stringing_records
```

字段建议：

```text
cost
string_date
```

过滤条件：

```sql
user_id = 当前用户 ID
AND deleted_at IS NULL
AND string_date >= startDate
AND string_date < endDate
```

统计：

```sql
COALESCE(SUM(cost), 0) AS stringing_cost
```

如果穿线记录表当前没有 `user_id`，建议补充或通过 `racket_id` join 到用户球拍表过滤当前用户。

---

## 10. 周统计规则

前端日历当前使用周一到周日顺序：

```text
一 二 三 四 五 六 日
```

因此后端 `weeklySessions` 建议也按周一作为一周开始。

推荐算法：

1. 获取当月第一天 `firstDay`
2. 计算 `firstDay` 所在周的周一作为第 1 周起点
3. 每 7 天为一周
4. 统计落在 `[startDate, endDate)` 内的记录
5. 返回覆盖当前月份的所有周

例如 2026-06 月：

```text
第1周：2026-06-01 ~ 2026-06-07
第2周：2026-06-08 ~ 2026-06-14
第3周：2026-06-15 ~ 2026-06-21
第4周：2026-06-22 ~ 2026-06-28
第5周：2026-06-29 ~ 2026-07-05
```

统计时只统计 6 月内的记录，7 月记录不计入 6 月第 5 周。

---

## 11. 错误响应

### 11.1 参数错误

```json
{
  "code": 40001,
  "message": "invalid request",
  "data": null
}
```

### 11.2 未登录

```json
{
  "code": 40101,
  "message": "unauthorized",
  "data": null
}
```

### 11.3 服务异常

```json
{
  "code": 50001,
  "message": "internal error",
  "data": null
}
```

---

## 12. 推荐 Go DTO

```go
type SessionCalendarQuery struct {
	Year  int `form:"year" binding:"required,min=2000,max=2100"`
	Month int `form:"month" binding:"required,min=1,max=12"`
}

type SessionCalendarDayResponse struct {
	Date  string `json:"date"`
	Count int64  `json:"count"`
}

type SessionCalendarSummaryResponse struct {
	SessionCount   int64   `json:"sessionCount"`
	ActiveDayCount int64   `json:"activeDayCount"`
	TotalMinutes   int64   `json:"totalMinutes"`
	AverageMinutes float64 `json:"averageMinutes"`
	AverageRating  float64 `json:"averageRating"`
	SessionCost    float64 `json:"sessionCost"`
	RacketCost     float64 `json:"racketCost"`
	StringingCost  float64 `json:"stringingCost"`
	TotalCost      float64 `json:"totalCost"`
}

type CalendarWeeklySessionChartItemResponse struct {
	Label string `json:"label"`
	Count int64  `json:"count"`
}

type CalendarRatingTrendChartItemResponse struct {
	Date   string `json:"date"`
	Rating int16  `json:"rating"`
}

type CalendarExpenseChartItemResponse struct {
	Label string  `json:"label"`
	Value float64 `json:"value"`
}

type SessionCalendarChartsResponse struct {
	WeeklySessions  []CalendarWeeklySessionChartItemResponse `json:"weeklySessions"`
	RatingTrend     []CalendarRatingTrendChartItemResponse   `json:"ratingTrend"`
	ExpenseBreakdown []CalendarExpenseChartItemResponse       `json:"expenseBreakdown"`
}

type SessionCalendarResponse struct {
	Year           int                            `json:"year"`
	Month          int                            `json:"month"`
	ActiveDayCount int64                          `json:"activeDayCount"`
	Days           []SessionCalendarDayResponse   `json:"days"`
	Summary        SessionCalendarSummaryResponse `json:"summary"`
	Charts         SessionCalendarChartsResponse  `json:"charts"`
}
```

---

## 13. SQL / 查询建议

### 13.1 日期列表

```sql
SELECT date, COUNT(*) AS count
FROM tennis_sessions
WHERE user_id = ?
  AND deleted_at IS NULL
  AND date >= ?
  AND date < ?
GROUP BY date
ORDER BY date ASC;
```

### 13.2 月度打球统计

```sql
SELECT
  COUNT(*) AS session_count,
  COUNT(DISTINCT date) AS active_day_count,
  COALESCE(SUM(duration_minutes), 0) AS total_minutes,
  COALESCE(AVG(duration_minutes), 0) AS average_minutes,
  COALESCE(AVG(rating), 0) AS average_rating,
  COALESCE(SUM(cost), 0) AS session_cost
FROM tennis_sessions
WHERE user_id = ?
  AND deleted_at IS NULL
  AND date >= ?
  AND date < ?;
```

### 13.3 手感趋势

```sql
SELECT date, rating
FROM tennis_sessions
WHERE user_id = ?
  AND deleted_at IS NULL
  AND date >= ?
  AND date < ?
ORDER BY date DESC, created_at DESC
LIMIT 8;
```

如果使用上面的倒序查询，service 层建议再反转为时间升序返回给前端。

### 13.4 球拍购买费用

```sql
SELECT COALESCE(SUM(purchase_price), 0)
FROM rackets
WHERE user_id = ?
  AND deleted_at IS NULL
  AND purchase_date >= ?
  AND purchase_date < ?;
```

### 13.5 穿线费用

```sql
SELECT COALESCE(SUM(cost), 0)
FROM stringing_records
WHERE user_id = ?
  AND deleted_at IS NULL
  AND string_date >= ?
  AND string_date < ?;
```

如果 `stringing_records` 没有 `user_id`：

```sql
SELECT COALESCE(SUM(sr.cost), 0)
FROM stringing_records sr
JOIN rackets r ON r.id = sr.racket_id
WHERE r.user_id = ?
  AND sr.deleted_at IS NULL
  AND r.deleted_at IS NULL
  AND sr.string_date >= ?
  AND sr.string_date < ?;
```

---

## 14. 前端展示建议

统计 tab 第一版使用原生 `view + wxss` 图表，不需要引入图表库。

### 14.1 月度概览

使用 `summary`：

| 展示 | 字段 |
|---|---|
| 打球次数 | `summary.sessionCount` |
| 打球日数 | `summary.activeDayCount` |
| 累计时长 | `summary.totalMinutes` |
| 平均时长 | `summary.averageMinutes` |
| 平均手感 | `summary.averageRating` |
| 本月花费 | `summary.totalCost` |

### 14.2 打球频率图

使用：

```text
charts.weeklySessions
```

前端根据最大 `count` 计算柱状图高度。

### 14.3 手感趋势图

使用：

```text
charts.ratingTrend
```

前端根据 `rating` 计算柱状图高度。

### 14.4 消费构成图

使用：

```text
charts.expenseBreakdown
```

前端根据 `summary.totalCost` 或各项合计计算横向条百分比。

---

## 15. 兼容策略

该接口是在现有 `/api/sessions/calendar` 上追加字段：

- `summary`
- `charts`

旧前端只读取：

- `year`
- `month`
- `activeDayCount`
- `days`

因此新增字段不会破坏旧前端。

前端接入时应对 `summary` 和 `charts` 做空值保护：

- `summary` 缺失时使用零值对象
- `charts.weeklySessions` 缺失时使用空数组或默认周数组
- `charts.ratingTrend` 缺失时使用 `[]`
- `charts.expenseBreakdown` 缺失时使用固定三项零值

---

## 16. 注意事项

1. 所有金额字段返回 number
2. 日期格式统一 `YYYY-MM-DD`
3. JSON 字段使用 camelCase
4. 查询必须过滤当前用户
5. 查询必须过滤 `deleted_at IS NULL`
6. 空数组返回 `[]`，不要返回 `null`
7. 空统计返回完整零值对象
8. 周统计与前端日历一致，周一作为一周开始
9. 服务端异常不要返回部分错误堆栈，统一 `internal error`
10. 统计口径以后端为准，前端只做展示转换
