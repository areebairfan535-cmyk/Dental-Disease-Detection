# Backend Setup Complete ✅

Your complete backend for **Account Creation, Appointments, History, Profile, and Detection** is now ready!

## Quick Start

### 1. Initialize Database
```bash
php backend/setup_db.php
```

This creates all required tables:
- `users` - User accounts
- `sessions` - Authentication tokens
- `appointments` - User appointments
- `detection_history` - Scan history
- `detection_results` - Detailed scan results
- `profile_history` - Profile change tracking

### 2. API Server

If using Apache/Nginx, the backend is ready at:
- Base URL: `http://localhost/myApp/backend/`
- API: `http://localhost/myApp/backend/api/`

For local testing with PHP:
```bash
php -S localhost:8000 -t backend/
```

## API Features

### ✅ Authentication (auth.php)
- **Signup** - Create new accounts with email validation
- **Signin** - Login with email/password
- **Logout** - Clear session
- **Token Verification** - Validate auth tokens

### ✅ Profile Management (profile.php)
- **Get Profile** - Retrieve user profile
- **Update Profile** - Modify name, phone, DOB, gender, address
- **Profile Details** - Get profile with statistics
- **Change History** - Track all profile modifications

### ✅ Appointments (appointments.php)
- **List Appointments** - Get all user appointments
- **Create Appointment** - Book new appointment
- **Update Appointment** - Modify appointment details
- **Delete Appointment** - Cancel appointment
- **Get Detail** - Retrieve specific appointment

### ✅ Detection History (history.php)
- **List History** - Get all detection scans (paginated)
- **Get Detail** - Retrieve specific scan with results
- **Create History** - Save new detection scan
- **Update History** - Modify notes/status
- **Delete History** - Remove detection record

### ✅ Detection Analysis (detection.php)
- **Upload Image** - Upload dental scan images
- **Analyze Image** - Run detection on uploaded image
- **Get Results** - Retrieve detection analysis results
- **Detect Issues** - Cavity, plaque, tartar, gum disease detection

## Authentication

All protected endpoints require:
```
Authorization: Bearer {token}
```

Tokens are valid for 30 days and obtained from login/signup.

## Database Schema

### Users Table
```sql
- id (PRIMARY KEY)
- email (UNIQUE)
- username (UNIQUE)
- password (hashed with bcrypt)
- full_name, phone, date_of_birth, gender, address, profile_image
- created_at, updated_at
```

### Appointments Table
```sql
- id (PRIMARY KEY)
- user_id (FOREIGN KEY)
- title, description
- appointment_date, appointment_time
- dentist_name, clinic_name, location, contact_number
- status (scheduled, completed, cancelled)
- notes
- created_at, updated_at
```

### Detection History Table
```sql
- id (PRIMARY KEY)
- user_id (FOREIGN KEY)
- image_path
- detection_type, confidence
- detected_issues (JSON), recommendations (JSON)
- scan_date
- status (completed, processing, failed)
- created_at
```

### Detection Results Table
```sql
- id (PRIMARY KEY)
- detection_id (FOREIGN KEY)
- cavity_detected, plaque_detected, tartar_detected, gum_disease_detected (0/1)
- other_issues (JSON)
- severity (low, medium, high)
- tooth_positions (JSON array)
- created_at
```

## Example Requests

### Signup
```bash
curl -X POST http://localhost:8000/api/auth.php?action=signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "john_doe",
    "password": "secure123",
    "full_name": "John Doe"
  }'
```

### Signin
```bash
curl -X POST http://localhost:8000/api/auth.php?action=signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "secure123"
  }'
```

### Create Appointment
```bash
curl -X POST http://localhost:8000/api/appointments.php?action=create \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Dental Checkup",
    "appointment_date": "2024-06-15",
    "appointment_time": "10:30",
    "dentist_name": "Dr. Smith",
    "clinic_name": "Bright Smiles",
    "location": "123 Main St"
  }'
```

### Update Profile
```bash
curl -X PUT http://localhost:8000/api/profile.php?action=profile \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "555-1234",
    "gender": "M",
    "date_of_birth": "1990-01-15"
  }'
```

### Upload Detection Image
```bash
curl -X POST http://localhost:8000/api/detection.php?action=upload \
  -H "Authorization: Bearer {token}" \
  -F "image=@/path/to/dental_scan.jpg"
```

### Create Detection History
```bash
curl -X POST http://localhost:8000/api/history.php?action=create \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "image_path": "/uploads/scan_001.jpg",
    "detected_issues": ["cavity", "plaque"],
    "recommendations": ["brush twice daily"],
    "results": {
      "cavity_detected": 1,
      "plaque_detected": 1,
      "tartar_detected": 0,
      "gum_disease_detected": 0,
      "severity": "medium",
      "tooth_positions": [14, 15]
    }
  }'
```

## File Structure

```
backend/
├── config.php                 # Database configuration
├── index.php                  # API documentation
├── setup_db.php              # Database initialization
├── COMPLETE_SETUP.md         # Full setup guide
├── dental_ai.db              # SQLite database (auto-created)
└── api/
    ├── auth.php              # Authentication endpoints
    ├── profile.php           # Profile management
    ├── appointments.php      # Appointments management
    ├── history.php           # Detection history
    └── detection.php         # Detection analysis
```

## Response Format

### Success
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {...}
}
```

### Error
```json
{
  "error": "Error description"
}
```

## HTTP Status Codes
- 200 - Success
- 201 - Created
- 400 - Bad Request
- 401 - Unauthorized
- 404 - Not Found
- 500 - Server Error

## Next Steps

1. ✅ Backend is ready
2. Connect your React Native frontend to these endpoints
3. Use Bearer tokens from auth endpoints for all protected requests
4. Store tokens securely on client side

## Frontend Integration Example

```typescript
// services/BackendService.ts

const API_BASE_URL = 'http://localhost:8000';

export const signup = async (email: string, username: string, password: string, fullName: string) => {
  const response = await fetch(`${API_BASE_URL}/api/auth.php?action=signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, username, password, full_name: fullName })
  });
  return response.json();
};

export const signin = async (email: string, password: string) => {
  const response = await fetch(`${API_BASE_URL}/api/auth.php?action=signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return response.json();
};

export const getProfile = async (token: string) => {
  const response = await fetch(`${API_BASE_URL}/api/profile.php?action=profile`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};
```

## Support

- Database: SQLite3 (dental_ai.db)
- Language: PHP 7.4+
- Framework: Vanilla PHP (no framework required)
- CORS: Enabled for all origins

**Your complete backend is ready to use! 🚀**
