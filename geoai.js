// ==========================================================
// AGROSKOR GeoAI: zona kesuburan (k-means), prediksi spasial (IDW),
// dan rekap kebutuhan dolomit per zona.
// ----------------------------------------------------------
// - K-means memakai pH dan EC yang distandardisasi (z-score).
//   Kelembapan dan suhu tidak dipakai karena berubah menurut jam ukur
//   dan waktu penyiraman.
// - Hasil k-means selalu sama untuk data yang sama (seed tetap).
// - IDW memperkirakan pH di lokasi yang belum diukur. Ini perkiraan,
//   bukan pengukuran, dan hanya digambar di dekat titik ukur.
// ==========================================================
const GeoAI = (() => {
    const WARNA_ZONA = ["#b5643c", "#c98a12", "#5f8f2f", "#2b6299", "#7a4a9a"];

    // Bilangan acak dengan seed tetap (mulberry32)
    function rng(seed) {
        return function () {
            seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
            let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    function standardisasi(X) {
        const d = X[0].length;
        const mean = Array(d).fill(0), sd = Array(d).fill(0);
        X.forEach(x => x.forEach((v, j) => { mean[j] += v / X.length; }));
        X.forEach(x => x.forEach((v, j) => { sd[j] += (v - mean[j]) ** 2 / X.length; }));
        for (let j = 0; j < d; j++) sd[j] = Math.sqrt(sd[j]) || 1;
        return { Z: X.map(x => x.map((v, j) => (v - mean[j]) / sd[j])), mean, sd };
    }

    const jarak2 = (a, b) => a.reduce((s, v, j) => s + (v - b[j]) ** 2, 0);

    // K-means dengan inisialisasi k-means++ dan beberapa kali ulang, ambil inersia terkecil
    function kmeans(Z, k, ulang = 20, seed = 42) {
        const acak = rng(seed);
        let terbaik = null;
        for (let r = 0; r < ulang; r++) {
            const pusat = [Z[Math.floor(acak() * Z.length)].slice()];
            while (pusat.length < k) {
                const dist = Z.map(z => Math.min(...pusat.map(c => jarak2(z, c))));
                const total = dist.reduce((a, b) => a + b, 0);
                let u = acak() * total, i = 0;
                while (i < dist.length - 1 && (u -= dist[i]) > 0) i++;
                pusat.push(Z[i].slice());
            }
            let label = Array(Z.length).fill(0);
            for (let iter = 0; iter < 100; iter++) {
                const baru = Z.map(z => {
                    let best = 0, bd = Infinity;
                    pusat.forEach((c, j) => { const dd = jarak2(z, c); if (dd < bd) { bd = dd; best = j; } });
                    return best;
                });
                const berubah = baru.some((v, i) => v !== label[i]);
                label = baru;
                for (let j = 0; j < k; j++) {
                    const anggota = Z.filter((_, i) => label[i] === j);
                    if (anggota.length) pusat[j] = pusat[j].map((_, d) => anggota.reduce((s, z) => s + z[d], 0) / anggota.length);
                }
                if (!berubah && iter > 0) break;
            }
            const inersia = Z.reduce((s, z, i) => s + jarak2(z, pusat[label[i]]), 0);
            if (!terbaik || inersia < terbaik.inersia) terbaik = { label, pusat, inersia };
        }
        return terbaik;
    }

    // Skor silhouette rata-rata (makin dekat 1, pengelompokan makin jelas)
    function silhouette(Z, label, k) {
        if (k < 2) return 0;
        let total = 0;
        Z.forEach((z, i) => {
            const rata = Array(k).fill(0), jumlah = Array(k).fill(0);
            Z.forEach((w, j) => { if (i !== j) { rata[label[j]] += Math.sqrt(jarak2(z, w)); jumlah[label[j]]++; } });
            const a = jumlah[label[i]] ? rata[label[i]] / jumlah[label[i]] : 0;
            let b = Infinity;
            for (let c = 0; c < k; c++) if (c !== label[i] && jumlah[c]) b = Math.min(b, rata[c] / jumlah[c]);
            const s = (jumlah[label[i]] === 0 || !isFinite(b)) ? 0 : (b - a) / Math.max(a, b);
            total += s;
        });
        return total / Z.length;
    }

    // Kelompokkan titik. k = "otomatis" memilih k dengan silhouette tertinggi (2 sampai 5).
    function zonakan(titik, kPilihan) {
        const n = titik.length;
        if (n < 3) return null;
        const { Z } = standardisasi(titik.map(t => [t.ph, t.ec]));
        const daftarK = [];
        for (let k = 2; k <= Math.min(5, n - 1); k++) daftarK.push(k);
        const hasilPerK = daftarK.map(k => {
            const km = kmeans(Z, k);
            return { k, km, sil: silhouette(Z, km.label, k) };
        });
        let pilih = kPilihan === "otomatis"
            ? hasilPerK.reduce((a, b) => (b.sil > a.sil ? b : a))
            : hasilPerK.find(h => h.k === Number(kPilihan)) || hasilPerK[hasilPerK.length - 1];

        // Ringkas tiap zona dalam satuan asli, lalu urutkan dari pH terendah
        const ringkas = [];
        for (let j = 0; j < pilih.k; j++) {
            const anggota = titik.filter((_, i) => pilih.km.label[i] === j);
            const rata = (f) => anggota.reduce((s, t) => s + t[f], 0) / anggota.length;
            ringkas.push({ asli: j, jumlah: anggota.length, ph: rata("ph"), ec: rata("ec") });
        }
        ringkas.sort((a, b) => a.ph - b.ph);
        const peta = {};
        ringkas.forEach((z, idx) => {
            peta[z.asli] = idx;
            z.nomor = idx + 1;
            z.warna = WARNA_ZONA[idx % WARNA_ZONA.length];
            z.nama = `pH ${AGROSKOR_RULES.labelPh(z.ph).toLowerCase()}, EC sekitar ${Math.round(z.ec)}`;
        });
        const label = pilih.km.label.map(l => peta[l]);
        return { k: pilih.k, label, zona: ringkas, silhouette: pilih.sil, semuaK: hasilPerK.map(h => ({ k: h.k, sil: h.sil })) };
    }

    // Jarak meter antar koordinat (haversine)
    function meter(a, b) {
        const R = 6371000, rad = Math.PI / 180;
        const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
        const s = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
        return 2 * R * Math.asin(Math.sqrt(s));
    }

    // IDW: perkiraan pH pada grid. Sel yang terlalu jauh dari titik ukur tidak digambar.
    function idwGrid(titik, opsi = {}) {
        const sel = opsi.sel || 45, pangkat = opsi.pangkat || 2, jarakMaks = opsi.jarakMaks || 1200;
        let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
        titik.forEach(t => { minLat = Math.min(minLat, t.lat); maxLat = Math.max(maxLat, t.lat); minLng = Math.min(minLng, t.lng); maxLng = Math.max(maxLng, t.lng); });
        const padLat = (maxLat - minLat) * 0.08 + 0.002, padLng = (maxLng - minLng) * 0.08 + 0.002;
        minLat -= padLat; maxLat += padLat; minLng -= padLng; maxLng += padLng;
        const dLat = (maxLat - minLat) / sel, dLng = (maxLng - minLng) / sel;
        const hasil = [];
        for (let i = 0; i < sel; i++) {
            for (let j = 0; j < sel; j++) {
                const c = { lat: minLat + (i + 0.5) * dLat, lng: minLng + (j + 0.5) * dLng };
                let num = 0, den = 0, terdekat = Infinity;
                for (const t of titik) {
                    const d = meter(c, t);
                    terdekat = Math.min(terdekat, d);
                    const w = 1 / Math.pow(Math.max(d, 1), pangkat);
                    num += w * t.ph; den += w;
                }
                if (terdekat > jarakMaks) continue;
                hasil.push({ bounds: [[c.lat - dLat / 2, c.lng - dLng / 2], [c.lat + dLat / 2, c.lng + dLng / 2]], ph: num / den, terdekat });
            }
        }
        return hasil;
    }

    // Uji silang leave-one-out untuk IDW: seberapa jauh perkiraan pH dari nilai terukur
    function ujiIdw(titik, pangkat = 2) {
        if (titik.length < 4) return null;
        let galat = 0;
        titik.forEach((t, i) => {
            let num = 0, den = 0;
            titik.forEach((u, j) => {
                if (i === j) return;
                const w = 1 / Math.pow(Math.max(meter(t, u), 1), pangkat);
                num += w * u.ph; den += w;
            });
            galat += Math.abs(num / den - t.ph);
        });
        return galat / titik.length;
    }

    function warnaPh(ph) {
        const B = AGROSKOR_RULES.BATAS;
        if (ph < B.PH_MIN) return "#a63b25";
        if (ph > B.PH_MAX) return "#2b6299";
        return "#2e6f2f";
    }

    return { zonakan, idwGrid, ujiIdw, warnaPh, WARNA_ZONA };
})();
