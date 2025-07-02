# 🏠 AI Home Manager — Firestore Schema (Jobs & Tasks)

A Firestore schema to support job-based home service management with shared households, users, jobs, and multi-step task execution.

---

## 🔹 `users` (top-level collection)

Each person using the app.

**Keyed by:** `user_id`

### Fields:

- `name: string`
- `email: string`
- `phone_numbers: string[]`
- `household_ids: string[]` — households this user is part of
- `last_active_at: timestamp`
- `created_at: timestamp`

---

## 🔹 `households` (top-level collection)

A shared home or address where jobs are performed.

**Keyed by:** `household_id`

### Fields:

- `address: string`
- `timezone: string`
- `owner_user_id: string`
- `user_ids: string[]` — members of the household
- `created_at: timestamp`
- `metadata: object`

---

## 🔹 `jobs` (top-level collection)

High-level requests like “fix plumbing” or “spray for mosquitos”.

**Keyed by:** `job_id`

### Fields:

- `household_id: string`
- `user_id: string` — the creator/requester
- `title: string`
- `status: string` — (`open`, `in_progress`, `awaiting_user`, `completed`, `canceled`)
- `category: string` — (`pest_control`, `plumbing`, etc.)
- `visible_to_user_ids: string[]` — optional, for shared visibility
- `created_at: timestamp`
- `updated_at: timestamp`
- `metadata: object` — any extra tags, notes, etc.

---

## 🔸 `tasks` (subcollection under each `job`)

LLM or agent-driven steps to fulfill the job.

**Path:** `jobs/{job_id}/tasks/{task_id}`

### Fields:

- `order: number` — for sequencing tasks
- `type: string` — (`verify_address`, `get_quotes`, `collect_payment`, etc.)
- `status: string` — (`pending`, `in_progress`, `done`, `skipped`, `failed`)
- `output_data: object` — result of the task (e.g. quotes, confirmation number)
- `assigned_agent: string` — `llm`, `human`, or service name
- `created_at: timestamp`
- `updated_at: timestamp`

---

## 🔹 `providers` (optional global collection)

Cached local service vendors (plumbers, exterminators, etc.)

**Keyed by:** `provider_id`

### Fields:

- `name: string`
- `categories: string[]`
- `service_area: string`
- `phone: string`
- `booking_url: string`
- `last_quoted_at: timestamp`
- `metadata: object`

---

## 🔁 Relationship Summary

- Users belong to one or more `households`
- Jobs belong to a `user` and a `household`
- Tasks are a subcollection of `jobs`
- All lookups use document IDs (no joins)
- Use `array-contains` filters for shared visibility if needed
