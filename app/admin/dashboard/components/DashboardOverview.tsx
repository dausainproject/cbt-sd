"use client";

import {
  Users,
  BookOpen,
  FileText,
  ClipboardList,
} from "lucide-react";

export default function DashboardOverview() {
  const stats = [
    {
      title: "Total Users",
      value: "128",
      icon: Users,
      gradient: "from-indigo-500 to-purple-500",
      bg: "from-indigo-50 to-purple-50",
    },
    {
      title: "Total Peserta",
      value: "342",
      icon: Users,
      gradient: "from-blue-500 to-cyan-500",
      bg: "from-blue-50 to-cyan-50",
    },
    {
      title: "Mata Pelajaran",
      value: "12",
      icon: BookOpen,
      gradient: "from-emerald-500 to-teal-500",
      bg: "from-emerald-50 to-teal-50",
    },
    {
      title: "Total Soal",
      value: "1,240",
      icon: FileText,
      gradient: "from-amber-500 to-orange-500",
      bg: "from-amber-50 to-orange-50",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">
          Dashboard Overview
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Ringkasan statistik sistem CBT
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;

          return (
            <div
              key={index}
              className="relative overflow-hidden rounded-3xl bg-white border border-slate-200 p-6 shadow-sm hover:shadow-xl transition-all duration-300 group"
            >
              {/* Subtle Background Gradient Accent */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${stat.bg} opacity-0 group-hover:opacity-100 transition duration-500`}
              />

              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm">
                    {stat.title}
                  </p>
                  <h2 className="text-3xl font-bold text-slate-800 mt-2">
                    {stat.value}
                  </h2>
                </div>

                <div
                  className={`bg-gradient-to-r ${stat.gradient} p-3 rounded-2xl shadow-md`}
                >
                  <Icon className="text-white" size={22} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}