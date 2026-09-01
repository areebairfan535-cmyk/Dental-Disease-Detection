<?php
require_once __DIR__ . '/schema.php';

header('Content-Type: application/json');

$dbPath = __DIR__ . '/dental_ai.db';
$reset = isset($_GET['reset']) && $_GET['reset'] === '1';

if ($reset && file_exists($dbPath)) {
    unlink($dbPath);
}

try {
    $conn = new PDO('sqlite:' . $dbPath);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    initializeDatabase($conn);

    echo json_encode([
        'success' => true,
        'message' => $reset ? 'Database reset and initialized successfully' : 'Database initialized successfully',
        'database' => $dbPath,
        'tables' => [
            'users',
            'sessions',
            'appointments',
            'detection_history',
            'detection_results',
            'profile_history'
        ]
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database setup failed: ' . $e->getMessage()
    ]);
}
?>
