# API Documentation

Base URL: `/api`

All responses follow one of these two shapes:

**Success**
```json
{ "success": true, "data": { } }
```

**Paginated success** (list endpoints)
```json
{ "success": true, "data": [ ], "pagination": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 } }
```

**Error**
```json
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "..." } }
```

| HTTP Status | Meaning |
|---|---|
| 400 | Validation error / bad request |
| 401 | Not authenticated (missing/invalid/expired token) |
| 403 | Authenticated, but not authorized for this action |
| 404 | Resource not found |
| 409 | Conflict (e.g. duplicate email, already a member) |
| 429 | Rate limited |
| 500 | Internal / invariant error |

Authenticated endpoints require:
```
Authorization: Bearer <jwt>
```

All monetary amounts in requests and responses are **integers in minor currency units** (e.g. paise for INR), unless explicitly noted otherwise (CSV/PDF exports render human-readable major-unit amounts).

---

## Health

### `GET /api/health`
No auth required.

**Response `200`**
```json
{ "success": true, "status": "healthy", "database": "connected", "timestamp": "2026-09-12T10:00:00.000Z" }
```

---

## Auth

### `POST /api/auth/register`
No auth required. Rate-limited (20 requests / 15 min per IP).

**Body**
```json
{ "name": "Tanu", "email": "tanu@example.com", "password": "Password123!", "currency": "INR", "timezone": "Asia/Kolkata" }
```
`currency`/`timezone` are optional.

**Response `201`**
```json
{ "success": true, "data": { "user": { "_id": "...", "name": "Tanu", "email": "tanu@example.com", ... }, "token": "<jwt>", "expiresIn": "7d" } }
```

**Errors**: `400 VALIDATION_ERROR`, `409 CONFLICT` (email already registered)

### `POST /api/auth/login`
No auth required. Rate-limited.

**Body**
```json
{ "email": "tanu@example.com", "password": "Password123!" }
```

**Response `200`**: same shape as register.

**Errors**: `400 VALIDATION_ERROR`, `401 UNAUTHENTICATED` (wrong email/password)

### `POST /api/auth/logout`
Auth required. No-op today (stateless JWT) — client should discard the token.

**Response `200`**: `{ "success": true, "data": { "message": "Logged out" } }`

### `GET /api/auth/me`
Auth required.

**Response `200`**: `{ "success": true, "data": { "user": { ... } } }`

---

## Users

### `GET /api/users/me`
Auth required. Same as `/api/auth/me`.

### `PATCH /api/users/me`
Auth required.

**Body** (all optional)
```json
{ "name": "Tanu R", "avatar": "https://...", "currency": "INR", "timezone": "Asia/Kolkata",
  "notificationPreferences": { "email": true, "push": false } }
```

**Response `200`**: `{ "success": true, "data": { "user": { ... } } }`

### `POST /api/users/me/change-password`
Auth required.

**Body**
```json
{ "currentPassword": "old", "newPassword": "newPassword123" }
```

**Errors**: `401 UNAUTHENTICATED` (current password incorrect)

### `GET /api/users/search?q=`
Auth required. Searches users by name/email substring (used e.g. when picking someone to add to a group).

**Response `200`**: `{ "success": true, "data": { "users": [ { "_id", "name", "email" } ] } }`

---

## Groups

### `POST /api/groups`
Auth required. Creates a group; the creator becomes `OWNER`.

**Body**
```json
{ "name": "Goa Trip", "description": "Beach vacation", "currency": "INR" }
```

**Response `201`**: `{ "success": true, "data": { "group": { ... } } }`

### `GET /api/groups`
Auth required. Lists groups the caller belongs to.

**Response `200`**: `{ "success": true, "data": { "groups": [ ... ] } }`

### `GET /api/groups/:groupId`
Auth required, must be a group member.

### `PATCH /api/groups/:groupId`
Auth required, must be `ADMIN` or `OWNER`.

**Body** (all optional): `{ "name", "description", "image", "currency" }`

### `DELETE /api/groups/:groupId`
Auth required, must be `OWNER`.

### `GET /api/groups/:groupId/activity`
Auth required, must be a group member. Returns the most recent 50 activity log entries (expense/member/settlement/group events) for the group.

---

## Group Members

### `GET /api/groups/:groupId/members`
Auth required, must be a group member.

**Response `200`**
```json
{ "success": true, "data": { "members": [
  { "userId": "...", "name": "Tanu", "email": "tanu@example.com", "role": "OWNER", "joinedAt": "..." }
] } }
```

### `POST /api/groups/:groupId/members`
Auth required, must be `ADMIN` or `OWNER`. Adds an **existing** user (found by email) directly to the group. For people without an account yet, use the invitation flow instead.

**Body**
```json
{ "email": "rahul@example.com", "role": "MEMBER" }
```
`role` is optional (defaults to `MEMBER`; can also be `ADMIN`).

**Errors**: `400 VALIDATION_ERROR` (no account with that email), `409 CONFLICT` (already a member)

### `DELETE /api/groups/:groupId/members/:userId`
Auth required, must be `ADMIN` or `OWNER`. The group owner cannot be removed this way.

### `PATCH /api/groups/:groupId/members/:userId/role`
Auth required, must be `OWNER`.

**Body**
```json
{ "role": "ADMIN" }
```
A group must always retain at least one `OWNER`.

---

## Invitations

### `POST /api/groups/:groupId/invitations`
Auth required, must be `ADMIN` or `OWNER`. Creates a token-based invitation (works even if the invited email has no account yet).

**Body**
```json
{ "email": "newperson@example.com" }
```

**Errors**: `409 CONFLICT` (already a member, or already has a pending invitation)

### `GET /api/groups/:groupId/invitations?status=PENDING`
Auth required, must be a group member. `status` query param is optional.

### `POST /api/invitations/:token/respond`
Auth required. The authenticated user's email must match the invitation's email.

**Body**
```json
{ "action": "ACCEPT" }
```
`action` is `"ACCEPT"` or `"DECLINE"`.

**Errors**: `400 VALIDATION_ERROR` (already responded to / expired), `401 UNAUTHORIZED` (email mismatch)

---

## Expenses

### `POST /api/expenses`
Auth required, caller must belong to the group.

**Body (EQUAL split)**
```json
{
  "groupId": "...",
  "title": "Dinner",
  "description": "Beach shack",
  "amount": 100000,
  "category": "Food",
  "paidBy": "<userId>",
  "splitType": "EQUAL",
  "participants": [ { "userId": "<userId-1>" }, { "userId": "<userId-2>" } ]
}
```

**Body (PERCENTAGE split)** — every participant needs `percentage`, must total 100:
```json
{ "...": "...", "splitType": "PERCENTAGE",
  "participants": [ { "userId": "A", "percentage": 50 }, { "userId": "B", "percentage": 50 } ] }
```

**Body (CUSTOM split)** — every participant needs `shareAmount` (minor units), must total `amount`:
```json
{ "...": "...", "splitType": "CUSTOM",
  "participants": [ { "userId": "A", "shareAmount": 60000 }, { "userId": "B", "shareAmount": 40000 } ] }
```

The server always computes final `shareAmount`s — a client-supplied `shareAmount`/`percentage` is only ever an *input* to the split calculation, never trusted as the final balance value.

**Response `201`**
```json
{ "success": true, "data": { "expense": { ... }, "participants": [ { "userId", "shareAmount", "percentage" } ] } }
```

**Errors**: `400 VALIDATION_ERROR` / `400 INVALID_SPLIT` (bad split math, participant not in group, payer not in group)

### `GET /api/expenses`
Auth required. Filters (all optional query params): `group`, `category`, `dateFrom`, `dateTo`, `paidBy`, `participant`, `page`, `limit`. If `group` is omitted, results are restricted to expenses across every group the caller belongs to.

**Response `200`**: paginated list of expenses.

### `GET /api/expenses/:expenseId`
Auth required, caller must belong to the expense's group.

**Response `200`**: `{ "success": true, "data": { "expense": { ... }, "participants": [ ... ] } }`

### `PATCH /api/expenses/:expenseId`
Auth required. Only the expense's creator, or a group `ADMIN`/`OWNER`, may edit it. Any subset of the create-body fields may be supplied; if `amount`, `splitType`, or `participants` change, shares are recalculated from scratch server-side.

### `DELETE /api/expenses/:expenseId`
Auth required, same permission rule as update. Soft-deletes the expense (historical data is retained, not destroyed).

---

## Balances

### `GET /api/groups/:groupId/balances`
Auth required, must be a group member.

**Response `200`**
```json
{ "success": true, "data": { "groupId": "...", "balances": [
  { "userId": "...", "name": "Tanu", "totalPaid": 500000, "totalOwed": 320000,
    "settlementsPaid": 0, "settlementsReceived": 0, "netBalance": 180000 }
] } }
```
`netBalance` positive = the group owes this person money; negative = they owe the group; zero = settled up.

---

## Debts

### `GET /api/groups/:groupId/debts`
Auth required, must be a group member. Direct, pairwise "who owes whom", already netted against settlements (but **not** run through simplification, so circular/transitive debts between 3+ people may appear as multiple lines).

**Response `200`**
```json
{ "success": true, "data": [ { "from": "<userId>", "to": "<userId>", "amount": 50000 } ] }
```

### `GET /api/groups/:groupId/debts/simplified`
Auth required, must be a group member. Runs the greedy debt-simplification algorithm over each member's net balance.

**Response `200`**
```json
{ "success": true, "data": { "transactions": [
  { "from": { "id": "...", "name": "A" }, "to": { "id": "...", "name": "B" }, "amount": 50000 }
], "transactionCount": 1 } }
```

---

## Settlements

### `POST /api/settlements`
Auth required. A `MEMBER` may only record a settlement they are personally a party to (`fromUser` or `toUser` must be the caller); `ADMIN`/`OWNER` may record one on behalf of any two group members.

**Body**
```json
{ "groupId": "...", "fromUser": "<userId>", "toUser": "<userId>", "amount": 50000,
  "paymentMethod": "UPI", "note": "Settling Goa trip" }
```
`paymentMethod` is one of `CASH`, `UPI`, `BANK_TRANSFER`, `OTHER` (default `CASH`). `currency`, `note`, `date` are optional.

**Response `201`**: `{ "success": true, "data": { "settlement": { ... } } }`

**Errors**: `400 VALIDATION_ERROR` (same user twice, non-positive amount, user not in group), `403 UNAUTHORIZED`

### `GET /api/settlements`
Auth required. Filters: `group`, `userId` (either party), `page`, `limit`. If `group` is omitted, restricted to the caller's groups.

### `GET /api/settlements/:settlementId`
Auth required, must belong to the settlement's group.

### `DELETE /api/settlements/:settlementId`
Auth required. Only the settlement's creator, or a group `ADMIN`/`OWNER`, may delete it.

---

## Notifications

### `GET /api/notifications?page=&limit=`
Auth required.

**Response `200`**
```json
{ "success": true, "data": [ { "_id", "type", "title", "message", "read", "createdAt", "..." } ],
  "pagination": { "page": 1, "limit": 20, "total": 5, "totalPages": 1 }, "unread": 2 }
```

### `PATCH /api/notifications/:id/read`
Auth required.

### `PATCH /api/notifications/read-all`
Auth required. Marks every unread notification for the caller as read.

### `DELETE /api/notifications/:id`
Auth required.

---

## Analytics

All analytics endpoints require auth and are scoped to the caller (their own paid/owed amounts), optionally narrowed to a single group with `?groupId=`.

### `GET /api/analytics/overview`
**Response `200`**
```json
{ "success": true, "data": { "groupCount": 3, "expenseCount": 12, "totalSpending": 4500000,
  "userShare": 1500000, "totalPaid": 2000000, "totalOwed": 1500000, "netBalance": 500000 } }
```

### `GET /api/analytics/monthly?month=9&year=2026&groupId=`
`month` (1-12) and `year` are required query params.

**Response `200`**
```json
{ "success": true, "data": { "month": 9, "year": 2026, "totalSpending": 1845000,
  "userShare": 624000, "totalPaid": 850000, "totalOwed": 124000 } }
```

### `GET /api/analytics/categories?groupId=`
**Response `200`**: `{ "success": true, "data": { "categories": [ { "category": "Food", "totalSpending": ..., "userShare": ..., "count": ... } ] } }`

### `GET /api/analytics/groups`
**Response `200`**: `{ "success": true, "data": { "groups": [ { "groupId", "name", "totalSpending", "userShare", "totalPaid", "expenseCount" } ] } }`

### `GET /api/analytics/trends?groupId=&months=6`
**Response `200`**: `{ "success": true, "data": { "trends": [ { "month": "2026-04", "totalSpending": ..., "userShare": ... } ] } }` — one entry per month, oldest first, zero-filled for months with no spending.

---

## Export

### `GET /api/groups/:groupId/export/csv`
Auth required, must be a group member. Returns `text/csv` with `Content-Disposition: attachment`. Columns: Date, Expense, Category, Paid By, Participants, Amount, User Share, Balance (amounts shown in major currency units, e.g. rupees).

### `GET /api/groups/:groupId/export/pdf`
Auth required, must be a group member. Returns `application/pdf` with `Content-Disposition: attachment`: group summary, member balances, full expense history, full settlement history.

---

## Attachments (receipts)

### `POST /api/attachments`
Auth required. `multipart/form-data` with a `file` field (JPEG/PNG/WEBP/PDF, up to `MAX_FILE_SIZE`), plus an optional `expenseId` field to associate the receipt with a specific expense.

**Response `201`**: `{ "success": true, "data": { "attachment": { "_id", "filename", "mimeType", "size", "path", ... } } }`

**Errors**: `400 VALIDATION_ERROR` (bad type/extension/size)

### `GET /api/attachments/:attachmentId`
Auth required. Accessible to the uploader, or any member of the associated expense's group.

### `DELETE /api/attachments/:attachmentId`
Auth required. Only the uploader may delete their own attachment.

---

## Search

### `GET /api/search?q=`
Auth required. Searches groups, expenses, settlements, and co-members — **strictly scoped** to data the caller is authorized to see (only their own groups, and only users who share a group with them).

**Response `200`**
```json
{ "success": true, "data": {
  "groups": [ { "id", "name", "description" } ],
  "expenses": [ { "id", "title", "amount", "groupId", "date" } ],
  "users": [ { "id", "name", "email" } ],
  "settlements": [ { "id", "amount", "groupId", "note", "date" } ]
} }
```
