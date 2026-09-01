<?php
require_once __DIR__ . '/env.php';
require_once __DIR__ . '/schema.php';

loadBackendEnv(__DIR__ . '/.env');

ini_set('display_errors', '0');
ini_set('html_errors', '0');
error_reporting(E_ALL);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$dbPath = __DIR__ . '/dental_ai.db';

try {
    $conn = new PDO('sqlite:' . $dbPath);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    initializeDatabase($conn);
} catch (PDOException $e) {
    jsonResponse(['success' => false, 'error' => 'Database connection failed: ' . $e->getMessage()], 500);
}

function jsonResponse(array $payload, int $status = 200): void
{
    while (ob_get_level() > 0) {
        ob_end_clean();
    }

    header('Content-Type: application/json');
    http_response_code($status);
    echo json_encode($payload);
    exit;
}

function readJsonBody(): array
{
    $rawBody = file_get_contents('php://input');
    if ($rawBody === false || trim($rawBody) === '') {
        return [];
    }

    $data = json_decode($rawBody, true);
    if (!is_array($data)) {
        jsonResponse(['success' => false, 'error' => 'Invalid JSON body'], 400);
    }

    return $data;
}

function authUserId(PDO $conn): ?int
{
    $headers = function_exists('getallheaders') ? getallheaders() : [];
    $authHeader = $headers['Authorization']
        ?? $headers['authorization']
        ?? $_SERVER['HTTP_AUTHORIZATION']
        ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
        ?? '';

    if (!$authHeader || stripos($authHeader, 'Bearer ') !== 0) {
        return null;
    }

    $token = trim(substr($authHeader, 7));
    if ($token === '') {
        return null;
    }

    $stmt = $conn->prepare("SELECT user_id FROM sessions WHERE token = :token AND expires_at > datetime('now')");
    $stmt->execute([':token' => $token]);
    $session = $stmt->fetch();

    return $session ? (int) $session['user_id'] : null;
}

function requireAuthUserId(PDO $conn): int
{
    $userId = authUserId($conn);
    if ($userId === null) {
        jsonResponse(['success' => false, 'error' => 'Unauthorized'], 401);
    }

    return $userId;
}
?>
