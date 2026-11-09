    
// Initialize Icons
        feather.replace();

        // Real-time Clock & Date
        function updateTime() {
            const now = new Date();
            const clockEl = document.getElementById('clock');
            const dateEl = document.getElementById('date');

            clockEl.innerText = now.toLocaleTimeString('id-ID', { hour12: false });
            dateEl.innerText = now.toLocaleDateString('id-ID', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
            });
        }
        setInterval(updateTime, 1000);
        updateTime();

        // Buka & Tutup Modal
        function showLogin() {
            document.getElementById('loginModal').style.display = 'flex';
        }
        function closeLogin() {
            document.getElementById('loginModal').style.display = 'none';
        }

        // LOGIKA LOGIN DENGAN MODAL STATUS
        function showStatusModal(type, title, message) {
        const modal = document.getElementById('statusModal');
        const icon = document.getElementById('statusIcon');
        const titleEl = document.getElementById('statusTitle');
        const msgEl = document.getElementById('statusMessage');
        const box = modal.querySelector('.status-box');

        // Atur Tema
        if(type === 'success') {
            icon.innerText = "✅";
            box.className = "modal-content status-box success-theme";
        } else {
            icon.innerText = "❌";
            box.className = "modal-content status-box error-theme";
        }

        titleEl.innerText = title;
        msgEl.innerText = message;
        
        // Tampilkan Modal & Jalankan Loader
        modal.style.display = 'flex';
        modal.classList.add('show-loader');

        // Tutup otomatis setelah 2 detik
        setTimeout(() => {
            modal.style.display = 'none';
            modal.classList.remove('show-loader');
        }, 2000);
    }

    // Fungsi Verifikasi Login (Update dari kode sebelumnya)
        document.getElementById('loginForm').addEventListener('submit', function(e) {
            e.preventDefault();
            const user = document.getElementById('loginUser').value;
            const pass = document.getElementById('loginPass').value;

            if(user === "admin" && pass === "pkm2026") {
                isLoggedIn = true; 

                // TAMBAHKAN BARIS INI UNTUK MENYIMPAN SESI KE BROWSER 
                 localStorage.setItem("adminLoggedIn", "true");

                showStatusModal('success', 'Akses Diterima', 'Menghubungkan ke sensor...');
                showToast('success', 'Berhasil Masuk!', 'Selamat datang, data lahan siap dikelola.');
                
                setTimeout(() => {
                    document.getElementById('guest-view').style.display = 'none';
                    document.getElementById('admin-view').style.display = 'block';
                    closeLogin();
                    
                    // MULAI SCAN SENSOR SETELAH LOGIN
                    startSensorMonitoring(); 
                }, 1000);
            } else {        
                // --- UBAH BAGIAN INI JUGA ---
                showStatusModal('error', 'Akses Ditolak', 'Username atau password salah.');
                showToast('error', 'Gagal masuk!', 'Username atau password salah.');
            }
        });

        // LOGIKA LOGOUT DENGAN KONFIRMASI
        function handleLogout() {
            if(confirm("Apakah Anda ingin keluar sistem?")) {
                document.getElementById('guest-view').style.display = 'block';
                document.getElementById('admin-view').style.display = 'none';
            }
        }

        document.getElementById('togglePassword').addEventListener('click', function() {
        const passwordInput = document.getElementById('loginPass');
        const eyeIcon = this.querySelector('i');

        // Cek tipe input saat ini
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            // Ganti ikon ke mata terbuka/tertutup (tergantung versi Feather)
            this.innerHTML = feather.icons['eye-off'].toSvg();
        } else {
            passwordInput.type = 'password';
            this.innerHTML = feather.icons['eye'].toSvg();
        }
        
        // Render ulang ikon feather setelah diganti via JS
        feather.replace();
        });

        // Fungsi untuk menampilkan Toast
        function showToast(status, title, msg) {
            const toast = document.getElementById('toast');
            const toastTitle = document.getElementById('toast-title');
            const toastMsg = document.getElementById('toast-msg');
            
            // Reset class
            toast.className = "toast-container";
            toast.classList.add(status === 'success' ? 'toast-success' : 'toast-error');
            
            toastTitle.innerText = title;
            toastMsg.innerText = msg;
            
            // Tampilkan
            toast.classList.add('show');
            
            // Hilangkan setelah 3 detik
            setTimeout(() => {
                toast.classList.remove('show');
            }, 3000);
        }

        // --- FUNGSI MODAL LOGOUT ---

        // Munculkan Modal Logout
        function handleLogout() {
            document.getElementById('logoutModal').style.display = 'flex';
        }

        // Tutup Modal Logout
        function closeLogoutModal() {
            document.getElementById('logoutModal').style.display = 'none';
        }

        // Eksekusi Keluar
        function confirmLogout() {
            // 1. Tampilkan Toast Berhasil Keluar
            showToast('success', 'Logout Berhasil', 'Sesi admin telah diakhiri.');

            // 2. Beri jeda sedikit agar animasi toast terlihat
            setTimeout(() => {
                // Balikkan UI ke Guest View
                document.getElementById('guest-view').style.display = 'block';
                document.getElementById('admin-view').style.display = 'none';
                
                // Tutup Modal
                closeLogoutModal();
            }, 800);
        }

        // Grafik Multi Sensor
        const ctx = document.getElementById('multiSensorChart').getContext('2d');

        // Data awal (Kosong)
        let labels = [];
        let datasetValues = {
            n: [], p: [], k: [], ph: [], temp: [], hum: [], ec: [], salt: []
        };

        let historyLogData = JSON.parse(sessionStorage.getItem("liveCsvBackup")) || [];

        // Tema grafik: tinta di atas kertas (selaras style.css)
        Chart.defaults.color = '#6f695c';
        Chart.defaults.borderColor = '#e0d8c8';
        Chart.defaults.font.family = "'IBM Plex Mono', ui-monospace, monospace";
        Chart.defaults.font.size = 11;

        // Satu grafik = satu satuan. Seri NPK memakai palet yang lolos uji buta warna;
        // besaran tunggal memakai warna brand.
        const SERIES_NPK = ['#2a78d6', '#eb6834', '#1baf7a'];
        const SERIES_SINGLE = '#2f5d28';
        const lineStyle = (color, hidden) => ({
            borderColor: color, backgroundColor: color, tension: 0.3, borderWidth: 2,
            pointRadius: 0, pointHoverRadius: 4, pointHoverBorderWidth: 2, pointHoverBorderColor: '#fbf9f4', hidden: hidden
        });

        const multiChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    { label: 'Nitrogen (N)', data: datasetValues.n, ...lineStyle(SERIES_NPK[0], false) },
                    { label: 'Fosfor (P)', data: datasetValues.p, ...lineStyle(SERIES_NPK[1], false) },
                    { label: 'Kalium (K)', data: datasetValues.k, ...lineStyle(SERIES_NPK[2], false) },
                    { label: 'pH Tanah', data: datasetValues.ph, ...lineStyle(SERIES_SINGLE, true) },
                    { label: 'Suhu (°C)', data: datasetValues.temp, ...lineStyle(SERIES_SINGLE, true) },
                    { label: 'Kelembapan (%)', data: datasetValues.hum, ...lineStyle(SERIES_SINGLE, true) },
                    { label: 'EC (µS/cm)', data: datasetValues.ec, ...lineStyle(SERIES_SINGLE, true) },
                    { label: 'Salinitas (mg/L)', data: datasetValues.salt, ...lineStyle(SERIES_SINGLE, true) }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                
                animation: {
                    x: {
                        duration: 1000,     // Samakan persis dengan delay ESP32 (500ms)
                        easing: 'linear'   // Membuat pergeseran ke kiri stabil tanpa rem
                    },
                    y: { 
                        duration: 0        // Tetap matikan animasi vertikal agar tidak nyungsep
                    }
                },

                interaction: { mode: 'index', intersect: false },
                scales: {
                    y: {
                        beginAtZero: false,
                        grace: '5%',
                        border: { display: false },
                        grid: { color: '#ebe5d8' },
                        ticks: { padding: 8 }
                    },
                    x: { grid: { display: false }, ticks: { maxTicksLimit: 8, maxRotation: 0 } }
                },
                plugins: {
                    legend: {
                        position: 'top',
                        align: 'start',
                        labels: {
                            boxWidth: 10, boxHeight: 10, padding: 16, usePointStyle: true, pointStyle: 'rectRounded',
                            filter: (item, chartData) => !chartData.datasets[item.datasetIndex].hidden
                        },
                        onClick: () => {}
                    },
                    tooltip: {
                        backgroundColor: '#1d1c18', titleColor: '#f2eee4', bodyColor: '#f2eee4',
                        padding: 10, cornerRadius: 8, boxPadding: 4, usePointStyle: true
                    }
                }
            }
        });

        // Tab grafik: tampilkan satu besaran (satu satuan) sekaligus
        const LIVE_CHART_GROUPS = {
            npk:  { idx: [0, 1, 2], title: 'Nitrogen, Fosfor, Kalium (mg/kg)' },
            ph:   { idx: [3], title: 'pH tanah' },
            temp: { idx: [4], title: 'Suhu tanah (°C)' },
            hum:  { idx: [5], title: 'Kelembapan tanah (%)' },
            ec:   { idx: [6], title: 'Daya hantar listrik (µS/cm)' },
            salt: { idx: [7], title: 'Salinitas (mg/L)' }
        };
        function setLiveChartGroup(group) {
            const cfg = LIVE_CHART_GROUPS[group];
            if (!cfg) return;
            multiChart.data.datasets.forEach((ds, i) => { ds.hidden = !cfg.idx.includes(i); });
            multiChart.options.plugins.legend.display = cfg.idx.length > 1;
            multiChart.update('none');
            document.querySelectorAll('#live-chart-tabs .filter-btn').forEach(btn => {
                const on = btn.dataset.group === group;
                btn.classList.toggle('active', on);
                btn.setAttribute('aria-selected', on ? 'true' : 'false');
            });
            const titleEl = document.getElementById('live-chart-title');
            if (titleEl) titleEl.textContent = cfg.title;
        }
        setLiveChartGroup('npk');

        // --- Helper tampilan status (warna diatur oleh style.css lewat atribut data-*) ---
        const DASH = '—';
        function setConnectionState(state, text) {
            const wrap = document.getElementById('connection-status');
            const textEl = document.getElementById('connection-text');
            const dotEl = document.getElementById('connection-dot');
            if (wrap) wrap.dataset.state = state;
            if (textEl) { textEl.innerText = text; textEl.style.color = ''; }
            if (dotEl) dotEl.className = state === 'online' ? 'dot pulse' : (state === 'offline' ? 'dot offline pulse-offline' : 'dot');
        }
        function setHeroState(state, score) {
            const hero = document.querySelector('.hero-score');
            if (!hero) return;
            hero.dataset.state = state;
            hero.style.background = '';
            hero.style.setProperty('--score', Math.max(0, Math.min(100, Number(score) || 0)));
        }
        function setPhState(phValue, status) {
            const card = document.querySelector('.ph-card');
            const label = document.getElementById('ph-status-label');
            if (label) {
                label.dataset.status = status ? String(status).toLowerCase() : '';
                label.style.background = ''; label.style.color = '';
            }
            if (!card) return;
            if (phValue === null) { card.dataset.live = 'false'; return; }
            card.dataset.live = 'true';
            // Skala visual pH 3–10
            const pos = ((parseFloat(phValue) - 3) / 7) * 100;
            card.style.setProperty('--ph', Math.max(0, Math.min(100, pos)));
        }

        // FUNGSI EKSPOR CSV 
        function downloadCSV() {
            // 1. Cek jika data kosong
            if (historyLogData.length === 0) {
                showToast('error', 'Gagal', 'Belum ada data yang direkam alat.');
                return;
            }

            // 2. Siapkan Header CSV (Gunakan Titik Koma untuk Excel Indonesia)
            let csvContent = "data:text/csv;charset=utf-8,";
            // Bungkus header dengan tanda kutip agar seragam
            csvContent += '"Waktu";"Nitrogen(N)";"Fosfor(P)";"Kalium(K)";"pH";"Suhu";"Kelembapan";"EC";"Salinitas"\n';

            // 3. Gabungkan seluruh data dari array historyLogData (Tanpa batas 60)
            historyLogData.forEach((rowObj) => {
                // Siapkan data mentah
                let rawRow = [
                    rowObj.waktu,
                    rowObj.n,
                    rowObj.p,
                    rowObj.k,
                    parseFloat(rowObj.ph).toFixed(2).replace('.', ','), 
                    parseFloat(rowObj.temp).toFixed(2).replace('.', ','), 
                    parseFloat(rowObj.hum).toFixed(2).replace('.', ','),
                    rowObj.ec,
                    rowObj.salt
                ];
                
                // BUNGKUS DENGAN KUTIP GANDA ("...") SEPERTI DI HISTORY.JS
                let row = rawRow.map(item => '"' + item + '"').join(";"); 
                
                csvContent += row + "\n";
            });

            // 4. Proses Download
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            
            // Nama file dengan format tanggal dan jam agar tidak tertukar
            let now = new Date();
            let timeStr = now.getHours() + "-" + now.getMinutes();
            const fileName = `Log_Geolistrik_${now.toLocaleDateString().replace(/\//g, '-')}_Jam_${timeStr}.csv`;
            
            link.setAttribute("download", fileName);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Notifikasi sukses beserta jumlah baris yang berhasil ditarik
            showToast('success', 'Berhasil!', `Laporan CSV (${historyLogData.length} baris) telah diunduh.`);
        }

    // Status Login (Default: false)
    let isLoggedIn = false;
    let dataInterval; // Untuk menampung interval pengecekan sensor

    // Hubungkan web ke esp32 melalui Firebase Realtime Database
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

    firebase.initializeApp(firebaseConfig);
    const database = firebase.database();

    // Variabel untuk melacak kapan data terakhir masuk
    let lastDataTime = 0; 
    let connectionInterval; 
    let wasOnline = true; 

    // --- AMBANG BATAS: SAMA PERSIS DENGAN SISTEM PAKAR DI ALAT (agroskor_ai.h) ---
    // Sumber dan catatan asumsi ada di agroskor-rules.js. Batas tidak lagi diambil
    // dari halaman Pengaturan, karena alat memakai batas di firmware.
    const BATAS_ALAT = AGROSKOR_RULES.BATAS;
    let batasNitrogen = BATAS_ALAT.N;
    let batasFosfor   = BATAS_ALAT.P;
    let batasKalium   = BATAS_ALAT.K;
    let batasPH       = BATAS_ALAT.PH_MIN;
    let batasPhMax    = BATAS_ALAT.PH_MAX;
    let batasHumMin   = BATAS_ALAT.KEL_MIN;
    let batasHumMax   = BATAS_ALAT.KEL_MAX;

    // --- DATA SENSOR TERKINI (dipakai fitur komoditas) ---
    let currentSensorData = { ada: false, n: 0, p: 0, k: 0, ph: 0, hum: 0, ec: 0, tahap: null };

    // --- DOSIS PER POT (Juknis BPTP Jakarta 2018) DIKALI JUMLAH POT ---
    function jumlahPotTersimpan() {
        const v = parseInt(localStorage.getItem("jumlahPotTersimpan"));
        return v > 0 ? v : 1;
    }
    function formatGram(g) {
        return g >= 1000 ? `${(g / 1000).toFixed(g % 1000 === 0 ? 0 : 2).replace('.', ',')} kg` : `${Math.round(g)} g`;
    }
    function dosisTotal(gramPerPot) {
        const n = jumlahPotTersimpan();
        return n === 1 ? `${formatGram(gramPerPot)} per pot` : `${formatGram(gramPerPot)} per pot, total ${formatGram(gramPerPot * n)} untuk ${n} pot`;
    }

    // --- CROP LIBRARY: hanya komoditas yang sudah ada rujukannya ---
    const plantDatabase = {
        bawang: { nama: "Bawang Merah", phMin: BATAS_ALAT.PH_MIN, phMax: BATAS_ALAT.PH_MAX, humMin: BATAS_ALAT.KEL_MIN, humMax: BATAS_ALAT.KEL_MAX }
    };

    // Ubah daftar aturan yang terpenuhi menjadi langkah tindakan beserta dosis
    function langkahTindakan(aturan) {
        const out = [];
        aturan.forEach(a => {
            if (a.kode === "R1") out.push({ grup: "Pembenah tanah (koreksi pH)", teks: "Dolomit", dosis: dosisTotal(AGROSKOR_RULES.DOSIS.DOLOMIT), alasan: a.alasan, kode: a.kode });
            else if (a.kode === "R2") out.push({ grup: "Pembenah tanah (koreksi pH)", teks: "Jangan tambah kapur atau dolomit", dosis: "", alasan: a.alasan, kode: a.kode });
            else if (a.kode === "R3") out.push({ grup: "Pupuk", teks: "Tunda pemupukan", dosis: "", alasan: a.alasan, kode: a.kode });
            else if (a.kode === "R4") {
                out.push({ grup: "Pupuk", teks: "SP-36 saat tanam", dosis: dosisTotal(AGROSKOR_RULES.DOSIS.SP36), alasan: a.alasan, kode: a.kode });
                out.push({ grup: "Pupuk", teks: "NPK umur 14 hari dan 1 bulan", dosis: dosisTotal(AGROSKOR_RULES.DOSIS.NPK) + " tiap aplikasi", alasan: a.alasan, kode: a.kode });
            }
            else if (a.kode === "R5") out.push({ grup: "Manajemen air", teks: "Siram dulu, lalu ukur ulang", dosis: "", alasan: a.alasan, kode: a.kode });
            else if (a.kode === "R6") out.push({ grup: "Manajemen air", teks: "Tunda penyiraman", dosis: "", alasan: a.alasan, kode: a.kode });
        });
        return out;
    }

    function htmlLangkah(langkah) {
        const grup = {};
        langkah.forEach(l => { (grup[l.grup] = grup[l.grup] || []).push(l); });
        return Object.keys(grup).map(g => `<div class="recom-group"><span class="recom-group-title">${g}</span><ul class="dose-list">${
            grup[g].map(l => `<li class="dose-v3"><span class="dose-name">${l.teks}</span>${l.dosis ? `<b class="dose-amount">${l.dosis}</b>` : ''}<small class="rule-why">${l.kode}: ${l.alasan}</small></li>`).join("")
        }</ul></div>`).join("");
    }

    function kelasTag(kode) {
        return kode === "R4" ? "good" : (kode === "R2" ? "warn" : "crit");
    }

    // FUNGSI ANALISIS SPESIFIK KOMODITAS - PREMIUM RENDERING 
    function analyzeSpecificPlant() {
        //const selected = document.getElementById('target-plant').value;
        const selected = selectedPlantId;
        const resultBox = document.getElementById('plant-specific-result');
        if(!resultBox) return;

        // JIKA GUEST VIEW ATAU SENSOR BELUM AKTIF
        if (!isLoggedIn || !currentSensorData.ada) {
            resultBox.className = 'cae-result cae-empty-stateGuest';
            resultBox.innerHTML = isLoggedIn ? `
                <i data-feather="download"></i>
                <span>Tancapkan probe ke tanah. Hasil pencocokan muncul setelah alat mengirim bacaan.</span>
            ` : `
                <i data-feather="lock"></i>
                <span>Fitur Analisis Pakar hanya tersedia untuk Admin. Silakan Login.</span>
            `;
            feather.replace();
            return;
        }

        // JIKA PILIH "UMUM" (DEFAULT)
        if (selected === "umum") {
            resultBox.className = 'cae-result cae-empty-state';
            resultBox.innerHTML = `
                <i data-feather="info"></i>
                <span>Pilih komoditas di atas untuk melihat kecocokan tanah secara real-time.</span>
            `;
            feather.replace();
            return;
        }

        const plant = plantDatabase[selected];
        if (!plant) return;
        const land = currentSensorData;
        const inf = AGROSKOR_RULES.inferensi({ ph: land.ph, ec: land.ec, kel: land.hum });

        const issuesFound = inf.aturan.filter(a => a.kode !== "R4").map(a => `${a.kesimpulan} (${a.alasan})`);
        const lacksCount = issuesFound.length;
        const actionInstructions = langkahTindakan(inf.aturan)
            .map(l => `${l.teks}${l.dosis ? `: ${l.dosis}` : ''} <small class="rule-why">${l.kode}: ${l.alasan}</small>`);
        const catatanSementara = land.tahap === 1 ? '<div class="cae-r-desc"><em>Bacaan alat masih menstabilkan, jadi hasil ini sementara.</em></div>' : '';

        // KASUS SUKSES: Tanah 100% Cocok
        if (lacksCount === 0) {
            resultBox.className = 'cae-result cae-success-state';
            resultBox.innerHTML = `
                <div class="cae-r-title"><i data-feather="check-circle"></i> Lahan siap tanam</div>
                <div class="cae-r-desc">pH ${land.ph.toFixed(2)} masuk rentang ideal <strong>${plant.nama}</strong> (${plant.phMin.toFixed(1)} sampai ${plant.phMax.toFixed(1)}) dan tidak ada masalah kelembapan atau garam. Pupuk mengikuti jadwal Juknis.</div>
                <div class="cae-expert-plan"><ul class="cae-plan-steps">${actionInstructions.map(step => `<li>${step}</li>`).join("")}</ul></div>
                ${catatanSementara}
            `;
        } 

        // KASUS PERINGATAN: Tanah Perlu Tindakan
        else {
            resultBox.className = 'cae-result cae-warning-state';
            resultBox.innerHTML = `
                <div class="cae-r-title"><i data-feather="alert-triangle"></i> Tanah belum siap untuk ${plant.nama}</div>
                
                <div class="cae-issues-found">
                    <div class="cae-issues-title">Hasil sistem pakar</div>
                    <div class="cae-issues-list">
                        ${issuesFound.map(item => `<div class="cae-issue-item"><i data-feather="x"></i> ${item}</div>`).join("")}
                    </div>
                </div>

                <div class="cae-expert-plan">
                    <div class="cae-plan-title"><i data-feather="tool"></i> Langkah perbaikan, urut prioritas</div>
                    <ul class="cae-plan-steps">
                        ${actionInstructions.map(step => `<li>${step}</li>`).join("")}
                    </ul>
                </div>
                ${catatanSementara}
            `;
        }
        
        feather.replace(); 
    }

    // ==========================================
    // KONTROL MODAL FITUR PAKAR (KOMODITAS)
    // ==========================================
    let selectedPlantId = "umum"; // Nilai default

    function showPlantModal() {
        document.getElementById('plantModal').style.display = 'flex';
    }

    function closePlantModal() {
        document.getElementById('plantModal').style.display = 'none';
    }

    function selectPlant(id, name) {
    selectedPlantId = id;
    
    // Ubah teks di tombol utama
    document.getElementById('selected-plant-text').innerText = name;
    
    // Tutup modal
    closePlantModal();
    
    // --- SENTUHAN TOAST SPESIFIK ---
    if (id === 'umum') {
        // Jika kembali ke umum
        showToast('success', 'Mode Umum Aktif', 'Sistem kembali memantau kesuburan lahan secara general.');
    } else {
        // Jika memilih tanaman tertentu
        showToast('success', 'Komoditas Dipilih', `Memulai kalkulasi pakar untuk target ${name}...`);
    }
    
    // Panggil ulang fungsi render AI secara instan
    if (typeof analyzeSpecificPlant === 'function') analyzeSpecificPlant();
    }

    // Fungsi untuk mulai memindai data (Simulasi Firebase)
    function startSensorMonitoring() {
        if (!isLoggedIn) return;

        // Tampilkan status "menghubungkan" sambil menunggu data pertama
        setConnectionState('idle', 'Menghubungkan...');
        const waitDesc = document.getElementById('web-status-desc');
        if (waitDesc) waitDesc.textContent = "Menunggu data pertama dari alat AGROSKOR di lahan...";

        // --- MASA TENGGANG AWAL ---
        const WAKTU_MULAI_PANTAU = Date.now();
        let statusAwalDiumumkan = false; 

        // WATCHDOG TIMER (Monitor apakah data terus mengalir)
        connectionInterval = setInterval(() => {
            const sekarang = Date.now();
            // Jika tidak ada data masuk selama 10 detik, paksa Offline
            if (sekarang - WAKTU_MULAI_PANTAU > 5000 && sekarang - lastDataTime > 10000) {
                if (wasOnline || !statusAwalDiumumkan) {
                    resetDataToZero();
                    showToast('error', 'Koneksi Terputus!', 'Sensor tidak terdeteksi.');
                    wasOnline = false;
                    statusAwalDiumumkan = true;
                }
            }
        }, 1000);

        // 2. MENDENGARKAN DATA DARI FIREBASE
        database.ref('AgroskorPro/SensorData').on('value', (snapshot) => {
            const data = snapshot.val();
            if(data && isLoggedIn) {

                // --- 1. PERBAIKAN GERBANG WAKTU (ANTI JAM MINUS) ---
                let waktuData = 0;
                if (data.lastUpdate) {
                    waktuData = parseInt(data.lastUpdate);
                    if (waktuData > 0 && waktuData < 2000000000) waktuData = waktuData * 1000; 
                }

                const waktuSekarang = Date.now();
                // KUNCI: Gunakan Math.abs() agar selisih waktu tidak pernah minus!
                const selisihWaktu = Math.abs(waktuSekarang - waktuData);

                // JIKA DATA LEBIH TUA DARI 15 DETIK
                if (selisihWaktu > 15000 || isNaN(waktuData) || waktuData === 0) {
                    return; // BLOKIR DATA HANTU SECARA SILENT! Layar tetap abu-abu "Menunggu..."
                }
                
                lastDataTime = Date.now(); 
                statusAwalDiumumkan = true;

                if (!wasOnline) {
                    showToast('success', 'ESP32 Terhubung!', 'Menerima transmisi data...');
                    wasOnline = true;
                }

                // Indikator koneksi pojok kanan atas
                setConnectionState('online', 'ESP32 online');

                // Tahap bacaan dari alat: 0 probe kosong, 1 menstabilkan, 2 siap.
                // Firmware lama tidak mengirim "tahap", jadi dianggap siap.
                const tahap = (data.tahap === undefined || data.tahap === null) ? 2 : Number(data.tahap);
                const kat = AGROSKOR_RULES.kategoriSkor(Number(data.score));

                // Warna & penanda skala skor (diatur style.css lewat data-state)
                if (tahap === 0) setHeroState('offline', 0);
                else setHeroState(kat.state, data.score);

                // Update Angka pH (label menurut kriteria Balai Penelitian Tanah 2009)
                const phVal = document.getElementById('val-ph');
                const phLabel = document.getElementById('ph-status-label');
                const phNum = parseFloat(data.ph);
                phVal.innerText = phNum.toFixed(2);
                phLabel.innerText = tahap === 0 ? "Probe kosong" : AGROSKOR_RULES.labelPh(phNum);
                setPhState(phNum, tahap === 0 ? '' : AGROSKOR_RULES.statusPhBawang(phNum));

                document.getElementById('web-score-val').textContent = tahap === 0 ? DASH : data.score;
                document.getElementById('web-score-label').textContent = tahap === 0 ? "Tancapkan probe"
                    : (tahap === 1 ? "Hasil sementara" : (kat.kode === 2 ? "Sangat baik" : (kat.kode === 1 ? "Cukup" : "Kurang")));
                document.getElementById('web-status-title').innerText = data.status;
                document.getElementById('web-status-desc').innerText = data.desc;

                document.getElementById('val-n').innerText = data.nitrogen;
                document.getElementById('val-p').innerText = data.fosfor;
                document.getElementById('val-k').innerText = data.kalium;
                document.getElementById('val-temp').innerText = parseFloat(data.temp).toFixed(2);
                document.getElementById('val-hum').innerText = parseFloat(data.hum).toFixed(2);
                document.getElementById('val-ec').innerText = data.ec;  
                document.getElementById('val-salt').innerText = data.salinitas; 
                
                // Update Koordinat GPS
                const latEl = document.getElementById('val-lat');
                const lngEl = document.getElementById('val-lng');
                if (latEl) latEl.innerText = (data.lat !== undefined && data.lat !== 0) ? data.lat.toFixed(6) : "mencari sinyal";
                if (lngEl) lngEl.innerText = (data.lng !== undefined && data.lng !== 0) ? data.lng.toFixed(6) : "mencari sinyal";

                // --- UPDATE VARIABEL GLOBAL UNTUK FITUR KOMODITAS BARU ---
                currentSensorData.ada = tahap !== 0;
                currentSensorData.n = Number(data.nitrogen);
                currentSensorData.p = Number(data.fosfor);
                currentSensorData.k = Number(data.kalium);
                currentSensorData.ph = phNum;
                currentSensorData.hum = Number(data.hum);
                currentSensorData.ec = Number(data.ec);
                currentSensorData.tahap = tahap;
                
                // Perbarui analisis komoditas setiap data baru masuk (jika tanaman sudah dipilih)
                if (selectedPlantId !== 'umum') analyzeSpecificPlant();

                // --- KALKULASI STATUS NPK (RENDAH / NORMAL / TINGGI) ---
                const maksNitrogen = batasNitrogen + 100; 
                const maksFosfor = batasFosfor + 50;
                const maksKalium = batasKalium + 100;

                let statusN = data.nitrogen < batasNitrogen ? "RENDAH" : (data.nitrogen > maksNitrogen ? "TINGGI" : "NORMAL");
                let statusP = data.fosfor < batasFosfor ? "RENDAH" : (data.fosfor > maksFosfor ? "TINGGI" : "NORMAL");
                let statusK = data.kalium < batasKalium ? "RENDAH" : (data.kalium > maksKalium ? "TINGGI" : "NORMAL");

                updateNutrientLabel('n-status-label', statusN);
                updateNutrientLabel('p-status-label', statusP);
                updateNutrientLabel('k-status-label', statusK);

                const nFill = document.querySelector('.n-fill');
                const pFill = document.querySelector('.p-fill');
                const kFill = document.querySelector('.k-fill');

                if(nFill) nFill.style.width = Math.min((data.nitrogen / 200) * 100, 100) + "%";
                if(pFill) pFill.style.width = Math.min((data.fosfor / 100) * 100, 100) + "%";
                if(kFill) kFill.style.width = Math.min((data.kalium / 250) * 100, 100) + "%";

                // --- GRAFIK MULTI SENSOR ---
                const timeLabel = new Date().toLocaleTimeString('id-ID', {hour12: false});
                if (labels.length > 60) { labels.shift(); Object.values(datasetValues).forEach(arr => arr.shift()); }
                labels.push(timeLabel);
                const chartEmpty = document.getElementById('live-chart-empty');
                if (chartEmpty) chartEmpty.hidden = true;
                datasetValues.n.push(data.nitrogen); datasetValues.p.push(data.fosfor); datasetValues.k.push(data.kalium);
                datasetValues.ph.push(data.ph); datasetValues.temp.push(data.temp); datasetValues.hum.push(data.hum); datasetValues.ec.push(data.ec); datasetValues.salt.push(data.salinitas);
                multiChart.update();

                // SIMPAN KE LOG TANPA BATAS UNTUK EKSPOR CSV GEOLISTRIK
                historyLogData.push({
                    waktu: timeLabel,
                    n: data.nitrogen,
                    p: data.fosfor,
                    k: data.kalium,
                    ph: data.ph,
                    temp: data.temp,
                    hum: data.hum,
                    ec: data.ec,
                    salt: data.salinitas
                });

                sessionStorage.setItem("liveCsvBackup", JSON.stringify(historyLogData));

                renderSistemPakar(data, tahap);

                feather.replace();
            }
        });
    }

    // ==========================================================
    // TAMPILKAN HASIL SISTEM PAKAR (sama dengan aturan di alat)
    // ==========================================================
    function renderSistemPakar(data, tahap) {
        const analysisList = document.getElementById('ai-analysis-list');
        const recomText = document.getElementById('ai-recom-text');
        if (!analysisList || !recomText) return;
        analysisList.className = 'ai-list';

        if (tahap === 0) {
            analysisList.innerHTML = `<li><div class="ai-icon-wrap" style="background: var(--warn-soft); color: var(--warn);"><i data-feather="download"></i></div><div class="ai-text"><strong>Probe belum masuk tanah</strong><br> Tancapkan probe, lalu tunggu sampai bacaan siap.</div></li>`;
            recomText.innerHTML = '<div class="recom-content is-offline"><span class="recom-title">Belum ada bacaan tanah</span><div class="recom-value">Saran muncul setelah probe ditancapkan dan bacaan siap.</div></div>';
            return;
        }

        const b = AGROSKOR_RULES.dariFirebase(data);
        const inf = AGROSKOR_RULES.inferensi(b);
        const cocok = AGROSKOR_RULES.komoditasSesuai(b.ph);
        const tagSementara = tahap === 1 ? ' <span class="ai-tag warn">sementara</span>' : '';

        const teksKomoditas = cocok.length
            ? `pH sesuai untuk: ${cocok.map(c => `<span class="ai-tag good">${c.nama}</span>`).join("")}`
            : `<span class="ai-tag crit">Belum sesuai</span> pH ${b.ph.toFixed(2)} di luar rentang komoditas di crop library.`;
        const teksDiagnosa = inf.aturan.map(a => `<span class="ai-tag ${kelasTag(a.kode)}">${a.kesimpulan} (${a.alasan})</span>`).join("");

        analysisList.innerHTML = `
            <li><div class="ai-icon-wrap" style="background: var(--good-soft); color: var(--good);"><i data-feather="target"></i></div><div class="ai-text"><strong>Kesesuaian komoditas</strong>${tagSementara}<br> ${teksKomoditas}</div></li>
            <li><div class="ai-icon-wrap" style="background: var(--info-soft); color: var(--info);"><i data-feather="cpu"></i></div><div class="ai-text"><strong>Diagnosa sistem pakar</strong>${tagSementara}<br> ${teksDiagnosa}</div></li>
        `;

        if (tahap === 1) {
            recomText.innerHTML = `
                <div class="recom-content is-warn">
                    <span class="recom-title"><i data-feather="clock"></i> Menunggu bacaan siap</span>
                    <div class="recom-value">Bacaan sensor masih berubah. Decision tree di alat akan menandai kapan bacaan siap, lalu saran akhir muncul di sini.</div>
                </div>`;
            return;
        }

        const langkah = langkahTindakan(inf.aturan);
        const adaMasalah = inf.aturan.some(a => a.kode !== "R4");
        recomText.innerHTML = `
            <div class="recom-content ${adaMasalah ? '' : 'is-good'}">
                <span class="recom-title"><i data-feather="${adaMasalah ? 'zap' : 'shield'}"></i> ${adaMasalah ? 'Tindakan korektif' : 'Lahan siap tanam'}</span>
                <div class="recom-value">${htmlLangkah(langkah)}</div>
                <div class="recom-source">Dosis per pot dari Juknis BPTP Jakarta (2018). Batas EC dan kelembapan masih asumsi tim.</div>
            </div>
        `;
    }

    // Fungsi untuk memperbarui label status nutrisi dengan warna yang sesuai
    function updateNutrientLabel(elementId, statusText) {
        const el = document.getElementById(elementId);
        if(!el) return;

        el.innerText = statusText;
        el.style.color = '';
        // Warna 3 arah (normal / tinggi / rendah) diatur style.css lewat data-status
        el.dataset.status = String(statusText).toLowerCase();
    }

    // Fungsi Logout (Matikan Scan)
    function confirmLogout() {
        isLoggedIn = false;
        if (typeof connectionInterval !== 'undefined') {
        clearInterval(dataInterval); // HENTIKAN SCAN SENSOR
        clearInterval(connectionInterval); // HENTIKAN WATCHDOG TIMER 
        }
    
        localStorage.removeItem("adminLoggedIn");

        // Reset Angka Sensor & Skor ("—" = belum ada data, bukan nol)
        const idsToReset = ['val-n', 'val-p', 'val-k', 'val-ph', 'val-temp', 'val-hum', 'val-ec', 'val-salt', 'web-score-val'];
        idsToReset.forEach(id => {
            const el = document.getElementById(id);
            if(el) el.textContent = DASH;
        });

        // Reset Label Status NPK & Skor (kembali netral)
        const labelsToReset = ['n-status-label', 'p-status-label', 'k-status-label', 'web-score-label'];
        labelsToReset.forEach(id => {
            const el = document.getElementById(id);
            if(el) {
                el.textContent = "Memuat...";
                el.style.color = '';
                delete el.dataset.status;
            }
        });

        // Reset Label pH
        const phLabel = document.getElementById('ph-status-label');
        if(phLabel) phLabel.textContent = "Memantau...";
        setPhState(null, '');

        // Kotak skor kembali ke kondisi netral
        setHeroState('offline', 0);

        // Reset Judul Status Utama
        const titleEl = document.getElementById('web-status-title');
        if(titleEl) titleEl.textContent = "Menganalisis data lahan...";
        const descEl = document.getElementById('web-status-desc');
        if(descEl) descEl.textContent = "Menunggu data dari sensor";

        // Reset Progress Bar NPK ke 0%
        const nFill = document.querySelector('.n-fill'); if(nFill) nFill.style.width = "0%";
        const pFill = document.querySelector('.p-fill'); if(pFill) pFill.style.width = "0%";
        const kFill = document.querySelector('.k-fill'); if(kFill) kFill.style.width = "0%";

        // Reset Status Koneksi ke posisi menunggu
        setConnectionState('idle', 'Menunggu alat...');

        // Reset Kotak AI dan Rekomendasi
        const analysisList = document.getElementById('ai-analysis-list');
        if(analysisList) analysisList.innerHTML = '<li><div class="ai-text">Masuk sebagai admin untuk melihat diagnosis lahan.</div></li>';

        const recomText = document.getElementById('ai-recom-text');
        if(recomText) recomText.innerHTML = '<p class="empty-note">Menunggu kalkulasi dari sensor...</p>';

        // Hapus backup memori CSV saat logout
        sessionStorage.removeItem("liveCsvBackup");

        // RESET GRAFIK KE KOSONG 
        labels.length = 0; // Kosongkan label waktu (sumbu X)
        datasetValues.n.length = 0;
        datasetValues.p.length = 0;
        datasetValues.k.length = 0;
        datasetValues.ph.length = 0;
        datasetValues.temp.length = 0;
        datasetValues.hum.length = 0;
        datasetValues.ec.length = 0;
        datasetValues.salt.length = 0;
        
        // Perbarui tampilan grafik agar semua garis langsung terhapus
        if(typeof multiChart !== 'undefined') {
            multiChart.update();
        }
        const chartEmpty = document.getElementById('live-chart-empty');
        if (chartEmpty) chartEmpty.hidden = false;
        
        showToast('success', 'Logout Berhasil', 'Koneksi sensor diputus.');

        setTimeout(() => {
            document.getElementById('guest-view').style.display = 'block';
            document.getElementById('admin-view').style.display = 'none';
            closeLogoutModal();
        }, 800);
    }

    // --- AUTO-LOGIN & PEMULIHAN MEMORI SAAT HALAMAN DI-REFRESH ---
    document.addEventListener("DOMContentLoaded", () => {
        // 1. Pemulihan status login lebih dulu, agar teks kondisi kosong sesuai peran
        const restoredLogin = localStorage.getItem("adminLoggedIn") === "true";
        if (restoredLogin) isLoggedIn = true;

        // 2. KUNCI UTAMA: Langsung reset ke status Offline
        resetDataToZero(); 

        // 3. Pemulihan Login
        if (restoredLogin) {
            document.getElementById('guest-view').style.display = 'none';
            document.getElementById('admin-view').style.display = 'block';      
            
            // JALANKAN MONITORING DENGAN WATCHDOG
            startSensorMonitoring(); 
        }
    });

// FUNGSI UNTUK MERESET DATA SAAT ESP32 OFFLINE / DATA USANG
function resetDataToZero() {
    // 1. Indikator atas: offline
    setConnectionState('offline', 'ESP32 offline');

    // 2. Kotak skor ke kondisi netral
    setHeroState('offline', 0);

    // 3. Kosongkan angka sensor ("—" = tidak ada data, bukan nol)
    const idsToReset = ['val-n', 'val-p', 'val-k', 'val-ph', 'val-temp', 'val-hum', 'val-ec', 'val-salt', 'web-score-val'];
    idsToReset.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.textContent = DASH;
    });

    // 4. Label status NPK & skor jadi netral
    const labelsToReset = ['n-status-label', 'p-status-label', 'k-status-label', 'web-score-label'];
    labelsToReset.forEach(id => {
        const el = document.getElementById(id);
        if(el) { el.textContent = "Offline"; el.style.color = ''; delete el.dataset.status; }
    });

    const phLabel = document.getElementById('ph-status-label');
    if(phLabel) phLabel.textContent = "Offline";
    setPhState(null, '');

    // reset titik koordinat GPS
    const latEl = document.getElementById('val-lat');
    if(latEl) latEl.textContent = DASH;
    const lngEl = document.getElementById('val-lng');
    if(lngEl) lngEl.textContent = DASH;

    // 5. Kosongkan Progress Bar NPK
    const nFill = document.querySelector('.n-fill'); if(nFill) nFill.style.width = "0%";
    const pFill = document.querySelector('.p-fill'); if(pFill) pFill.style.width = "0%";
    const kFill = document.querySelector('.k-fill'); if(kFill) kFill.style.width = "0%";

    // 6. Reset Judul Banner Utama & Kotak Analisis AI
    const titleEl = document.getElementById('web-status-title');
    if(titleEl) titleEl.textContent = "Sensor belum mengirim data";
    const descEl = document.getElementById('web-status-desc');
    if(descEl) descEl.textContent = isLoggedIn
        ? "Nyalakan alat AGROSKOR di lahan. Skor muncul otomatis begitu data pertama masuk."
        : "Masuk sebagai admin untuk mulai membaca sensor dari lahan.";
    const analysisList = document.getElementById('ai-analysis-list');
    if(analysisList) analysisList.innerHTML = '<li><div class="ai-text">Menunggu transmisi data dari sensor&hellip;</div></li>';
    const recomText = document.getElementById('ai-recom-text');
    if(recomText) recomText.innerHTML = '<div class="recom-content is-offline"><span class="recom-title">Belum ada data</span><div class="recom-value">Dosis muncul setelah sensor terbaca.</div></div>';
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
// MESIN ALARM NOTIFIKASI LAHAN KRITIS (ANTI-NOISE)
// ==========================================

let isNotifKritisAktif = false;
let currentScore = null; // Ubah jadi null (kosong) agar tidak memicu alarm 0
let hasAlertedKritis = false;
let isDataLoaded = false; // Bendera pengaman

// 1. PUSAT EVALUASI ALARM
function evaluasiAlarm() {
    // PENGAMAN 1: Jangan bunyi kalau belum login (Tunggu admin masuk)
    if (typeof isLoggedIn !== 'undefined' && isLoggedIn === false) return; 

    // PENGAMAN 2: Jangan bunyi kalau data asli belum datang dari ESP32
    if (isDataLoaded === false || currentScore === null) return;

    // Jika skor kritis (asli dari alat) DAN saklar di Settings menyala
    if (currentScore < 50 && isNotifKritisAktif === true) {
        
        // Cek agar tidak spam (muncul berkali-kali)
        if (hasAlertedKritis === false) {
            showToast('error', 'Peringatan: lahan kritis', 'Skor kesuburan anjlok ke ' + currentScore + '! Segera cek rekomendasi AI.');
            hasAlertedKritis = true; 
        }
        
    } 
    // Jika lahan kembali normal
    else if (currentScore >= 50) {
        hasAlertedKritis = false; 
    }
}

// 2. Pantau "Saklar" Notifikasi dari halaman Settings
database.ref('AgroskorPro/Settings/Notifications/kritis').on('value', (snapshot) => {
    isNotifKritisAktif = snapshot.val() || false;
    evaluasiAlarm(); 
});

// 3. Pantau "Skor" dari ESP32
database.ref('AgroskorPro/SensorData/score').on('value', (snapshot) => {
    if (snapshot.exists()) {
        currentScore = snapshot.val();
        isDataLoaded = true; // Tandai bahwa ini adalah data ASLI dari alat
        evaluasiAlarm(); 
    }
});

// 1. Jalankan saat halaman pertama kali dibuka
window.addEventListener('load', handleProfilePosition);

// 2. Jalankan secara REAL-TIME setiap kali ukuran layar ditarik/diubah (resize)
window.addEventListener('resize', handleProfilePosition);

// FUNGSI UNTUK TOMBOL "TERAPKAN" JUMLAH POT
function konfirmasiLuasLahan() {
    const input = document.getElementById('luas-lahan');
    const n = input ? parseInt(input.value) : 0;
    if (n > 0) {
        localStorage.setItem("jumlahPotTersimpan", n);
        showToast('success', 'Jumlah Pot Diterapkan', `Dosis dihitung untuk ${n} pot.`);
        if (typeof analyzeSpecificPlant === 'function') analyzeSpecificPlant();
    } else {
        showToast('error', 'Input Tidak Valid', 'Masukkan jumlah pot lebih dari 0.');
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const input = document.getElementById('luas-lahan');
    if (input) input.value = jumlahPotTersimpan();
});
