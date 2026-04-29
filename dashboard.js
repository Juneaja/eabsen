async function loadDashboard() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        document.getElementById('userName').textContent = user.nama;
    }

    // Load status dan history
    await loadStatus();
    await loadHistory();
}

async function loadStatus() {
    const history = await getHistory();
    const today = new Date().toISOString().split('T')[0];
    const todayRecords = history.filter(item => item.tanggal === today);
    
    const statusCard = document.getElementById('statusCard');
    if (todayRecords.length > 0) {
        const lastRecord = todayRecords[todayRecords.length - 1];
        statusCard.innerHTML = `
            <div>
                <h4>${lastRecord.tipe} - ${lastRecord.waktu}</h4>
                <p>${lastRecord.latitude}, ${lastRecord.longitude}</p>
            </div>
        `;
        statusCard.style.background = lastRecord.tipe === 'Masuk' ? '#d4edda' : '#fff3cd';
    }
}

async function loadHistory() {
    const history = await getHistory();
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = history.map(item => `
        <div class="history-item">
            <div>
                <strong>${item.tanggal}</strong><br>
                <small>${item.tipe} - ${item.waktu}</small>
            </div>
            <div style="text-align: right;">
                <small>${item.latitude}, ${item.longitude}</small>
            </div>
        </div>
    `).join('');
}

async function getHistory() {
    const user = JSON.parse(localStorage.getItem('user'));
    const response = await fetch('php/absensi.php?action=getHistory&email=' + user.email);
    return await response.json();
}

// Load dashboard saat halaman dimuat
loadDashboard();
