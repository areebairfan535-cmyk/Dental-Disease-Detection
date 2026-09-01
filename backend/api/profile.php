<?php
require_once __DIR__ . '/../config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($method === 'GET' && $action === 'profile') {
    getProfile($conn);
} elseif ($method === 'PUT' && $action === 'profile') {
    updateProfile($conn);
} elseif ($method === 'GET' && $action === 'detail') {
    getProfileDetail($conn);
} elseif ($method === 'GET' && $action === 'changes') {
    getProfileChanges($conn);
} else {
    jsonResponse(['success' => false, 'error' => 'Invalid request'], 400);
}

function profileColumns(): string
{
    return 'id, email, username, full_name, phone, date_of_birth, gender, address, profile_image, created_at, updated_at';
}

function getProfile(PDO $conn): void
{
    $userId = requireAuthUserId($conn);
    $stmt = $conn->prepare('SELECT ' . profileColumns() . ' FROM users WHERE id = :id');
    $stmt->execute([':id' => $userId]);
    $profile = $stmt->fetch();

    if (!$profile) {
        jsonResponse(['success' => false, 'error' => 'User not found'], 404);
    }

    jsonResponse(['success' => true, 'profile' => $profile]);
}

function updateProfile(PDO $conn): void
{
    $userId = requireAuthUserId($conn);
    $data = readJsonBody();

    if (!$data) {
        jsonResponse(['success' => false, 'error' => 'No data provided'], 400);
    }

    $stmt = $conn->prepare('SELECT full_name, phone, date_of_birth, gender, address, profile_image FROM users WHERE id = :id');
    $stmt->execute([':id' => $userId]);
    $current = $stmt->fetch();
    if (!$current) {
        jsonResponse(['success' => false, 'error' => 'User not found'], 404);
    }

    $allowedFields = ['full_name', 'phone', 'date_of_birth', 'gender', 'address', 'profile_image'];
    $updateFields = [];
    $params = [':id' => $userId];

    foreach ($allowedFields as $field) {
        if (array_key_exists($field, $data)) {
            $value = is_string($data[$field]) ? trim($data[$field]) : $data[$field];
            if ($field === 'full_name' && $value === '') {
                jsonResponse(['success' => false, 'error' => 'Full name is required'], 400);
            }
            if ($field === 'date_of_birth' && $value !== '' && !preg_match('/^\d{4}-\d{2}-\d{2}$/', (string) $value)) {
                jsonResponse(['success' => false, 'error' => 'Date of birth must use YYYY-MM-DD format'], 400);
            }

            $updateFields[] = "$field = :$field";
            $params[":$field"] = $value;

            if (($current[$field] ?? null) !== $value) {
                $history = $conn->prepare('INSERT INTO profile_history (user_id, field_name, old_value, new_value) VALUES (:user_id, :field_name, :old_value, :new_value)');
                $history->execute([
                    ':user_id' => $userId,
                    ':field_name' => $field,
                    ':old_value' => $current[$field] ?? null,
                    ':new_value' => $value
                ]);
            }
        }
    }

    if (!$updateFields) {
        jsonResponse(['success' => false, 'error' => 'No valid fields to update'], 400);
    }

    $updateFields[] = 'updated_at = CURRENT_TIMESTAMP';
    $stmt = $conn->prepare('UPDATE users SET ' . implode(', ', $updateFields) . ' WHERE id = :id');
    $stmt->execute($params);

    $stmt = $conn->prepare('SELECT ' . profileColumns() . ' FROM users WHERE id = :id');
    $stmt->execute([':id' => $userId]);

    jsonResponse([
        'success' => true,
        'message' => 'Profile updated successfully',
        'profile' => $stmt->fetch()
    ]);
}

function getProfileDetail(PDO $conn): void
{
    $userId = requireAuthUserId($conn);

    $stmt = $conn->prepare('SELECT ' . profileColumns() . ' FROM users WHERE id = :id');
    $stmt->execute([':id' => $userId]);
    $profile = $stmt->fetch();

    if (!$profile) {
        jsonResponse(['success' => false, 'error' => 'User not found'], 404);
    }

    $appointmentCount = $conn->prepare('SELECT COUNT(*) AS total FROM appointments WHERE user_id = :user_id');
    $appointmentCount->execute([':user_id' => $userId]);

    $detectionCount = $conn->prepare('SELECT COUNT(*) AS total FROM detection_history WHERE user_id = :user_id');
    $detectionCount->execute([':user_id' => $userId]);

    jsonResponse([
        'success' => true,
        'profile' => $profile,
        'statistics' => [
            'total_appointments' => (int) $appointmentCount->fetch()['total'],
            'total_detections' => (int) $detectionCount->fetch()['total']
        ]
    ]);
}

function getProfileChanges(PDO $conn): void
{
    $userId = requireAuthUserId($conn);
    $stmt = $conn->prepare('SELECT field_name, old_value, new_value, changed_at FROM profile_history WHERE user_id = :user_id ORDER BY changed_at DESC LIMIT 50');
    $stmt->execute([':user_id' => $userId]);

    jsonResponse(['success' => true, 'changes' => $stmt->fetchAll()]);
}
?>
