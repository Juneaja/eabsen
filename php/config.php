<?php
session_start();

// Path ke file Excel
$excelFile = __DIR__ . '/../data/absensi.xlsx';

// Pastikan folder data ada
if (!file_exists(__DIR__ . '/../data')) {
    mkdir(__DIR__ . '/../data', 0777, true);
}

// Include PHPSpreadsheet (install via composer di folder project root)
require_once __DIR__ . '/../vendor/autoload.php';

use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;

class AbsensiDB {
    private $excelFile;
    
    public function __construct($filePath) {
        $this->excelFile = $filePath;
        $this->initExcel();
    }
    
    private function initExcel() {
        if (!file_exists($this->excelFile)) {
            $spreadsheet = new Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();
            
            // Header
            $headers = ['ID', 'Nama', 'Email', 'Tanggal', 'Waktu', 'Latitude', 'Longitude', 'Tipe', 'Selfie', 'Status', 'Password'];
            $sheet->fromArray($headers, null, 'A1');
            
            // Style header
            $headerStyle = [
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => '4472C4']
                ],
                'font' => ['color' => ['rgb' => 'FFFFFF'], 'bold' => true],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER]
            ];
            $sheet->getStyle('A1:K1')->applyFromArray($headerStyle);
            
            // Auto size columns
            foreach(range('A','K') as $col) {
                $sheet->getColumnDimension($col)->setAutoSize(true);
            }
            
            $writer = new Xlsx($spreadsheet);
            $writer->save($this->excelFile);
        }
    }
    
    public function getAllData() {
        $spreadsheet = IOFactory::load($this->excelFile);
        $sheet = $spreadsheet->getActiveSheet();
        $data = [];
        $highestRow = $sheet->getHighestRow();
        
        for ($row = 2; $row <= $highestRow; $row++) {
            $data[] = [
                'id' => $sheet->getCell('A' . $row)->getValue(),
                'nama' => $sheet->getCell('B' . $row)->getValue(),
                'email' => $sheet->getCell('C' . $row)->getValue(),
                'tanggal' => $sheet->getCell('D' . $row)->getValue(),
                'waktu' => $sheet->getCell('E' . $row)->getValue(),
                'lat' => $sheet->getCell('F' . $row)->getValue(),
                'lng' => $sheet->getCell('G' . $row)->getValue(),
                'tipe' => $sheet->getCell('H' . $row)->getValue(),
                'selfie' => $sheet->getCell('I' . $row)->getValue(),
                'status' => $sheet->getCell('J' . $row)->getValue(),
                'password' => $sheet->getCell('K' . $row)->getValue()
            ];
        }
        return $data;
    }
    
    public function findUser($email) {
        $data = $this->getAllData();
        foreach ($data as $row) {
            if ($row['email'] === $email) {
                return $row;
            }
        }
        return null;
    }
    
    public function addUser($nama, $email, $password) {
        $spreadsheet = IOFactory::load($this->excelFile);
        $sheet = $spreadsheet->getActiveSheet();
        $highestRow = $sheet->getHighestRow() + 1;
        
        $sheet->setCellValue('A' . $highestRow, $highestRow - 1);
        $sheet->setCellValue('B' . $highestRow, $nama);
        $sheet->setCellValue('C' . $highestRow, $email);
        $sheet->setCellValue('K' . $highestRow, password_hash($password, PASSWORD_DEFAULT));
        
        $writer = new Xlsx($spreadsheet);
        $writer->save($this->excelFile);
        return true;
    }
    
    public function addAbsensi($data) {
        $spreadsheet = IOFactory::load($this->excelFile);
        $sheet = $spreadsheet->getActiveSheet();
        $highestRow = $sheet->getHighestRow() + 1;
        
        $sheet->setCellValue('A' . $highestRow, $highestRow - 1);
        $sheet->setCellValue('B' . $highestRow, $data['nama']);
        $sheet->setCellValue('C' . $highestRow, $data['email']);
        $sheet->setCellValue('D' . $highestRow, $data['tanggal']);
        $sheet->setCellValue('E' . $highestRow, $data['waktu']);
        $sheet->setCellValue('F' . $highestRow, $data['latitude']);
        $sheet->setCellValue('G' . $highestRow, $data['longitude']);
        $sheet->setCellValue('H' . $highestRow, $data['tipe']);
        $sheet->setCellValue('I' . $highestRow, $data['selfie']);
        $sheet->setCellValue('J' . $highestRow, 'Terverifikasi');
        
        $writer = new Xlsx($spreadsheet);
        $writer->save($this->excelFile);
        return true;
    }
    
    public function getUserHistory($email, $days = 30) {
        $data = $this->getAllData();
        $history = array_filter($data, function($row) use ($email) {
            return $row['email'] === $email;
        });
        return array_values($history);
    }
}

// Inisialisasi database
$db = new AbsensiDB($excelFile);

// Admin default (akan ditambahkan otomatis)
$adminExists = false;
$data = $db->getAllData();
foreach ($data as $row) {
    if ($row['email'] === 'admin@company.com') {
        $adminExists = true;
        break;
    }
}

if (!$adminExists) {
    $db->addUser('Administrator', 'admin@company.com', 'admin123');
}
?>
