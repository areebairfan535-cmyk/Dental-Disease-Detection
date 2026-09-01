<?php
function initializeDatabase(PDO $conn): void
{
    $conn->exec('PRAGMA foreign_keys = ON');

    $conn->exec("CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        full_name TEXT NOT NULL,
        phone TEXT,
        date_of_birth TEXT,
        gender TEXT,
        address TEXT,
        profile_image TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");

    $conn->exec("CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        token TEXT UNIQUE NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )");

    $conn->exec("CREATE TABLE IF NOT EXISTS appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        appointment_date DATETIME NOT NULL,
        appointment_time TEXT NOT NULL,
        dentist_name TEXT,
        clinic_name TEXT,
        location TEXT,
        contact_number TEXT,
        status TEXT DEFAULT 'scheduled',
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )");

    $conn->exec("CREATE TABLE IF NOT EXISTS detection_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        image_path TEXT NOT NULL,
        detection_type TEXT DEFAULT 'dental_scan',
        confidence REAL,
        detected_issues TEXT,
        recommendations TEXT,
        scan_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        notes TEXT,
        status TEXT DEFAULT 'completed',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )");

    $conn->exec("CREATE TABLE IF NOT EXISTS detection_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        detection_id INTEGER NOT NULL,
        cavity_detected INTEGER DEFAULT 0,
        plaque_detected INTEGER DEFAULT 0,
        tartar_detected INTEGER DEFAULT 0,
        gum_disease_detected INTEGER DEFAULT 0,
        other_issues TEXT,
        severity TEXT,
        tooth_positions TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (detection_id) REFERENCES detection_history(id) ON DELETE CASCADE
    )");

    $conn->exec("CREATE TABLE IF NOT EXISTS profile_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        field_name TEXT NOT NULL,
        old_value TEXT,
        new_value TEXT,
        changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )");

    addColumnIfMissing($conn, 'detection_history', 'updated_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP');

    $conn->exec("CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token)");
    $conn->exec("CREATE INDEX IF NOT EXISTS idx_history_user_date ON detection_history(user_id, scan_date)");
    $conn->exec("CREATE INDEX IF NOT EXISTS idx_appointments_user_date ON appointments(user_id, appointment_date)");
}

function addColumnIfMissing(PDO $conn, string $table, string $column, string $definition): void
{
    $columns = $conn->query("PRAGMA table_info($table)")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($columns as $existingColumn) {
        if ($existingColumn['name'] === $column) {
            return;
        }
    }

    $conn->exec("ALTER TABLE $table ADD COLUMN $column $definition");
}
?>
