"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

import {
  LayoutDashboard,
  Users,
  UserCheck,
  BookOpen,
  FileText,
  ClipboardList,
  Activity,
  LogOut,
} from "lucide-react";

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

  const menuItems = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "users", label: "Manajemen User", icon: Users },
    { key: "participants", label: "Manajemen Peserta", icon: UserCheck },
    { key: "subjects", label: "Mata Pelajaran", icon: BookOpen },
    { key: "question-bank", label: "Bank Soal", icon: FileText },
    { key: "assessments", label: "Asesmen", icon: ClipboardList },
    { key: "monitoring", label: "Monitoring Ujian", icon: Activity },
  ];

  return (
    <main className="min-h-screen bg-slate-100 flex">
      
      {/* SIDEBAR */}
      <aside className="w-72 bg-white shadow-2xl p-8 flex flex-col justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-10">
            Admin Panel
          </h2>

          <ul className="space-y-3">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeMenu === item.key;

              return (
                <li
                  key={item.key}
                  onClick={() => setActiveMenu(item.key)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 font-medium
                    ${
                      isActive
                        ? "bg-indigo-600 text-white shadow-lg"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                >
                  <Icon size={20} />
                  {item.label}
                </li>
              );
            })}
          </ul>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-rose-500 text-white rounded-xl font-semibold hover:bg-rose-600 transition"
        >
          <LogOut size={18} />
          Logout
        </button>
      </aside>

      {/* CONTENT */}
      <section className="flex-1 pt-6 px-8 pb-8 bg-slate-100">
        <div className="bg-white rounded-3xl shadow-xl p-10 min-h-[650px] transition-all">
          {activeMenu === "dashboard" && <DashboardOverview />}
          {activeMenu === "users" && <UserManagement />}
          {activeMenu === "participants" && <ParticipantManagement />}
          {activeMenu === "subjects" && <SubjectManagement />}
          {activeMenu === "question-bank" && <QuestionBank />}
          {activeMenu === "assessments" && <AssessmentManagement />}
          {activeMenu === "monitoring" && <ExamMonitoring />}
        </div>
      </section>
    </main>
  );
}