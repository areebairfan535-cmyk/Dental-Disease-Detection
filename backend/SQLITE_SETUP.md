# SQLite Backend Setup

## Quick Start

### 1. Create Database
```bash
cd backend
php setup_db.php
```
This creates `dental_ai.db` file with all tables.

### 2. Start Backend
```bash
php -S 0.0.0.0:8000
```
Backend runs on `http://localhost:8000`

### 3. Update Frontend URL
Edit `services/BackendService.ts`:
```typescript
const API_BASE_URL = 'http://192.168.18.114:8000';  // Use your PC IP
```

### 4. Run App
```bash
npx expo start
```

## Database File

✅ **No configuration needed**
- SQLite database file: `backend/dental_ai.db`
- File-based (portable, easy backup)
- Zero setup required

## API Base

```
http://localhost:8000  (local)
or
http://your_pc_ip:8000 (from phone/emulator)
```

## All Endpoints Ready

✅ Auth (Signup/Signin/Logout)
✅ Profile (Get/Update)
✅ Appointments (Create/List/Update/Delete)
✅ History (Save/List/Get/Delete)
✅ Detection Results Storage

Done! Backend is ready for frontend integration.
