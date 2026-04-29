<?php
require_once 'config.php';

if ($_GET['action'] === 'getLaporan') {
    $date = $_GET['date'] ?? date('Y-m-d');
    $spreadsheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($excelFile);
    $sheet = $spreadsheet->getActiveSheet();
    $highestRow = $sheet->getHighestRow();
    $data = [];
    
    for ($row = 2; $row <= $highestRow; $row++) {
        $tanggal = $sheet->getCell('D' . $row)->getValue();
        if (!$tanggal || $tanggal === $date) {
            $data[] = [
                'nama' => $sheet->getCell('B' . $row)->getValue(),
                'email' => $sheet->getCell('C' . $row)->getValue(),
                'tanggal' => $tanggal,
                'waktu' => $sheet->getCell('E' . $row)->getValue(),
                'latitude' => $sheet->getCell('F' . $row)->getValue(),
                'longitude' => $sheet->getCell('G' . $row)->getValue(),
                'tipe' => $sheet->getCell('H' . $row)->getValue(),
                'status' => 'Terverifikasi'
            ];
        }
    }
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

// Download Excel
header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
header('Content-Disposition: attachment;filename="laporan_absensi.xlsx"');
header('Cache-Control: max-age=0');

$spreadsheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($excelFile);
$writer = new Xlsx($spreadsheet);
$writer->save('php://output');
?>
