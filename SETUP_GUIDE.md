# Dental AI - Full Stack Setup Guide

## Backend Setup (PHP + MySQL)

### Prerequisites
- PHP 7.4+
- MySQL 5.7+
- Composer (optional, for additional packages)

### 1. Database Setup

```bash
# Open MySQL command line or phpMyAdmin
mysql -u root -p

# Run setup script
php backend/setup_db.php
```

This creates:
- `dental_ai_db` database
- Tables: users, detection_history, appointments, sessions, doctors

### 2. Configure Backend

Edit `backend/config.php`:
```php
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');  // Your MySQL password
define('DB_NAME', 'dental_ai_db');
```

### 3. Start PHP Server

```bash
cd backend
php -S 0.0.0.0:8000
```

Backend runs on: `http://192.168.18.114:8000` (or your PC IP)

## Frontend Setup (React Native/Expo)

### 1. Install Dependencies

```bash
npm install
```

### 2. Backend URL Configuration

Edit `services/BackendService.ts`:
```typescript
const API_BASE_URL = 'http://192.168.18.114:8000';
```
(Replace with your PC's actual IP)

### 3. Start Expo App

```bash
npx expo start
```

## API Endpoints

### Auth Endpoints

#### Sign Up
```bash
POST http://192.168.18.114:8000/api/auth.php?action=signup
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "username",
  "password": "password123",
  "full_name": "John Doe"
}

Response:
{
  "success": true,
  "token": "token_string",
  "user": { ... }
}
```

#### Sign In
```bash
POST http://192.168.18.114:8000/api/auth.php?action=signin
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "token": "token_string",
  "user": { ... }
}
```

#### Logout
```bash
POST http://192.168.18.114:8000/api/auth.php?action=logout
Authorization: Bearer token_string
Content-Type: application/json

{
  "token": "token_string"
}

Response:
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Profile Endpoints (Requires Token)

#### Get Profile
```bash
GET http://192.168.18.114:8000/api/profile.php?action=profile
Authorization: Bearer token_string

Response:
{
  "success": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "username",
    "full_name": "John Doe",
    "phone": "1234567890",
    "age": 25,
    "profile_pic": null
  }
}
```

#### Update Profile
```bash
PUT http://192.168.18.114:8000/api/profile.php?action=profile
Authorization: Bearer token_string
Content-Type: application/json

{
  "full_name": "Jane Doe",
  "phone": "9876543210",
  "age": 26
}

Response:
{
  "success": true,
  "message": "Profile updated successfully"
}
```

### Appointments Endpoints (Requires Token)

#### List Appointments
```bash
GET http://192.168.18.114:8000/api/appointments.php?action=list
Authorization: Bearer token_string

Response:
{
  "success": true,
  "appointments": [
    {
      "id": 1,
      "doctor_id": "dr-001",
      "doctor_name": "Dr. Ahmed",
      "specialty": "Dentist",
      "appointment_date": "2026-05-20 10:00:00",
      "status": "pending",
      "notes": "Regular checkup"
    }
  ]
}
```

#### Create Appointment
```bash
POST http://192.168.18.114:8000/api/appointments.php?action=create
Authorization: Bearer token_string
Content-Type: application/json

{
  "doctor_id": "dr-001",
  "doctor_name": "Dr. Ahmed Rehan",
  "specialty": "Periodontist",
  "appointment_date": "2026-05-20 10:00:00",
  "notes": "Gum disease consultation"
}

Response:
{
  "success": true,
  "message": "Appointment booked",
  "appointment_id": 1
}
```

### Detection History Endpoints (Requires Token)

#### List History
```bash
GET http://192.168.18.114:8000/api/history.php?action=list
Authorization: Bearer token_string

Response:
{
  "success": true,
  "history": [
    {
      "id": 1,
      "result": "Cavity",
      "advice": "Visit a dentist for a filling.",
      "image_path": "file:///path/to/image.jpg",
      "scan_date": "2026-05-13 10:00:00"
    }
  ]
}
```

#### Save Detection Result
```bash
POST http://192.168.18.114:8000/api/history.php?action=create
Authorization: Bearer token_string
Content-Type: application/json

{
  "result": "Cavity",
  "image_path": "file:///path/to/image.jpg",
  "advice": "Visit a dentist for a filling."
}

Response:
{
  "success": true,
  "message": "Detection saved",
  "id": 1
}
```

## Features Implemented

✅ User Authentication (Signup/Signin/Logout)
✅ Profile Management
✅ Appointment Booking & Management
✅ Detection History Storage
✅ Token-Based Authorization
✅ CORS Support
✅ Error Handling
✅ Secure Password Hashing

## Frontend Pages Connected

1. **Sign Up** - Creates account in MySQL
2. **Sign In** - Authenticates user & gets token
3. **Profile** - View/Edit user info from database
4. **Appointments** - Book & view appointments
5. **History** - Save & view detection results
6. **Detection** - Analyze teeth & save results

## Troubleshooting

### Backend Connection Error
- Check PHP server is running: `php -S 0.0.0.0:8000`
- Verify correct IP in `BackendService.ts`
- Ensure MySQL is running
- Check firewall allows port 8000

### Database Connection Error
- Verify MySQL credentials in `config.php`
- Run `setup_db.php` to create tables
- Check MySQL service is running

### Auth Token Issues
- Tokens valid for 30 days
- Always include `Authorization: Bearer token` header
- Check token hasn't expired in sessions table

## Project Structure

```
myApp/
├── app/                    # React Native screens
│   ├── signin.tsx         # Connected to backend
│   ├── signup.tsx         # Connected to backend
│   ├── profile.tsx        # Connected to backend
│   ├── appointments.tsx   # Connected to backend
│   ├── history.tsx        # Connected to backend
│   └── (tabs)/
│       ├── detection.tsx  # Saves to backend
│       └── ...
├── services/
│   └── BackendService.ts  # API calls handler
├── backend/               # PHP Backend
│   ├── config.php         # Database config
│   ├── setup_db.php       # Database setup
│   ├── index.php          # Main entry
│   ├── api/
│   │   ├── auth.php       # Auth endpoints
│   │   ├── profile.php    # Profile endpoints
│   │   ├── appointments.php
│   │   └── history.php
│   └── README.md
└── ...
```
