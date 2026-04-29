// ============================================
// DASHBOARD ABSENSI - FULL FUNCTIONALITY
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Cek login
    checkAuth();
    
    // Load semua data dashboard
    loadDashboard();
    
    // Event listeners
    document.getElementById('absenBtn')?.addEventListener('click', startAbsensi);
});

// ============================================
// AUTHENTICATION
// ============================================
function checkAuth() {
    const user = localStorage.getItem('user');
    if (!user) {
        alert('Silakan login terlebih dahulu!');
        window.location.href = 'index.html';
        return false;
    }
    const userData = JSON.parse(user);
    document.getElementById('userName').textContent = userData.nama;
    return true;
}

function logout() {
    if (confirm('Yakin ingin logout?')) {
        localStorage.removeItem('user');
        sessionStorage.clear();
        window.location.href = 'index.html';
    }
}

// ============================================
// MAIN DASHBOARD FUNCTIONS
// ============================================
async function loadDashboard() {
    if (!checkAuth()) return;
    
    console.log('Loading dashboard...');
    
    // Update UI secara paralel
    await Promise.all([
        loadStatus(),
        loadHistory(),
        loadTodayStats()
    ]);
    
    console.log('Dashboard loaded successfully!');
}

async function loadStatus() {
    try {
        const statusCard = document.getElementById('statusCard');
        const history = await getHistory();
        const today = getTodayDate();
        const todayRecords = history.filter(item => item.tanggal === today);
        
        if (todayRecords.length === 0) {
            statusCard.innerHTML = `
                <div style="color: #6c757d;">
                    <h4>📋 Belum Absen</h4>
                    <p>Hari ini: ${formatDate(today)}</p>
                </div>
            `;
            statusCard.style.background = '#f8f9fa';
            return;
        }
        
        const lastRecord = todayRecords[todayRecords.length - 1];
        const isComplete = todayRecords.some(r => r.tipe === 'Pulang');
        
        statusCard.innerHTML = `
            <div style="text-align: left;">
                <h4 style="margin: 0; color: ${lastRecord.tipe === 'Masuk' ? '#28a745' : '#ffc107'};">
                    ✅ ${lastRecord.tipe}
                </h4>
                <p style="margin: 5px 0; font-size: 14px;">${lastRecord.waktu}</p>
                <small style="color: #6c757d;">
                    📍 ${lastRecord.latitude?.toFixed(6)}, ${lastRecord.longitude?.toFixed(6)}
                </small>
                ${!isComplete ? '<p style="color: #ffc107; font-weight: bold;">⏰ Belum absen pulang</p>' : ''}
            </div>
        `;
        
        statusCard.style.background = isComplete ? '#d4edda' : '#fff3cd';
        
    } catch (error) {
        console.error('Error loading status:', error);
        showError('Gagal memuat status absensi');
    }
}

async function loadHistory() {
    try {
        const historyList = document.getElementById('historyList');
        const history = await getHistory(7); // 7 hari terakhir
        
        if (history.length === 0) {
            historyList.innerHTML = '<p style="text-align: center; color: #6c757d;">Belum ada riwayat absensi</p>';
            return;
        }
        
        historyList.innerHTML = history.map(item => createHistoryItem(item)).join('');
        
    } catch (error) {
        console.error('Error loading history:', error);
        showError('Gagal memuat riwayat absensi');
    }
}

async function loadTodayStats() {
    try {
        // Tambahkan stats card jika ada di HTML
        const statsContainer = document.getElementById('statsContainer');
        if (!statsContainer) return;
        
        const history = await getHistory();
        const today = getTodayDate();
        const todayRecords = history.filter(item => item.tanggal === today);
        
        statsContainer.innerHTML = `
            <div class="stat-item">
                <h3>${todayRecords.length}</h3>
                <p>Absensi Hari Ini</p>
            </div>
            <div class="stat-item">
                <h3>${todayRecords.filter(r => r.tipe === 'Masuk').length}</h3>
                <p>Masuk</p>
            </div>
            <div class="stat-item">
                <h3>${todayRecords.filter(r => r.tipe === 'Pulang').length}</h3>
                <p>Pulang</p>
            </div>
        `;
        
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// ============================================
// ABSENSI FUNCTIONS
// ============================================
async function startAbsensi() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        alert('Silakan login terlebih dahulu');
        return;
    }

    // Cek GPS permission
    if (!navigator.geolocation) {
        alert('Browser tidak mendukung GPS');
        return;
    }

    // Cek apakah sudah absen hari ini
    try {
        const today = getTodayDate();
        const history = await getHistory();
        const todayRecords = history.filter(item => item.tanggal === today);
        const hasMasuk = todayRecords.some(item => item.tipe === 'Masuk');
        const hasPulang = todayRecords.some(item => item.tipe === 'Pulang');
        
        if (hasMasuk && hasPulang) {
            alert('Anda sudah lengkap absen hari ini (Masuk & Pulang)!');
            return;
        }
        
        const tipe = hasMasuk ? 'Pulang' : 'Masuk';
        if (!confirm(`Absen ${tipe}?`)) return;
        
        // Mulai selfie process
        document.getElementById('absenBtn').style.display = 'none';
        document.getElementById('statusCard').innerHTML = '<p>Memulai proses absensi...</p>';
        document.getElementById('selfieContainer').style.display = 'block';
        
        await startCamera();
        
    } catch (error) {
        console.error('Error starting absensi:', error);
        alert('Gagal memulai absensi: ' + error.message);
    }
}

async function capturePhoto() {
    try {
        // Ambil GPS
        const gps = await getGPS();
        if (!gps) {
            throw new Error('GPS tidak tersedia');
        }

        // Ambil foto
        const canvas = document.getElementById('canvas');
        const photoData = canvas.toDataURL('image/jpeg', 0.8);
        
        // Kirim data absensi
        const user = JSON.parse(localStorage.getItem('user'));
        const now = new Date();
        const tipe = now.getHours() < 13 ? 'Masuk' : 'Pulang'; // 13:00 sebagai batas
        
        document.getElementById('captureBtn').textContent = '⏳ Menyimpan...';
        document.getElementById('captureBtn').disabled = true;
        
        const response = await fetch('php/absensi.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nama: user.nama,
                email: user.email,
                tanggal: getTodayDate(),
                waktu: formatTime(now),
                latitude: gps.latitude,
                longitude: gps.longitude,
                tipe: tipe,
                selfie: photoData
            })
        });

        const result = await response.json();
        
        if (result.success) {
            showSuccess(`✅ Absensi ${tipe} berhasil disimpan!`);
            stopCamera();
            document.getElementById('selfieContainer').style.display = 'none';
            document.getElementById('absenBtn').style.display = 'block';
            document.getElementById('absenBtn').textContent = 'Absen Lagi';
            
            // Refresh dashboard
            await loadDashboard();
        } else {
            throw new Error(result.message || 'Gagal menyimpan absensi');
        }
        
    } catch (error) {
        console.error('Error capturing photo:', error);
        alert('❌ Gagal absen: ' + error.message);
        document.getElementById('captureBtn').textContent = '📸 Ambil Foto';
        document.getElementById('captureBtn').disabled = false;
    }
}

function cancelAbsensi() {
    stopCamera();
    document.getElementById('selfieContainer').style.display = 'none';
    document.getElementById('absenBtn').style.display = 'block';
    document.getElementById('absenBtn').textContent = 'Absen Sekarang';
}

// ============================================
// GPS & CAMERA HELPERS
// ============================================
async function getGPS() {
    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
            position => {
                const accuracy = position.coords.accuracy;
                if (accuracy > 50) { // Akurasi minimal 50 meter
                    reject('Akurasi GPS kurang baik (>' + accuracy.toFixed(0) + 'm)');
                    return;
                }
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: accuracy
                });
            },
            error => {
                let message = 'Gagal mendapatkan GPS: ';
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        message += 'Izin GPS ditolak';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        message += 'Lokasi tidak tersedia';
                        break;
                    case error.TIMEOUT:
                        message += 'Timeout GPS';
                        break;
                }
                reject(message);
            },
            { 
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 30000 
            }
        );
    });
}

// Camera functions sudah ada di selfie.js, tapi backup di sini
let videoStream = null;
async function startCamera() {
    try {
        const video = document.getElementById('video');
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: 'user', 
                width: { ideal: 640 }, 
                height: { ideal: 640 } 
            } 
        });
        video.srcObject = stream;
        videoStream = stream;
    } catch (err) {
        throw new Error('Kamera tidak tersedia: ' + err.message);
    }
}

function stopCamera() {
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        videoStream = null;
    }
}

// ============================================
// API CALLS
// ============================================
async function getHistory(days = 30) {
    const user = JSON.parse(localStorage.getItem('user'));
    const params = new URLSearchParams({
        action: 'getHistory',
        email: user.email,
        days: days
    });
    
    const response = await fetch(`php/absensi.php?${params}`);
    if (!response.ok) throw new Error('Network error');
    
    const history = await response.json();
    return Array.isArray(history) ? history : [];
}

// ============================================
// UI HELPERS & UTILITIES
// ============================================
function createHistoryItem(item) {
    const statusColor = item.tipe === 'Masuk' ? '#28a745' : '#ffc107';
    return `
        <div class="history-item" style="border-left: 4px solid ${statusColor};">
            <div style="flex: 1;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <strong>${formatDate(item.tanggal)}</strong>
                    <span style="color: ${statusColor}; font-weight: bold;">${item.tipe}</span>
                </div>
                <div style="font-size: 14px; color: #6c757d;">
                    ${item.waktu} • 📍 ${item.latitude?.toFixed(4)}, ${item.longitude?.toFixed(4)}
                </div>
            </div>
            <div style="text-align: right; font-size: 12px; color: #6c757d;">
                ${item.status || 'Terverifikasi'}
            </div>
        </div>
    `;
}

function getTodayDate() {
    return new Date().toISOString().split('T')[0];
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatTime(date) {
    return date.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

function showSuccess(message) {
    // Buat toast notification
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed; top: 20px; right: 20px; background: #d4edda; 
        color: #155724; padding: 15px 20px; border-radius: 10px; 
        box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 10000;
        font-weight: bold; border: 1px solid #c3e6cb;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 4000);
}

function showError(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed; top: 20px; right: 20px; background: #f8d7da; 
        color: #721c24; padding: 15px 20px; border-radius: 10px; 
        box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 10000;
        font-weight: bold; border: 1px solid #f5c6cb;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 5000);
}

// ============================================
// AUTO REFRESH (Optional)
// ============================================
setInterval(() => {
    if (document.visibilityState === 'visible') {
        loadStatus();
    }
}, 30000); // Refresh status setiap 30 detik

// Handle page visibility change
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        loadStatus();
    }
});

// ============================================
// ERROR HANDLING GLOBAL
// ============================================
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    showError('Terjadi kesalahan sistem: ' + event.reason.message);
});

// Export functions untuk digunakan di file lain
window.loadDashboard = loadDashboard;
window.startAbsensi = startAbsensi;
window.capturePhoto = capturePhoto;
window.cancelAbsensi = cancelAbsensi;
window.logout = logout;
