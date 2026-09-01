<?php
require_once '../config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';

header('Content-Type: application/json');

if ($method === 'GET' && $action === 'list') {
    listAppointments();
} else if ($method === 'POST' && $action === 'create') {
    createAppointment();
} else if ($method === 'PUT' && $action === 'update') {
    updateAppointment();
} else if ($method === 'DELETE' && $action === 'delete') {
    deleteAppointment();
} else if ($method === 'GET' && $action === 'detail') {
    getAppointmentDetail();
} else {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid request']);
}

function getAuthenticatedUserId() {
    global $conn;
    
    $headers = function_exists('getallheaders') ? getallheaders() : [];
    $authHeader = null;

    if (isset($headers['Authorization'])) {
        $authHeader = $headers['Authorization'];
    } elseif (isset($headers['authorization'])) {
        $authHeader = $headers['authorization'];
    } elseif (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
    } elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
        $authHeader = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
    }

    if (!$authHeader) {
        return null;
    }
    
    $token = str_replace('Bearer ', '', $authHeader);
    
    $stmt = $conn->prepare("SELECT user_id FROM sessions WHERE token = :token AND expires_at > datetime('now')");
    $stmt->execute([':token' => $token]);
    
    if ($stmt->rowCount() > 0) {
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result['user_id'];
    }
    
    return null;
}

function listAppointments() {
    global $conn;
    
    $user_id = getAuthenticatedUserId();
    
    if ($user_id === null) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        return;
    }
    
    try {
        $status = isset($_GET['status']) ? $_GET['status'] : '';
        
        $query = "SELECT * FROM appointments WHERE user_id = :user_id";
        $params = [':user_id' => $user_id];
        
        if (!empty($status)) {
            $query .= " AND status = :status";
            $params[':status'] = $status;
        }
        
        $query .= " ORDER BY appointment_date DESC";
        
        $stmt = $conn->prepare($query);
        $stmt->execute($params);
        
        $appointments = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'appointments' => $appointments,
            'total' => count($appointments)
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

function createAppointment() {
    global $conn;
    
    $user_id = getAuthenticatedUserId();
    
    if ($user_id === null) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        return;
    }
    
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (!isset($data['title']) || !isset($data['appointment_date']) || !isset($data['appointment_time'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required fields: title, appointment_date, appointment_time']);
        return;
    }
    
    try {
        $stmt = $conn->prepare("INSERT INTO appointments (user_id, title, description, appointment_date, appointment_time, dentist_name, clinic_name, location, contact_number, notes) 
                              VALUES (:user_id, :title, :description, :appointment_date, :appointment_time, :dentist_name, :clinic_name, :location, :contact_number, :notes)");
        
        $stmt->execute([
            ':user_id' => $user_id,
            ':title' => $data['title'],
            ':description' => $data['description'] ?? null,
            ':appointment_date' => $data['appointment_date'],
            ':appointment_time' => $data['appointment_time'],
            ':dentist_name' => $data['dentist_name'] ?? null,
            ':clinic_name' => $data['clinic_name'] ?? null,
            ':location' => $data['location'] ?? null,
            ':contact_number' => $data['contact_number'] ?? null,
            ':notes' => $data['notes'] ?? null
        ]);
        
        $appointment_id = $conn->lastInsertId();
        
        http_response_code(201);
        echo json_encode([
            'success' => true,
            'message' => 'Appointment created successfully',
            'appointment_id' => $appointment_id
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

function updateAppointment() {
    global $conn;
    
    $user_id = getAuthenticatedUserId();
    
    if ($user_id === null) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        return;
    }
    
    if (!isset($_GET['id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Appointment ID required']);
        return;
    }
    
    $appointment_id = $_GET['id'];
    $data = json_decode(file_get_contents("php://input"), true);
    
    try {
        $stmt = $conn->prepare("SELECT id FROM appointments WHERE id = :id AND user_id = :user_id");
        $stmt->execute([':id' => $appointment_id, ':user_id' => $user_id]);
        
        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['error' => 'Appointment not found']);
            return;
        }
        
        $allowedFields = ['title', 'description', 'appointment_date', 'appointment_time', 'dentist_name', 'clinic_name', 'location', 'contact_number', 'status', 'notes'];
        $updateFields = [];
        $params = [':id' => $appointment_id, ':user_id' => $user_id];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $updateFields[] = "$field = :$field";
                $params[":$field"] = $data[$field];
            }
        }
        
        if (empty($updateFields)) {
            http_response_code(400);
            echo json_encode(['error' => 'No valid fields to update']);
            return;
        }
        
        $updateFields[] = "updated_at = CURRENT_TIMESTAMP";
        $query = "UPDATE appointments SET " . implode(", ", $updateFields) . " WHERE id = :id AND user_id = :user_id";
        
        $stmt = $conn->prepare($query);
        $stmt->execute($params);
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Appointment updated successfully'
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

function deleteAppointment() {
    global $conn;
    
    $user_id = getAuthenticatedUserId();
    
    if ($user_id === null) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        return;
    }
    
    if (!isset($_GET['id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Appointment ID required']);
        return;
    }
    
    $appointment_id = $_GET['id'];
    
    try {
        $stmt = $conn->prepare("DELETE FROM appointments WHERE id = :id AND user_id = :user_id");
        $stmt->execute([':id' => $appointment_id, ':user_id' => $user_id]);
        
        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['error' => 'Appointment not found']);
            return;
        }
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Appointment deleted successfully'
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

function getAppointmentDetail() {
    global $conn;
    
    $user_id = getAuthenticatedUserId();
    
    if ($user_id === null) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        return;
    }
    
    if (!isset($_GET['id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Appointment ID required']);
        return;
    }
    
    $appointment_id = $_GET['id'];
    
    try {
        $stmt = $conn->prepare("SELECT * FROM appointments WHERE id = :id AND user_id = :user_id");
        $stmt->execute([':id' => $appointment_id, ':user_id' => $user_id]);
        
        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['error' => 'Appointment not found']);
            return;
        }
        
        $appointment = $stmt->fetch(PDO::FETCH_ASSOC);
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'appointment' => $appointment
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}
?>
