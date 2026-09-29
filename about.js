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
// 2. BLOK UNIVERSAL: AUTENTIKASI, MODAL, & TOAST
// ==========================================================
let isLoggedIn = false;

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

// C. Fungsi Notifikasi Modal Status (Pop-up Tengah)
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
                
                // ---- DISINI PERBAIKANNYA: MEMANGGIL KEDUANYA BERSAMAAN ----
                showStatusModal('success', 'Akses Diterima', 'Menghubungkan ke sensor...');
                showToast('success', 'Berhasil Masuk!', 'Selamat datang, data lahan siap dikelola.');

                setTimeout(() => {
                    closeLogin(); loginForm.reset(); applyAdminState(true); 
                }, 1000);
            } else {        
                // ---- MEMANGGIL KEDUANYA BERSAMAAN SAAT GAGAL ----
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
    
    // ---- PERBAIKAN: MEMANGGIL TOAST & MODAL SAAT LOGOUT ----
    showToast('success', 'Keluar Berhasil', 'Anda telah berhasil keluar dari sistem.');

    setTimeout(() => {
        closeLogoutModal(); applyAdminState(false);
    }, 1500);
}

// F. Terapkan Perubahan UI Sidebar
function applyAdminState(loginStatus) {
    isLoggedIn = loginStatus;
    const guestView = document.getElementById('guest-view');
    const adminView = document.getElementById('admin-view');
    
    if (isLoggedIn) {
        if (guestView) guestView.style.display = 'none';
        if (adminView) adminView.style.display = 'block';
    } else {
        if (guestView) guestView.style.display = 'block';
        if (adminView) adminView.style.display = 'none';
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

// 1. Jalankan saat halaman pertama kali dibuka
window.addEventListener('load', handleProfilePosition);

// 2. Jalankan secara REAL-TIME setiap kali ukuran layar ditarik/diubah (resize)
window.addEventListener('resize', handleProfilePosition);