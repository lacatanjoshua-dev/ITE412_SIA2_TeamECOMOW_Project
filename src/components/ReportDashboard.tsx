import React from "react";
import {
  BarChart3,
  Download,
  Bell,
  Battery,
  Cpu,
  FileText,
  CheckCircle2,
  Clock3,
  Activity,
  Zap,
  CalendarDays,
  TrendingUp,
} from "lucide-react";

export default function ReportDashboard() {
  return (
    <div className="min-h-screen w-full px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* ================= HEADER ================= */}
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/90 shadow-sm">
                <BarChart3 className="h-5 w-5 text-[#40513B]" />
              </div>

              <span className="text-xs font-black uppercase tracking-[3px] text-white drop-shadow">
                Analytics Center
              </span>
            </div>

            <h1 className="text-3xl font-black tracking-tight text-white drop-shadow sm:text-4xl">
              System Reports
            </h1>

            <p className="mt-2 max-w-2xl text-sm font-medium text-white/80 drop-shadow">
              Monitor ECOMOW performance, energy usage, notifications, and
              system activity.
            </p>
          </div>

          <button
            type="button"
            className="
              flex items-center justify-center gap-2
              rounded-2xl
              bg-[#40513B]
              px-5 py-3
              text-sm font-black uppercase tracking-wider
              text-white
              shadow-lg shadow-black/20
              transition-all
              hover:bg-[#2C3627]
              active:scale-[0.97]
            "
          >
            <Download size={18} />
            Export Report
          </button>
        </div>

        {/* ================= REPORT BUILDER ================= */}
        <div
          className="
            mb-8 overflow-hidden
            rounded-[2rem]
            border border-white/50
            bg-white/95
            shadow-xl
          "
        >
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto]">

            {/* LEFT */}
            <div className="p-6 sm:p-8 lg:p-10">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#628141]/10">
                  <FileText className="h-6 w-6 text-[#628141]" />
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-[3px] text-[#628141]">
                    Report Builder
                  </p>

                  <h2 className="text-xl font-black text-[#40513B] sm:text-2xl">
                    Analytics Report Builder
                  </h2>
                </div>
              </div>

              <p className="max-w-2xl text-sm font-medium leading-6 text-[#6D7C66]">
                Generate and review reports for your ECOMOW mower system.
                Monitor important information such as energy consumption,
                notifications, and system activity.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <div className="flex items-center gap-2 rounded-xl bg-[#F8FAF7] px-3 py-2">
                  <CalendarDays size={15} className="text-[#628141]" />
                  <span className="text-xs font-bold text-[#40513B]">
                    May 2026
                  </span>
                </div>

                <div className="flex items-center gap-2 rounded-xl bg-[#F8FAF7] px-3 py-2">
                  <Activity size={15} className="text-[#628141]" />
                  <span className="text-xs font-bold text-[#40513B]">
                    System Active
                  </span>
                </div>
              </div>
            </div>

            {/* RIGHT ILLUSTRATION */}
            <div className="flex min-h-[220px] items-center justify-center bg-[#F8FAF7] p-8 lg:w-72">
              <div className="relative flex h-36 w-36 items-center justify-center rounded-full bg-[#628141]/10">
                <div className="absolute h-28 w-28 rounded-full border-2 border-dashed border-[#628141]/30" />

                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-lg">
                  <BarChart3 className="h-10 w-10 text-[#628141]" />
                </div>

                <div className="absolute -right-1 top-4 flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-md">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>

                <div className="absolute -bottom-1 left-2 flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-md">
                  <Zap className="h-4 w-4 text-yellow-500" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= ANALYTICS CARDS ================= */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          {/* Notifications */}
          <div className="rounded-[1.7rem] border border-white/60 bg-white/95 p-5 shadow-lg transition hover:-translate-y-1 hover:shadow-xl">
            <div className="flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-50">
                <Bell className="h-6 w-6 text-yellow-500" />
              </div>

              <span className="rounded-full bg-yellow-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-yellow-600">
                Alerts
              </span>
            </div>

            <p className="mt-5 text-xs font-bold uppercase tracking-widest text-[#6D7C66]">
              Notifications
            </p>

            <div className="mt-1 flex items-end justify-between">
              <p className="text-3xl font-black text-[#40513B]">24</p>
              <span className="text-xs font-bold text-green-600">
                +8.2%
              </span>
            </div>
          </div>

          {/* Battery */}
          <div className="rounded-[1.7rem] border border-white/60 bg-white/95 p-5 shadow-lg transition hover:-translate-y-1 hover:shadow-xl">
            <div className="flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50">
                <Battery className="h-6 w-6 text-green-600" />
              </div>

              <span className="rounded-full bg-green-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-green-600">
                Healthy
              </span>
            </div>

            <p className="mt-5 text-xs font-bold uppercase tracking-widest text-[#6D7C66]">
              Battery Status
            </p>

            <div className="mt-1 flex items-end justify-between">
              <p className="text-3xl font-black text-[#40513B]">87%</p>
              <span className="text-xs font-bold text-green-600">
                Optimal
              </span>
            </div>
          </div>

          {/* Tasks */}
          <div className="rounded-[1.7rem] border border-white/60 bg-white/95 p-5 shadow-lg transition hover:-translate-y-1 hover:shadow-xl">
            <div className="flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50">
                <Cpu className="h-6 w-6 text-blue-600" />
              </div>

              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-blue-600">
                Active
              </span>
            </div>

            <p className="mt-5 text-xs font-bold uppercase tracking-widest text-[#6D7C66]">
              System Tasks
            </p>

            <div className="mt-1 flex items-end justify-between">
              <p className="text-3xl font-black text-[#40513B]">18</p>
              <span className="text-xs font-bold text-blue-600">
                Running
              </span>
            </div>
          </div>

          {/* Reports */}
          <div className="rounded-[1.7rem] border border-white/60 bg-white/95 p-5 shadow-lg transition hover:-translate-y-1 hover:shadow-xl">
            <div className="flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>

              <span className="rounded-full bg-purple-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-purple-600">
                Reports
              </span>
            </div>

            <p className="mt-5 text-xs font-bold uppercase tracking-widest text-[#6D7C66]">
              Reports Generated
            </p>

            <div className="mt-1 flex items-end justify-between">
              <p className="text-3xl font-black text-[#40513B]">6</p>
              <span className="text-xs font-bold text-purple-600">
                This month
              </span>
            </div>
          </div>
        </div>

        {/* ================= REPORT PREVIEW ================= */}
        <div className="overflow-hidden rounded-[2rem] border border-white/60 bg-white/95 shadow-xl">

          {/* TABLE HEADER */}
          <div className="flex flex-col gap-4 border-b border-gray-100 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#628141]/10">
                <FileText className="h-5 w-5 text-[#628141]" />
              </div>

              <div>
                <h3 className="font-black text-[#40513B]">
                  Report Preview
                </h3>

                <p className="mt-1 text-xs font-medium text-[#6D7C66]">
                  Recent system reports and activities
                </p>
              </div>
            </div>

            <button
              type="button"
              className="
                flex items-center justify-center gap-2
                rounded-xl
                bg-[#F8FAF7]
                px-4 py-2.5
                text-xs font-black
                text-[#40513B]
                transition
                hover:bg-[#628141]/10
              "
            >
              View All
              <span>→</span>
            </button>
          </div>

          {/* DESKTOP TABLE */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-[#F8FAF7]">
                  <th className="px-8 py-4 text-left text-[10px] font-black uppercase tracking-widest text-[#6D7C66]">
                    Report Type
                  </th>

                  <th className="px-8 py-4 text-left text-[10px] font-black uppercase tracking-widest text-[#6D7C66]">
                    Date
                  </th>

                  <th className="px-8 py-4 text-left text-[10px] font-black uppercase tracking-widest text-[#6D7C66]">
                    Status
                  </th>

                  <th className="px-8 py-4 text-right text-[10px] font-black uppercase tracking-widest text-[#6D7C66]">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>

                {/* ROW 1 */}
                <tr className="border-b border-gray-100 transition hover:bg-[#F8FAF7]">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-50">
                        <Bell className="h-4 w-4 text-yellow-500" />
                      </div>

                      <div>
                        <p className="font-black text-[#40513B]">
                          Notification Report
                        </p>

                        <p className="text-xs text-[#6D7C66]">
                          System notifications
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-8 py-5 font-bold text-[#6D7C66]">
                    May 10, 2026
                  </td>

                  <td className="px-8 py-5">
                    <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1.5 text-xs font-black text-green-600">
                      <CheckCircle2 size={14} />
                      Completed
                    </span>
                  </td>

                  <td className="px-8 py-5 text-right">
                    <button
                      type="button"
                      className="rounded-xl p-2 text-[#628141] transition hover:bg-[#628141]/10"
                    >
                      <Download size={18} />
                    </button>
                  </td>
                </tr>

                {/* ROW 2 */}
                <tr className="border-b border-gray-100 transition hover:bg-[#F8FAF7]">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
                        <Battery className="h-4 w-4 text-green-600" />
                      </div>

                      <div>
                        <p className="font-black text-[#40513B]">
                          Energy Usage
                        </p>

                        <p className="text-xs text-[#6D7C66]">
                          Battery and power data
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-8 py-5 font-bold text-[#6D7C66]">
                    May 9, 2026
                  </td>

                  <td className="px-8 py-5">
                    <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1.5 text-xs font-black text-green-600">
                      <CheckCircle2 size={14} />
                      Completed
                    </span>
                  </td>

                  <td className="px-8 py-5 text-right">
                    <button
                      type="button"
                      className="rounded-xl p-2 text-[#628141] transition hover:bg-[#628141]/10"
                    >
                      <Download size={18} />
                    </button>
                  </td>
                </tr>

                {/* ROW 3 */}
                <tr className="transition hover:bg-[#F8FAF7]">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                        <Cpu className="h-4 w-4 text-blue-600" />
                      </div>

                      <div>
                        <p className="font-black text-[#40513B]">
                          System Logs
                        </p>

                        <p className="text-xs text-[#6D7C66]">
                          Mower system activity
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-8 py-5 font-bold text-[#6D7C66]">
                    May 8, 2026
                  </td>

                  <td className="px-8 py-5">
                    <span className="inline-flex items-center gap-2 rounded-full bg-yellow-50 px-3 py-1.5 text-xs font-black text-yellow-600">
                      <Clock3 size={14} />
                      Processing
                    </span>
                  </td>

                  <td className="px-8 py-5 text-right">
                    <button
                      type="button"
                      className="rounded-xl p-2 text-gray-300"
                      disabled
                    >
                      <Download size={18} />
                    </button>
                  </td>
                </tr>

              </tbody>
            </table>
          </div>

          {/* MOBILE REPORT CARDS */}
          <div className="space-y-3 p-4 md:hidden">

            {/* Mobile Card 1 */}
            <div className="rounded-2xl bg-[#F8FAF7] p-4">
              <div className="flex items-start justify-between gap-3">

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-50">
                    <Bell className="h-4 w-4 text-yellow-500" />
                  </div>

                  <div>
                    <p className="text-sm font-black text-[#40513B]">
                      Notification Report
                    </p>

                    <p className="mt-1 text-xs text-[#6D7C66]">
                      May 10, 2026
                    </p>
                  </div>
                </div>

                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="rounded-full bg-green-50 px-3 py-1 text-[10px] font-black text-green-600">
                  COMPLETED
                </span>

                <button
                  type="button"
                  className="rounded-xl bg-white p-2 text-[#628141] shadow-sm"
                >
                  <Download size={16} />
                </button>
              </div>
            </div>

            {/* Mobile Card 2 */}
            <div className="rounded-2xl bg-[#F8FAF7] p-4">
              <div className="flex items-start justify-between gap-3">

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
                    <Battery className="h-4 w-4 text-green-600" />
                  </div>

                  <div>
                    <p className="text-sm font-black text-[#40513B]">
                      Energy Usage
                    </p>

                    <p className="mt-1 text-xs text-[#6D7C66]">
                      May 9, 2026
                    </p>
                  </div>
                </div>

                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="rounded-full bg-green-50 px-3 py-1 text-[10px] font-black text-green-600">
                  COMPLETED
                </span>

                <button
                  type="button"
                  className="rounded-xl bg-white p-2 text-[#628141] shadow-sm"
                >
                  <Download size={16} />
                </button>
              </div>
            </div>

            {/* Mobile Card 3 */}
            <div className="rounded-2xl bg-[#F8FAF7] p-4">
              <div className="flex items-start justify-between gap-3">

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                    <Cpu className="h-4 w-4 text-blue-600" />
                  </div>

                  <div>
                    <p className="text-sm font-black text-[#40513B]">
                      System Logs
                    </p>

                    <p className="mt-1 text-xs text-[#6D7C66]">
                      May 8, 2026
                    </p>
                  </div>
                </div>

                <Clock3 className="h-5 w-5 text-yellow-500" />
              </div>

              <div className="mt-4">
                <span className="rounded-full bg-yellow-50 px-3 py-1 text-[10px] font-black text-yellow-600">
                  PROCESSING
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* ================= FOOTER STATUS ================= */}
        <div className="mt-6 flex flex-col gap-3 rounded-[1.5rem] border border-white/50 bg-white/80 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">

          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-50">
              <Activity className="h-4 w-4 text-green-600" />
            </span>

            <div>
              <p className="text-xs font-black uppercase tracking-wider text-[#40513B]">
                System Reporting
              </p>

              <p className="text-[11px] font-medium text-[#6D7C66]">
                ECOMOW analytics are ready for review.
              </p>
            </div>
          </div>

          <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-green-600">
            <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
            System Online
          </span>
        </div>

      </div>
    </div>
  );
}