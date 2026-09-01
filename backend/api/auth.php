<?php
require_once __DIR__ . '/../config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($method === 'POST' && $action === 'signup') {
    signup($conn);
} elseif ($method === 'POST' && $action === 'signin') {
    signin($conn);
} elseif ($method === 'POST' && $action === 'logout') {
    logout($conn);
} elseif ($method === 'POST' && $action === 'verify-token') {
    verifyToken($conn);
} else {
    jsonResponse(['success' => false, 'error' => 'Invalid request'], 400);
}

function signup(PDO $conn): void
{
    $data = readJsonBody();
    $email = strtolower(trim($data['email'] ?? ''));
    $username = trim($data['username'] ?? '');
    $fullName = trim($data['full_name'] ?? '');
    $password = (string) ($data['password'] ?? '');

    if ($email === '' || $username === '' || $fullName === '' || $password === '') {
        jsonResponse(['success' => false, 'error' => 'Email, username, full_name and password are required'], 400);
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        jsonResponse(['success' => false, 'error' => 'Please enter a valid email address'], 400);
    }

    if (strlen($password) < 6) {
        jsonResponse(['success' => false, 'error' => 'Password must be at least 6 characters'], 400);
    }

    try {
        $stmt = $conn->prepare('SELECT email, username FROM users WHERE email = :email OR username = :username');
        $stmt->execute([':email' => $email, ':username' => $username]);
        $existing = $stmt->fetch();
        if ($existing) {
            if ($existing['email'] === $email) {
                jsonResponse(['success' => false, 'error' => 'Email already exists'], 409);
            }
            if ($existing['username'] === $username) {
                jsonResponse(['success' => false, 'error' => 'Username already exists'], 409);
            }
            jsonResponse(['success' => false, 'error' => 'Email or username already exists'], 409);
        }

        $stmt = $conn->prepare('INSERT INTO users (email, username, password, full_name) VALUES (:email, :username, :password, :full_name)');
        $stmt->execute([
            ':email' => $email,
            ':username' => $username,
            ':password' => password_hash($password, PASSWORD_BCRYPT),
            ':full_name' => $fullName
        ]);

        $userId = (int) $conn->lastInsertId();
        $token = createSession($conn, $userId);

        jsonResponse([
            'success' => true,
            'message' => 'Account created successfully',
            'user' => getPublicUser($conn, $userId),
            'token' => $token
        ], 201);
    } catch (PDOException $e) {
        jsonResponse(['success' => false, 'error' => 'Database error: ' . $e->getMessage()], 500);
    }
}

function signin(PDO $conn): void
{
    $data = readJsonBody();
    $email = strtolower(trim($data['email'] ?? ''));
    $password = (string) ($data['password'] ?? '');

    if ($email === '' || $password === '') {
        jsonResponse(['success' => false, 'error' => 'Email and password are required'], 400);
    }

    try {
        $stmt = $conn->prepare('SELECT * FROM users WHERE email = :email');
        $stmt->execute([':email' => $email]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, $user['password'])) {
            jsonResponse(['success' => false, 'error' => 'Invalid email or password'], 401);
        }

        $token = createSession($conn, (int) $user['id']);

        jsonResponse([
            'success' => true,
            'message' => 'Login successful',
            'user' => getPublicUser($conn, (int) $user['id']),
            'token' => $token
        ]);
    } catch (PDOException $e) {
        jsonResponse(['success' => false, 'error' => 'Database error: ' . $e->getMessage()], 500);
    }
}

function logout(PDO $conn): void
{
    $data = readJsonBody();
    $token = trim($data['token'] ?? '');

    if ($token === '') {
        jsonResponse(['success' => false, 'error' => 'Token required'], 400);
    }

    $stmt = $conn->prepare('DELETE FROM sessions WHERE token = :token');
    $stmt->execute([':token' => $token]);

    jsonResponse(['success' => true, 'message' => 'Logout successful']);
}

function verifyToken(PDO $conn): void
{
    $data = readJsonBody();
    $token = trim($data['token'] ?? '');

    if ($token === '') {
        jsonResponse(['success' => false, 'error' => 'Token required'], 400);
    }

    $stmt = $conn->prepare("SELECT user_id FROM sessions WHERE token = :token AND expires_at > datetime('now')");
    $stmt->execute([':token' => $token]);
    $session = $stmt->fetch();

    if (!$session) {
        jsonResponse(['success' => false, 'error' => 'Invalid or expired token'], 401);
    }

    jsonResponse([
        'success' => true,
        'user_id' => (int) $session['user_id'],
        'user' => getPublicUser($conn, (int) $session['user_id'])
    ]);
}

function createSession(PDO $conn, int $userId): string
{
    $token = bin2hex(random_bytes(32));
    $expires = date('Y-m-d H:i:s', strtotime('+30 days'));
    $stmt = $conn->prepare('INSERT INTO sessions (user_id, token, expires_at) VALUES (:user_id, :token, :expires_at)');
    $stmt->execute([':user_id' => $userId, ':token' => $token, ':expires_at' => $expires]);

    return $token;
}

function getPublicUser(PDO $conn, int $userId): array
{
    $stmt = $conn->prepare('SELECT id, email, username, full_name, phone, date_of_birth, gender, address, profile_image, created_at, updated_at FROM users WHERE id = :id');
    $stmt->execute([':id' => $userId]);
    return $stmt->fetch() ?: [];
}
?>
