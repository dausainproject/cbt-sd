async function loadPeserta() {
  if (!selectedAsesmen) return;

  const sesiFix = Number(sesi);

  try {
    // ===============================
    // 1. AMBIL SISWA (MASTER DATA)
    // ===============================
    const { data: siswa, error: errSiswa } = await supabase
      .from("data_siswa")
      .select("no_peserta, nama_lengkap")
      .eq("status", true);

    if (errSiswa) {
      console.log("❌ ERROR SISWA:", errSiswa.message);
      return;
    }

    if (!siswa?.length) {
      setPeserta([]);
      return;
    }

    // ===============================
    // 2. AMBIL LAPORAN (SOURCE OF TRUTH)
    // ===============================
    const { data: laporan, error: errLaporan } = await supabase
      .from("laporan_ujian")
      .select("no_peserta, status, status_final, pelanggaran, updated_at")
      .eq("id_asesmen", selectedAsesmen)
      .eq("sesi", sesiFix);

    if (errLaporan) {
      console.log("❌ ERROR LAPORAN:", errLaporan.message);
      return;
    }

    // ===============================
    // 3. BUILD MAP (AMBIL DATA TERAKHIR TERVALID)
    // ===============================
    const map = new Map<string, any>();

    (laporan || []).forEach((l) => {
      const existing = map.get(l.no_peserta);

      if (!existing) {
        map.set(l.no_peserta, l);
        return;
      }

      const prevTime = new Date(existing.updated_at || 0).getTime();
      const currTime = new Date(l.updated_at || 0).getTime();

      // ambil yang paling baru
      if (currTime >= prevTime) {
        map.set(l.no_peserta, l);
      }
    });

    // ===============================
    // 4. BUILD RESULT (PURE RENDER LOGIC)
    // ===============================
    const result: Monitoring[] = siswa.map((s) => {
      const lap = map.get(s.no_peserta);

      const hasEverData = !!lap;

      return {
        no_peserta: s.no_peserta,
        nama_lengkap: s.nama_lengkap,

        // ===========================
        // 🔥 FINAL CBT STATUS RULE
        // ===========================
        status:
          lap?.status_final ??
          lap?.status ??
          (hasEverData ? "sedang" : "belum_login"),

        pelanggaran: lap?.pelanggaran ?? 0,
      };
    });

    // ===============================
    // 5. SET STATE (NO MERGE, NO MEMORY BUG)
    // ===============================
    setPeserta(result);

    // ===============================
    // 6. STATISTIK
    // ===============================
    hitungStat(result);

  } catch (err) {
    console.log("❌ FATAL ERROR:", err);
  }
}
