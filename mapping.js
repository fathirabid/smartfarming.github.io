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

// F. Terapkan Perubahan UI Sidebar & Panel Mapping
function applyAdminState(loginStatus) {
    isLoggedIn = loginStatus;
    const guestView = document.getElementById('guest-view');
    const adminView = document.getElementById('admin-view');
    const guestWarning = document.getElementById('guest-warning');
    const mapBox = document.getElementById('map-content-box');
    
    if (isLoggedIn) {
        if (guestView) guestView.style.display = 'none';
        if (adminView) adminView.style.display = 'block';
        if (guestWarning) guestWarning.style.display = 'none';
        
        if (mapBox) mapBox.style.display = 'block';
        if (typeof initMap === 'function') initMap(); // Panggil peta HANYA setelah login
    } else {
        if (guestView) guestView.style.display = 'block';
        if (adminView) adminView.style.display = 'none';
        if (guestWarning) guestWarning.style.display = 'block';
        
        if (mapBox) mapBox.style.display = 'none';
    }
}


// ==========================================================
// 3. FUNGSI KHUSUS HALAMAN MAPPING (LIVE TRACKING NEO M8N)
// ==========================================================

// --- KONFIGURASI FIREBASE ---
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

let map; 
let deviceMarker;
let isFirstLoad = true;

// Titik default awal sebelum GPS ESP32 terkunci
const defaultLocation = [-6.861005, 107.590509]; 

// --- INISIALISASI PETA LEAFLET ---
function initMap() {
    if (map !== undefined) return; 

    map = L.map('soilMap', { zoomControl: false }).setView(defaultLocation, 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const offlineIcon = L.divIcon({
        className: 'custom-radar-marker offline-radar',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
    });

    deviceMarker = L.marker(defaultLocation, { icon: offlineIcon }).addTo(map);
    deviceMarker.bindPopup(`
        <div class="popup-title"><i data-feather="crosshair"></i> Prototipe AGROSKOR</div>
        <div style="font-size:12px; color:#64748b;">Lokasi ini diperbarui otomatis oleh GPS Neo M8N.</div>
    `);

    // Mulai melacak Firebase setelah peta siap
    fetchLiveGpsData();
}

// --- FUNGSI PELACAKAN DARI FIREBASE DENGAN ANTI-GHOSTING PINTAR ---
// --- FUNGSI PELACAKAN DARI FIREBASE DENGAN ANTI-GHOSTING PINTAR ---
let mapWatchdogTimer; 
let lastUpdateValue = null; 

function fetchLiveGpsData() {
    const liveRadarIcon = L.divIcon({
        className: 'custom-radar-marker', iconSize: [30, 30], iconAnchor: [15, 15] 
    });
    const offlineIcon = L.divIcon({
        className: 'custom-radar-marker offline-radar', iconSize: [30, 30], iconAnchor: [15, 15]
    });

    database.ref('AgroskorPro/SensorData').on('value', (snapshot) => {
        if (!isLoggedIn || !deviceMarker) return; 

        if (snapshot.exists()) {
            const data = snapshot.val();
            
            const lat = data.lat;
            const lng = data.lng;
            const score = data.score; 
            const ph = data.ph;       
            const currentUpdate = data.lastUpdate; 

            const hudLat = document.getElementById('hud-lat');
            const hudLng = document.getElementById('hud-lng');
            const hudScore = document.getElementById('hud-score'); 
            const hudPh = document.getElementById('hud-ph');       
            const hudStatus = document.getElementById('hud-status');
            const indicator = document.getElementById('pulse-indicator');

            // 1. CEK APAKAH DATA FRESH
            let isDataFresh = false;
            if (lastUpdateValue !== null && currentUpdate !== lastUpdateValue) {
                isDataFresh = true; 
            }
            lastUpdateValue = currentUpdate;

            clearTimeout(mapWatchdogTimer);

            // 2. TAMPILKAN DATA SENSOR (TIDAK PEDULI GPS NGUNCI ATAU TIDAK)
            // Selama ESP32 ngirim data fresh, tampilkan Skor & pH!
            if (isDataFresh) {
                if(hudScore) {
                    hudScore.innerText = score + " / 100";
                    hudScore.style.color = score > 80 ? "#2ecc71" : (score > 50 ? "#f39c12" : "#e74c3c");
                }
                if(hudPh) hudPh.innerText = ph;
            }

            // 3. LOGIKA KHUSUS GPS & PETA
            if (lat !== undefined && lng !== undefined && lat !== 0 && lng !== 0) {
                const newLatLng = new L.LatLng(lat, lng);
                deviceMarker.setLatLng(newLatLng);
                
                if (isFirstLoad) {
                    map.setView(newLatLng, 18); 
                    isFirstLoad = false;
                } else if (isDataFresh) {
                    map.panTo(newLatLng); 
                }

                if(hudLat) hudLat.innerText = lat.toFixed(6);
                if(hudLng) hudLng.innerText = lng.toFixed(6);

                if (isDataFresh) {
                    deviceMarker.setIcon(liveRadarIcon); 
                    if(hudStatus) { hudStatus.innerText = "Satelit Terkunci (Live Tracking)"; hudStatus.style.color = "#2ecc71"; }
                    if(indicator) indicator.className = "pulse-indicator pulse-active";
                } else {
                    deviceMarker.setIcon(offlineIcon); 
                    if(hudStatus) { hudStatus.innerText = "Menghubungkan ke Alat..."; hudStatus.style.color = "#f39c12"; }
                    if(indicator) indicator.className = "pulse-indicator"; 
                }

            } else {
                // JIKA ALAT HIDUP TAPI SATELIT BELUM DAPAT
                deviceMarker.setIcon(offlineIcon); 
                if(hudLat) hudLat.innerText = "Mencari...";
                if(hudLng) hudLng.innerText = "Mencari...";
                if(hudStatus) { hudStatus.innerText = "Mencari Sinyal GPS..."; hudStatus.style.color = "#f39c12"; }
                if(indicator) indicator.className = "pulse-indicator"; 
                
                // Jika data belum fresh saat baru refresh, jadikan status menunggu
                if (!isDataFresh) {
                    if(hudScore) { hudScore.innerText = "MENUNGGU..."; hudScore.style.color = "#f39c12"; }
                    if(hudPh) hudPh.innerText = "--";
                }
            }

            // 4. BOM WAKTU 10 DETIK (Jika alat tiba-tiba mati / dicabut listriknya)
            mapWatchdogTimer = setTimeout(() => {
                deviceMarker.setIcon(offlineIcon); 
                if(hudStatus) { hudStatus.innerText = "Koneksi Terputus / ESP32 Mati"; hudStatus.style.color = "#e74c3c"; }
                if(indicator) indicator.className = "pulse-indicator"; 
                if(hudScore) { hudScore.innerText = "OFFLINE"; hudScore.style.color = "#e74c3c"; }
                if(hudPh) hudPh.innerText = "--";
            }, 10000); 
        }
    });
}

// ==========================================================
// MAGIC SCRIPT: TELEPORTASI PROFIL PINTAR (RESPONSIVE REAL-TIME)
// ==========================================================
function handleProfilePosition() {
    const profile = document.querySelector('.sidebar-footer');
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    
    if (!profile || !sidebar || !mainContent) return; 

    if (window.innerWidth <= 768) {
        if (profile.parentElement !== mainContent) {
            mainContent.insertBefore(profile, mainContent.firstChild);
        }
    } else {
        if (profile.parentElement !== sidebar) {
            sidebar.appendChild(profile);
        }
    }
}

window.addEventListener('load', handleProfilePosition);
window.addEventListener('resize', handleProfilePosition);