
if (typeof feather !== 'undefined') feather.replace();

function updateTime() {
    const now = new Date();
    const clockEl = document.getElementById('clock');
    const dateEl = document.getElementById('date');
    if (clockEl) clockEl.innerText = now.toLocaleTimeString('id-ID', { hour12: false });
    if (dateEl) dateEl.innerText = now.toLocaleDateString('id-ID', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
    });
}
setInterval(updateTime, 1000); updateTime();


// ==========================================================
// BLOK UNIVERSAL: AUTENTIKASI, MODAL, & TOAST
// ==========================================================
let isLoggedIn = false;

// A. Buka/Tutup Modal
function showLogin() { document.getElementById('loginModal').style.display = 'flex'; }
function closeLogin() { document.getElementById('loginModal').style.display = 'none'; }
function handleLogout() { document.getElementById('logoutModal').style.display = 'flex'; }
function closeLogoutModal() { document.getElementById('logoutModal').style.display = 'none'; }

// Variabel penampung waktu ditaruh di LUAR fungsi agar tidak tumpang tindih
let toastTimer;

// Fungsi Notifikasi Toast (Pojok Layar)
function showToast(status, title, msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;

    // Bersihkan timer lama sebelum memunculkan toast baru
    clearTimeout(toastTimer);

    // Set teks judul dan pesan
    document.getElementById('toast-title').innerText = title;
    document.getElementById('toast-msg').innerText = msg;
    
    // Reset dan Set Warna (MENGGUNAKAN KELAS ASLI ANDA)
    toast.className = "toast-container";
    toast.classList.add(status === 'success' ? 'toast-success' : 'toast-error');
    
    // Munculkan toast ke layar
    toast.classList.add('show');

    // Set timer hitung mundur (3.5 detik)
    toastTimer = setTimeout(() => { 
        toast.classList.remove('show'); 
    }, 3500);
}

// Fungsi Notifikasi Modal Status (Pop-up Tengah)
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

// Event Listener Utama
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
                
                showStatusModal('success', 'Akses Diterima', 'Menghubungkan ke sensor...');
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

// Eksekusi Logout
function confirmLogout() {
    localStorage.setItem("adminLoggedIn", "false");

    showToast('success', 'Keluar Berhasil', 'Anda telah berhasil keluar dari sistem.');

    setTimeout(() => {
        closeLogoutModal(); applyAdminState(false);
    }, 1500);
}

// Terapkan Perubahan UI Sidebar & Panel Settings
function applyAdminState(loginStatus) {
    isLoggedIn = loginStatus;
    const guestView = document.getElementById('guest-view');
    const adminView = document.getElementById('admin-view');
    const guestWarning = document.getElementById('guest-warning');
    const setBox = document.getElementById('admin-settings-panel');
    
    if (isLoggedIn) {
        if (guestView) guestView.style.display = 'none';
        if (adminView) adminView.style.display = 'block';
        if (guestWarning) guestWarning.style.display = 'none';
        if (setBox) setBox.style.display = 'block';
    } else {
        if (guestView) guestView.style.display = 'block';
        if (adminView) adminView.style.display = 'none';
        if (guestWarning) guestWarning.style.display = 'block';
        if (setBox) setBox.style.display = 'none';
    }
}


// ==========================================================
// 3. FUNGSI KHUSUS HALAMAN SETTINGS (TIDAK ADA YANG DIRUBAH)
// ==========================================================

// --- FUNGSI BERSIHKAN CACHE / FORMAT SD CARD JARAK JAUH ---
function clearCache() {
    if(confirm("⚠️ PERINGATAN: Seluruh data log sejarah yang tersimpan di memori SD Card alat akan dihapus permanen. Lanjutkan?")) {
        database.ref('AgroskorPro/Command/clearLog').set(true)
        .then(() => {
            showToast('success', 'Memori Dibersihkan', 'Perintah format memori telah dikirim ke ESP32.');
        })
        .catch((error) => {
            showToast('error', 'Gagal', 'Sinyal gagal dikirim: ' + error.message);
        });
    }
}

// --- INISIALISASI FIREBASE UNTUK SETTINGS ---
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

// --- FUNGSI SIMPAN AMBANG BATAS (THRESHOLD) KE FIREBASE ---
function saveThresholds(e) {
    e.preventDefault(); 
    
    const nMin = parseInt(document.getElementById('thresh-n').value) || 0;
    const pMin = parseInt(document.getElementById('thresh-p').value) || 0;
    const kMin = parseInt(document.getElementById('thresh-k').value) || 0;
    
    // Tarik nilai Min dan Max saja
    const phMin = parseFloat(document.getElementById('thresh-ph').value) || 5.5;
    const phMax = parseFloat(document.getElementById('thresh-ph-max').value) || 7.0;

    // Kirim ke Firebase
    database.ref('AgroskorPro/Settings/Thresholds').update({
        n_min: nMin,
        p_min: pMin,
        k_min: kMin, 
        ph_min: phMin,
        ph_max: phMax
        // ph_tol DIHAPUS SAJA
    }).then(() => {
        showToast('success', 'Kalibrasi Disimpan', 'Ambang batas berhasil diperbarui.');
    }).catch((error) => {
        showToast('error', 'Gagal', error.message);
    });
}

// --- AMBIL DATA TERAKHIR SAAT HALAMAN SETTINGS DIBUKA ---
database.ref('AgroskorPro/Settings/Thresholds').on('value', (snapshot) => {
    if(snapshot.exists()) {
        const data = snapshot.val();
        if(document.getElementById('thresh-n')) document.getElementById('thresh-n').value = data.n_min;
        if(document.getElementById('thresh-p')) document.getElementById('thresh-p').value = data.p_min;
        if(document.getElementById('thresh-k')) document.getElementById('thresh-k').value = data.k_min; 
        if(document.getElementById('thresh-ph')) document.getElementById('thresh-ph').value = data.ph_min;

        if(document.getElementById('thresh-ph-max')) document.getElementById('thresh-ph-max').value = data.ph_max || 7.0;
        if(document.getElementById('thresh-hum-min')) document.getElementById('thresh-hum-min').value = data.hum_min || 40;
        if(document.getElementById('thresh-hum-max')) document.getElementById('thresh-hum-max').value = data.hum_max || 70;
    }
});

// --- FUNGSI REBOOT JARAK JAUH ---
function showRebootModal() { document.getElementById('rebootModal').style.display = 'flex'; }
function closeRebootModal() { document.getElementById('rebootModal').style.display = 'none'; }

// --- FUNGSI EKSEKUSI REBOOT FIREBASE ---
function confirmReboot() {
    // 1. Tutup modal terlebih dahulu
    closeRebootModal();

    // 2. Kirim perintah ke Firebase
    database.ref('AgroskorPro/Command/reboot').set(true)
    .then(() => {
        showToast('success', 'Sinyal Dikirim', 'Mengeksekusi Reboot pada ESP32...');
        
        // Memunculkan efek terputus secara visual setelah 2 detik
        setTimeout(() => {
            showToast('error', 'Koneksi Terputus', 'Alat sedang restart. Menunggu koneksi ulang...');
        }, 2000);
    })
    .catch((error) => {
        showToast('error', 'Gagal', 'Sinyal gagal dikirim: ' + error.message);
    });
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
// PENGATURAN PREFERENSI NOTIFIKASI
// ==========================================

// 1. Fungsi untuk membaca status dari Firebase secara realtime
function initNotifSync() {
    // Kita buat path baru di Firebase: AgroskorPro/Settings/Notifications
    database.ref('AgroskorPro/Settings/Notifications').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            // Update posisi toggle sesuai data di database
            if(document.getElementById('notif-kritis')) document.getElementById('notif-kritis').checked = data.kritis || false;
            if(document.getElementById('notif-wa')) document.getElementById('notif-wa').checked = data.wa || false;
            if(document.getElementById('notif-email')) document.getElementById('notif-email').checked = data.email || false;
        }
    });
}

// 2. Fungsi untuk menyimpan perubahan ke Firebase saat toggle digeser
function updateNotifSetting(key, isChecked) {
    database.ref('AgroskorPro/Settings/Notifications/' + key).set(isChecked)
    .then(() => {
        
        // 1. Tentukan nama fitur berdasarkan tombol (key) yang diklik
        let namaFitur = "";
        if (key === 'kritis') {
            namaFitur = "Peringatan Lahan Kritis";
        } else if (key === 'wa') {
            namaFitur = "Integrasi Bot WhatsApp";
        } else if (key === 'email') {
            namaFitur = "Notifikasi Email Darurat";
        }

        // 2. Munculkan Toast dengan nama fitur yang spesifik
        if (isChecked === true) {
            showToast('success', 'Diaktifkan', namaFitur + ' telah dihidupkan.');
        } else {
            showToast('error', 'Dinonaktifkan', namaFitur + ' berhasil dimatikan.'); 
        }
        
    })
    .catch((error) => {
        showToast('error', 'Gagal', 'Terjadi kesalahan: ' + error.message);
        
        // Kembalikan posisi toggle jika gagal
        setTimeout(() => { document.getElementById('notif-' + key).checked = !isChecked; }, 500);
    });
}

// Panggil fungsi sinkronisasi agar saat halaman dimuat, toggle langsung menyesuaikan
initNotifSync();

// 1. Jalankan saat halaman pertama kali dibuka
window.addEventListener('load', handleProfilePosition);

// 2. Jalankan secara REAL-TIME setiap kali ukuran layar ditarik/diubah (resize)
window.addEventListener('resize', handleProfilePosition);

