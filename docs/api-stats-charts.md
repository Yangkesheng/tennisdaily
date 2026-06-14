# 统计图表接口文档

## 1. 背景

日历页「统计」页签需要支持两种统计范围：

- 月统计：查看某年某月的数据
- 年统计：查看某一整年的数据

统计页签希望使用轻量图表展示：

- 打球频率
- 手感趋势
- 消费占比
- 训练 / 比赛 / 普通打球占比
- 月度或年度概览

为了避免前端拉全量记录自行统计，新增独立统计图表接口，由后端统一返回图表数据。

> 日历日期标记仍然使用 `/api/sessions/calendar`。统计图表使用本文档定义的新接口。

---

## 2. 接口定义

### Method

```http
GET
```

### Path

```http
/api/stats/charts
```

### 月统计示例

```http
GET /api/stats/charts?period=month&year=2026&month=6
Authorization: Bearer <token>
```

### 年统计示例

```http
GET /api/stats/charts?period=year&year=2026
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
| `period` | string | 是 | `month` | 统计周期，可选 `month` / `year` |
| `year` | number | 是 | `2026` | 查询年份 |
| `month` | number | 条件必填 | `6` | 查询月份，仅 `period=month` 时必填 |

### 参数规则

- `period=month` 时，必须传 `year` 和 `month`
- `period=year` 时，只需要传 `year`，忽略 `month`
- `year` 建议范围：`2000-2100`
- `month` 范围：`1-12`
- 统计时区统一使用 `Asia/Shanghai`

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

## 6. 月统计响应示例

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "period": "month",
    "year": 2026,
    "month": 6,
    "rangeText": "2026年6月",
    "summary": {
      "sessionCount": 8,
      "activeDayCount": 4,
      "totalMinutes": 960,
      "averageMinutes": 120,
      "averageRating": 3.8,
      "sessionCost": 320,
      "racketCost": 1280,
      "stringingCost": 260,
      "totalCost": 1860,
      "trainingCount": 1,
      "singlesCount": 2,
      "doublesCount": 3,
      "matchCount": 2
    },
    "charts": {
      "frequency": [
        {
          "label": "第1周",
          "value": 1
        },
        {
          "label": "第2周",
          "value": 2
        },
        {
          "label": "第3周",
          "value": 1
        },
        {
          "label": "第4周",
          "value": 4
        },
        {
          "label": "第5周",
          "value": 0
        }
      ],
      "ratingTrend": [
        {
          "label": "6/3",
          "date": "2026-06-03",
          "rating": 3
        },
        {
          "label": "6/8",
          "date": "2026-06-08",
          "rating": 4
        },
        {
          "label": "6/15",
          "date": "2026-06-15",
          "rating": 5
        }
      ],
      "expenseBreakdown": [
        {
          "key": "session",
          "label": "打球",
          "value": 320,
          "percent": 17.2
        },
        {
          "key": "racket",
          "label": "球拍",
          "value": 1280,
          "percent": 68.8
        },
        {
          "key": "stringing",
          "label": "穿线",
          "value": 260,
          "percent": 14.0
        }
      ],
      "sessionTypeBreakdown": [
        {
          "key": "training",
          "label": "训练",
          "value": 1,
          "percent": 12.5
        },
        {
          "key": "singles",
          "label": "单打",
          "value": 2,
          "percent": 25.0
        },
        {
          "key": "doubles",
          "label": "双打",
          "value": 3,
          "percent": 37.5
        },
        {
          "key": "match",
          "label": "比赛",
          "value": 2,
          "percent": 25.0
        }
      ]
    }
  }
}
```

---

## 7. 年统计响应示例

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "period": "year",
    "year": 2026,
    "month": 0,
    "rangeText": "2026年",
    "summary": {
      "sessionCount": 86,
      "activeDayCount": 52,
      "totalMinutes": 10320,
      "averageMinutes": 120,
      "averageRating": 3.7,
      "sessionCost": 4200,
      "racketCost": 3600,
      "stringingCost": 920,
      "totalCost": 8720,
      "trainingCount": 12,
      "singlesCount": 18,
      "doublesCount": 41,
      "matchCount": 15
    },
    "charts": {
      "frequency": [
        {
          "label": "1月",
          "value": 6
        },
        {
          "label": "2月",
          "value": 4
        },
        {
          "label": "3月",
          "value": 8
        },
        {
          "label": "4月",
          "value": 7
        },
        {
          "label": "5月",
          "value": 9
        },
        {
          "label": "6月",
          "value": 8
        },
        {
          "label": "7月",
          "value": 0
        },
        {
          "label": "8月",
          "value": 0
        },
        {
          "label": "9月",
          "value": 0
        },
        {
          "label": "10月",
          "value": 0
        },
        {
          "label": "11月",
          "value": 0
        },
        {
          "label": "12月",
          "value": 0
        }
      ],
      "ratingTrend": [
        {
          "label": "1月",
          "date": "2026-01",
          "rating": 3.5
        },
        {
          "label": "2月",
          "date": "2026-02",
          "rating": 3.7
        },
        {
          "label": "3月",
          "date": "2026-03",
          "rating": 3.9
        },
        {
          "label": "4月",
          "date": "2026-04",
          "rating": 3.6
        },
        {
          "label": "5月",
          "date": "2026-05",
          "rating": 3.8
        },
        {
          "label": "6月",
          "date": "2026-06",
          "rating": 3.8
        }
      ],
      "expenseBreakdown": [
        {
          "key": "session",
          "label": "打球",
          "value": 4200,
          "percent": 48.2
        },
        {
          "key": "racket",
          "label": "球拍",
          "value": 3600,
          "percent": 41.3
        },
        {
          "key": "stringing",
          "label": "穿线",
          "value": 920,
          "percent": 10.5
        }
      ],
      "sessionTypeBreakdown": [
        {
          "key": "training",
          "label": "训练",
          "value": 12,
          "percent": 14.0
        },
        {
          "key": "singles",
          "label": "单打",
          "value": 18,
          "percent": 20.9
        },
        {
          "key": "doubles",
          "label": "双打",
          "value": 41,
          "percent": 47.7
        },
        {
          "key": "match",
          "label": "比赛",
          "value": 15,
          "percent": 17.4
        }
      ]
    }
  }
}
```

---

## 8. 空数据响应示例

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "period": "month",
    "year": 2026,
    "month": 6,
    "rangeText": "2026年6月",
    "summary": {
      "sessionCount": 0,
      "activeDayCount": 0,
      "totalMinutes": 0,
      "averageMinutes": 0,
      "averageRating": 0,
      "sessionCost": 0,
      "racketCost": 0,
      "stringingCost": 0,
      "totalCost": 0,
      "trainingCount": 0,
      "singlesCount": 0,
      "doublesCount": 0,
      "matchCount": 0
    },
    "charts": {
      "frequency": [],
      "ratingTrend": [],
      "expenseBreakdown": [
        {
          "key": "session",
          "label": "打球",
          "value": 0,
          "percent": 0
        },
        {
          "key": "racket",
          "label": "球拍",
          "value": 0,
          "percent": 0
        },
        {
          "key": "stringing",
          "label": "穿线",
          "value": 0,
          "percent": 0
        }
      ],
      "sessionTypeBreakdown": [
        {
          "key": "training",
          "label": "训练",
          "value": 0,
          "percent": 0
        },
        {
          "key": "singles",
          "label": "单打",
          "value": 0,
          "percent": 0
        },
        {
          "key": "doubles",
          "label": "双打",
          "value": 0,
          "percent": 0
        },
        {
          "key": "match",
          "label": "比赛",
          "value": 0,
          "percent": 0
        }
      ]
    }
  }
}
```

建议：

- 空数组返回 `[]`，不要返回 `null`
- `summary` 始终返回完整零值对象
- `expenseBreakdown` 和 `sessionTypeBreakdown` 建议固定返回完整分类，即使值为 0

---

## 9. 字段说明

### 9.1 顶层字段

| 字段 | 类型 | 说明 |
|---|---|---|
| `period` | string | 统计周期：`month` / `year` |
| `year` | number | 查询年份 |
| `month` | number | 查询月份，年统计时返回 `0` |
| `rangeText` | string | 展示文案，例如 `2026年6月` / `2026年` |
| `summary` | object | 概览统计 |
| `charts` | object | 图表数据 |

### 9.2 `summary`

| 字段 | 类型 | 说明 |
|---|---|---|
| `sessionCount` | number | 当前范围内打球记录数 |
| `activeDayCount` | number | 当前范围内有打球记录的自然日数量 |
| `totalMinutes` | number | 当前范围内累计打球分钟数 |
| `averageMinutes` | number | 平均每次打球分钟数，`sessionCount=0` 时为 `0` |
| `averageRating` | number | 平均手感评分，范围 `0-5`，无记录时为 `0` |
| `sessionCost` | number | 打球消费，来自打球记录 cost |
| `racketCost` | number | 球拍购买费用 |
| `stringingCost` | number | 穿线费用 |
| `totalCost` | number | 总消费，`sessionCost + racketCost + stringingCost` |
| `trainingCount` | number | 训练记录数 |
| `singlesCount` | number | 单打记录数，不含单打比赛 |
| `doublesCount` | number | 双打记录数，不含双打比赛 |
| `matchCount` | number | 比赛记录数，包含单打比赛和双打比赛 |

---

## 10. 图表字段说明

### 10.1 `charts.frequency`

用于打球频率柱状图。

月统计时按周返回：

```json
[
  { "label": "第1周", "value": 1 },
  { "label": "第2周", "value": 2 }
]
```

年统计时按月返回：

```json
[
  { "label": "1月", "value": 6 },
  { "label": "2月", "value": 4 }
]
```

| 字段 | 类型 | 说明 |
|---|---|---|
| `label` | string | 展示标签 |
| `value` | number | 打球记录数 |

### 10.2 `charts.ratingTrend`

用于手感趋势图。

月统计时建议返回当前月最近最多 8 条记录，并按时间升序返回：

```json
[
  { "label": "6/3", "date": "2026-06-03", "rating": 3 }
]
```

年统计时建议按月返回每月平均评分：

```json
[
  { "label": "1月", "date": "2026-01", "rating": 3.5 }
]
```

| 字段 | 类型 | 说明 |
|---|---|---|
| `label` | string | 展示标签 |
| `date` | string | 月统计为 `YYYY-MM-DD`，年统计为 `YYYY-MM` |
| `rating` | number | 评分或平均评分，范围 `0-5` |

### 10.3 `charts.expenseBreakdown`

用于消费占比图。

固定返回三类：

```json
[
  { "key": "session", "label": "打球", "value": 320, "percent": 17.2 },
  { "key": "racket", "label": "球拍", "value": 1280, "percent": 68.8 },
  { "key": "stringing", "label": "穿线", "value": 260, "percent": 14.0 }
]
```

| 字段 | 类型 | 说明 |
|---|---|---|
| `key` | string | 类型标识：`session` / `racket` / `stringing` |
| `label` | string | 展示名称：打球 / 球拍 / 穿线 |
| `value` | number | 消费金额 |
| `percent` | number | 占总消费百分比，保留 1 位小数即可 |

计算规则：

```text
percent = totalCost > 0 ? value / totalCost * 100 : 0
```

### 10.4 `charts.sessionTypeBreakdown`

用于训练 / 比赛 / 单打 / 双打占比图。

固定返回四类：

```json
[
  { "key": "training", "label": "训练", "value": 1, "percent": 12.5 },
  { "key": "singles", "label": "单打", "value": 2, "percent": 25.0 },
  { "key": "doubles", "label": "双打", "value": 3, "percent": 37.5 },
  { "key": "match", "label": "比赛", "value": 2, "percent": 25.0 }
]
```

| 字段 | 类型 | 说明 |
|---|---|---|
| `key` | string | 类型标识：`training` / `singles` / `doubles` / `match` |
| `label` | string | 展示名称 |
| `value` | number | 对应类型记录数 |
| `percent` | number | 占打球记录总数百分比，保留 1 位小数即可 |

类型归类规则：

| 后端 type | 含义 | 归类 |
|---|---|---|
| `1` | 双打 | `doubles` |
| `2` | 单打 | `singles` |
| `3` | 训练 | `training` |
| `4` | 单打比赛 | `match` |
| `5` | 双打比赛 | `match` |

计算规则：

```text
percent = sessionCount > 0 ? value / sessionCount * 100 : 0
```

---

## 11. 统计时间范围

### 11.1 月统计

```text
startDate = YYYY-MM-01
endDate = 下个月 1 号
范围：[startDate, endDate)
```

示例：

```text
period=month&year=2026&month=6
startDate = 2026-06-01
endDate = 2026-07-01
```

### 11.2 年统计

```text
startDate = YYYY-01-01
endDate = 下一年 1 月 1 号
范围：[startDate, endDate)
```

示例：

```text
period=year&year=2026
startDate = 2026-01-01
endDate = 2027-01-01
```

统一使用：

```text
Asia/Shanghai
```

---

## 12. 数据来源和统计口径

### 12.1 打球记录

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

统计字段：

| 字段 | 来源 |
|---|---|
| `sessionCount` | `COUNT(*)` |
| `activeDayCount` | `COUNT(DISTINCT date)` |
| `totalMinutes` | `SUM(duration_minutes)` |
| `averageMinutes` | `AVG(duration_minutes)` |
| `averageRating` | `AVG(rating)` |
| `sessionCost` | `SUM(cost)` |
| `trainingCount` | `type = 3` |
| `singlesCount` | `type = 2` |
| `doublesCount` | `type = 1` |
| `matchCount` | `type IN (4, 5)` |

### 12.2 球拍购买费用

数据表建议：

```text
rackets
```

字段：

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

### 12.3 穿线费用

数据表建议：

```text
stringing_records
```

字段：

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

如果穿线表没有 `user_id`，通过球拍表关联当前用户：

```sql
JOIN rackets ON rackets.id = stringing_records.racket_id
WHERE rackets.user_id = 当前用户 ID
```

---

## 13. 推荐 Go DTO

```go
type StatsChartsQuery struct {
	Period string `form:"period" binding:"required,oneof=month year"`
	Year   int    `form:"year" binding:"required,min=2000,max=2100"`
	Month  int    `form:"month" binding:"omitempty,min=1,max=12"`
}

type StatsChartsSummaryResponse struct {
	SessionCount   int64   `json:"sessionCount"`
	ActiveDayCount int64   `json:"activeDayCount"`
	TotalMinutes   int64   `json:"totalMinutes"`
	AverageMinutes float64 `json:"averageMinutes"`
	AverageRating  float64 `json:"averageRating"`
	SessionCost    float64 `json:"sessionCost"`
	RacketCost     float64 `json:"racketCost"`
	StringingCost  float64 `json:"stringingCost"`
	TotalCost      float64 `json:"totalCost"`
	TrainingCount  int64   `json:"trainingCount"`
	SinglesCount   int64   `json:"singlesCount"`
	DoublesCount   int64   `json:"doublesCount"`
	MatchCount     int64   `json:"matchCount"`
}

type StatsFrequencyChartItemResponse struct {
	Label string `json:"label"`
	Value int64  `json:"value"`
}

type StatsRatingTrendItemResponse struct {
	Label  string  `json:"label"`
	Date   string  `json:"date"`
	Rating float64 `json:"rating"`
}

type StatsBreakdownItemResponse struct {
	Key     string  `json:"key"`
	Label   string  `json:"label"`
	Value   float64 `json:"value"`
	Percent float64 `json:"percent"`
}

type StatsChartsResponse struct {
	Frequency            []StatsFrequencyChartItemResponse `json:"frequency"`
	RatingTrend          []StatsRatingTrendItemResponse    `json:"ratingTrend"`
	ExpenseBreakdown     []StatsBreakdownItemResponse      `json:"expenseBreakdown"`
	SessionTypeBreakdown []StatsBreakdownItemResponse      `json:"sessionTypeBreakdown"`
}

type StatsChartsResultResponse struct {
	Period    string                     `json:"period"`
	Year      int                        `json:"year"`
	Month     int                        `json:"month"`
	RangeText string                     `json:"rangeText"`
	Summary   StatsChartsSummaryResponse `json:"summary"`
	Charts    StatsChartsResponse        `json:"charts"`
}
```

---

## 14. 错误响应

### 14.1 参数错误

例如：

```http
GET /api/stats/charts?period=month&year=2026
```

缺少 `month`，返回：

```json
{
  "code": 40001,
  "message": "invalid request",
  "data": null
}
```

### 14.2 未登录

```json
{
  "code": 40101,
  "message": "unauthorized",
  "data": null
}
```

### 14.3 服务异常

```json
{
  "code": 50001,
  "message": "internal error",
  "data": null
}
```

---

## 15. 前端展示建议

统计页签建议支持一个轻量范围切换：

```text
月    年
```

- 选择「月」时，请求：`/api/stats/charts?period=month&year=YYYY&month=M`
- 选择「年」时，请求：`/api/stats/charts?period=year&year=YYYY`

推荐图表：

| 图表 | 数据字段 | 展示方式 |
|---|---|---|
| 打球频率 | `charts.frequency` | 柱状图 |
| 手感趋势 | `charts.ratingTrend` | 柱状图或折线替代柱状图 |
| 消费占比 | `charts.expenseBreakdown` | 横向占比条 |
| 训练比赛占比 | `charts.sessionTypeBreakdown` | 横向占比条或分段条 |

第一版建议全部使用原生 `view + wxss`，不要引入图表库。

---

## 16. 与日历接口的关系

### 日历日期标记

继续使用：

```http
GET /api/sessions/calendar?year=YYYY&month=M
```

用于：

- 返回当前月有哪些日期打球
- 日历中显示 `🎾`
- 点击日期查看当天记录

### 统计图表

新增使用：

```http
GET /api/stats/charts?period=month&year=YYYY&month=M
GET /api/stats/charts?period=year&year=YYYY
```

用于：

- 月统计
- 年统计
- 消费占比
- 训练比赛占比
- 图表展示

这样职责更清晰，不会让 `/api/sessions/calendar` 变得过重。

---

## 17. 注意事项

1. 所有金额字段返回 number
2. 日期格式统一：月统计 `YYYY-MM-DD`，年统计可使用 `YYYY-MM`
3. JSON 字段使用 camelCase
4. 查询必须过滤当前用户
5. 查询必须过滤 `deleted_at IS NULL`
6. 空数组返回 `[]`，不要返回 `null`
7. 空统计返回完整零值对象
8. 百分比建议由后端返回，前端只展示
9. 百分比保留 1 位小数即可
10. 统计口径以后端为准，前端不做复杂聚合
