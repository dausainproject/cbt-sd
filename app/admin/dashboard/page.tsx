"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

import DashboardOverview from "./components/DashboardOverview";
import UserManagement from "./components/UserManagement";
import ParticipantManagement from "./components/ParticipantManagement";
import SubjectManagement from "./components/SubjectManagement";
import QuestionBank from "./components/QuestionBank";
import AssessmentManagement from "./components/AssessmentManagement";
import ExamMonitoring from "./components/ExamMonitoring";

export default function AdminDashboard() {
  const router = useRouter();
  const [activeMenu, setActiveMenu] = useState("dashboard");

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push("/admin/login");
      }
    };

    checkSession();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

  return (
    <main className="min-h-screen bg-slate-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-xl p-6 flex flex-col justify-between">
  <div>
    <h2 className="text-2xl font-bold text-slate-800 mb-8">
      Admin Panel
    </h2>

    <ul className="space-y-2">
      {[
        { key: "dashboard", label: "Dashboard" },
        { key: "users", label: "Manajemen User" },
        { key: "participants", label: "Manajemen Peserta" },
        { key: "subjects", label: "Mata Pelajaran" },
        { key: "question-bank", label: "Bank Soal" },
        { key: "assessments", label: "Asesmen" },
        { key: "monitoring", label: "Monitoring Ujian" },
      ].map((item) => (
        <li
          key={item.key}
          onClick={() => setActiveMenu(item.key)}
          className={`cursor-pointer px-4 py-3 rounded-xl transition font-medium
            ${
              activeMenu === item.key
                ? "bg-indigo-600 text-white shadow-md"
                : "text-slate-600 hover:bg-slate-100"
            }`}
        >
          {item.label}
        </li>
      ))}
    </ul>
  </div>

  <button
    onClick={handleLogout}
    className="mt-10 px-4 py-3 bg-rose-500 text-white rounded-xl font-semibold hover:bg-rose-600 transition"
  >
    Logout
  </button>
</aside>

      {/* Content */}
      <section className="flex-1 p-10">
        {activeMenu === "dashboard" && <DashboardOverview />}
        {activeMenu === "users" && <UserManagement />}
        {activeMenu === "participants" && <ParticipantManagement />}
        {activeMenu === "subjects" && <SubjectManagement />}
        {activeMenu === "question-bank" && <QuestionBank />}
        {activeMenu === "assessments" && <AssessmentManagement />}
        {activeMenu === "monitoring" && <ExamMonitoring />}
      </section>
    </main>
  );
}