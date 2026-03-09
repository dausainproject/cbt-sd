"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPeserta() {
  const router = useRouter();

  const [noPeserta, setNoPeserta] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("data_siswa")
      .select("*")
      .eq("no_peserta", noPeserta)
      .eq("password", password)
      .single();

    if (error || !data) {
      setError("No peserta atau password salah");
      setLoading(false);
      return;
    }

    // simpan ke localStorage
    localStorage.setItem("peserta", JSON.stringify(data));

    router.push("/peserta/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50 p-4">
      <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md">

        <h1 className="text-2xl font-bold text-center mb-6">
          Login Peserta
        </h1>

        <input
          type="text"
          placeholder="No Peserta"
          value={noPeserta}
          onChange={(e) => setNoPeserta(e.target.value)}
          className="w-full border p-3 rounded mb-4"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border p-3 rounded mb-4"
        />

        {error && (
          <p className="text-red-500 text-sm mb-4">{error}</p>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700"
        >
          {loading ? "Masuk..." : "Masuk"}
        </button>

      </div>
    </div>
  );
}