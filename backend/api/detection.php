<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../ai_analyzer.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($method === 'POST' && $action === 'upload') {
    uploadImage($conn);
} elseif ($method === 'POST' && $action === 'analyze') {
    analyzeImage($conn);
} elseif ($method === 'GET' && $action === 'results') {
    getDetectionResults($conn);
} else {
    jsonResponse(['success' => false, 'error' => 'Invalid request'], 400);
}

function uploadImage(PDO $conn): void
{
    $userId = requireAuthUserId($conn);

    if (!isset($_FILES['image']) || !is_uploaded_file($_FILES['image']['tmp_name'])) {
        jsonResponse(['success' => false, 'error' => 'No image file provided'], 400);
    }

    $file = $_FILES['image'];
    $allowedTypes = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/gif' => 'gif',
        'image/webp' => 'webp'
    ];

    $mimeType = function_exists('mime_content_type') ? (mime_content_type($file['tmp_name']) ?: $file['type']) : $file['type'];
    if (!isset($allowedTypes[$mimeType])) {
        jsonResponse(['success' => false, 'error' => 'Invalid file type. Allowed: jpg, png, gif, webp'], 400);
    }

    if ($file['size'] > 10 * 1024 * 1024) {
        jsonResponse(['success' => false, 'error' => 'File size too large. Maximum 10MB'], 400);
    }

    $uploadDir = realpath(__DIR__ . '/..') . DIRECTORY_SEPARATOR . 'uploads';
    if (!is_dir($uploadDir) && !mkdir($uploadDir, 0755, true)) {
        jsonResponse(['success' => false, 'error' => 'Unable to create upload directory'], 500);
    }

    $filename = 'detection_' . $userId . '_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $allowedTypes[$mimeType];
    $filepath = $uploadDir . DIRECTORY_SEPARATOR . $filename;

    if (!move_uploaded_file($file['tmp_name'], $filepath)) {
        jsonResponse(['success' => false, 'error' => 'Failed to upload image'], 500);
    }

    jsonResponse([
        'success' => true,
        'message' => 'Image uploaded successfully',
        'filename' => $filename,
        'path' => '/uploads/' . $filename
    ]);
}

function analyzeImage(PDO $conn): void
{
    $userId = requireAuthUserId($conn);
    $data = readJsonBody();
    $imagePath = trim($data['image_path'] ?? '');

    if ($imagePath === '' && empty($data['image_base64'])) {
        jsonResponse(['success' => false, 'error' => 'image_path or image_base64 is required'], 400);
    }

    $absoluteImagePath = resolveUploadedImagePath($imagePath);
    if ($absoluteImagePath === null && empty($data['image_base64'])) {
        jsonResponse(['success' => false, 'error' => 'Uploaded image file not found'], 404);
    }

    if ($absoluteImagePath === null) {
        $absoluteImagePath = saveBase64Image((string) $data['image_base64'], $userId);
        $imagePath = '/uploads/' . basename($absoluteImagePath);
    }

    $results = analyzeDentalImage($absoluteImagePath, $imagePath);

    $conn->beginTransaction();
    try {
        $stmt = $conn->prepare("INSERT INTO detection_history
            (user_id, image_path, detection_type, confidence, detected_issues, recommendations, status)
            VALUES (:user_id, :image_path, :detection_type, :confidence, :detected_issues, :recommendations, 'completed')");
        $stmt->execute([
            ':user_id' => $userId,
            ':image_path' => $imagePath !== '' ? $imagePath : 'base64_' . time(),
            ':detection_type' => $data['detection_type'] ?? 'dental_scan',
            ':confidence' => $results['confidence'],
            ':detected_issues' => json_encode($results['detected_issues']),
            ':recommendations' => json_encode($results['recommendations'])
        ]);

        $detectionId = (int) $conn->lastInsertId();
        $stmt = $conn->prepare("INSERT INTO detection_results
            (detection_id, cavity_detected, plaque_detected, tartar_detected, gum_disease_detected, other_issues, severity, tooth_positions)
            VALUES (:detection_id, :cavity_detected, :plaque_detected, :tartar_detected, :gum_disease_detected, :other_issues, :severity, :tooth_positions)");
        $stmt->execute([
            ':detection_id' => $detectionId,
            ':cavity_detected' => $results['cavity_detected'],
            ':plaque_detected' => $results['plaque_detected'],
            ':tartar_detected' => $results['tartar_detected'],
            ':gum_disease_detected' => $results['gum_disease_detected'],
            ':other_issues' => json_encode($results['other_issues']),
            ':severity' => $results['severity'],
            ':tooth_positions' => json_encode($results['tooth_positions'])
        ]);

        $conn->commit();
        jsonResponse([
            'success' => true,
            'message' => 'Image analyzed successfully',
            'detection_id' => $detectionId,
            'results' => $results
        ]);
    } catch (PDOException $e) {
        $conn->rollBack();
        jsonResponse(['success' => false, 'error' => 'Database error: ' . $e->getMessage()], 500);
    }
}

function getDetectionResults(PDO $conn): void
{
    $userId = requireAuthUserId($conn);
    $detectionId = (int) ($_GET['id'] ?? 0);

    if ($detectionId <= 0) {
        jsonResponse(['success' => false, 'error' => 'Detection ID required'], 400);
    }

    $stmt = $conn->prepare('SELECT * FROM detection_history WHERE id = :id AND user_id = :user_id');
    $stmt->execute([':id' => $detectionId, ':user_id' => $userId]);
    $detection = $stmt->fetch();

    if (!$detection) {
        jsonResponse(['success' => false, 'error' => 'Detection not found'], 404);
    }

    $stmt = $conn->prepare('SELECT * FROM detection_results WHERE detection_id = :detection_id');
    $stmt->execute([':detection_id' => $detectionId]);
    $results = $stmt->fetch();

    if ($results) {
        $results['other_issues'] = json_decode($results['other_issues'] ?? '[]', true) ?: [];
        $results['tooth_positions'] = json_decode($results['tooth_positions'] ?? '[]', true) ?: [];
    }

    $detection['detected_issues'] = json_decode($detection['detected_issues'] ?? '[]', true) ?: [];
    $detection['recommendations'] = json_decode($detection['recommendations'] ?? '[]', true) ?: [];

    jsonResponse(['success' => true, 'detection' => $detection, 'results' => $results]);
}

function resolveUploadedImagePath(string $imagePath): ?string
{
    $relativePath = ltrim(parse_url($imagePath, PHP_URL_PATH) ?: $imagePath, '/');
    $candidate = realpath(__DIR__ . '/../' . $relativePath);
    $uploadsRoot = realpath(__DIR__ . '/../uploads');

    if (!$candidate || !$uploadsRoot || !str_starts_with($candidate, $uploadsRoot)) {
        return null;
    }

    return is_file($candidate) ? $candidate : null;
}

function saveBase64Image(string $base64Image, int $userId): string
{
    if (str_contains($base64Image, ',')) {
        $base64Image = explode(',', $base64Image, 2)[1];
    }

    $binary = base64_decode($base64Image, true);
    if ($binary === false) {
        jsonResponse(['success' => false, 'error' => 'Invalid base64 image data'], 400);
    }

    $uploadDir = realpath(__DIR__ . '/..') . DIRECTORY_SEPARATOR . 'uploads';
    if (!is_dir($uploadDir) && !mkdir($uploadDir, 0755, true)) {
        jsonResponse(['success' => false, 'error' => 'Unable to create upload directory'], 500);
    }

    $filename = 'detection_' . $userId . '_' . time() . '_' . bin2hex(random_bytes(4)) . '.jpg';
    $path = $uploadDir . DIRECTORY_SEPARATOR . $filename;
    file_put_contents($path, $binary);

    return $path;
}
?>
