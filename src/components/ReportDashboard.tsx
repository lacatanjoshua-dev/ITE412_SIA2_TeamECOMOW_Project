import React, { useEffect, useState } from "react";
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
  AlertTriangle,
} from "lucide-react";

import {
  getDatabase,
  ref,
  onValue,
  off,
} from "firebase/database";

// =====================================================
// TYPES
// =====================================================

interface BatteryData {
  current: number;
  percentage: number;
  power: number;
  status: string;
  voltage: number;
}

interface MowerData {
  connection?: {
    status?: string;
  };

  battery?: {
    drive?: BatteryData;
    mowing?: BatteryData;
  };

  blades?: {
    command?: string;
  };

  drive?: {
    command?: string;
  };

  movement?: {
    command?: string;
  };
}

// =====================================================
// DEFAULT BATTERY
// =====================================================

const defaultBattery: BatteryData = {
  current: 0,
  percentage: 0,
  power: 0,
  status: "UNKNOWN",
  voltage: 0,
};

// =====================================================
// COMPONENT
// =====================================================

export default function ReportDashboard() {
  // ===================================================
  // STATE
  // ===================================================

  const [mower, setMower] = useState<MowerData>({});

  const [mowingBattery, setMowingBattery] =
    useState<BatteryData>(defaultBattery);

  const [driveBattery, setDriveBattery] =
    useState<BatteryData>(defaultBattery);

  const [firebaseConnected, setFirebaseConnected] =
    useState(false);

  const [lastUpdated, setLastUpdated] =
    useState<string>("Waiting for data...");

  // ===================================================
  // FIREBASE REALTIME DATABASE
  // ===================================================

  useEffect(() => {
    let database;

    try {
      database = getDatabase();

      const mowerRef = ref(database, "mower");

      const unsubscribe = onValue(
        mowerRef,
        (snapshot) => {
          const data = snapshot.val();

          console.log("=================================");
          console.log("REALTIME DATABASE UPDATE");
          console.log(data);
          console.log("=================================");

          if (data) {
            setMower(data);

            // -----------------------------------------
            // MOWING BATTERY
            // -----------------------------------------

            if (data.battery?.mowing) {
              setMowingBattery({
                current:
                  Number(data.battery.mowing.current) || 0,

                percentage:
                  Number(data.battery.mowing.percentage) || 0,

                power:
                  Number(data.battery.mowing.power) || 0,

                status:
                  data.battery.mowing.status || "UNKNOWN",

                voltage:
                  Number(data.battery.mowing.voltage) || 0,
              });
            }

            // -----------------------------------------
            // DRIVE BATTERY
            // -----------------------------------------

            if (data.battery?.drive) {
              setDriveBattery({
                current:
                  Number(data.battery.drive.current) || 0,

                percentage:
                  Number(data.battery.drive.percentage) || 0,

                power:
                  Number(data.battery.drive.power) || 0,

                status:
                  data.battery.drive.status || "UNKNOWN",

                voltage:
                  Number(data.battery.drive.voltage) || 0,
              });
            }
          }

          setFirebaseConnected(true);

          setLastUpdated(
            new Date().toLocaleTimeString()
          );
        },
        (error) => {
          console.error(
            "Realtime Database error:",
            error
          );

          setFirebaseConnected(false);
        }
      );

      // Cleanup listener
      return () => {
        off(mowerRef);
        unsubscribe();
      };
    } catch (error) {
      console.error(
        "Failed to initialize Realtime Database:",
        error
      );

      setFirebaseConnected(false);
    }
  }, []);

  // ===================================================
  // VALUES
  // ===================================================

  const connectionStatus =
    mower.connection?.status || "OFFLINE";

  const driveCommand =
    mower.drive?.command || "OFF";

  const bladeCommand =
    mower.blades?.command || "OFF";

  const movementCommand =
    mower.movement?.command || "stop";

  const mowingPercentage =
    Number(mowingBattery.percentage) || 0;

  const drivePercentage =
    Number(driveBattery.percentage) || 0;

  const averageBattery =
    drivePercentage > 0 && mowingPercentage > 0
      ? (drivePercentage + mowingPercentage) / 2
      : mowingPercentage || drivePercentage;

  const batteryHealthy =
    mowingBattery.status === "HEALTHY" ||
    driveBattery.status === "HEALTHY";

  // ===================================================
  // EXPORT REPORT
  // ===================================================

  const handleExportReport = () => {
    const report = {
      generatedAt: new Date().toISOString(),

      firebase: {
        connected: firebaseConnected,
      },

      mower: {
        connection: connectionStatus,
        drive: driveCommand,
        blades: bladeCommand,
        movement: movementCommand,
      },

      battery: {
        mowing: mowingBattery,
        drive: driveBattery,
        averagePercentage: averageBattery,
      },
    };

    const blob = new Blob(
      [JSON.stringify(report, null, 2)],
      {
        type: "application/json",
      }
    );

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;
    a.download = `ECOMOW-Report-${Date.now()}.json`;

    document.body.appendChild(a);

    a.click();

    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  };

  // ===================================================
  // FORMAT
  // ===================================================

  const formatNumber = (
    value: number,
    decimals = 2
  ) => {
    if (!Number.isFinite(value)) {
      return "0";
    }

    return value.toFixed(decimals);
  };

  // ===================================================
  // UI
  // ===================================================

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

        <div>

          <div className="mb-2 flex items-center gap-2">

            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/90 shadow-sm">

              <BarChart3
                className="h-5 w-5 text-[#40513B]"
              />

            </div>

            <span className="text-xs font-black uppercase tracking-[3px] text-white drop-shadow">
              Analytics Center
            </span>

          </div>

          <h1 className="text-3xl font-black tracking-tight text-white drop-shadow sm:text-4xl">
            System Reports
          </h1>

          <p className="mt-2 max-w-2xl text-sm font-medium text-white/80 drop-shadow">
            Monitor ECOMOW performance, battery health,
            energy usage, and system activity in real time.
          </p>

        </div>

        <button
          type="button"
          onClick={handleExportReport}
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


      {/* =================================================
          REALTIME STATUS
      ================================================= */}

      <div
        className={`
          mb-8 flex flex-col gap-4 rounded-[1.5rem]
          border p-5 shadow-lg
          sm:flex-row sm:items-center sm:justify-between
          ${
            firebaseConnected
              ? "border-green-200 bg-green-50/95"
              : "border-red-200 bg-red-50/95"
          }
        `}
      >

        <div className="flex items-center gap-3">

          <div
            className={`
              flex h-11 w-11 items-center justify-center
              rounded-2xl
              ${
                firebaseConnected
                  ? "bg-green-100"
                  : "bg-red-100"
              }
            `}
          >

            {firebaseConnected ? (
              <CheckCircle2
                className="h-6 w-6 text-green-600"
              />
            ) : (
              <AlertTriangle
                className="h-6 w-6 text-red-600"
              />
            )}

          </div>

          <div>

            <p
              className={`
                text-sm font-black
                ${
                  firebaseConnected
                    ? "text-green-700"
                    : "text-red-700"
                }
              `}
            >
              {firebaseConnected
                ? "Firebase Realtime Connected"
                : "Firebase Disconnected"}
            </p>

            <p className="text-xs font-medium text-[#6D7C66]">
              Last update: {lastUpdated}
            </p>

          </div>

        </div>

        <div className="flex items-center gap-3">

          <span className="text-xs font-bold text-[#6D7C66]">
            Mower:
          </span>

          <span
            className={`
              rounded-full px-3 py-1.5
              text-xs font-black uppercase
              ${
                connectionStatus === "ONLINE"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }
            `}
          >
            {connectionStatus}
          </span>

        </div>

      </div>


      {/* =================================================
          REPORT BUILDER
      ================================================= */}

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

          <div className="p-6 sm:p-8 lg:p-10">

            <div className="mb-5 flex items-center gap-3">

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#628141]/10">

                <FileText
                  className="h-6 w-6 text-[#628141]"
                />

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
              Generate and review ECOMOW system reports.
              Battery information is retrieved directly
              from Firebase Realtime Database.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">

              <div className="flex items-center gap-2 rounded-xl bg-[#F8FAF7] px-3 py-2">

                <CalendarDays
                  size={15}
                  className="text-[#628141]"
                />

                <span className="text-xs font-bold text-[#40513B]">
                  Live Data
                </span>

              </div>

              <div className="flex items-center gap-2 rounded-xl bg-[#F8FAF7] px-3 py-2">

                <Activity
                  size={15}
                  className="text-[#628141]"
                />

                <span className="text-xs font-bold text-[#40513B]">
                  {connectionStatus}
                </span>

              </div>

              <div className="flex items-center gap-2 rounded-xl bg-[#F8FAF7] px-3 py-2">

                <Battery
                  size={15}
                  className="text-[#628141]"
                />

                <span className="text-xs font-bold text-[#40513B]">
                  {formatNumber(averageBattery, 1)}%
                </span>

              </div>

            </div>

          </div>


          <div className="flex min-h-[220px] items-center justify-center bg-[#F8FAF7] p-8 lg:w-72">

            <div className="relative flex h-36 w-36 items-center justify-center rounded-full bg-[#628141]/10">

              <div className="absolute h-28 w-28 rounded-full border-2 border-dashed border-[#628141]/30" />

              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-lg">

                <BarChart3
                  className="h-10 w-10 text-[#628141]"
                />

              </div>

              <div className="absolute -right-1 top-4 flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-md">

                <TrendingUp
                  className="h-4 w-4 text-green-600"
                />

              </div>

              <div className="absolute -bottom-1 left-2 flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-md">

                <Zap
                  className="h-4 w-4 text-yellow-500"
                />

              </div>

            </div>

          </div>

        </div>

      </div>


      {/* =================================================
          ANALYTICS CARDS
      ================================================= */}

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">


        {/* BATTERY */}

        <div className="rounded-[1.7rem] border border-white/60 bg-white/95 p-5 shadow-lg transition hover:-translate-y-1 hover:shadow-xl">

          <div className="flex items-start justify-between">

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50">

              <Battery
                className="h-6 w-6 text-green-600"
              />

            </div>

            <span
              className={`
                rounded-full px-2.5 py-1
                text-[9px] font-black uppercase tracking-wider
                ${
                  batteryHealthy
                    ? "bg-green-50 text-green-600"
                    : "bg-red-50 text-red-600"
                }
              `}
            >
              {batteryHealthy
                ? "Healthy"
                : "Check"}
            </span>

          </div>

          <p className="mt-5 text-xs font-bold uppercase tracking-widest text-[#6D7C66]">
            Mowing Battery
          </p>

          <div className="mt-1 flex items-end justify-between">

            <p className="text-3xl font-black text-[#40513B]">
              {formatNumber(mowingPercentage, 1)}%
            </p>

            <span className="text-xs font-bold text-green-600">
              {formatNumber(mowingBattery.voltage, 2)} V
            </span>

          </div>

        </div>


        {/* CURRENT */}

        <div className="rounded-[1.7rem] border border-white/60 bg-white/95 p-5 shadow-lg transition hover:-translate-y-1 hover:shadow-xl">

          <div className="flex items-start justify-between">

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-50">

              <Zap
                className="h-6 w-6 text-yellow-500"
              />

            </div>

            <span className="rounded-full bg-yellow-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-yellow-600">
              Live
            </span>

          </div>

          <p className="mt-5 text-xs font-bold uppercase tracking-widest text-[#6D7C66]">
            Current
          </p>

          <div className="mt-1 flex items-end justify-between">

            <p className="text-3xl font-black text-[#40513B]">
              {formatNumber(
                mowingBattery.current,
                3
              )}
              A
            </p>

            <span className="text-xs font-bold text-[#628141]">
              Mowing
            </span>

          </div>

        </div>


        {/* POWER */}

        <div className="rounded-[1.7rem] border border-white/60 bg-white/95 p-5 shadow-lg transition hover:-translate-y-1 hover:shadow-xl">

          <div className="flex items-start justify-between">

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50">

              <Activity
                className="h-6 w-6 text-blue-600"
              />

            </div>

            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-blue-600">
              Live
            </span>

          </div>

          <p className="mt-5 text-xs font-bold uppercase tracking-widest text-[#6D7C66]">
            Power
          </p>

          <div className="mt-1 flex items-end justify-between">

            <p className="text-3xl font-black text-[#40513B]">
              {formatNumber(
                mowingBattery.power,
                3
              )}
              W
            </p>

            <span className="text-xs font-bold text-blue-600">
              Mowing
            </span>

          </div>

        </div>


        {/* SYSTEM */}

        <div className="rounded-[1.7rem] border border-white/60 bg-white/95 p-5 shadow-lg transition hover:-translate-y-1 hover:shadow-xl">

          <div className="flex items-start justify-between">

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50">

              <Cpu
                className="h-6 w-6 text-purple-600"
              />

            </div>

            <span
              className={`
                rounded-full px-2.5 py-1
                text-[9px] font-black uppercase tracking-wider
                ${
                  connectionStatus === "ONLINE"
                    ? "bg-green-50 text-green-600"
                    : "bg-red-50 text-red-600"
                }
              `}
            >
              {connectionStatus}
            </span>

          </div>

          <p className="mt-5 text-xs font-bold uppercase tracking-widest text-[#6D7C66]">
            Drive System
          </p>

          <div className="mt-1 flex items-end justify-between">

            <p className="text-3xl font-black text-[#40513B]">
              {driveCommand}
            </p>

            <span className="text-xs font-bold text-purple-600">
              {movementCommand}
            </span>

          </div>

        </div>

      </div>


      {/* =================================================
          BATTERY DETAILS
      ================================================= */}

      <div className="mb-8 grid grid-cols-1 gap-5 lg:grid-cols-2">


        {/* MOWING BATTERY */}

        <div className="rounded-[2rem] border border-white/60 bg-white/95 p-6 shadow-xl">

          <div className="mb-6 flex items-center justify-between">

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-50">

                <Battery
                  className="h-5 w-5 text-green-600"
                />

              </div>

              <div>

                <h3 className="font-black text-[#40513B]">
                  Mowing Battery
                </h3>

                <p className="text-xs text-[#6D7C66]">
                  INA226 real-time measurements
                </p>

              </div>

            </div>

            <span className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-black text-green-600">
              {mowingBattery.status}
            </span>

          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">

            <div className="rounded-2xl bg-[#F8FAF7] p-4">

              <p className="text-[10px] font-black uppercase text-[#6D7C66]">
                Voltage
              </p>

              <p className="mt-2 text-xl font-black text-[#40513B]">
                {formatNumber(
                  mowingBattery.voltage,
                  2
                )} V
              </p>

            </div>

            <div className="rounded-2xl bg-[#F8FAF7] p-4">

              <p className="text-[10px] font-black uppercase text-[#6D7C66]">
                Current
              </p>

              <p className="mt-2 text-xl font-black text-[#40513B]">
                {formatNumber(
                  mowingBattery.current,
                  3
                )} A
              </p>

            </div>

            <div className="rounded-2xl bg-[#F8FAF7] p-4">

              <p className="text-[10px] font-black uppercase text-[#6D7C66]">
                Power
              </p>

              <p className="mt-2 text-xl font-black text-[#40513B]">
                {formatNumber(
                  mowingBattery.power,
                  3
                )} W
              </p>

            </div>

            <div className="rounded-2xl bg-[#F8FAF7] p-4">

              <p className="text-[10px] font-black uppercase text-[#6D7C66]">
                Health
              </p>

              <p className="mt-2 text-xl font-black text-[#40513B]">
                {formatNumber(
                  mowingBattery.percentage,
                  1
                )}%
              </p>

            </div>

          </div>

        </div>


        {/* DRIVE BATTERY */}

        <div className="rounded-[2rem] border border-white/60 bg-white/95 p-6 shadow-xl">

          <div className="mb-6 flex items-center justify-between">

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50">

                <Battery
                  className="h-5 w-5 text-blue-600"
                />

              </div>

              <div>

                <h3 className="font-black text-[#40513B]">
                  Drive Battery
                </h3>

                <p className="text-xs text-[#6D7C66]">
                  Realtime battery measurements
                </p>

              </div>

            </div>

            <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-black text-gray-500">
              {driveBattery.status}
            </span>

          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">

            <div className="rounded-2xl bg-[#F8FAF7] p-4">

              <p className="text-[10px] font-black uppercase text-[#6D7C66]">
                Voltage
              </p>

              <p className="mt-2 text-xl font-black text-[#40513B]">
                {formatNumber(
                  driveBattery.voltage,
                  2
                )} V
              </p>

            </div>

            <div className="rounded-2xl bg-[#F8FAF7] p-4">

              <p className="text-[10px] font-black uppercase text-[#6D7C66]">
                Current
              </p>

              <p className="mt-2 text-xl font-black text-[#40513B]">
                {formatNumber(
                  driveBattery.current,
                  3
                )} A
              </p>

            </div>

            <div className="rounded-2xl bg-[#F8FAF7] p-4">

              <p className="text-[10px] font-black uppercase text-[#6D7C66]">
                Power
              </p>

              <p className="mt-2 text-xl font-black text-[#40513B]">
                {formatNumber(
                  driveBattery.power,
                  3
                )} W
              </p>

            </div>

            <div className="rounded-2xl bg-[#F8FAF7] p-4">

              <p className="text-[10px] font-black uppercase text-[#6D7C66]">
                Health
              </p>

              <p className="mt-2 text-xl font-black text-[#40513B]">
                {formatNumber(
                  driveBattery.percentage,
                  1
                )}%
              </p>

            </div>

          </div>

        </div>

      </div>


      {/* =================================================
          REPORT PREVIEW
      ================================================= */}

      <div className="overflow-hidden rounded-[2rem] border border-white/60 bg-white/95 shadow-xl">

        <div className="flex flex-col gap-4 border-b border-gray-100 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#628141]/10">

              <FileText
                className="h-5 w-5 text-[#628141]"
              />

            </div>

            <div>

              <h3 className="font-black text-[#40513B]">
                Report Preview
              </h3>

              <p className="mt-1 text-xs font-medium text-[#6D7C66]">
                Current ECOMOW system information
              </p>

            </div>

          </div>

        </div>


        {/* TABLE */}

        <div className="overflow-x-auto">

          <table className="w-full text-sm">

            <thead>

              <tr className="border-b border-gray-100 bg-[#F8FAF7]">

                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-[#6D7C66]">
                  Information
                </th>

                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-[#6D7C66]">
                  Value
                </th>

                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-[#6D7C66]">
                  Status
                </th>

              </tr>

            </thead>

            <tbody>


              <tr className="border-b border-gray-100">

                <td className="px-6 py-5 font-black text-[#40513B]">
                  Firebase
                </td>

                <td className="px-6 py-5 font-bold text-[#6D7C66]">
                  Realtime Database
                </td>

                <td className="px-6 py-5">

                  <span
                    className={`
                      rounded-full px-3 py-1.5
                      text-xs font-black
                      ${
                        firebaseConnected
                          ? "bg-green-50 text-green-600"
                          : "bg-red-50 text-red-600"
                      }
                    `}
                  >
                    {firebaseConnected
                      ? "CONNECTED"
                      : "OFFLINE"}
                  </span>

                </td>

              </tr>


              <tr className="border-b border-gray-100">

                <td className="px-6 py-5 font-black text-[#40513B]">
                  Mower
                </td>

                <td className="px-6 py-5 font-bold text-[#6D7C66]">
                  {connectionStatus}
                </td>

                <td className="px-6 py-5">

                  <span className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-black text-green-600">
                    LIVE
                  </span>

                </td>

              </tr>


              <tr className="border-b border-gray-100">

                <td className="px-6 py-5 font-black text-[#40513B]">
                  Mowing Battery
                </td>

                <td className="px-6 py-5 font-bold text-[#6D7C66]">
                  {formatNumber(
                    mowingBattery.voltage,
                    2
                  )} V /{" "}
                  {formatNumber(
                    mowingBattery.percentage,
                    1
                  )}%
                </td>

                <td className="px-6 py-5">

                  <span className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-black text-green-600">
                    {mowingBattery.status}
                  </span>

                </td>

              </tr>


              <tr className="border-b border-gray-100">

                <td className="px-6 py-5 font-black text-[#40513B]">
                  Drive
                </td>

                <td className="px-6 py-5 font-bold text-[#6D7C66]">
                  {driveCommand}
                </td>

                <td className="px-6 py-5">

                  <span
                    className={`
                      rounded-full px-3 py-1.5
                      text-xs font-black
                      ${
                        driveCommand === "ON"
                          ? "bg-green-50 text-green-600"
                          : "bg-gray-100 text-gray-500"
                      }
                    `}
                  >
                    {driveCommand}
                  </span>

                </td>

              </tr>


              <tr>

                <td className="px-6 py-5 font-black text-[#40513B]">
                  Blades
                </td>

                <td className="px-6 py-5 font-bold text-[#6D7C66]">
                  {bladeCommand}
                </td>

                <td className="px-6 py-5">

                  <span
                    className={`
                      rounded-full px-3 py-1.5
                      text-xs font-black
                      ${
                        bladeCommand === "ON"
                          ? "bg-green-50 text-green-600"
                          : "bg-gray-100 text-gray-500"
                      }
                    `}
                  >
                    {bladeCommand}
                  </span>

                </td>

              </tr>

            </tbody>

          </table>

        </div>

      </div>


      {/* =================================================
          FOOTER
      ================================================= */}

      <div className="mt-6 flex flex-col gap-3 rounded-[1.5rem] border border-white/50 bg-white/80 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">

        <div className="flex items-center gap-3">

          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-50">

            <Activity
              className="h-4 w-4 text-green-600"
            />

          </span>

          <div>

            <p className="text-xs font-black uppercase tracking-wider text-[#40513B]">
              System Reporting
            </p>

            <p className="text-[11px] font-medium text-[#6D7C66]">
              Data is synchronized from Firebase
              Realtime Database.
            </p>

          </div>

        </div>

        <span
          className={`
            flex items-center gap-2
            text-[10px] font-black uppercase tracking-widest
            ${
              firebaseConnected
                ? "text-green-600"
                : "text-red-600"
            }
          `}
        >

          <span
            className={`
              h-2 w-2 animate-pulse rounded-full
              ${
                firebaseConnected
                  ? "bg-green-500"
                  : "bg-red-500"
              }
            `}
          />

          {firebaseConnected
            ? "Realtime Online"
            : "Realtime Offline"}

        </span>

      </div>

    </div>
  );
}