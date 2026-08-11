import React, { useEffect, useState } from "react";
import {
  BarChart3,
  Download,
  Battery,
  Cpu,
  FileText,
  CheckCircle2,
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

  mode?: {
    current?: string;
  };

  battery?: {
    mowing?: BatteryData;
    drive?: BatteryData;
  };

  blades?: {
    command?: string;
    status?: string;
  };

  drive?: {
    command?: string;
    status?: string;
  };

  movement?: {
    command?: string;
  };

  steering?: {
    command?: string;
    status?: string;
  };

  automatic?: {
    command?: string;
    status?: string;
  };
}

// =====================================================
// DEFAULT DATA
// =====================================================

const defaultBattery: BatteryData = {
  current: 0,
  percentage: 0,
  power: 0,
  status: "UNKNOWN",
  voltage: 0,
};

const defaultMower: MowerData = {};

// =====================================================
// COMPONENT
// =====================================================

export default function ReportDashboard() {
  // ===================================================
  // STATE
  // ===================================================

  const [mower, setMower] =
    useState<MowerData>(defaultMower);

  const [mowingBattery, setMowingBattery] =
    useState<BatteryData>(defaultBattery);

  const [driveBattery, setDriveBattery] =
    useState<BatteryData>(defaultBattery);

  const [firebaseConnected, setFirebaseConnected] =
    useState(false);

  const [lastUpdated, setLastUpdated] =
    useState("Waiting for data...");

  // ===================================================
  // FIREBASE REALTIME DATABASE
  // ===================================================

  useEffect(() => {
    const database = getDatabase();

    // IMPORTANT:
    // Firebase structure:
    // ecomow/mower/...
    const mowerRef = ref(
      database,
      "ecomow/mower"
    );

    const handleValue = (snapshot: any) => {
      const data = snapshot.val();

      console.log(
        "================================="
      );
      console.log(
        "ECOMOW REALTIME DATABASE UPDATE"
      );
      console.log(data);
      console.log(
        "================================="
      );

      // -------------------------------------------------
      // Firebase connected
      // -------------------------------------------------

      setFirebaseConnected(true);

      setLastUpdated(
        new Date().toLocaleTimeString()
      );

      // -------------------------------------------------
      // No mower data
      // -------------------------------------------------

      if (!data) {
        setMower(defaultMower);
        setMowingBattery(defaultBattery);
        setDriveBattery(defaultBattery);

        return;
      }

      // -------------------------------------------------
      // SAVE COMPLETE MOWER DATA
      // -------------------------------------------------

      setMower(data);

      // =================================================
      // MOWING BATTERY
      // Path:
      // ecomow/mower/battery/mowing
      // =================================================

      if (data.battery?.mowing) {
        const mowing = data.battery.mowing;

        const updatedMowingBattery: BatteryData = {
          voltage:
            Number(mowing.voltage) || 0,

          current:
            Number(mowing.current) || 0,

          power:
            Number(mowing.power) || 0,

          percentage:
            Number(mowing.percentage) || 0,

          status:
            String(
              mowing.status || "UNKNOWN"
            ),
        };

        console.log(
          "🔋 MOWING BATTERY"
        );

        console.log(
          "Voltage:",
          updatedMowingBattery.voltage,
          "V"
        );

        console.log(
          "Current:",
          updatedMowingBattery.current,
          "A"
        );

        console.log(
          "Power:",
          updatedMowingBattery.power,
          "W"
        );

        console.log(
          "Percentage:",
          updatedMowingBattery.percentage,
          "%"
        );

        console.log(
          "Status:",
          updatedMowingBattery.status
        );

        setMowingBattery(
          updatedMowingBattery
        );
      } else {
        setMowingBattery(
          defaultBattery
        );
      }

      // =================================================
      // DRIVE BATTERY
      // Path:
      // ecomow/mower/battery/drive
      // =================================================

      if (data.battery?.drive) {
        const drive = data.battery.drive;

        const updatedDriveBattery: BatteryData = {
          voltage:
            Number(drive.voltage) || 0,

          current:
            Number(drive.current) || 0,

          power:
            Number(drive.power) || 0,

          percentage:
            Number(drive.percentage) || 0,

          status:
            String(
              drive.status || "UNKNOWN"
            ),
        };

        console.log(
          "🚗 DRIVE BATTERY"
        );

        console.log(
          "Voltage:",
          updatedDriveBattery.voltage,
          "V"
        );

        console.log(
          "Current:",
          updatedDriveBattery.current,
          "A"
        );

        console.log(
          "Power:",
          updatedDriveBattery.power,
          "W"
        );

        console.log(
          "Percentage:",
          updatedDriveBattery.percentage,
          "%"
        );

        console.log(
          "Status:",
          updatedDriveBattery.status
        );

        setDriveBattery(
          updatedDriveBattery
        );
      } else {
        setDriveBattery(
          defaultBattery
        );
      }
    };

    const handleError = (error: Error) => {
      console.error(
        "Firebase Realtime Database error:",
        error
      );

      setFirebaseConnected(false);

      setLastUpdated(
        "Connection error"
      );
    };

    // -------------------------------------------------
    // START REALTIME LISTENER
    // -------------------------------------------------

    onValue(
      mowerRef,
      handleValue,
      handleError
    );

    // -------------------------------------------------
    // CLEANUP
    // -------------------------------------------------

    return () => {
      off(mowerRef);
    };
  }, []);

  // ===================================================
  // VALUES
  // ===================================================

  const connectionStatus =
    mower.connection?.status ||
    "OFFLINE";

  const mode =
    mower.mode?.current ||
    "UNKNOWN";

  const driveCommand =
    mower.drive?.command ||
    "OFF";

  const driveStatus =
    mower.drive?.status ||
    "OFF";

  const bladeCommand =
    mower.blades?.command ||
    "OFF";

  const bladeStatus =
    mower.blades?.status ||
    "OFF";

  const movementCommand =
    mower.movement?.command ||
    "STOP";

  const steeringCommand =
    mower.steering?.command ||
    "STOP";

  const automaticCommand =
    mower.automatic?.command ||
    "STOP";

  const automaticStatus =
    mower.automatic?.status ||
    "STOPPED";

  // ===================================================
  // BATTERY VALUES
  // ===================================================

  const mowingPercentage =
    Number(
      mowingBattery.percentage
    ) || 0;

  const drivePercentage =
    Number(
      driveBattery.percentage
    ) || 0;

  const averageBattery =
    drivePercentage > 0 &&
    mowingPercentage > 0
      ? (drivePercentage +
          mowingPercentage) /
        2
      : mowingPercentage ||
        drivePercentage;

  const mowingHealthy =
    mowingBattery.status
      .toUpperCase() ===
    "HEALTHY";

  const driveHealthy =
    driveBattery.status
      .toUpperCase() ===
    "HEALTHY";

  // ===================================================
  // FORMAT NUMBER
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
  // EXPORT REPORT
  // ===================================================

  const handleExportReport = () => {
    const report = {
      generatedAt:
        new Date().toISOString(),

      firebase: {
        connected:
          firebaseConnected,

        lastUpdated,
      },

      mower: {
        connection:
          connectionStatus,

        mode,

        drive: {
          command:
            driveCommand,

          status:
            driveStatus,
        },

        blades: {
          command:
            bladeCommand,

          status:
            bladeStatus,
        },

        movement:
          movementCommand,

        steering: {
          command:
            steeringCommand,
        },

        automatic: {
          command:
            automaticCommand,

          status:
            automaticStatus,
        },
      },

      battery: {
        mowing: {
          voltage:
            mowingBattery.voltage,

          current:
            mowingBattery.current,

          power:
            mowingBattery.power,

          percentage:
            mowingBattery.percentage,

          status:
            mowingBattery.status,
        },

        drive: {
          voltage:
            driveBattery.voltage,

          current:
            driveBattery.current,

          power:
            driveBattery.power,

          percentage:
            driveBattery.percentage,

          status:
            driveBattery.status,
        },

        averagePercentage:
          averageBattery,
      },
    };

    const blob = new Blob(
      [
        JSON.stringify(
          report,
          null,
          2
        ),
      ],
      {
        type:
          "application/json",
      }
    );

    const url =
      URL.createObjectURL(
        blob
      );

    const a =
      document.createElement(
        "a"
      );

    a.href = url;

    a.download =
      `ECOMOW-Report-${Date.now()}.json`;

    document.body.appendChild(
      a
    );

    a.click();

    document.body.removeChild(
      a
    );

    URL.revokeObjectURL(url);
  };

  // ===================================================
  // BATTERY STATUS COLOR
  // ===================================================

  const getBatteryStatusClass = (
    status: string
  ) => {
    switch (
      status.toUpperCase()
    ) {
      case "HEALTHY":
        return "bg-green-50 text-green-600";

      case "NORMAL":
        return "bg-blue-50 text-blue-600";

      case "LOW":
        return "bg-yellow-50 text-yellow-600";

      case "CRITICAL":
        return "bg-red-50 text-red-600";

      default:
        return "bg-gray-100 text-gray-500";
    }
  };

  // ===================================================
  // UI
  // ===================================================

  return (
    <div>
      {/* =================================================
          HEADER
      ================================================= */}

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
            Monitor ECOMOW performance,
            battery health, energy usage,
            and system activity in real time.
          </p>
        </div>

        <button
          type="button"
          onClick={
            handleExportReport
          }
          className="flex items-center justify-center gap-2 rounded-2xl bg-[#40513B] px-5 py-3 text-sm font-black uppercase tracking-wider text-white shadow-lg shadow-black/20 transition-all hover:bg-[#2C3627] active:scale-[0.97]"
        >
          <Download size={18} />
          Export Report
        </button>
      </div>

      {/* =================================================
          REALTIME STATUS
      ================================================= */}

      <div
        className={`mb-8 flex flex-col gap-4 rounded-[1.5rem] border p-5 shadow-lg sm:flex-row sm:items-center sm:justify-between ${
          firebaseConnected
            ? "border-green-200 bg-green-50/95"
            : "border-red-200 bg-red-50/95"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
              firebaseConnected
                ? "bg-green-100"
                : "bg-red-100"
            }`}
          >
            {firebaseConnected ? (
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            ) : (
              <AlertTriangle className="h-6 w-6 text-red-600" />
            )}
          </div>

          <div>
            <p
              className={`text-sm font-black ${
                firebaseConnected
                  ? "text-green-700"
                  : "text-red-700"
              }`}
            >
              {firebaseConnected
                ? "Firebase Realtime Connected"
                : "Firebase Disconnected"}
            </p>

            <p className="text-xs font-medium text-[#6D7C66]">
              Last update:{" "}
              {lastUpdated}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-[#6D7C66]">
            Mower:
          </span>

          <span
            className={`rounded-full px-3 py-1.5 text-xs font-black uppercase ${
              connectionStatus.toUpperCase() ===
              "ONLINE"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {connectionStatus}
          </span>
        </div>
      </div>

      {/* =================================================
          REPORT BUILDER
      ================================================= */}

      <div className="mb-8 overflow-hidden rounded-[2rem] border border-white/50 bg-white/95 shadow-xl">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto]">
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
              Generate and review ECOMOW
              system reports. Battery
              information is retrieved
              directly from Firebase
              Realtime Database.
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
                  {formatNumber(
                    averageBattery,
                    1
                  )}
                  %
                </span>
              </div>

              <div className="flex items-center gap-2 rounded-xl bg-[#F8FAF7] px-3 py-2">
                <Cpu
                  size={15}
                  className="text-[#628141]"
                />

                <span className="text-xs font-bold text-[#40513B]">
                  {mode}
                </span>
              </div>
            </div>
          </div>

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

      {/* =================================================
          ANALYTICS CARDS
      ================================================= */}

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* MOWING BATTERY */}

        <div className="rounded-[1.7rem] border border-white/60 bg-white/95 p-5 shadow-lg transition hover:-translate-y-1 hover:shadow-xl">
          <div className="flex items-start justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50">
              <Battery className="h-6 w-6 text-green-600" />
            </div>

            <span
              className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ${getBatteryStatusClass(
                mowingBattery.status
              )}`}
            >
              {mowingBattery.status}
            </span>
          </div>

          <p className="mt-5 text-xs font-bold uppercase tracking-widest text-[#6D7C66]">
            Mowing Battery
          </p>

          <div className="mt-1 flex items-end justify-between">
            <p className="text-3xl font-black text-[#40513B]">
              {formatNumber(
                mowingBattery.percentage,
                1
              )}
              %
            </p>

            <span className="text-xs font-bold text-green-600">
              {formatNumber(
                mowingBattery.voltage,
                2
              )}{" "}
              V
            </span>
          </div>
        </div>

        {/* DRIVE BATTERY */}

        <div className="rounded-[1.7rem] border border-white/60 bg-white/95 p-5 shadow-lg transition hover:-translate-y-1 hover:shadow-xl">
          <div className="flex items-start justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50">
              <Battery className="h-6 w-6 text-blue-600" />
            </div>

            <span
              className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ${getBatteryStatusClass(
                driveBattery.status
              )}`}
            >
              {driveBattery.status}
            </span>
          </div>

          <p className="mt-5 text-xs font-bold uppercase tracking-widest text-[#6D7C66]">
            Drive Battery
          </p>

          <div className="mt-1 flex items-end justify-between">
            <p className="text-3xl font-black text-[#40513B]">
              {formatNumber(
                driveBattery.percentage,
                1
              )}
              %
            </p>

            <span className="text-xs font-bold text-blue-600">
              {formatNumber(
                driveBattery.voltage,
                2
              )}{" "}
              V
            </span>
          </div>
        </div>

        {/* CURRENT */}

        <div className="rounded-[1.7rem] border border-white/60 bg-white/95 p-5 shadow-lg transition hover:-translate-y-1 hover:shadow-xl">
          <div className="flex items-start justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-50">
              <Zap className="h-6 w-6 text-yellow-500" />
            </div>

            <span className="rounded-full bg-yellow-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-yellow-600">
              LIVE
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
              )}{" "}
              A
            </p>

            <span className="text-xs font-bold text-[#628141]">
              Mowing
            </span>
          </div>
        </div>

        {/* SYSTEM */}

        <div className="rounded-[1.7rem] border border-white/60 bg-white/95 p-5 shadow-lg transition hover:-translate-y-1 hover:shadow-xl">
          <div className="flex items-start justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50">
              <Cpu className="h-6 w-6 text-purple-600" />
            </div>

            <span
              className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ${
                connectionStatus.toUpperCase() ===
                "ONLINE"
                  ? "bg-green-50 text-green-600"
                  : "bg-red-50 text-red-600"
              }`}
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
          MOWING BATTERY
      ================================================= */}

      <div className="mb-8 rounded-[2rem] border border-white/60 bg-white/95 p-6 shadow-xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50">
              <Battery className="h-6 w-6 text-green-600" />
            </div>

            <div>
              <h3 className="font-black text-[#40513B]">
                Mowing Battery
              </h3>

              <p className="text-xs text-[#6D7C66]">
                Realtime battery
                measurements
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`rounded-full px-3 py-1.5 text-xs font-black ${getBatteryStatusClass(
                mowingBattery.status
              )}`}
            >
              {mowingBattery.status}
            </span>

            {firebaseConnected && (
              <span className="flex items-center gap-2 rounded-full bg-green-50 px-3 py-1.5 text-xs font-black text-green-600">
                <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                LIVE
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {/* VOLTAGE */}

          <div className="rounded-2xl bg-[#F8FAF7] p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#6D7C66]">
              Voltage
            </p>

            <p className="mt-2 text-2xl font-black text-[#40513B]">
              {formatNumber(
                mowingBattery.voltage,
                2
              )}{" "}
              V
            </p>
          </div>

          {/* CURRENT */}

          <div className="rounded-2xl bg-[#F8FAF7] p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#6D7C66]">
              Current
            </p>

            <p className="mt-2 text-2xl font-black text-[#40513B]">
              {formatNumber(
                mowingBattery.current,
                3
              )}{" "}
              A
            </p>
          </div>

          {/* POWER */}

          <div className="rounded-2xl bg-[#F8FAF7] p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#6D7C66]">
              Power
            </p>

            <p className="mt-2 text-2xl font-black text-[#40513B]">
              {formatNumber(
                mowingBattery.power,
                3
              )}{" "}
              W
            </p>
          </div>

          {/* PERCENTAGE */}

          <div className="rounded-2xl bg-[#F8FAF7] p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#6D7C66]">
              Percentage
            </p>

            <p className="mt-2 text-2xl font-black text-[#40513B]">
              {formatNumber(
                mowingBattery.percentage,
                1
              )}{" "}
              %
            </p>

            <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-green-500 transition-all duration-500"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(
                      0,
                      mowingBattery.percentage
                    )
                  )}%`,
                }}
              />
            </div>
          </div>

          {/* STATUS */}

          <div className="rounded-2xl bg-[#F8FAF7] p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#6D7C66]">
              Status
            </p>

            <div className="mt-2 flex items-center gap-2">
              {mowingHealthy ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              )}

              <p className="text-xl font-black text-[#40513B]">
                {mowingBattery.status}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-green-100 bg-green-50/70 p-4">
          <p className="text-xs font-black uppercase tracking-wider text-green-700">
            Firebase Realtime Data
          </p>

          <p className="mt-1 text-[11px] font-medium text-green-700/80">
            Battery data is being
            read from:
          </p>

          <code className="mt-1 block text-[11px] font-bold text-[#40513B]">
            ecomow/mower/battery/mowing
          </code>
        </div>
      </div>

      {/* =================================================
          DRIVE BATTERY
      ================================================= */}

      <div className="mb-8 rounded-[2rem] border border-white/60 bg-white/95 p-6 shadow-xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50">
              <Battery className="h-6 w-6 text-blue-600" />
            </div>

            <div>
              <h3 className="font-black text-[#40513B]">
                Drive Battery
              </h3>

              <p className="text-xs text-[#6D7C66]">
                Realtime battery
                measurements
              </p>
            </div>
          </div>

          <span
            className={`rounded-full px-3 py-1.5 text-xs font-black ${getBatteryStatusClass(
              driveBattery.status
            )}`}
          >
            {driveBattery.status}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {/* VOLTAGE */}

          <div className="rounded-2xl bg-[#F8FAF7] p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#6D7C66]">
              Voltage
            </p>

            <p className="mt-2 text-2xl font-black text-[#40513B]">
              {formatNumber(
                driveBattery.voltage,
                2
              )}{" "}
              V
            </p>
          </div>

          {/* CURRENT */}

          <div className="rounded-2xl bg-[#F8FAF7] p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#6D7C66]">
              Current
            </p>

            <p className="mt-2 text-2xl font-black text-[#40513B]">
              {formatNumber(
                driveBattery.current,
                3
              )}{" "}
              A
            </p>
          </div>

          {/* POWER */}

          <div className="rounded-2xl bg-[#F8FAF7] p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#6D7C66]">
              Power
            </p>

            <p className="mt-2 text-2xl font-black text-[#40513B]">
              {formatNumber(
                driveBattery.power,
                3
              )}{" "}
              W
            </p>
          </div>

          {/* PERCENTAGE */}

          <div className="rounded-2xl bg-[#F8FAF7] p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#6D7C66]">
              Percentage
            </p>

            <p className="mt-2 text-2xl font-black text-[#40513B]">
              {formatNumber(
                driveBattery.percentage,
                1
              )}{" "}
              %
            </p>

            <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-blue-500 transition-all duration-500"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(
                      0,
                      driveBattery.percentage
                    )
                  )}%`,
                }}
              />
            </div>
          </div>

          {/* STATUS */}

          <div className="rounded-2xl bg-[#F8FAF7] p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#6D7C66]">
              Status
            </p>

            <div className="mt-2 flex items-center gap-2">
              {driveHealthy ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              )}

              <p className="text-xl font-black text-[#40513B]">
                {driveBattery.status}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
          <p className="text-xs font-black uppercase tracking-wider text-blue-700">
            Firebase Realtime Data
          </p>

          <p className="mt-1 text-[11px] font-medium text-blue-700/80">
            Battery data is being
            read from:
          </p>

          <code className="mt-1 block text-[11px] font-bold text-[#40513B]">
            ecomow/mower/battery/drive
          </code>
        </div>
      </div>

      {/* =================================================
          SYSTEM INFORMATION
      ================================================= */}

      <div className="mb-8 rounded-[2rem] border border-white/60 bg-white/95 p-6 shadow-xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-50">
            <Cpu className="h-5 w-5 text-purple-600" />
          </div>

          <div>
            <h3 className="font-black text-[#40513B]">
              Mower System Status
            </h3>

            <p className="text-xs text-[#6D7C66]">
              Live ECOMOW controller
              information
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl bg-[#F8FAF7] p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#6D7C66]">
              Mode
            </p>

            <p className="mt-2 text-2xl font-black text-[#40513B]">
              {mode}
            </p>
          </div>

          <div className="rounded-2xl bg-[#F8FAF7] p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#6D7C66]">
              Drive
            </p>

            <p className="mt-2 text-2xl font-black text-[#40513B]">
              {driveCommand}
            </p>

            <p className="mt-1 text-[10px] font-bold text-[#6D7C66]">
              Status: {driveStatus}
            </p>
          </div>

          <div className="rounded-2xl bg-[#F8FAF7] p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#6D7C66]">
              Blades
            </p>

            <p className="mt-2 text-2xl font-black text-[#40513B]">
              {bladeCommand}
            </p>

            <p className="mt-1 text-[10px] font-bold text-[#6D7C66]">
              Status: {bladeStatus}
            </p>
          </div>

          <div className="rounded-2xl bg-[#F8FAF7] p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#6D7C66]">
              Movement
            </p>

            <p className="mt-2 text-2xl font-black text-[#40513B]">
              {movementCommand}
            </p>
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
              <FileText className="h-5 w-5 text-[#628141]" />
            </div>

            <div>
              <h3 className="font-black text-[#40513B]">
                Report Preview
              </h3>

              <p className="mt-1 text-xs font-medium text-[#6D7C66]">
                Current ECOMOW system
                information
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={
              handleExportReport
            }
            className="flex items-center justify-center gap-2 rounded-xl bg-[#F8FAF7] px-4 py-2.5 text-xs font-black text-[#40513B] transition hover:bg-[#628141]/10"
          >
            <Download size={15} />
            Export
          </button>
        </div>

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
              {/* FIREBASE */}

              <tr className="border-b border-gray-100">
                <td className="px-6 py-5 font-black text-[#40513B]">
                  Firebase
                </td>

                <td className="px-6 py-5 font-bold text-[#6D7C66]">
                  Realtime Database
                </td>

                <td className="px-6 py-5">
                  <span
                    className={`rounded-full px-3 py-1.5 text-xs font-black ${
                      firebaseConnected
                        ? "bg-green-50 text-green-600"
                        : "bg-red-50 text-red-600"
                    }`}
                  >
                    {firebaseConnected
                      ? "CONNECTED"
                      : "OFFLINE"}
                  </span>
                </td>
              </tr>

              {/* MOWER */}

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

              {/* MODE */}

              <tr className="border-b border-gray-100">
                <td className="px-6 py-5 font-black text-[#40513B]">
                  Mode
                </td>

                <td className="px-6 py-5 font-bold text-[#6D7C66]">
                  {mode}
                </td>

                <td className="px-6 py-5">
                  <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-600">
                    LIVE
                  </span>
                </td>
              </tr>

              {/* MOWING VOLTAGE */}

              <tr className="border-b border-gray-100">
                <td className="px-6 py-5 font-black text-[#40513B]">
                  Mowing Battery Voltage
                </td>

                <td className="px-6 py-5 font-bold text-[#6D7C66]">
                  {formatNumber(
                    mowingBattery.voltage,
                    2
                  )}{" "}
                  V
                </td>

                <td className="px-6 py-5">
                  <span className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-black text-green-600">
                    RECEIVED
                  </span>
                </td>
              </tr>

              {/* MOWING CURRENT */}

              <tr className="border-b border-gray-100">
                <td className="px-6 py-5 font-black text-[#40513B]">
                  Mowing Battery Current
                </td>

                <td className="px-6 py-5 font-bold text-[#6D7C66]">
                  {formatNumber(
                    mowingBattery.current,
                    3
                  )}{" "}
                  A
                </td>

                <td className="px-6 py-5">
                  <span className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-black text-green-600">
                    RECEIVED
                  </span>
                </td>
              </tr>

              {/* MOWING POWER */}

              <tr className="border-b border-gray-100">
                <td className="px-6 py-5 font-black text-[#40513B]">
                  Mowing Battery Power
                </td>

                <td className="px-6 py-5 font-bold text-[#6D7C66]">
                  {formatNumber(
                    mowingBattery.power,
                    3
                  )}{" "}
                  W
                </td>

                <td className="px-6 py-5">
                  <span className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-black text-green-600">
                    RECEIVED
                  </span>
                </td>
              </tr>

              {/* MOWING PERCENTAGE */}

              <tr className="border-b border-gray-100">
                <td className="px-6 py-5 font-black text-[#40513B]">
                  Mowing Battery Percentage
                </td>

                <td className="px-6 py-5 font-bold text-[#6D7C66]">
                  {formatNumber(
                    mowingBattery.percentage,
                    1
                  )}{" "}
                  %
                </td>

                <td className="px-6 py-5">
                  <span className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-black text-green-600">
                    RECEIVED
                  </span>
                </td>
              </tr>

              {/* MOWING STATUS */}

              <tr className="border-b border-gray-100">
                <td className="px-6 py-5 font-black text-[#40513B]">
                  Mowing Battery Status
                </td>

                <td className="px-6 py-5 font-bold text-[#6D7C66]">
                  {mowingBattery.status}
                </td>

                <td className="px-6 py-5">
                  <span
                    className={`rounded-full px-3 py-1.5 text-xs font-black ${getBatteryStatusClass(
                      mowingBattery.status
                    )}`}
                  >
                    {mowingBattery.status}
                  </span>
                </td>
              </tr>

              {/* DRIVE VOLTAGE */}

              <tr className="border-b border-gray-100">
                <td className="px-6 py-5 font-black text-[#40513B]">
                  Drive Battery Voltage
                </td>

                <td className="px-6 py-5 font-bold text-[#6D7C66]">
                  {formatNumber(
                    driveBattery.voltage,
                    2
                  )}{" "}
                  V
                </td>

                <td className="px-6 py-5">
                  <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-600">
                    RECEIVED
                  </span>
                </td>
              </tr>

              {/* DRIVE CURRENT */}

              <tr className="border-b border-gray-100">
                <td className="px-6 py-5 font-black text-[#40513B]">
                  Drive Battery Current
                </td>

                <td className="px-6 py-5 font-bold text-[#6D7C66]">
                  {formatNumber(
                    driveBattery.current,
                    3
                  )}{" "}
                  A
                </td>

                <td className="px-6 py-5">
                  <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-600">
                    RECEIVED
                  </span>
                </td>
              </tr>

              {/* DRIVE POWER */}

              <tr className="border-b border-gray-100">
                <td className="px-6 py-5 font-black text-[#40513B]">
                  Drive Battery Power
                </td>

                <td className="px-6 py-5 font-bold text-[#6D7C66]">
                  {formatNumber(
                    driveBattery.power,
                    3
                  )}{" "}
                  W
                </td>

                <td className="px-6 py-5">
                  <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-600">
                    RECEIVED
                  </span>
                </td>
              </tr>

              {/* DRIVE PERCENTAGE */}

              <tr className="border-b border-gray-100">
                <td className="px-6 py-5 font-black text-[#40513B]">
                  Drive Battery Percentage
                </td>

                <td className="px-6 py-5 font-bold text-[#6D7C66]">
                  {formatNumber(
                    driveBattery.percentage,
                    1
                  )}{" "}
                  %
                </td>

                <td className="px-6 py-5">
                  <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-600">
                    RECEIVED
                  </span>
                </td>
              </tr>

              {/* DRIVE STATUS */}

              <tr className="border-b border-gray-100">
                <td className="px-6 py-5 font-black text-[#40513B]">
                  Drive Battery Status
                </td>

                <td className="px-6 py-5 font-bold text-[#6D7C66]">
                  {driveBattery.status}
                </td>

                <td className="px-6 py-5">
                  <span
                    className={`rounded-full px-3 py-1.5 text-xs font-black ${getBatteryStatusClass(
                      driveBattery.status
                    )}`}
                  >
                    {driveBattery.status}
                  </span>
                </td>
              </tr>

              {/* DRIVE */}

              <tr className="border-b border-gray-100">
                <td className="px-6 py-5 font-black text-[#40513B]">
                  Drive
                </td>

                <td className="px-6 py-5 font-bold text-[#6D7C66]">
                  {driveCommand}
                </td>

                <td className="px-6 py-5">
                  <span
                    className={`rounded-full px-3 py-1.5 text-xs font-black ${
                      driveCommand.toUpperCase() ===
                      "ON"
                        ? "bg-green-50 text-green-600"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {driveCommand}
                  </span>
                </td>
              </tr>

              {/* BLADES */}

              <tr className="border-b border-gray-100">
                <td className="px-6 py-5 font-black text-[#40513B]">
                  Blades
                </td>

                <td className="px-6 py-5 font-bold text-[#6D7C66]">
                  {bladeCommand}
                </td>

                <td className="px-6 py-5">
                  <span
                    className={`rounded-full px-3 py-1.5 text-xs font-black ${
                      bladeCommand.toUpperCase() ===
                      "ON"
                        ? "bg-green-50 text-green-600"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {bladeCommand}
                  </span>
                </td>
              </tr>

              {/* MOVEMENT */}

              <tr className="border-b border-gray-100">
                <td className="px-6 py-5 font-black text-[#40513B]">
                  Movement
                </td>

                <td className="px-6 py-5 font-bold text-[#6D7C66]">
                  {movementCommand}
                </td>

                <td className="px-6 py-5">
                  <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-600">
                    LIVE
                  </span>
                </td>
              </tr>

              {/* STEERING */}

              <tr className="border-b border-gray-100">
                <td className="px-6 py-5 font-black text-[#40513B]">
                  Steering
                </td>

                <td className="px-6 py-5 font-bold text-[#6D7C66]">
                  {steeringCommand}
                </td>

                <td className="px-6 py-5">
                  <span className="rounded-full bg-purple-50 px-3 py-1.5 text-xs font-black text-purple-600">
                    LIVE
                  </span>
                </td>
              </tr>

              {/* AUTOMATIC */}

              <tr>
                <td className="px-6 py-5 font-black text-[#40513B]">
                  Automatic
                </td>

                <td className="px-6 py-5 font-bold text-[#6D7C66]">
                  {automaticCommand}
                </td>

                <td className="px-6 py-5">
                  <span className="rounded-full bg-orange-50 px-3 py-1.5 text-xs font-black text-orange-600">
                    {automaticStatus}
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
            <Activity className="h-4 w-4 text-green-600" />
          </span>

          <div>
            <p className="text-xs font-black uppercase tracking-wider text-[#40513B]">
              System Reporting
            </p>

            <p className="text-[11px] font-medium text-[#6D7C66]">
              Data is synchronized
              from Firebase
              Realtime Database.
            </p>
          </div>
        </div>

        <span
          className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${
            firebaseConnected
              ? "text-green-600"
              : "text-red-600"
          }`}
        >
          <span
            className={`h-2 w-2 animate-pulse rounded-full ${
              firebaseConnected
                ? "bg-green-500"
                : "bg-red-500"
            }`}
          />

          {firebaseConnected
            ? "Realtime Online"
            : "Realtime Offline"}
        </span>
      </div>
    </div>
  );
}