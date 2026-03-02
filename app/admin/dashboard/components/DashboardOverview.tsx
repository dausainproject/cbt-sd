"use client";

import { Users, BookOpen, FileText, ClipboardList } from "lucide-react";

export default function DashboardOverview() {
  const stats = [
    {
      title: "Total Users",
      value: "128",
      icon: Users,
    },
    {
      title: "Total Peserta",
      value: "342",
      icon: Users,
    },
    {
      title: "Mata Pelajaran",
      value: "12",
      icon: BookOpen,
    },
    {
      title: "Total Soal",
      value: "1,240",
      icon: FileText,
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-8">
        Dashboard Overview
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;

          return (
            <div
              key={index}
              className="bg-slate-50 rounded-2xl p-6 shadow-sm hover:shadow-lg transition duration-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm">{stat.title}</p>
                  <h2 className="text-3xl font-bold text-slate-800 mt-2">
                    {stat.value}
                  </h2>
                </div>

                <div className="bg-indigo-100 p-3 rounded-xl">
                  <Icon className="text-indigo-600" size={22} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}