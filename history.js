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
        icon.innerText = "✅"; box.className = "modal-content status-box success"; 
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
                    <td>${data.ph}</td>
                    <td>${data.nitrogen}</td>
                    <td>${data.fosfor}</td>
                    <td>${data.kalium}</td>
                    <td>${data.hum}%</td>
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
        if(confirm(`🚨 PERINGATAN KRITIS: Anda akan menghancurkan SELURUH database riwayat (${totalLogs}+ baris). Anda tidak dapat membatalkan ini.\n\nYakin untuk me-reset total?`)) {
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

// --- FUNGSI EKSEKUSI UNDUH CSV ---
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
            // Tambahkan tanda kutip agar format teks/angka yang memiliki koma tidak error di Excel
            row.push('"' + cols[j].innerText + '"'); 
        }
        csv.push(row.join(",")); // Gabungkan kolom dengan koma
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
    const btns = document.querySelectorAll('.filter-btn');
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
        dpH.push(d.ph);
        dHum.push(d.hum);
    });

    if (historyTrendChart) historyTrendChart.destroy(); // Bersihkan kanvas lama

    // Atur warna bawaan Chart.js untuk mode gelap
    Chart.defaults.color = '#cbd5e1'; 
    Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.05)';

    historyTrendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: lbls,
            datasets: [
                { label: ' 🌟 Skor', data: dScore, borderColor: '#facc15', backgroundColor: 'rgba(250, 204, 21, 0.15)', borderWidth: 3, fill: true, tension: 0.4 },
                { label: ' Nitrogen (N)', data: dN, borderColor: '#2ecc71', borderWidth: 2, tension: 0.4, borderDash: [5, 5] },
                { label: ' Fosfor (P)', data: dP, borderColor: '#e67e22', borderWidth: 2, tension: 0.4, borderDash: [5, 5] },
                { label: ' Kalium (K)', data: dK, borderColor: '#3498db', borderWidth: 2, tension: 0.4, borderDash: [5, 5] },
                { label: ' pH Tanah', data: dpH, borderColor: '#f1c40f', borderWidth: 2, tension: 0.4 },
                { label: ' Kelembapan (%)', data: dHum, borderColor: '#9b59b6', borderWidth: 2, tension: 0.4 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } } },
            scales: { x: { grid: { display: false } }, y: { beginAtZero: true } }
        }
    });
}