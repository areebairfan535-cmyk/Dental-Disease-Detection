# Dental AI Backend - PHP + SQLite

## Setup Instructions

### 1. Database Setup
- Run the SQLite setup script from the backend folder:
  ```bash
  cd backend
  php setup_db.php
  ```
- This will create the file `backend/dental_ai.db` and the required tables.

### 2. Configure Backend
- No database username or password is required for SQLite.
- If you need to change the database file location, edit `backend/config.php`.

### 3. Start PHP Server
```bash
cd backend
php -S localhost:8000
```

Backend will run on: http://localhost:8000

### 4. API Endpoints

#### Authentication
- **Signup**: `POST /api/auth.php?action=signup`
  ```json
  {
    "email": "user@example.com",
    "username": "username",
    "password": "password",
    "full_name": "Full Name"
  }
  ```

- **Signin**: `POST /api/auth.php?action=signin`
  ```json
  {
    "email": "user@example.com",
    "password": "password"
  }
  ```

- **Logout**: `POST /api/auth.php?action=logout`
  ```json
  {
    "token": "your_token_here"
  }
  ```

#### Profile (Requires Auth Token)
- **Get Profile**: `GET /api/profile.php?action=profile`
  - Header: `Authorization: Bearer your_token_here`

- **Update Profile**: `PUT /api/profile.php?action=profile`
  - Header: `Authorization: Bearer your_token_here`
  ```json
  {
    "full_name": "New Name",
    "phone": "1234567890",
    "age": 25
  }
  ```

#### Appointments (Requires Auth Token)
- **List**: `GET /api/appointments.php?action=list`
- **Create**: `POST /api/appointments.php?action=create`
  ```json
  {
    "doctor_id": "dr-123",
    "doctor_name": "Dr. Name",
    "specialty": "Dentist",
    "appointment_date": "2026-05-20 10:00:00",
    "notes": "Check teeth"
  }
  ```
- **Update**: `PUT /api/appointments.php?action=update`
- **Delete**: `DELETE /api/appointments.php?action=delete&id=X`

#### Detection History (Requires Auth Token)
- **List**: `GET /api/history.php?action=list`
- **Create**: `POST /api/history.php?action=create`
  ```json
  {
    "result": "Cavity",
    "image_path": "path/to/image.jpg",
    "advice": "Visit a dentist"
  }
  ```
- **Get Detail**: `GET /api/history.php?action=detail&id=X`
- **Delete**: `DELETE /api/history.php?action=delete&id=X`

## Database Tables

### users
- id, username, email, password, full_name, phone, age, profile_pic, created_at, updated_at

### detection_history
- id, user_id, image_path, result, advice, scan_date

### appointments
- id, user_id, doctor_id, doctor_name, specialty, appointment_date, status, notes, created_at

### sessions
- id, user_id, token, created_at, expires_at

## Notes
- All API endpoints return JSON
- Authentication uses Bearer tokens valid for 30 days
- All user endpoints require valid Authorization header
- Passwords are hashed with bcrypt
