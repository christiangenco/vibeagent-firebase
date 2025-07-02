# Vibeagent API Documentation

Base URL: `https://api.vibeagent.ai`

## Users

All user IDs are normalized phone numbers in E.164 format (e.g., `+1234567890`)

### Get User with Households and Active Jobs
```
GET /api/users/:phoneNumber
```

Response:
```json
{
  "user": {
    "id": "+1234567890",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890"
  },
  "households": [{
    "id": "household_123",
    "address": "123 Main St",
    "timezone": "America/New_York"
  }],
  "activeJobs": [{
    "id": "job_123",
    "title": "Fix plumbing",
    "status": "in_progress"
  }]
}
```

### Create/Update User
```
PUT /api/users/:phoneNumber
```

### Create User
```
POST /api/users
```
Body must include `phone` field

## Households

### Get Household
```
GET /api/households/:householdId
```

### Create/Update Household
```
PUT /api/households/:householdId
```

### Create Household
```
POST /api/households
```

## Jobs

### Get Job
```
GET /api/jobs/:jobId
```

### Create/Update Job
```
PUT /api/jobs/:jobId
```

### Create Job
```
POST /api/jobs
```
Required fields: `household_id`, `user_id`, `title`

## Health Check
```
GET /api/health
```

## Phone Number Formats Accepted
- `+1234567890` (E.164)
- `1234567890` (10 digits)
- `11234567890` (11 digits with country code)
- `(123) 456-7890` (formatted)