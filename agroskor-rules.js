// ==========================================================
// AGROSKOR: cermin sistem pakar di alat (agroskor_ai.h)
// ----------------------------------------------------------
// Batas, skor, label pH, basis pengetahuan, dan crop library di file ini
// HARUS sama dengan agroskor_ai.h di firmware. Jika batas di firmware
// diubah, ubah juga di sini.
// Web memakai file ini hanya jika data dari alat belum membawa hasil
// sistem pakar (misalnya firmware lama atau data sementara).
// ==========================================================
const AGROSKOR_RULES = (() => {
    const BATAS = {
        PH_MIN: 5.6,       // Juknis Budidaya Bawang Merah, BPTP Jakarta (2018)
        PH_MAX: 6.5,       // Juknis Budidaya Bawang Merah, BPTP Jakarta (2018)
        N: 45,             // mg/kg, asumsi tim (spreadsheet)
        P: 15,             // mg/kg, asumsi tim (spreadsheet)
        K: 20,             // mg/kg, asumsi tim (spreadsheet)
        KEL_MIN: 45,       // %, asumsi tim
        KEL_MAX: 65,       // %, asumsi tim
        EC_MAKS: 1200      // uS/cm, asumsi tim mengacu ambang FAO 1,2 dS/m (ECe)
    };
    const DOSIS = { DOLOMIT: 13, SP36: 3, NPK: 3 };   // gram per pot, Juknis BPTP Jakarta (2018)

    const SUMBER = {
        juknis: "Juknis Budidaya Bawang Merah di Lahan dan di Dalam Pot/Polybag, BPTP Jakarta (2018)",
        balai: "Kriteria Penilaian Hasil Analisis Tanah, Balai Penelitian Tanah (2009)",
        fao: "FAO, Crop salt tolerance data (ambang ECe bawang 1,2 dS/m)",
        asumsi: "Asumsi tim"
    };

    // Ubah data Firebase (nitrogen, fosfor, kalium, hum) ke format internal
    function dariFirebase(d) {
        return {
            ph: Number(d.ph), ec: Number(d.ec), kel: Number(d.hum),
            n: Number(d.nitrogen), p: Number(d.fosfor), k: Number(d.kalium)
        };
    }

    // Skor kesuburan MCDM (Hierarki 1): pH 35%, N 15%, P 15%, K 15%, kelembapan 20%
    function skorKesuburan(b) {
        const sPH = (b.ph >= BATAS.PH_MIN && b.ph <= BATAS.PH_MAX) ? 100
            : (b.ph >= BATAS.PH_MIN - 0.3 && b.ph <= BATAS.PH_MAX + 0.3) ? 70 : 30;
        const sN = b.n >= BATAS.N * 1.3 ? 100 : (b.n >= BATAS.N ? 70 : 30);
        const sP = b.p >= BATAS.P * 1.3 ? 100 : (b.p >= BATAS.P ? 70 : 30);
        const sK = b.k >= BATAS.K * 1.3 ? 100 : (b.k >= BATAS.K ? 70 : 30);
        const sH = (b.kel >= BATAS.KEL_MIN && b.kel <= BATAS.KEL_MAX) ? 100
            : (b.kel >= BATAS.KEL_MIN - 15 && b.kel <= BATAS.KEL_MAX + 15) ? 60 : 20;
        return Math.round(sPH * 0.35 + sN * 0.15 + sP * 0.15 + sK * 0.15 + sH * 0.20);
    }

    // 2 = optimal, 1 = belum optimal, 0 = kritis (sama dengan alat)
    function kategoriSkor(skor) {
        const kode = skor >= 80 ? 2 : (skor >= 50 ? 1 : 0);
        const nama = ["LAHAN KRITIS", "BELUM OPTIMAL", "LAHAN OPTIMAL"][kode];
        const state = ["crit", "warn", "good"][kode];
        return { kode, nama, state };
    }

    // Label pH menurut kriteria Balai Penelitian Tanah (2009)
    function labelPh(ph) {
        if (ph < 4.5) return "SANGAT MASAM";
        if (ph < 5.6) return "MASAM";
        if (ph <= 6.5) return "AGAK MASAM";
        if (ph <= 7.5) return "NETRAL";
        if (ph <= 8.5) return "AGAK ALKALIS";
        return "ALKALIS";
    }

    // Kesesuaian pH untuk bawang merah (dipakai untuk warna label)
    function statusPhBawang(ph) {
        if (ph < BATAS.PH_MIN) return "asam";
        if (ph > BATAS.PH_MAX) return "basa";
        return "netral";
    }

    // Basis pengetahuan (sama urutannya dengan agroskor_ai.h)
    const BASIS_PENGETAHUAN = [
        { kode: "R1", param: "ph", op: "<", batas: BATAS.PH_MIN, kesimpulan: "Tanah terlalu asam untuk bawang merah", tindakan: "Tambah dolomit 13 g per pot", jenis: "pembenah", gram: DOSIS.DOLOMIT, sumber: SUMBER.juknis },
        { kode: "R2", param: "ph", op: ">", batas: BATAS.PH_MAX, kesimpulan: "pH di atas rentang ideal bawang merah", tindakan: "Jangan tambah kapur atau dolomit", jenis: "pembenah", gram: 0, sumber: SUMBER.juknis },
        { kode: "R3", param: "ec", op: ">", batas: BATAS.EC_MAKS, kesimpulan: "Kadar garam terlarut tinggi", tindakan: "Tunda pemupukan", jenis: "pupuk", gram: 0, sumber: SUMBER.fao + ", batas " + SUMBER.asumsi.toLowerCase() },
        { kode: "R4", param: "ec", op: "<=", batas: BATAS.EC_MAKS, kesimpulan: "Kadar garam tidak berlebih", tindakan: "Pupuk: SP-36 3 g saat tanam, NPK 3 g umur 14 hari dan 1 bulan", jenis: "pupuk", gram: 0, sumber: SUMBER.juknis },
        { kode: "R5", param: "kel", op: "<", batas: BATAS.KEL_MIN, kesimpulan: "Tanah kering", tindakan: "Siram dulu, lalu ukur ulang", jenis: "air", gram: 0, sumber: SUMBER.asumsi },
        { kode: "R6", param: "kel", op: ">", batas: BATAS.KEL_MAX, kesimpulan: "Tanah terlalu basah", tindakan: "Tunda penyiraman", jenis: "air", gram: 0, sumber: SUMBER.asumsi }
    ];
    const NAMA_PARAM = { ph: "pH", ec: "EC", kel: "Kelembapan" };

    function cek(v, op, batas) {
        if (op === "<") return v < batas;
        if (op === ">") return v > batas;
        return v <= batas;
    }

    // Mesin inferensi: aturan yang terpenuhi beserta alasannya
    function inferensi(b) {
        const hasil = [];
        let dolomitGram = 0;
        BASIS_PENGETAHUAN.forEach(a => {
            const v = b[a.param];
            if (!isFinite(v)) return;
            if (cek(v, a.op, a.batas)) {
                const desimal = a.param === "ph" ? 2 : 0;
                const alasan = `${NAMA_PARAM[a.param]} ${v.toFixed(desimal)} ${a.op} ${a.batas.toFixed(desimal)}`;
                hasil.push({ ...a, alasan });
                if (a.kode === "R1") dolomitGram = DOSIS.DOLOMIT;
            }
        });
        return { aturan: hasil, dolomitGram };
    }

    // Crop library (kesesuaian pH). Tambah komoditas setelah ada sumbernya.
    const CROP_LIBRARY = [
        { nama: "Bawang merah", phMin: BATAS.PH_MIN, phMax: BATAS.PH_MAX, sumber: SUMBER.juknis }
    ];
    function komoditasSesuai(ph) {
        return CROP_LIBRARY.filter(c => ph >= c.phMin && ph <= c.phMax);
    }

    return { BATAS, DOSIS, SUMBER, BASIS_PENGETAHUAN, CROP_LIBRARY, dariFirebase, skorKesuburan, kategoriSkor, labelPh, statusPhBawang, inferensi, komoditasSesuai };
})();
