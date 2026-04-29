<?php
session_start();

// Konfigurasi database Excel
$excelFile = 'data/absensi.xlsx';
require_once 'vendor/autoload.php'; // Install via composer: composer require phpoffice/phpspreadsheet

use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

function initExcel() {
    global $excelFile;
    if (!file_exists($excelFile)) {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setCellValue('A1', 'ID');
        $sheet->setCellValue('B1', 'Nama');
        $sheet->setCellValue('C1', 'Email');
        $sheet->setCellValue('D1', 'Tanggal');
        $sheet->setCellValue('E1', 'Waktu');
        $sheet->setCellValue('F1', 'Latitude');
        $sheet->setCellValue('G1', 'Longitude');
        $sheet->setCellValue('H1', 'Tipe');
        $sheet->setCellValue('I1', 'Selfie');
        $sheet->setCellValue('J1', 'Status');
        
        $writer = new Xlsx($spreadsheet);
        $writer->save($excelFile);
    }
}

function getUsers() {
    global $excelFile;
    initExcel();
    $spreadsheet = IOFactory::load($excelFile);
    $sheet = $spreadsheet->getActiveSheet();
    $users = [];
    $highestRow = $sheet->getHighestRow();
    
    for ($row = 2; $row <= $highestRow; $row++) {
        $email = $sheet->getCell('C' . $row)->getValue();
        if ($email && strpos($email, '@admin') !== false) {
            $users[] = [
                'email' => $email,
                'password' => $sheet->getCell('K' . $row)->getValue() // Kolom password
            ];
        }
    }
    return $users;
}
?>
