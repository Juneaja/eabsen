<?php
require_once 'config.php';
header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);
$action = $input['action'] ?? $_GET['action'] ?? '';

if ($action === 'login') {
    $email = $input['email'];
    $password = $input['password'];
    $role = $input['role'];
    
    $spreadsheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($excelFile);
    $sheet = $spreadsheet->getActiveSheet();
    $highestRow = $sheet->getHighestRow();
    
    for ($row = 2; $row <= $highestRow; $row++) {
        $dbEmail = $sheet->getCell('C' . $row)->getValue();
        $dbPass = $sheet->getCell('K' . $row)->getValue();
        
        if ($dbEmail === $email && password_verify($password, $dbPass)) {
            echo json_encode([
                'success' => true,
                'user' => [
                    'nama' => $sheet->getCell('B' . $row)->getValue(),
                    'email' => $dbEmail
                ]
            ]);
            exit;
        }
    }
    
    // Admin default: admin@company.com / admin123
    if ($role === 'admin' && $email === 'admin@company.com' && $password === 'admin123') {
        echo json_encode([
            'success' => true,
            'user' => ['nama' => 'Admin', 'email' => $email]
        ]);
        exit;
    }
    
    echo json_encode(['success' => false, 'message' => 'Email atau password salah']);
    
} elseif ($action === 'signup') {
    $nama = $input['nama'];
    $email = $input['email'];
    $password = password_hash($input['password'], PASSWORD_DEFAULT);
    
    $spreadsheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($excelFile);
    $sheet = $spreadsheet->getActiveSheet();
    $highestRow = $sheet->getHighestRow() + 1;
    
    // Cek apakah email sudah ada
    for ($row = 2; $row <= $highestRow; $row++) {
        if ($sheet->getCell('C' . $row)->getValue() === $email) {
            echo json_encode(['success' => false, 'message' => 'Email sudah terdaftar']);
            exit;
        }
    }
    
    // Tambah user baru
    $sheet->setCellValue('A' . $highestRow, $highestRow - 1);
    $sheet->setCellValue('B' . $highestRow, $nama);
    $sheet->setCellValue('C' . $highestRow, $email);
    $sheet->setCellValue('K' . $highestRow, $password); // Kolom password
    
    $writer = new Xlsx($spreadsheet);
    $writer->save($excelFile);
    
    echo json_encode(['success' => true, 'message' => 'Registrasi berhasil']);
}
?>
