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
      <aside className="w-64 bg-white shadow-lg p-6">
        <h2 className="text-xl font-bold mb-6">Admin Panel</h2>

        <ul className="space-y-3">
          <li onClick={() => setActiveMenu("dashboard")} className="cursor-pointer">Dashboard</li>
          <li onClick={() => setActiveMenu("users")} className="cursor-pointer">Manajemen User</li>
          <li onClick={() => setActiveMenu("participants")} className="cursor-pointer">Manajemen Peserta</li>
          <li onClick={() => setActiveMenu("subjects")} className="cursor-pointer">Mata Pelajaran</li>
          <li onClick={() => setActiveMenu("question-bank")} className="cursor-pointer">Bank Soal</li>
          <li onClick={() => setActiveMenu("assessments")} className="cursor-pointer">Asesmen</li>
          <li onClick={() => setActiveMenu("monitoring")} className="cursor-pointer">Monitoring Ujian</li>
        </ul>

        <button
          onClick={handleLogout}
          className="mt-10 px-4 py-2 bg-rose-500 text-white rounded-xl"
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