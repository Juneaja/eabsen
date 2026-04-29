let video, canvas, context, stream;

async function startAbsensi() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        alert('Silakan login terlebih dahulu');
        return;
    }

    // Cek apakah sudah absen hari ini
    const today = new Date().toISOString().split('T')[0];
    const history = await getHistory();
    const alreadyAbsen = history.some(item => 
        item.tanggal === today && (item.tipe === 'Masuk' || item.tipe === 'Pulang')
    );

    if (alreadyAbsen) {
        alert('Anda sudah absen hari ini!');
        return;
    }

    document.getElementById('absenBtn').style.display = 'none';
    document.getElementById('selfieContainer').style.display = 'block';
    startCamera();
}

function startCamera() {
    video = document.getElementById('video');
    canvas = document.getElementById('canvas');
    context = canvas.getContext('2d');

    navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 300, height: 300 } 
    })
    .then(s => {
        stream = s;
        video.srcObject = stream;
    })
    .catch(err => {
        alert('Error mengakses kamera: ' + err.message);
        cancelAbsensi();
    });
}

async function capturePhoto() {
    context.drawImage(video, 0, 0, 300, 300);
    
    // Dapatkan GPS
    const gps = await getGPS();
    if (!gps) {
        alert('GPS tidak tersedia');
        return;
    }

    // Simpan absensi
    const user = JSON.parse(localStorage.getItem('user'));
    const now = new Date();
    const tipe = now.getHours() < 12 ? 'Masuk' : 'Pulang';
    
    const photoData = canvas.toDataURL('image/jpeg', 0.8);
    
    const response = await fetch('php/absensi.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            nama: user.nama,
            email: user.email,
            tanggal: now.toISOString().split('T')[0],
            waktu: now.toLocaleTimeString('id-ID'),
            latitude: gps.latitude,
            longitude: gps.longitude,
            tipe: tipe,
            selfie: photoData
        })
    });

    const result = await response.json();
    
    if (result.success) {
        alert(`Absensi ${tipe} berhasil!`);
        stopCamera();
        loadDashboard();
    } else {
        alert('Gagal absen: ' + result.message);
    }
}

function cancelAbsensi() {
    stopCamera();
    document.getElementById('selfieContainer').style.display = 'none';
    document.getElementById('absenBtn').style.display = 'block';
}

function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
}
