# Complete Backend Setup Guide

## Database Initialization

1. Run the database setup:
```bash
php backend/setup_db.php
```

This will create all necessary tables with proper relationships.

## API Endpoints Overview

### Authentication Endpoints
- **POST** `/api/auth.php?action=signup` - Create new account
- **POST** `/api/auth.php?action=signin` - Login user
- **POST** `/api/auth.php?action=logout` - Logout user
- **POST** `/api/auth.php?action=verify-token` - Verify token validity

### Profile Endpoints
- **GET** `/api/profile.php?action=profile` - Get user profile
- **PUT** `/api/profile.php?action=profile` - Update user profile
- **GET** `/api/profile.php?action=detail` - Get detailed profile with statistics

### Appointments Endpoints
- **GET** `/api/appointments.php?action=list` - Get all appointments
- **GET** `/api/appointments.php?action=detail&id=X` - Get specific appointment
- **POST** `/api/appointments.php?action=create` - Create new appointment
- **PUT** `/api/appointments.php?action=update&id=X` - Update appointment
- **DELETE** `/api/appointments.php?action=delete&id=X` - Delete appointment

### History/Detection Endpoints
- **GET** `/api/history.php?action=list` - Get detection history
- **GET** `/api/history.php?action=detail&id=X` - Get specific detection
- **POST** `/api/history.php?action=create` - Save detection result
- **PUT** `/api/history.php?action=update&id=X` - Update detection record
- **DELETE** `/api/history.php?action=delete&id=X` - Delete history entry

### Detection Analysis Endpoints
- **POST** `/api/detection.php?action=upload` - Upload detection image
- **POST** `/api/detection.php?action=analyze` - Analyze image for dental issues
- **GET** `/api/detection.php?action=results&id=X` - Get detection results

## Request Examples

### Signup
```json
POST /api/auth.php?action=signup
{
    "email": "user@example.com",
    "username": "john_doe",
    "password": "secure123",
    "full_name": "John Doe"
}
```

### Signin
```json
POST /api/auth.php?action=signin
{
    "email": "user@example.com",
    "password": "secure123"
}
```

### Create Appointment
```json
POST /api/appointments.php?action=create
Headers: Authorization: Bearer {token}

{
    "title": "Dental Checkup",
    "description": "Regular checkup",
    "appointment_date": "2024-06-15",
    "appointment_time": "10:30",
    "dentist_name": "Dr. Smith",
    "clinic_name": "Bright Smiles",
    "location": "123 Main St",
    "contact_number": "555-1234",
    "notes": "Bring insurance card"
}
```

### Update Profile
```json
PUT /api/profile.php?action=profile
Headers: Authorization: Bearer {token}

{
    "phone": "555-1234",
    "date_of_birth": "1990-01-15",
    "gender": "M",
    "address": "123 Main St, City"
}
```

### Create Detection History
```json
POST /api/history.php?action=create
Headers: Authorization: Bearer {token}

{
    "image_path": "/uploads/scan_001.jpg",
    "detection_type": "dental_scan",
    "confidence": 0.85,
    "detected_issues": ["cavity", "plaque"],
    "recommendations": ["brush twice daily", "floss daily"],
    "results": {
        "cavity_detected": 1,
        "plaque_detected": 1,
        "tartar_detected": 0,
        "gum_disease_detected": 0,
        "severity": "medium",
        "tooth_positions": [14, 15]
    }
}
```

## Database Schema

### Users Table
- id (INTEGER PRIMARY KEY)
- email (TEXT UNIQUE)
- username (TEXT UNIQUE)
- password (TEXT)
- full_name (TEXT)
- phone (TEXT)
- date_of_birth (TEXT)
- gender (TEXT)
- address (TEXT)
- profile_image (TEXT)
- created_at, updated_at (DATETIME)

### Sessions Table
- id (INTEGER PRIMARY KEY)
- user_id (INTEGER FOREIGN KEY)
- token (TEXT UNIQUE)
- expires_at (DATETIME)
- created_at (DATETIME)

### Appointments Table
- id (INTEGER PRIMARY KEY)
- user_id (INTEGER FOREIGN KEY)
- title (TEXT)
- description (TEXT)
- appointment_date (DATETIME)
- appointment_time (TEXT)
- dentist_name (TEXT)
- clinic_name (TEXT)
- location (TEXT)
- contact_number (TEXT)
- status (TEXT) - 'scheduled', 'completed', 'cancelled'
- notes (TEXT)
- created_at, updated_at (DATETIME)

### Detection History Table
- id (INTEGER PRIMARY KEY)
- user_id (INTEGER FOREIGN KEY)
- image_path (TEXT)
- detection_type (TEXT)
- confidence (REAL)
- detected_issues (TEXT) - JSON
- recommendations (TEXT) - JSON
- scan_date (DATETIME)
- notes (TEXT)
- status (TEXT) - 'completed', 'processing', 'failed'
- created_at (DATETIME)

### Detection Results Table
- id (INTEGER PRIMARY KEY)
- detection_id (INTEGER FOREIGN KEY)
- cavity_detected (INTEGER)
- plaque_detected (INTEGER)
- tartar_detected (INTEGER)
- gum_disease_detected (INTEGER)
- other_issues (TEXT) - JSON
- severity (TEXT) - 'low', 'medium', 'high'
- tooth_positions (TEXT) - JSON
- created_at (DATETIME)

### Profile History Table
- id (INTEGER PRIMARY KEY)
- user_id (INTEGER FOREIGN KEY)
- field_name (TEXT)
- old_value (TEXT)
- new_value (TEXT)
- changed_at (DATETIME)

## Authentication

All protected endpoints require Authorization header:
```
Authorization: Bearer {token}
```

Token is obtained from signup/signin responses and expires in 30 days.

## Response Format

Success Response:
```json
{
    "success": true,
    "message": "Operation successful",
    "data": {...}
}
```

Error Response:
```json
{
    "error": "Error description"
}
```

HTTP Status Codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 404: Not Found
- 500: Server Error
