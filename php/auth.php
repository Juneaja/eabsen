<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'config.php';

$input = json_decode(file_get_contents('php://input'), true);
$action = $input['action'] ?? $_GET['action'] ?? '';

try {
    switch ($action) {
        case 'login':
            $email = trim($input['email'] ?? '');
            $password = $input['password'] ?? '';
            $role = $input['role'] ?? 'user';
            
            if (empty($email) || empty($password)) {
                throw new Exception('Email dan password wajib diisi');
            }
            
            $user = $db->findUser($email);
            
            if (!$user) {
                // Cek admin default
                if ($email === 'admin@company.com' && $password === 'admin123') {
                    echo json_encode([
                        'success' => true,
                        'user' => [
                            'nama' => 'Administrator',
                            'email' => $email,
                            'role' => 'admin'
                        ]
                    ]);
                    exit;
                }
                throw new Exception('Email tidak ditemukan');
            }
            
            if (password_verify($password, $user['password'])) {
                echo json_encode([
                    'success' => true,
                    'user' => [
                        'nama' => $user['nama'],
                        'email' => $user['email'],
                        'role' => strpos($user['email'], '@admin') !== false ? 'admin' : 'user'
                    ]
                ]);
            } else {
                throw new Exception('Password salah');
            }
            break;
            
        case 'signup':
            $nama = trim($input['nama'] ?? '');
            $email = trim($input['email'] ?? '');
            $password = $input['password'] ?? '';
            
            if (empty($nama) || empty($email) || empty($password)) {
                throw new Exception('Semua field wajib diisi');
            }
            
            if (strlen($password) < 6) {
                throw new Exception('Password minimal 6 karakter');
            }
            
            // Cek email sudah ada
            if ($db->findUser($email)) {
                throw new Exception('Email sudah terdaftar');
            }
            
            $db->addUser($nama, $email, $password);
            
            echo json_encode([
                'success' => true,
                'message' => 'Registrasi berhasil! Silakan login.'
            ]);
            break;
            
        default:
            throw new Exception('Action tidak valid');
    }
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
