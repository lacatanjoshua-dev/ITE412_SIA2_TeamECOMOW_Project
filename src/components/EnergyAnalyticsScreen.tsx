import React from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import {
  Battery,
  Sun,
  Clock,
  Zap,
  Leaf,
  TrendingUp,
  Activity,
  Gauge,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";

export default function EnergyAnalyticsScreen() {
  const batteryData = [
    { time: "00:00", level: 95 },
    { time: "06:00", level: 87 },
    { time: "08:00", level: 65 },
    { time: "10:00", level: 72 },
    { time: "12:00", level: 85 },
    { time: "14:00", level: 92 },
    { time: "16:00", level: 88 },
    { time: "18:00", level: 87 },
  ];

  const energyData = [
    { day: "Mon", harvested: 450, consumed: 380 },
    { day: "Tue", harvested: 520, consumed: 420 },
    { day: "Wed", harvested: 380, consumed: 360 },
    { day: "Thu", harvested: 490, consumed: 410 },
    { day: "Fri", harvested: 530, consumed: 440 },
    { day: "Sat", harvested: 560, consumed: 390 },
    { day: "Sun", harvested: 510, consumed: 350 },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-5 lg:px-8 pb-28 lg:pb-10">

      {/* =========================================================
          HEADER
      ========================================================= */}
      <div className="mb-8 sm:mb-10">

        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">

          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-[#628141]/10 flex items-center justify-center">
                <Leaf size={18} className="text-[#628141]" />
              </div>

              <span className="text-[10px] font-black text-[#628141] uppercase tracking-[3px]">
                ECOMOW SYSTEM
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#40513B] tracking-tight">
              Energy Analytics
            </h1>

            <p className="mt-2 text-sm sm:text-base text-[#6D7C66] font-medium">
              Monitor battery performance, solar input, and energy efficiency.
            </p>
          </div>

          {/* LIVE STATUS */}
          <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 border border-[#E5D9B6]/50 shadow-sm w-fit">

            <div className="relative">
              <span className="block w-3 h-3 rounded-full bg-green-500" />
              <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-40" />
            </div>

            <div>
              <p className="text-[9px] font-black text-[#6D7C66] uppercase tracking-widest">
                System Status
              </p>

              <p className="text-sm font-black text-[#40513B]">
                Energy System Online
              </p>
            </div>

          </div>

        </div>
      </div>


      {/* =========================================================
          QUICK OVERVIEW
      ========================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mb-8">

        {/* SOLAR */}
        <div className="group bg-white rounded-[1.7rem] sm:rounded-[2rem] p-5 sm:p-6 border border-[#E5D9B6]/50 shadow-sm hover:shadow-lg transition-all duration-300">

          <div className="flex items-start justify-between mb-5">

            <div className="w-11 h-11 rounded-2xl bg-[#E67E22]/10 flex items-center justify-center">
              <Sun className="w-5 h-5 text-[#E67E22]" />
            </div>

            <div className="flex items-center gap-1 text-[9px] font-black text-[#628141]">
              <TrendingUp size={12} />
              12%
            </div>

          </div>

          <p className="text-[9px] font-black text-[#6D7C66] uppercase tracking-[1.5px]">
            Solar Input
          </p>

          <p className="mt-1 text-2xl sm:text-3xl font-black text-[#40513B]">
            2.4
            <span className="text-sm ml-1 text-[#6D7C66]">kWh</span>
          </p>

          <p className="mt-2 text-[9px] font-bold text-[#628141] uppercase">
            Positive energy gain
          </p>

        </div>


        {/* BATTERY */}
        <div className="group bg-white rounded-[1.7rem] sm:rounded-[2rem] p-5 sm:p-6 border border-[#E5D9B6]/50 shadow-sm hover:shadow-lg transition-all duration-300">

          <div className="flex items-start justify-between mb-5">

            <div className="w-11 h-11 rounded-2xl bg-[#628141]/10 flex items-center justify-center">
              <Battery className="w-5 h-5 text-[#628141]" />
            </div>

            <span className="text-[9px] font-black text-green-600 bg-green-50 px-2 py-1 rounded-full">
              GOOD
            </span>

          </div>

          <p className="text-[9px] font-black text-[#6D7C66] uppercase tracking-[1.5px]">
            Battery Level
          </p>

          <p className="mt-1 text-2xl sm:text-3xl font-black text-[#40513B]">
            87%
          </p>

          <div className="mt-3 h-2 bg-[#F1F4EE] rounded-full overflow-hidden">
            <div className="h-full w-[87%] bg-[#628141] rounded-full" />
          </div>

          <p className="mt-2 text-[9px] font-bold text-[#6D7C66] uppercase">
            3.2 hrs remaining
          </p>

        </div>


        {/* RUNTIME */}
        <div className="group bg-white rounded-[1.7rem] sm:rounded-[2rem] p-5 sm:p-6 border border-[#E5D9B6]/50 shadow-sm hover:shadow-lg transition-all duration-300">

          <div className="flex items-start justify-between mb-5">

            <div className="w-11 h-11 rounded-2xl bg-[#40513B]/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-[#40513B]" />
            </div>

            <Activity size={16} className="text-[#628141]" />

          </div>

          <p className="text-[9px] font-black text-[#6D7C66] uppercase tracking-[1.5px]">
            Runtime
          </p>

          <p className="mt-1 text-2xl sm:text-3xl font-black text-[#40513B]">
            2h 15m
          </p>

          <p className="mt-2 text-[9px] font-bold text-[#6D7C66] uppercase">
            78% solar load
          </p>

        </div>


        {/* POWER */}
        <div className="group bg-white rounded-[1.7rem] sm:rounded-[2rem] p-5 sm:p-6 border border-[#E5D9B6]/50 shadow-sm hover:shadow-lg transition-all duration-300">

          <div className="flex items-start justify-between mb-5">

            <div className="w-11 h-11 rounded-2xl bg-[#E67E22]/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-[#E67E22]" />
            </div>

            <Gauge size={16} className="text-[#E67E22]" />

          </div>

          <p className="text-[9px] font-black text-[#6D7C66] uppercase tracking-[1.5px]">
            Avg Power
          </p>

          <p className="mt-1 text-2xl sm:text-3xl font-black text-[#40513B]">
            85
            <span className="text-sm ml-1 text-[#6D7C66]">W</span>
          </p>

          <p className="mt-2 text-[9px] font-bold text-[#E67E22] uppercase">
            Optimal range
          </p>

        </div>

      </div>


      {/* =========================================================
          ENERGY PERFORMANCE
      ========================================================= */}
      <div className="bg-[#40513B] rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 mb-8 relative overflow-hidden shadow-xl shadow-[#40513B]/20">

        <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-[#628141]/20 blur-3xl" />
        <div className="absolute -left-20 -bottom-20 w-64 h-64 rounded-full bg-[#E67E22]/10 blur-3xl" />

        <div className="relative z-10">

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-7">

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={15} className="text-[#E5D9B6]" />

                <span className="text-[9px] font-black text-[#E5D9B6] uppercase tracking-[2px]">
                  Performance Overview
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white">
                Excellent Energy Efficiency
              </h2>

              <p className="text-xs text-white/60 mt-1">
                Your mower is producing more energy than it consumes.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-white/10 border border-white/10 rounded-2xl px-4 py-3 w-fit">
              <ArrowUpRight size={18} className="text-[#628141]" />

              <div>
                <p className="text-[9px] text-white/50 font-black uppercase">
                  Efficiency
                </p>

                <p className="text-lg font-black text-white">
                  91.4%
                </p>
              </div>
            </div>

          </div>


          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-[9px] text-white/40 font-black uppercase tracking-widest">
                Harvested
              </p>

              <p className="text-xl font-black text-white mt-1">
                12.8 kWh
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-[9px] text-white/40 font-black uppercase tracking-widest">
                Consumed
              </p>

              <p className="text-xl font-black text-white mt-1">
                9.7 kWh
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-[9px] text-white/40 font-black uppercase tracking-widest">
                Net Gain
              </p>

              <p className="text-xl font-black text-[#D9E8C8] mt-1">
                +3.1 kWh
              </p>
            </div>

          </div>

        </div>
      </div>


      {/* =========================================================
          CHARTS
      ========================================================= */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">


        {/* =======================================================
            BATTERY CHART
        ======================================================= */}
        <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 border border-[#E5D9B6]/50 shadow-sm">

          <div className="flex items-start justify-between mb-7">

            <div>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-[#628141]/10 flex items-center justify-center">
                  <Battery size={17} className="text-[#628141]" />
                </div>

                <h2 className="font-black text-[#40513B] text-sm uppercase tracking-widest">
                  Battery Cycle
                </h2>
              </div>

              <p className="text-xs text-[#6D7C66] font-medium mt-2">
                Battery level throughout the day
              </p>
            </div>

            <div className="text-right">
              <p className="text-[9px] font-black text-[#6D7C66] uppercase">
                Current
              </p>

              <p className="text-xl font-black text-[#628141]">
                87%
              </p>
            </div>

          </div>


          <div className="h-[280px] sm:h-[320px] w-full">

            <ResponsiveContainer width="100%" height="100%">

              <AreaChart
                data={batteryData}
                margin={{
                  top: 10,
                  right: 5,
                  left: -20,
                  bottom: 0,
                }}
              >

                <defs>

                  <linearGradient
                    id="batteryGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >

                    <stop
                      offset="5%"
                      stopColor="#628141"
                      stopOpacity={0.35}
                    />

                    <stop
                      offset="95%"
                      stopColor="#628141"
                      stopOpacity={0}
                    />

                  </linearGradient>

                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#E5D9B6"
                  vertical={false}
                  opacity={0.35}
                />

                <XAxis
                  dataKey="time"
                  stroke="#6D7C66"
                  axisLine={false}
                  tickLine={false}
                  style={{
                    fontSize: "10px",
                    fontWeight: "bold",
                  }}
                />

                <YAxis
                  stroke="#6D7C66"
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 100]}
                  style={{
                    fontSize: "10px",
                    fontWeight: "bold",
                  }}
                />

                <Tooltip
                  cursor={{
                    stroke: "#628141",
                    strokeDasharray: "4 4",
                  }}
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #E5D9B6",
                    borderRadius: "16px",
                    padding: "12px",
                    boxShadow:
                      "0 10px 25px rgba(64,81,59,0.12)",
                  }}
                  formatter={(value: number) => [
                    `${value}%`,
                    "Battery",
                  ]}
                />

                <Area
                  type="monotone"
                  dataKey="level"
                  stroke="#628141"
                  strokeWidth={4}
                  fill="url(#batteryGradient)"
                  dot={false}
                  activeDot={{
                    r: 6,
                    strokeWidth: 3,
                    fill: "#ffffff",
                  }}
                />

              </AreaChart>

            </ResponsiveContainer>

          </div>


          <div className="mt-6 flex items-center gap-3 p-4 bg-[#628141]/5 rounded-2xl border border-[#628141]/10">

            <div className="w-9 h-9 rounded-xl bg-[#628141]/10 flex items-center justify-center">
              <Sun size={16} className="text-[#628141]" />
            </div>

            <div>
              <p className="text-[9px] font-black text-[#628141] uppercase tracking-widest">
                Peak Solar Absorption
              </p>

              <p className="text-xs font-bold text-[#40513B] mt-0.5">
                Recorded at 12:45 PM
              </p>
            </div>

          </div>

        </div>


        {/* =======================================================
            ENERGY BALANCE CHART
        ======================================================= */}
        <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 border border-[#E5D9B6]/50 shadow-sm">

          <div className="flex items-start justify-between mb-7">

            <div>
              <div className="flex items-center gap-2">

                <div className="w-9 h-9 rounded-xl bg-[#E67E22]/10 flex items-center justify-center">
                  <Zap size={17} className="text-[#E67E22]" />
                </div>

                <h2 className="font-black text-[#40513B] text-sm uppercase tracking-widest">
                  Energy Balance
                </h2>

              </div>

              <p className="text-xs text-[#6D7C66] font-medium mt-2">
                Solar energy vs system consumption
              </p>
            </div>

            <div className="text-right">
              <p className="text-[9px] font-black text-[#6D7C66] uppercase">
                Weekly Gain
              </p>

              <p className="text-xl font-black text-[#628141]">
                +3.1 kWh
              </p>
            </div>

          </div>


          <div className="h-[280px] sm:h-[320px] w-full">

            <ResponsiveContainer width="100%" height="100%">

              <BarChart
                data={energyData}
                margin={{
                  top: 10,
                  right: 5,
                  left: -20,
                  bottom: 0,
                }}
                barGap={4}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#E5D9B6"
                  vertical={false}
                  opacity={0.35}
                />

                <XAxis
                  dataKey="day"
                  stroke="#6D7C66"
                  axisLine={false}
                  tickLine={false}
                  style={{
                    fontSize: "10px",
                    fontWeight: "bold",
                  }}
                />

                <YAxis
                  stroke="#6D7C66"
                  axisLine={false}
                  tickLine={false}
                  style={{
                    fontSize: "10px",
                    fontWeight: "bold",
                  }}
                />

                <Tooltip
                  cursor={{
                    fill: "#628141",
                    opacity: 0.05,
                  }}
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #E5D9B6",
                    borderRadius: "16px",
                    padding: "12px",
                    boxShadow:
                      "0 10px 25px rgba(64,81,59,0.12)",
                  }}
                />

                <Bar
                  dataKey="harvested"
                  fill="#E67E22"
                  radius={[7, 7, 0, 0]}
                  name="Solar Harvested"
                />

                <Bar
                  dataKey="consumed"
                  fill="#40513B"
                  radius={[7, 7, 0, 0]}
                  name="Energy Consumed"
                />

              </BarChart>

            </ResponsiveContainer>

          </div>


          <div className="flex flex-wrap items-center justify-center gap-5 mt-6">

            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#E67E22]" />

              <span className="text-[9px] font-black text-[#6D7C66] uppercase tracking-widest">
                Harvested
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#40513B]" />

              <span className="text-[9px] font-black text-[#6D7C66] uppercase tracking-widest">
                Consumed
              </span>
            </div>

          </div>

        </div>

      </div>


      {/* =========================================================
          ENVIRONMENTAL IMPACT
      ========================================================= */}
      <div className="mt-8 bg-[#40513B] rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 text-white relative overflow-hidden shadow-xl shadow-[#40513B]/20">

        <div className="absolute top-0 right-0 w-72 h-72 bg-[#628141]/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />

        <div className="absolute bottom-0 left-0 w-56 h-56 bg-[#E67E22]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />

        <div className="relative z-10">

          <div className="flex items-center gap-3 mb-7">

            <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center">
              <Leaf className="text-[#D9E8C8]" size={21} />
            </div>

            <div>
              <h2 className="font-black text-lg sm:text-xl uppercase tracking-widest">
                Environmental Impact
              </h2>

              <p className="text-xs text-white/50 mt-1">
                Your mower's contribution to cleaner energy
              </p>
            </div>

          </div>


          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* CO2 */}
            <div className="bg-white/5 p-6 rounded-[1.7rem] border border-white/10 hover:bg-white/10 transition">

              <div className="flex items-center justify-between mb-5">

                <div className="w-10 h-10 rounded-xl bg-[#E5D9B6]/10 flex items-center justify-center">
                  <Leaf size={18} className="text-[#E5D9B6]" />
                </div>

                <ArrowUpRight size={17} className="text-[#E5D9B6]" />

              </div>

              <div className="text-3xl font-black text-[#E5D9B6]">
                8.4 kg
              </div>

              <div className="text-[9px] font-black text-white/40 uppercase tracking-widest mt-2">
                CO₂ Saved This Month
              </div>

            </div>


            {/* CLEAN ENERGY */}
            <div className="bg-white/5 p-6 rounded-[1.7rem] border border-white/10 hover:bg-white/10 transition">

              <div className="flex items-center justify-between mb-5">

                <div className="w-10 h-10 rounded-xl bg-[#628141]/20 flex items-center justify-center">
                  <Sun size={18} className="text-[#628141]" />
                </div>

                <ArrowUpRight size={17} className="text-[#628141]" />

              </div>

              <div className="text-3xl font-black text-[#D9E8C8]">
                12.8 kWh
              </div>

              <div className="text-[9px] font-black text-white/40 uppercase tracking-widest mt-2">
                Clean Energy Produced
              </div>

            </div>


            {/* ZERO EMISSION */}
            <div className="bg-white/5 p-6 rounded-[1.7rem] border border-white/10 hover:bg-white/10 transition">

              <div className="flex items-center justify-between mb-5">

                <div className="w-10 h-10 rounded-xl bg-[#E67E22]/10 flex items-center justify-center">
                  <Sparkles size={18} className="text-[#E67E22]" />
                </div>

                <span className="text-[9px] font-black text-[#E67E22]">
                  CLEAN
                </span>

              </div>

              <div className="text-3xl font-black text-[#E67E22]">
                100%
              </div>

              <div className="text-[9px] font-black text-white/40 uppercase tracking-widest mt-2">
                Zero-Emission Operation
              </div>

            </div>

          </div>

        </div>
      </div>


      {/* =========================================================
          FOOTER STATUS
      ========================================================= */}
      <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-2">

        <div className="flex items-center gap-2">

          <span className="w-2 h-2 rounded-full bg-green-500" />

          <span className="text-[9px] font-black text-[#6D7C66] uppercase tracking-widest">
            Energy monitoring active
          </span>

        </div>

        <span className="text-[9px] font-bold text-[#6D7C66]">
          ECOMOW • Solar Powered Mower System
        </span>

      </div>

    </div>
  );
}