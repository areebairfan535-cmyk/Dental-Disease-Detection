<?php
require_once __DIR__ . '/../config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($method === 'GET' && $action === 'list') {
    listHistory($conn);
} elseif ($method === 'GET' && $action === 'detail') {
    getHistoryDetail($conn);
} elseif ($method === 'POST' && $action === 'create') {
    createHistory($conn);
} elseif ($method === 'DELETE' && $action === 'delete') {
    deleteHistory($conn);
} elseif ($method === 'PUT' && $action === 'update') {
    updateHistory($conn);
} else {
    jsonResponse(['success' => false, 'error' => 'Invalid request'], 400);
}

function listHistory(PDO $conn): void
{
    $userId = requireAuthUserId($conn);
    $limit = max(1, min(100, (int) ($_GET['limit'] ?? 20)));
    $offset = max(0, (int) ($_GET['offset'] ?? 0));

    $stmt = $conn->prepare('SELECT * FROM detection_history WHERE user_id = :user_id ORDER BY scan_date DESC LIMIT :limit OFFSET :offset');
    $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $history = array_map('decodeHistoryRow', $stmt->fetchAll());

    $count = $conn->prepare('SELECT COUNT(*) AS total FROM detection_history WHERE user_id = :user_id');
    $count->execute([':user_id' => $userId]);

    jsonResponse([
        'success' => true,
        'history' => $history,
        'total' => (int) $count->fetch()['total'],
        'limit' => $limit,
        'offset' => $offset
    ]);
}

function getHistoryDetail(PDO $conn): void
{
    $userId = requireAuthUserId($conn);
    $historyId = (int) ($_GET['id'] ?? 0);
    if ($historyId <= 0) {
        jsonResponse(['success' => false, 'error' => 'History ID required'], 400);
    }

    $stmt = $conn->prepare('SELECT * FROM detection_history WHERE id = :id AND user_id = :user_id');
    $stmt->execute([':id' => $historyId, ':user_id' => $userId]);
    $history = $stmt->fetch();

    if (!$history) {
        jsonResponse(['success' => false, 'error' => 'History not found'], 404);
    }

    $stmt = $conn->prepare('SELECT * FROM detection_results WHERE detection_id = :detection_id');
    $stmt->execute([':detection_id' => $historyId]);

    jsonResponse([
        'success' => true,
        'history' => decodeHistoryRow($history),
        'results' => array_map('decodeResultRow', $stmt->fetchAll())
    ]);
}

function createHistory(PDO $conn): void
{
    $userId = requireAuthUserId($conn);
    $data = readJsonBody();
    $imagePath = trim($data['image_path'] ?? $data['image'] ?? '');

    if ($imagePath === '') {
        jsonResponse(['success' => false, 'error' => 'image_path is required'], 400);
    }

    $detectedIssues = $data['detected_issues'] ?? ($data['result'] ?? []);
    if (is_string($detectedIssues)) {
        $detectedIssues = [$detectedIssues];
    }

    $recommendations = $data['recommendations'] ?? ($data['advice'] ?? []);
    if (is_string($recommendations)) {
        $recommendations = [$recommendations];
    }

    $conn->beginTransaction();
    try {
        $stmt = $conn->prepare("INSERT INTO detection_history
            (user_id, image_path, detection_type, confidence, detected_issues, recommendations, notes, status)
            VALUES (:user_id, :image_path, :detection_type, :confidence, :detected_issues, :recommendations, :notes, :status)");
        $stmt->execute([
            ':user_id' => $userId,
            ':image_path' => $imagePath,
            ':detection_type' => $data['detection_type'] ?? 'dental_scan',
            ':confidence' => $data['confidence'] ?? null,
            ':detected_issues' => json_encode($detectedIssues),
            ':recommendations' => json_encode($recommendations),
            ':notes' => $data['notes'] ?? null,
            ':status' => $data['status'] ?? 'completed'
        ]);

        $detectionId = (int) $conn->lastInsertId();
        if (isset($data['results']) && is_array($data['results'])) {
            saveDetectionResultRow($conn, $detectionId, $data['results']);
        }

        $conn->commit();
        jsonResponse([
            'success' => true,
            'message' => 'Detection history created successfully',
            'detection_id' => $detectionId
        ], 201);
    } catch (PDOException $e) {
        $conn->rollBack();
        jsonResponse(['success' => false, 'error' => 'Database error: ' . $e->getMessage()], 500);
    }
}

function updateHistory(PDO $conn): void
{
    $userId = requireAuthUserId($conn);
    $historyId = (int) ($_GET['id'] ?? 0);
    if ($historyId <= 0) {
        jsonResponse(['success' => false, 'error' => 'History ID required'], 400);
    }

    $data = readJsonBody();
    $allowedFields = ['notes', 'status'];
    $updates = [];
    $params = [':id' => $historyId, ':user_id' => $userId];

    foreach ($allowedFields as $field) {
        if (array_key_exists($field, $data)) {
            $updates[] = "$field = :$field";
            $params[":$field"] = $data[$field];
        }
    }

    if (!$updates) {
        jsonResponse(['success' => false, 'error' => 'No valid fields to update'], 400);
    }

    $updates[] = 'updated_at = CURRENT_TIMESTAMP';
    $stmt = $conn->prepare('UPDATE detection_history SET ' . implode(', ', $updates) . ' WHERE id = :id AND user_id = :user_id');
    $stmt->execute($params);

    if ($stmt->rowCount() === 0) {
        jsonResponse(['success' => false, 'error' => 'History not found'], 404);
    }

    jsonResponse(['success' => true, 'message' => 'History updated successfully']);
}

function deleteHistory(PDO $conn): void
{
    $userId = requireAuthUserId($conn);
    $historyId = (int) ($_GET['id'] ?? 0);
    if ($historyId <= 0) {
        jsonResponse(['success' => false, 'error' => 'History ID required'], 400);
    }

    $stmt = $conn->prepare('DELETE FROM detection_history WHERE id = :id AND user_id = :user_id');
    $stmt->execute([':id' => $historyId, ':user_id' => $userId]);

    if ($stmt->rowCount() === 0) {
        jsonResponse(['success' => false, 'error' => 'History not found'], 404);
    }

    jsonResponse(['success' => true, 'message' => 'History deleted successfully']);
}

function saveDetectionResultRow(PDO $conn, int $detectionId, array $results): void
{
    $stmt = $conn->prepare("INSERT INTO detection_results
        (detection_id, cavity_detected, plaque_detected, tartar_detected, gum_disease_detected, other_issues, severity, tooth_positions)
        VALUES (:detection_id, :cavity_detected, :plaque_detected, :tartar_detected, :gum_disease_detected, :other_issues, :severity, :tooth_positions)");
    $stmt->execute([
        ':detection_id' => $detectionId,
        ':cavity_detected' => !empty($results['cavity_detected']) ? 1 : 0,
        ':plaque_detected' => !empty($results['plaque_detected']) ? 1 : 0,
        ':tartar_detected' => !empty($results['tartar_detected']) ? 1 : 0,
        ':gum_disease_detected' => !empty($results['gum_disease_detected']) ? 1 : 0,
        ':other_issues' => json_encode($results['other_issues'] ?? []),
        ':severity' => $results['severity'] ?? null,
        ':tooth_positions' => json_encode($results['tooth_positions'] ?? [])
    ]);
}

function decodeHistoryRow(array $row): array
{
    $row['detected_issues'] = json_decode($row['detected_issues'] ?? '[]', true) ?: [];
    $row['recommendations'] = json_decode($row['recommendations'] ?? '[]', true) ?: [];
    $row['result'] = $row['detected_issues'][0] ?? $row['detection_type'] ?? 'Scan result';
    $row['advice'] = implode(' ', $row['recommendations']);
    return $row;
}

function decodeResultRow(array $row): array
{
    $row['other_issues'] = json_decode($row['other_issues'] ?? '[]', true) ?: [];
    $row['tooth_positions'] = json_decode($row['tooth_positions'] ?? '[]', true) ?: [];
    return $row;
}
?>
