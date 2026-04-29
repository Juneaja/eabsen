<?php
require_once 'config.php';
header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);
$action = $_GET['action'] ?? '';

if ($action === 'getHistory') {
    $email = $_GET['email'];
    $spreadsheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($excelFile);
    $sheet = $spreadsheet->getActiveSheet();
    $highestRow = $sheet->getHighestRow();
    $history = [];
    
    for ($row = 2; $row <= $highestRow; $row++) {
        if ($sheet->getCell('C' . $row)->getValue() === $email) {
            $history[] = [
                'tanggal' => $sheet->getCell('D' . $row)->getValue(),
                'waktu' => $sheet->getCell('E' . $row)->getValue(),
                'latitude' => $sheet->getCell('F' . $row)->getValue(),
                'longitude' => $sheet->getCell('G' . $row)->getValue(),
                'tipe' => $sheet->getCell('H' . $row)->getValue()
            ];
        }
    }
    echo json_encode($history);
    exit;
}

if (!$input) {
    echo json_encode(['success' => false, 'message' => 'No data']);
    exit;
}

// Simpan absensi
$spreadsheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($excelFile);
$sheet = $spreadsheet->getActiveSheet();
$highestRow = $sheet->getHighestRow() + 1;

$sheet->setCellValue('A' . $highestRow, $highestRow - 1);
$sheet->setCellValue('B' . $highestRow, $input['nama']);
$sheet->setCellValue('C' . $highestRow, $input['email']);
$sheet->setCellValue('D' . $highestRow, $input['tanggal']);
$sheet->setCellValue('E' . $highestRow, $input['waktu']);
$sheet->setCellValue('F' . $highestRow, $input['latitude']);
$sheet->setCellValue('G' . $highestRow, $input['longitude']);
$sheet->setCellValue('H' . $highestRow, $input['tipe']);
$sheet->setCellValue('I' . $highestRow, $input['selfie']);

// Simpan foto sebagai base64 di Excel
$writer = new Xlsx($spreadsheet);
$writer->save($excelFile);

echo json_encode(['success' => true]);
?>
