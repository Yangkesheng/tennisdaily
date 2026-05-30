# API 文档

本文档记录小程序前端当前已接入的后端 API。后端统一响应格式：

```json
{
  "code": 0,
  "message": "ok",
  "data": {}
}
```

---

## 18. 球拍接口

### 18.1 球拍状态

| 值 | 含义 |
|---:|---|
| 1 | 主力拍 |
| 2 | 在用 |
| 3 | 已退役 |

### 18.2 RacketResponse

```json
{
  "id": 1,
  "libraryId": 1,
  "name": "EZONE 主力拍",
  "brand": "Yonex",
  "model": "EZONE 100",
  "status": 1,
  "imageUrl": "",
  "purchaseDate": "2026-01-01",
  "purchasePrice": 1599,
  "stringName": "Poly Tour Pro",
  "tension": 48,
  "lastStringDate": "2026-05-10",
  "lastStringCost": 80,
  "totalMinutes": 5160,
  "totalHours": 86,
  "createdAt": "2026-05-30T12:00:00+08:00",
  "updatedAt": "2026-05-30T12:00:00+08:00"
}
```

说明：

- `stringName`、`tension`、`lastStringDate`、`lastStringCost` 来自最近一条穿线记录。
- `totalMinutes`、`totalHours` 通过打球记录中的 `racketId` 统计。
- 前端球拍列表页当前会额外读取打球记录，计算球拍累计使用次数和累计使用时间。

### 18.3 获取球拍列表

球拍管理页使用。

```http
GET /api/rackets?includeRetired=true
Authorization: Bearer <token>
```

查询参数：

| 参数 | 类型 | 说明 |
|---|---|---|
| includeRetired | boolean | 是否包含已退役球拍，默认 `false` |

响应 data：

```json
[
  {
    "id": 1,
    "libraryId": 1,
    "name": "EZONE 主力拍",
    "brand": "Yonex",
    "model": "EZONE 100",
    "status": 1,
    "purchasePrice": 1599,
    "stringName": "Poly Tour Pro",
    "tension": 48,
    "lastStringDate": "2026-05-10",
    "lastStringCost": 80,
    "totalMinutes": 5160,
    "totalHours": 86
  }
]
```

前端使用场景：

- 球拍列表页展示我的球拍。
- 我的页面统计未退役球拍数量和球拍总消费。

### 18.4 获取球拍统计

统计当前登录用户的球拍数量和球拍相关消费。我的页面使用该接口展示球拍数量、球拍总消费和穿线总消费。

```http
GET /api/rackets/stats
Authorization: Bearer <token>
```

统计口径：

- `racketCount`：当前用户未删除球拍总数，包含主力拍、在用、已退役，不包含已逻辑删除球拍。
- `racketCost`：当前用户未删除球拍的购买费用合计，累加 `racket.purchase_price`，空值按 `0` 处理。
- `stringingCost`：当前用户未删除球拍的未删除穿线记录费用合计，累加 `racket_stringing_record.cost`。
- 已删除球拍不计入球拍总数、球拍花费和穿线费用。
- 已删除穿线记录不计入穿线费用。

响应 data：

```json
{
  "racketCount": 3,
  "racketCost": 4597,
  "stringingCost": 320,
  "totalCost": 4917,
  "racketCostText": "4597.00",
  "stringingCostText": "320.00",
  "totalCostText": "4917.00"
}
```

字段说明：

| 字段 | 类型 | 说明 |
|---|---|---|
| racketCount | number | 球拍总数，排除已删除球拍 |
| racketCost | number | 球拍购买费用合计 |
| stringingCost | number | 球拍穿线费用合计 |
| totalCost | number | 球拍购买费用 + 穿线费用 |
| racketCostText | string | 格式化后的球拍购买费用，保留两位小数 |
| stringingCostText | string | 格式化后的穿线费用，保留两位小数 |
| totalCostText | string | 格式化后的总费用，保留两位小数 |

curl 示例：

```bash
curl http://localhost:8081/api/rackets/stats \
  -H 'Authorization: Bearer <token>'
```

### 18.5 获取可选球拍列表

新增打球记录时使用，只返回未退役球拍：

```text
status IN (1, 2)
```

接口：

```http
GET /api/my-rackets
Authorization: Bearer <token>
```

响应 data 示例：

```json
[
  {
    "id": 1,
    "libraryId": 1,
    "name": "EZONE 主力拍",
    "brand": "Yonex",
    "model": "EZONE 100",
    "status": 1,
    "stringName": "Poly Tour Pro",
    "tension": 48,
    "lastStringDate": "2026-05-10",
    "totalHours": 86
  }
]
```

前端新增/编辑打球记录时写入：

```json
{
  "racketId": 1,
  "racketName": "EZONE 主力拍"
}
```

### 18.6 添加球拍

添加球拍只维护球拍本体信息，不创建穿线记录。

```http
POST /api/rackets
Authorization: Bearer <token>
Content-Type: application/json
```

从球拍库选择时请求体示例：

```json
{
  "libraryId": 1,
  "name": "EZONE 主力拍",
  "brand": "Yonex",
  "model": "EZONE 100",
  "imageUrl": "",
  "purchaseDate": "2026-01-01",
  "purchasePrice": 1599
}
```

手动添加时请求体示例：

```json
{
  "name": "我的老款备用拍",
  "brand": "Volkl",
  "model": "V-Cell 10",
  "purchasePrice": 1200
}
```

规则：

- `name` 必填。
- `libraryId` 可选。
- 新增球拍默认 `status = 2`，表示在用。
- 从球拍库选择时，后端可根据 `libraryId` 补全 `brand`、`model`、`imageUrl`。
- 当前接口不再接收/处理 `stringName`、`tension`、`lastStringDate`、`lastStringCost`。

### 18.7 获取球拍详情

球拍详情页使用。我的页面当前也会调用该接口汇总穿线总消费。

```http
GET /api/rackets/:id
Authorization: Bearer <token>
```

响应 data：

```json
{
  "racket": {
    "id": 1,
    "libraryId": 1,
    "name": "EZONE 主力拍",
    "brand": "Yonex",
    "model": "EZONE 100",
    "status": 1,
    "purchaseDate": "2026-01-01",
    "purchasePrice": 1599,
    "stringName": "Poly Tour Pro",
    "tension": 48,
    "lastStringDate": "2026-05-10",
    "lastStringCost": 80,
    "totalHours": 86
  },
  "stringingRecords": [
    {
      "id": 1,
      "racketId": 1,
      "stringName": "Poly Tour Pro",
      "tension": 48,
      "cost": 80,
      "stringDate": "2026-05-10",
      "createdAt": "2026-05-30T12:00:00+08:00",
      "updatedAt": "2026-05-30T12:00:00+08:00"
    }
  ]
}
```

前端使用场景：

- 点击球拍列表条目进入详情页。
- 详情页展示穿线记录。
- 我的页面统计穿线总消费：累加所有 `stringingRecords[].cost`。

### 18.8 编辑球拍

```http
PUT /api/rackets/:id
Authorization: Bearer <token>
Content-Type: application/json
```

请求体：

```json
{
  "libraryId": 1,
  "name": "EZONE 主力拍",
  "brand": "Yonex",
  "model": "EZONE 100",
  "status": 1,
  "imageUrl": "",
  "purchaseDate": "2026-01-01",
  "purchasePrice": 1599
}
```

说明：

- `status = 1`：设为主力拍，后端会自动将当前用户其他主力拍改为在用。
- `status = 2`：在用。
- `status = 3`：退役。
- 编辑球拍不再接收/处理穿线信息。

### 18.9 设置主力拍

球拍详情页使用。

```http
POST /api/rackets/:id/set-primary
Authorization: Bearer <token>
```

规则：

- 系统只允许当前用户存在一支主力拍。
- 设置成功后，原主力拍会自动变成在用。

### 18.10 退役球拍

球拍详情页使用。

```http
POST /api/rackets/:id/retire
Authorization: Bearer <token>
```

规则：

- 退役后 `status = 3`。
- 默认球拍列表不展示。
- `/api/my-rackets` 不返回退役球拍。
- 历史打球记录和统计不受影响。

### 18.11 删除球拍

球拍列表页左滑删除使用。

```http
DELETE /api/rackets/:id
Authorization: Bearer <token>
```

响应 data：

```json
{
  "deleted": true
}
```

说明：

- 当前实现为逻辑删除，更新 `deleted_at`。
- 删除后默认列表、我的球拍列表不再返回。
- 历史打球记录中的 `racketId` 不会被清空。

### 18.12 新增穿线记录

穿线信息通过独立接口维护。

```http
POST /api/rackets/:id/stringing-records
Authorization: Bearer <token>
Content-Type: application/json
```

请求体：

```json
{
  "stringName": "Poly Tour Pro",
  "tension": 48,
  "cost": 80,
  "stringDate": "2026-05-10"
}
```

说明：

- `stringName` 必填。
- `stringDate` 必填，格式 `YYYY-MM-DD`。
- 球拍列表和详情中的当前球线信息来自最近一条穿线记录。

---

## 19. 球拍库与添加球拍选择接口

### 19.1 获取球拍库，按品牌分类

添加球拍页面使用。返回系统球拍库中的球拍，并按品牌分组。

```http
GET /api/racket-library
Authorization: Bearer <token>
```

响应 data 示例：

```json
[
  {
    "brand": "Yonex",
    "items": [
      {
        "id": 1,
        "brand": "Yonex",
        "model": "EZONE 100",
        "releaseYear": 2025,
        "weight": 300,
        "headSize": 100,
        "imageUrl": ""
      }
    ]
  },
  {
    "brand": "Wilson",
    "items": [
      {
        "id": 7,
        "brand": "Wilson",
        "model": "Blade 98 16x19",
        "releaseYear": 2024,
        "weight": 305,
        "headSize": 98,
        "imageUrl": ""
      }
    ]
  }
]
```

### 19.2 从球拍库添加到我的球拍

用户选择球拍库中的球拍后，新增我的球拍时传 `libraryId`。

```http
POST /api/rackets
Authorization: Bearer <token>
Content-Type: application/json
```

请求体示例：

```json
{
  "libraryId": 1,
  "name": "EZONE 主力拍",
  "purchaseDate": "2026-01-01",
  "purchasePrice": 1599
}
```

说明：

- `libraryId` 有值时，后端会从球拍库补全 `brand`、`model`、`imageUrl`。
- 如果请求体里也传了 `brand`、`model`、`imageUrl`，以前端传入值为准。
- `name` 仍可自定义，比如“EZONE 主力拍”。

---

## 20. 我的页面球拍消费统计

我的页面直接使用后端统计接口：

```http
GET /api/rackets/stats
Authorization: Bearer <token>
```

展示字段：

| 前端展示 | 接口字段 |
|---|---|
| 球拍 | `racketCount` |
| 球拍总消费 | `racketCostText` |
| 穿线总消费 | `stringingCostText` |

说明：

- 统计口径以后端 `/api/rackets/stats` 为准。
- 前端不再通过 `GET /api/rackets` 和 `GET /api/rackets/:id` 组合计算我的页面消费统计。

