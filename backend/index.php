<?php
// Backend main entry point
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

echo json_encode([
    'status' => 'success',
    'message' => 'Dental AI Backend API',
    'version' => '1.0',
    'endpoints' => [
        'POST /api/auth.php?action=signup' => 'Register new user',
        'POST /api/auth.php?action=signin' => 'Login user',
        'POST /api/auth.php?action=logout' => 'Logout user',
        'GET /api/profile.php?action=profile' => 'Get user profile',
        'PUT /api/profile.php?action=profile' => 'Update user profile',
        'GET /api/appointments.php?action=list' => 'List appointments',
        'POST /api/appointments.php?action=create' => 'Create appointment',
        'PUT /api/appointments.php?action=update' => 'Update appointment',
        'DELETE /api/appointments.php?action=delete&id=X' => 'Delete appointment',
        'GET /api/history.php?action=list' => 'List detection history',
        'POST /api/history.php?action=create' => 'Save detection result',
        'GET /api/history.php?action=detail&id=X' => 'Get history detail',
        'DELETE /api/history.php?action=delete&id=X' => 'Delete history'
    ]
]);
?>
