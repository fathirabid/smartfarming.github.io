// ==========================================================
// 1. INISIALISASI IKON & WAKTU (SIDEBAR)
// ==========================================================
if (typeof feather !== 'undefined') feather.replace();

function updateTime() {
    const now = new Date();
    const clockEl = document.getElementById('clock');
    const dateEl = document.getElementById('date');
    if (clockEl) clockEl.innerText = now.toLocaleTimeString('id-ID', { hour12: false });
    if (dateEl) dateEl.innerText = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}
setInterval(updateTime, 1000); updateTime();


// ==========================================================
// 2. KONFIGURASI FIREBASE
// ==========================================================
const firebaseConfig = {
  apiKey: "AIzaSyA7jwKuPkjPtjcrv0wtXq13EP8uQfKrMX0",
  authDomain: "radlab-iot.firebaseapp.com",
  databaseURL: "https://radlab-iot-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "radlab-iot",
  storageBucket: "radlab-iot.firebasestorage.app",
  messagingSenderId: "82363834416",
  appId: "1:82363834416:web:f9cbc4bacfb3fbdcd8cdf5",
  measurementId: "G-7V4PYQB2QR"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const database = firebase.database();


// ==========================================================
// 3. BLOK UNIVERSAL: AUTENTIKASI, MODAL, & TOAST
// ==========================================================
let isLoggedIn = false;
let historyDataArray = [];

// A. Buka/Tutup Modal
function showLogin() { document.getElementById('loginModal').style.display = 'flex'; }
function closeLogin() { document.getElementById('loginModal').style.display = 'none'; }
function handleLogout() { document.getElementById('logoutModal').style.display = 'flex'; }
function closeLogoutModal() { document.getElementById('logoutModal').style.display = 'none'; }

// B. Fungsi Notifikasi Toast (Pojok Layar)
function showToast(status, title, msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    document.getElementById('toast-title').innerText = title;
    document.getElementById('toast-msg').innerText = msg;
    toast.className = "toast-container";
    toast.classList.add(status === 'success' ? 'toast-success' : 'toast-error');
    toast.classList.add('show');
    setTimeout(() => { toast.classList.remove('show'); }, 3000);
}

// C. Fungsi Notifikasi Modal Status (Pop-up Tengah) - INI YANG SEBELUMNYA HILANG!
function showStatusModal(type, title, message) {
    const modal = document.getElementById('statusModal');
    if (!modal) return;
    const icon = document.getElementById('statusIcon');
    const titleEl = document.getElementById('statusTitle');
    const msgEl = document.getElementById('statusMessage');
    const box = modal.querySelector('.status-box');

    if (type === 'success') {
        icon.innerText = ""; box.className = "modal-content status-box success"; 
    } else if (type === 'error') {
        icon.innerText = "❌"; box.className = "modal-content status-box error";
    } else {
        icon.innerText = "⚠️"; box.className = "modal-content status-box warning";
    }

    titleEl.innerText = title; msgEl.innerText = message;
    
    modal.style.display = 'flex';
    setTimeout(() => { modal.style.display = 'none'; }, 2000);
}

// D. Event Listener Utama
document.addEventListener("DOMContentLoaded", () => {
    
    // Toggle Ikon Mata Password
    const toggleBtn = document.getElementById('togglePassword');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', function() {
            const passInput = document.getElementById('loginPass');
            if (passInput.type === 'password') {
                passInput.type = 'text'; this.innerHTML = '<i data-feather="eye-off"></i>';
            } else {
                passInput.type = 'password'; this.innerHTML = '<i data-feather="eye"></i>';
            }
            if (typeof feather !== 'undefined') feather.replace();
        });
    }

    // Form Login Submit
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const user = document.getElementById('loginUser').value;
            const pass = document.getElementById('loginPass').value;

            if (user === "admin" && pass === "pkm2026") {
                localStorage.setItem("adminLoggedIn", "true");
                
                showStatusModal('success', 'Akses Diterima', 'Login berhasil, memuat sistem SoilSense...');
                showToast('success', 'Berhasil Masuk!', 'Selamat datang, data lahan siap dikelola.');

                setTimeout(() => {
                    closeLogin(); loginForm.reset(); applyAdminState(true); 
                }, 1000);
            } else {        
                showStatusModal('error', 'Akses Ditolak', 'Username atau password yang Anda masukkan salah.');
                showToast('error', 'Gagal Masuk!', 'Username atau password salah.');
            }
        });
    }

    // Cek Memori Auto-Login
    if (localStorage.getItem("adminLoggedIn") === "true") { applyAdminState(true); } 
    else { applyAdminState(false); }
});

// E. Eksekusi Logout
function confirmLogout() {
    localStorage.setItem("adminLoggedIn", "false");
    
    showStatusModal('success', 'Sesi Berakhir', 'Anda telah keluar dari sistem.');
    showToast('success', 'Keluar Berhasil', 'Anda telah berhasil keluar dari sistem.');

    setTimeout(() => {
        closeLogoutModal(); applyAdminState(false);
    }, 1500);
}

// F. Terapkan Perubahan UI Sidebar & Panel History
function applyAdminState(loginStatus) {
    isLoggedIn = loginStatus;
    const guestView = document.getElementById('guest-view');
    const adminView = document.getElementById('admin-view');
    const guestWarning = document.getElementById('guest-warning');
    
    const histBox = document.getElementById('history-content-box');
    const chartBox = document.getElementById('history-chart-box'); // <-- AMBIL KOTAK GRAFIK
    const btnExport = document.getElementById('btn-export');
    const btnClear = document.getElementById('btn-clear');
    
    if (isLoggedIn) {
        if (guestView) guestView.style.display = 'none';
        if (adminView) adminView.style.display = 'block';
        if (guestWarning) guestWarning.style.display = 'none';
        
        if (histBox) histBox.style.display = 'block';
        if (chartBox) chartBox.style.display = 'block'; // <-- TAMPILKAN GRAFIK DI SINI
        if (btnExport) btnExport.style.display = 'flex';
        if (btnClear) btnClear.style.display = 'flex';
        
        loadHistoryData(); // Panggil data dari Firebase
    } else {
        if (guestView) guestView.style.display = 'block';
        if (adminView) adminView.style.display = 'none';
        if (guestWarning) guestWarning.style.display = 'block';
        
        if (histBox) histBox.style.display = 'none';
        if (chartBox) chartBox.style.display = 'none'; // <-- SEMBUNYIKAN GRAFIK JIKA LOGOUT
        if (btnExport) btnExport.style.display = 'none';
        if (btnClear) btnClear.style.display = 'none';
        
        const tbody = document.getElementById('history-body');
        if (tbody) tbody.innerHTML = ''; // Kosongkan tabel demi keamanan
    }
}

// ==========================================================
// 4. FUNGSI KHUSUS HALAMAN HISTORY (TIDAK ADA YANG DIRUBAH)
// ==========================================================

function loadHistoryData() {
    const tbody = document.getElementById('history-body');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">Mengambil data dari server awan...</td></tr>';
    
    database.ref('AgroskorPro/History').limitToLast(200).on('value', (snapshot) => {
        if (!isLoggedIn) return; 
        
        tbody.innerHTML = ''; 
        historyDataArray = [];

        if (snapshot.exists()) {
            const dataList = [];
            snapshot.forEach((childSnapshot) => { 
                let item = childSnapshot.val();
                item.firebaseKey = childSnapshot.key; 
                dataList.push(item); 
            });
            
            dataList.reverse(); 
            historyDataArray = dataList;

            dataList.forEach((data) => {
                let badgeClass = "badge-crit";
                if (data.score > 80) badgeClass = "badge-good";
                else if (data.score > 50) badgeClass = "badge-warn";

                const tr = document.createElement('tr');
                let timestamp = parseInt(data.lastUpdate);
                if (timestamp > 1000000000) timestamp = timestamp * 1000; 
                
                const dateObj = new Date(timestamp);
                const timeString = dateObj.toLocaleDateString('id-ID') + " - " + dateObj.toLocaleTimeString('id-ID');

                tr.innerHTML = `
                    <td>${timeString}</td>
                    <td><strong>${data.score} / 100</strong></td>
                    <td>${parseFloat(data.ph).toFixed(2).replace('.', ',')}</td>
                    <td>${data.nitrogen}</td>
                    <td>${data.fosfor}</td>
                    <td>${data.kalium}</td>
                    <td>${parseFloat(data.hum).toFixed(2).replace('.', ',')}%</td>
                    <td><span class="badge-status ${badgeClass}">${data.status}</span></td>
                `;
                tbody.appendChild(tr);
            });
            updateChartFilter(currentFilterRange);

        } else {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">Belum ada riwayat. Biarkan alat menyala beberapa menit untuk menyimpan log pertama.</td></tr>';
            renderHistoryChart([]);
        }
    });
}

function exportHistoryCSV() {
    if(historyDataArray.length === 0) return alert("Belum ada data untuk diunduh!");
    let csvContent = "data:text/csv;charset=utf-8,Waktu,Skor AI,pH,Nitrogen,Fosfor,Kalium,Suhu,Kelembapan,Status\n";
    historyDataArray.forEach(data => {
        let timestamp = parseInt(data.lastUpdate);
        if (timestamp > 1000000000) timestamp = timestamp * 1000; 
        const timeStr = new Date(timestamp).toLocaleString('id-ID').replace(/,/g, '');
        csvContent += [timeStr, data.score, data.ph, data.nitrogen, data.fosfor, data.kalium, data.temp, data.hum, data.status].join(",") + "\n";
    });
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `AgroskorPro_Full_History_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
}

function clearTodayLogs() { 
    if(historyDataArray.length === 0) {
        showToast('error', 'Gagal', 'Tidak ada data untuk dihapus.');
        return;
    }
    const deleteModal = document.getElementById('deleteModal');
    if (deleteModal) deleteModal.style.display = 'flex';
}

function closeDeleteModal() {
    const deleteModal = document.getElementById('deleteModal');
    if (deleteModal) deleteModal.style.display = 'none';
}

function executeClearLogs(mode) {
    const deleteModal = document.getElementById('deleteModal');
    if (deleteModal) deleteModal.style.display = 'none'; 
    
    if (mode === 'all') {
        let totalLogs = historyDataArray.length;
        if(confirm(`PERINGATAN: Anda akan menghancurkan SELURUH database riwayat (${totalLogs}+ baris). Anda tidak dapat membatalkan ini.\n\nYakin untuk me-reset total?`)) {
            database.ref('AgroskorPro/History').remove()
                .then(() => { showToast('success', 'Reset Total Berhasil', 'Seluruh data riwayat telah dihapus dari server awan.'); })
                .catch((error) => { showToast('error', 'Gagal', 'Terjadi kesalahan sistem.'); });
        }
    } else if (mode === 'today') {
        const todayStr = new Date().toLocaleDateString('id-ID');
        let keysToDelete = [];

        historyDataArray.forEach(data => {
            let timestamp = parseInt(data.lastUpdate);
            if (timestamp > 1000000000) timestamp = timestamp * 1000;
            const dateObj = new Date(timestamp);
            
            if(dateObj.toLocaleDateString('id-ID') === todayStr) {
                keysToDelete.push(data.firebaseKey);
            }
        });

        if(keysToDelete.length === 0) {
            showToast('error', 'Info', 'Tidak ada rekaman log baru pada hari ini.');
            return;
        }

        keysToDelete.forEach(key => { database.ref('AgroskorPro/History/' + key).remove(); });
        showToast('success', 'Pembersihan Harian', `${keysToDelete.length} data log hari ini telah dihapus permanen.`);
    }
}

// ==========================================================
// MAGIC SCRIPT: TELEPORTASI PROFIL PINTAR (RESPONSIVE REAL-TIME)
// ==========================================================
function handleProfilePosition() {
    const profile = document.querySelector('.sidebar-footer');
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    
    if (!profile || !sidebar || !mainContent) return; // Keamanan jika elemen tidak ditemukan

    if (window.innerWidth <= 768) {
        // JIKA LAYAR HP: Pindahkan profil ke atas Main Content (jika belum ada di sana)
        if (profile.parentElement !== mainContent) {
            mainContent.insertBefore(profile, mainContent.firstChild);
        }
    } else {
        // JIKA LAYAR DEKSTOP: Pulangkan profil kembali ke bawah Sidebar (jika belum ada di sana)
        if (profile.parentElement !== sidebar) {
            sidebar.appendChild(profile);
        }
    }
}

// ==========================================
// FITUR EXPORT / UNDUH LAPORAN CSV
// ==========================================

// --- BUKA/TUTUP MODAL CSV ---
function showCsvModal() { 
    // Cek langsung ke array data aslinya, bukan ke tampilan tabel HTML-nya
    if (historyDataArray.length === 0) {
        showToast('error', 'Data Kosong', 'Tidak ada data riwayat yang bisa diunduh saat ini.');
        return; // Hentikan fungsi jika datanya 0
    }

    // Jika datanya ada, baru izinkan modal terbuka
    document.getElementById('csvModal').style.display = 'flex'; 
}

function closeCsvModal() { 
    document.getElementById('csvModal').style.display = 'none'; 
}

function confirmDownloadCSV() {
    // 1. Tutup modal terlebih dahulu
    closeCsvModal();

    // 2. Munculkan notifikasi Toast
    showToast('success', 'Mengunduh...', 'Laporan CSV sedang disiapkan dan akan segera diunduh.');

    // 3. Proses membaca tabel dan membuat file CSV
    let csv = [];
    // Mengambil tabel berdasarkan class "history-table"
    let rows = document.querySelectorAll("table.history-table tr");
    
    for (let i = 0; i < rows.length; i++) {
        let row = [], cols = rows[i].querySelectorAll("td, th");
        
        for (let j = 0; j < cols.length; j++) {
            let cellText = cols[j].innerText;
            
            // Trik khusus Excel Indonesia: Ubah titik desimal jadi koma khusus untuk angka
            // (Kita kecualikan kolom tanggal/waktu yang memiliki tanda garis miring '/')
            if (cellText.includes('.') && !cellText.includes('/')) {
                cellText = cellText.replace('.', ',');
            }

            // Tambahkan tanda kutip untuk mencegah error format
            row.push('"' + cellText + '"'); 
        }
        // KUNCI PERBAIKAN: Gunakan TITIK KOMA (;) sebagai pemisah kolom
        csv.push(row.join(";")); 
    }

    // 4. Eksekusi Download File ke Browser Pengguna
    downloadCSVFile(csv.join("\n"), 'Laporan_Sensor_Agroskor.csv');
}

// --- FUNGSI PEMBANTU DOWNLOAD BROWSER ---
function downloadCSVFile(csv, filename) {
    let csvFile;
    let downloadLink;

    // Buat file CSV dalam bentuk Blob
    csvFile = new Blob([csv], {type: "text/csv"});

    // Buat link tersembunyi
    downloadLink = document.createElement("a");
    downloadLink.download = filename;
    downloadLink.href = window.URL.createObjectURL(csvFile);
    downloadLink.style.display = "none";
    document.body.appendChild(downloadLink);
    
    // Klik otomatis secara rahasia
    downloadLink.click(); 
    
    // Hapus link setelah selesai
    document.body.removeChild(downloadLink); 
}

// 1. Jalankan saat halaman pertama kali dibuka
window.addEventListener('load', handleProfilePosition);

// 2. Jalankan secara REAL-TIME setiap kali ukuran layar ditarik/diubah (resize)
window.addEventListener('resize', handleProfilePosition);

// ==========================================================
// 5. MESIN GRAFIK TREN HISTORY (SMART FILTERING)
// ==========================================================
let historyTrendChart = null;
let currentFilterRange = 'today';

function updateChartFilter(range) {
    currentFilterRange = range;
    
    // Update warna tombol aktif
    const btns = document.querySelectorAll('#history-range-tabs .filter-btn');
    if (btns.length > 0) {
        btns.forEach(btn => btn.classList.remove('active'));
        if(range === 'today') btns[0].classList.add('active');
        if(range === 'week') btns[1].classList.add('active');
        if(range === 'month') btns[2].classList.add('active');
    }

    if(!historyDataArray || historyDataArray.length === 0) return;

    const now = Date.now();
    let timeLimit = 0;
    
    if (range === 'today') timeLimit = now - (24 * 60 * 60 * 1000);
    else if (range === 'week') timeLimit = now - (7 * 24 * 60 * 60 * 1000);
    else if (range === 'month') timeLimit = now - (30 * 24 * 60 * 60 * 1000);

    // Filter dan urutkan data dari yang Terlama -> Terbaru untuk grafik (Kiri ke Kanan)
    let filteredData = historyDataArray.filter(d => {
        let ts = parseInt(d.lastUpdate);
        if(ts < 2000000000) ts *= 1000;
        return ts >= timeLimit;
    }).reverse(); 

    // DOWNSAMPLING: Agar grafik tidak error karena ribuan titik data
    let sampledData = [];
    if (filteredData.length > 60) {
        let step = Math.ceil(filteredData.length / 60);
        for(let i=0; i<filteredData.length; i+=step) sampledData.push(filteredData[i]);
        // Pastikan data paling akhir ikut masuk
        if(sampledData[sampledData.length-1] !== filteredData[filteredData.length-1]) {
            sampledData.push(filteredData[filteredData.length-1]);
        }
    } else {
        sampledData = filteredData;
    }

    renderHistoryChart(sampledData);
}

function renderHistoryChart(dataArr) {
    const ctx = document.getElementById('historyTrendChart').getContext('2d');
    
    // 1. Tambahkan penampung array untuk dpH dan dHum
    const lbls = [], dScore = [], dN = [], dP = [], dK = [], dpH = [], dHum = [];

    dataArr.forEach(d => {
        let ts = parseInt(d.lastUpdate);
        if(ts < 2000000000) ts *= 1000;
        const dt = new Date(ts);
        
        // Format Label: Jam untuk "Hari Ini", Tanggal untuk "Minggu/Bulan"
        let timeLbl = currentFilterRange === 'today' ? 
            dt.toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'}) : 
            dt.toLocaleDateString('id-ID', {day: 'numeric', month: 'short'});
        
        lbls.push(timeLbl);
        dScore.push(d.score);
        dN.push(d.nitrogen);
        dP.push(d.fosfor);
        dK.push(d.kalium);
        
        // 2. Masukkan angka dari Firebase ke dalam penampung
        // Harus angka (bukan string "6,50") agar Chart.js bisa menggambar garisnya
        dpH.push(Number(parseFloat(d.ph).toFixed(2)));
        dHum.push(Number(parseFloat(d.hum).toFixed(2)));
    });

    if (historyTrendChart) historyTrendChart.destroy(); // Bersihkan kanvas lama

    // Atur warna bawaan Chart.js untuk mode gelap
    // Tema grafik: tinta di atas kertas (selaras style.css)
    Chart.defaults.color = '#6f695c';
    Chart.defaults.borderColor = '#e0d8c8';
    Chart.defaults.font.family = "'IBM Plex Mono', ui-monospace, monospace";
    Chart.defaults.font.size = 11;

    const cfg = HISTORY_METRICS[currentHistoryMetric] || HISTORY_METRICS.score;
    const line = (color, extra) => Object.assign({
        borderColor: color, backgroundColor: color, borderWidth: 2, tension: 0.35,
        pointRadius: 0, pointHoverRadius: 4, pointHoverBorderWidth: 2, pointHoverBorderColor: '#fbf9f4'
    }, extra || {});
    const all = [
        Object.assign({ label: 'Skor kesuburan', data: dScore }, line('#2f5d28', { fill: true, backgroundColor: 'rgba(47, 93, 40, 0.08)' })),
        Object.assign({ label: 'Nitrogen (N)', data: dN }, line('#2a78d6')),
        Object.assign({ label: 'Fosfor (P)', data: dP }, line('#eb6834')),
        Object.assign({ label: 'Kalium (K)', data: dK }, line('#1baf7a')),
        Object.assign({ label: 'pH tanah', data: dpH }, line('#2f5d28')),
        Object.assign({ label: 'Kelembapan (%)', data: dHum }, line('#2f5d28'))
    ];
    all.forEach((ds, i) => { ds.hidden = !cfg.idx.includes(i); });

    historyTrendChart = new Chart(ctx, {
        type: 'line',
        data: { labels: lbls, datasets: all },
        options: {
            responsive: true, maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: {
                    display: cfg.idx.length > 1, position: 'top', align: 'start',
                    labels: { usePointStyle: true, pointStyle: 'rectRounded', boxWidth: 10, boxHeight: 10, padding: 16,
                              filter: (item, chartData) => !chartData.datasets[item.datasetIndex].hidden },
                    onClick: () => {}
                },
                tooltip: { backgroundColor: '#1d1c18', titleColor: '#f2eee4', bodyColor: '#f2eee4', padding: 10, cornerRadius: 8, boxPadding: 4, usePointStyle: true }
            },
            scales: {
                x: { grid: { display: false }, ticks: { maxTicksLimit: 8, maxRotation: 0 } },
                y: Object.assign({ border: { display: false }, grid: { color: '#ebe5d8' }, ticks: { padding: 8 } }, cfg.y)
            }
        }
    });
}

// Satu grafik = satu satuan: pilih besaran yang ditampilkan
const HISTORY_METRICS = {
    score: { idx: [0], title: 'Tren skor kesuburan', y: { min: 0, max: 100 } },
    npk:   { idx: [1, 2, 3], title: 'Tren Nitrogen, Fosfor, Kalium (mg/kg)', y: { beginAtZero: true } },
    ph:    { idx: [4], title: 'Tren pH tanah', y: { grace: '10%' } },
    hum:   { idx: [5], title: 'Tren kelembapan tanah (%)', y: { grace: '10%' } }
};
let currentHistoryMetric = 'score';

function setHistoryMetric(metric) {
    if (!HISTORY_METRICS[metric]) return;
    currentHistoryMetric = metric;
    document.querySelectorAll('#history-metric-tabs .filter-btn').forEach(btn => {
        const on = btn.dataset.metric === metric;
        btn.classList.toggle('active', on);
        btn.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    const titleEl = document.getElementById('history-chart-title');
    if (titleEl) titleEl.textContent = HISTORY_METRICS[metric].title;
    updateChartFilter(currentFilterRange);
}