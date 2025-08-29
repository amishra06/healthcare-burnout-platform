# Healthcare Burnout Prevention API Documentation

## Overview

This API provides authentication and data management endpoints for the Healthcare Burnout Prevention Platform. All endpoints return JSON responses with a consistent format.

## Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data here
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": [] // Optional validation details
  }
}
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Endpoints

### Authentication Endpoints

#### POST /api/auth/login
Authenticate manager and receive JWT token.

**Request Body:**
```json
{
  "email": "manager@hospital.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "manager": {
      "id": 1,
      "name": "Manager Name",
      "email": "manager@hospital.com"
    }
  }
}
```

**Error Responses:**
- 400: Validation error (invalid email format, missing fields)
- 401: Invalid credentials

#### POST /api/auth/logout
Logout endpoint (client-side token removal).

**Headers:** `Authorization: Bearer <token>`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

#### GET /api/auth/verify
Verify JWT token and return manager information.

**Headers:** `Authorization: Bearer <token>`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "manager": {
      "id": 1,
      "name": "Manager Name",
      "email": "manager@hospital.com"
    }
  }
}
```

**Error Responses:**
- 401: No token provided
- 403: Invalid or expired token

### Staff Management Endpoints

#### GET /api/staff
Get all staff members with optional filtering and pagination.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `department` (optional): Filter by department (ICU, Emergency, General)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50, max: 100)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "staff": [
      {
        "id": 1,
        "name": "John Doe",
        "email": "john.doe@hospital.com",
        "department": "ICU",
        "role": "Nurse",
        "hire_date": "2023-01-15",
        "created_at": "2024-01-01T10:00:00.000Z",
        "updated_at": "2024-01-01T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 15,
      "totalPages": 1,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

#### GET /api/staff/:id
Get specific staff member with work hours and risk history.

**Headers:** `Authorization: Bearer <token>`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "staff": {
      "id": 1,
      "name": "John Doe",
      "email": "john.doe@hospital.com",
      "department": "ICU",
      "role": "Nurse",
      "hire_date": "2023-01-15"
    },
    "workHours": [
      {
        "id": 1,
        "staff_id": 1,
        "date": "2024-01-15",
        "hours_worked": 8.5,
        "overtime_hours": 2.0,
        "created_at": "2024-01-15T10:00:00.000Z"
      }
    ],
    "riskHistory": [
      {
        "id": 1,
        "staff_id": 1,
        "date": "2024-01-15",
        "score": 45,
        "risk_level": "Medium",
        "factors": "{\"baseScore\":20,\"consecutiveDays\":10}",
        "created_at": "2024-01-15T10:00:00.000Z"
      }
    ]
  }
}
```

**Error Responses:**
- 404: Staff member not found

#### POST /api/staff
Create new staff member.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane.smith@hospital.com",
  "department": "Emergency",
  "role": "Doctor",
  "hire_date": "2023-06-01"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "staff": {
      "id": 2,
      "name": "Jane Smith",
      "email": "jane.smith@hospital.com",
      "department": "Emergency",
      "role": "Doctor",
      "hire_date": "2023-06-01",
      "created_at": "2024-01-01T10:00:00.000Z",
      "updated_at": "2024-01-01T10:00:00.000Z"
    }
  }
}
```

**Error Responses:**
- 400: Validation error
- 409: Email already exists

#### PUT /api/staff/:id
Update existing staff member.

**Headers:** `Authorization: Bearer <token>`

**Request Body (partial updates allowed):**
```json
{
  "name": "Jane Smith Updated",
  "role": "Senior Doctor"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "staff": {
      "id": 2,
      "name": "Jane Smith Updated",
      "email": "jane.smith@hospital.com",
      "department": "Emergency",
      "role": "Senior Doctor",
      "hire_date": "2023-06-01",
      "updated_at": "2024-01-01T11:00:00.000Z"
    }
  }
}
```

**Error Responses:**
- 400: Validation error or no valid fields to update
- 404: Staff member not found
- 409: Email already exists (if email is being updated)

#### DELETE /api/staff/:id
Delete staff member.

**Headers:** `Authorization: Bearer <token>`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Staff member deleted successfully"
  }
}
```

**Error Responses:**
- 404: Staff member not found

### Work Hours Endpoints

#### POST /api/work-hours
Record work hours for a staff member.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "staff_id": 1,
  "date": "2024-01-15",
  "hours_worked": 8.5,
  "overtime_hours": 2.0
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "workHour": {
      "id": 1,
      "staff_id": 1,
      "date": "2024-01-15",
      "hours_worked": 8.5,
      "overtime_hours": 2.0,
      "created_at": "2024-01-15T10:00:00.000Z"
    },
    "message": "Work hours recorded successfully"
  }
}
```

**Error Responses:**
- 400: Validation error
- 404: Staff member not found
- 409: Work hours already exist for this date

#### GET /api/work-hours/:staff_id
Get work hours for a specific staff member.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `start_date` (optional): Filter from date (YYYY-MM-DD)
- `end_date` (optional): Filter to date (YYYY-MM-DD)
- `limit` (optional): Maximum entries to return (default: 100)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "staff": {
      "id": 1,
      "name": "John Doe"
    },
    "workHours": [
      {
        "id": 1,
        "staff_id": 1,
        "date": "2024-01-15",
        "hours_worked": 8.5,
        "overtime_hours": 2.0,
        "created_at": "2024-01-15T10:00:00.000Z"
      }
    ],
    "summary": {
      "totalEntries": 1,
      "totalHours": 8.5,
      "totalOvertime": 2.0,
      "averageDaily": 8.5
    }
  }
}
```

**Error Responses:**
- 404: Staff member not found

#### PUT /api/work-hours/:id
Update existing work hours entry.

**Headers:** `Authorization: Bearer <token>`

**Request Body (partial updates allowed):**
```json
{
  "hours_worked": 9.0,
  "overtime_hours": 1.5
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "workHour": {
      "id": 1,
      "staff_id": 1,
      "date": "2024-01-15",
      "hours_worked": 9.0,
      "overtime_hours": 1.5,
      "created_at": "2024-01-15T10:00:00.000Z",
      "staff_name": "John Doe"
    },
    "message": "Work hours updated successfully"
  }
}
```

**Error Responses:**
- 400: Validation error or no valid fields to update
- 404: Work hours entry not found

#### DELETE /api/work-hours/:id
Delete work hours entry.

**Headers:** `Authorization: Bearer <token>`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Work hours entry deleted successfully"
  }
}
```

**Error Responses:**
- 404: Work hours entry not found

### Dashboard Analytics Endpoints

#### GET /api/dashboard/overview
Get comprehensive dashboard overview with risk statistics and alerts.

**Headers:** `Authorization: Bearer <token>`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "totalStaff": 15,
    "riskDistribution": {
      "Low": 8,
      "Medium": 5,
      "High": 2
    },
    "topRiskStaff": [
      {
        "id": 3,
        "name": "Alice Johnson",
        "department": "ICU",
        "role": "Nurse",
        "score": 85,
        "risk_level": "High",
        "factors": "{\"baseScore\":20,\"consecutiveDays\":30,\"overtimeHours\":25,\"weeklyHours\":20}",
        "risk_date": "2024-01-15"
      }
    ],
    "activeAlerts": [
      {
        "id": 1,
        "message": "High burnout risk detected for Alice Johnson",
        "risk_score": 85,
        "created_at": "2024-01-15T10:00:00.000Z",
        "staff_id": 3,
        "staff_name": "Alice Johnson",
        "department": "ICU"
      }
    ],
    "summary": {
      "highRiskCount": 2,
      "mediumRiskCount": 5,
      "lowRiskCount": 8,
      "activeAlertsCount": 1
    }
  }
}
```

#### GET /api/dashboard/risk-distribution
Get detailed risk distribution statistics overall and by department.

**Headers:** `Authorization: Bearer <token>`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "overall": {
      "Low": 8,
      "Medium": 5,
      "High": 2
    },
    "byDepartment": {
      "ICU": {
        "Low": 3,
        "Medium": 2,
        "High": 1
      },
      "Emergency": {
        "Low": 2,
        "Medium": 2,
        "High": 1
      },
      "General": {
        "Low": 3,
        "Medium": 1,
        "High": 0
      }
    }
  }
}
```

#### GET /api/dashboard/top-risk-staff
Get top N highest risk staff members.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `limit` (optional): Number of staff to return (default: 10)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "topRiskStaff": [
      {
        "id": 3,
        "name": "Alice Johnson",
        "department": "ICU",
        "role": "Nurse",
        "score": 85,
        "risk_level": "High",
        "factors": "{\"baseScore\":20,\"consecutiveDays\":30}",
        "risk_date": "2024-01-15"
      }
    ],
    "count": 1
  }
}
```

#### GET /api/dashboard/risk-trends
Get risk trend data over time.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `days` (optional): Number of days to include (default: 30)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "trends": [
      {
        "date": "2024-01-15",
        "avg_score": 42.5,
        "staff_count": 15,
        "high_risk_count": 2,
        "medium_risk_count": 5,
        "low_risk_count": 8
      }
    ],
    "period": "30 days"
  }
}
```

#### GET /api/dashboard/alerts
Get alerts with filtering and pagination.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `resolved` (optional): Filter by resolution status (true/false/all, default: false)
- `limit` (optional): Items per page (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "alerts": [
      {
        "id": 1,
        "message": "High burnout risk detected for Alice Johnson",
        "risk_score": 85,
        "resolved": false,
        "resolved_at": null,
        "created_at": "2024-01-15T10:00:00.000Z",
        "staff_id": 3,
        "staff_name": "Alice Johnson",
        "department": "ICU",
        "role": "Nurse"
      }
    ],
    "pagination": {
      "total": 1,
      "limit": 50,
      "offset": 0,
      "hasMore": false
    }
  }
}
```

## Validation Rules

### Staff Creation/Update
- `name`: 2-100 characters, required for creation
- `email`: Valid email format, unique, required for creation
- `department`: Must be one of: ICU, Emergency, General
- `role`: 2-50 characters, required for creation
- `hire_date`: ISO date format (YYYY-MM-DD), required for creation

### Work Hours
- `staff_id`: Valid staff member ID, required
- `date`: ISO date format (YYYY-MM-DD), required
- `hours_worked`: 0-24 hours, required
- `overtime_hours`: 0 or greater, optional (defaults to 0)

### Authentication
- `email`: Valid email format, required
- `password`: Non-empty string, required

## Error Codes

- `NO_TOKEN`: Authorization token not provided
- `INVALID_TOKEN`: Token is invalid or expired
- `MANAGER_NOT_FOUND`: Manager account no longer exists
- `VALIDATION_ERROR`: Input validation failed
- `INVALID_CREDENTIALS`: Login credentials are incorrect
- `EMAIL_EXISTS`: Email address already in use
- `STAFF_NOT_FOUND`: Staff member not found
- `WORK_HOURS_NOT_FOUND`: Work hours entry not found
- `WORK_HOURS_EXIST`: Work hours already recorded for date
- `NO_UPDATES`: No valid fields provided for update
- `DATABASE_ERROR`: Database operation failed
- `DASHBOARD_ERROR`: Dashboard data retrieval failed
- `INTERNAL_SERVER_ERROR`: Unexpected server error
- `NOT_FOUND`: Route not found

## Rate Limiting

API requests are limited to 100 requests per 15-minute window per IP address.

## Security Features

- JWT token authentication
- Password hashing with bcrypt
- Input validation and sanitization
- SQL injection prevention
- CORS protection
- Security headers with Helmet
- Rate limiting
- Error message sanitization