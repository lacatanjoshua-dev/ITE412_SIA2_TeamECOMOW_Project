import React, {
  useEffect,
  useRef,
  useState,
} from "react";

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
  Wifi,
  WifiOff,
  RefreshCw,
} from "lucide-react";

import {
  ref,
  onValue,
} from "firebase/database";

import {
  realtimeDb,
} from "../firebase";

// =====================================================
// TYPES
// =====================================================

interface BatteryData {
  voltage: number;
  current: number;
  power: number;
  percentage: number;
  status: string;
}

interface BatteryFirebaseData {
  voltage?: number;
  current?: number;
  power?: number;
  percentage?: number;
  status?: string;
}

// =====================================================
// CHART TYPES
// =====================================================

interface BatteryChartPoint {
  time: string;
  level: number;
}

interface EnergyChartPoint {
  time: string;
  drive: number;
  mowing: number;
  total: number;
}

// =====================================================
// HELPERS
// =====================================================

const safeNumber = (
  value: unknown,
  fallback = 0
): number => {
  const number = Number(value);

  if (
    Number.isFinite(number)
  ) {
    return number;
  }

  return fallback;
};

// =====================================================
// COMPONENT
// =====================================================

export default function EnergyAnalyticsScreen() {

  // ===================================================
  // FIREBASE DATA
  // ===================================================

  const [
    driveBattery,
    setDriveBattery,
  ] = useState<BatteryData>({
    voltage: 0,
    current: 0,
    power: 0,
    percentage: 0,
    status: "UNKNOWN",
  });

  const [
    mowingBattery,
    setMowingBattery,
  ] = useState<BatteryData>({
    voltage: 0,
    current: 0,
    power: 0,
    percentage: 0,
    status: "UNKNOWN",
  });

  // ===================================================
  // CONNECTION
  // ===================================================

  const [
    firebaseOnline,
    setFirebaseOnline,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(true);

  // ===================================================
  // ENERGY
  // ===================================================

  const [
    driveEnergy,
    setDriveEnergy,
  ] = useState(0);

  const [
    mowingEnergy,
    setMowingEnergy,
  ] = useState(0);

  // ===================================================
  // RUNTIME
  // ===================================================

  const [
    runtimeSeconds,
    setRuntimeSeconds,
  ] = useState(0);

  // ===================================================
  // CHARTS
  // ===================================================

  const [
    batteryHistory,
    setBatteryHistory,
  ] = useState<BatteryChartPoint[]>([]);

  const [
    energyHistory,
    setEnergyHistory,
  ] = useState<EnergyChartPoint[]>([]);

  // ===================================================
  // REFS
  // ===================================================

  const lastCalculationTime =
    useRef<number | null>(null);

  const previousDrivePower =
    useRef(0);

  const previousMowingPower =
    useRef(0);

  const lastRuntimeTime =
    useRef<number | null>(null);

  // ===================================================
  // FIREBASE LISTENER
  // ===================================================

  useEffect(() => {

    console.log(
      "======================================"
    );

    console.log(
      "STARTING ENERGY FIREBASE LISTENER"
    );

    console.log(
      "PATH:",
      "ecomow/mower/battery"
    );

    console.log(
      "======================================"
    );

    const batteryRef =
      ref(
        realtimeDb,
        "ecomow/mower/battery"
      );

    const unsubscribe =
      onValue(
        batteryRef,
        (snapshot) => {

          const data =
            snapshot.val();

          console.log(
            "ENERGY FIREBASE DATA:",
            data
          );

          // ==========================================
          // DRIVE
          // ==========================================

          const drive =
            data?.drive || {};

          const driveVoltage =
            safeNumber(
              drive.voltage
            );

          const driveCurrent =
            safeNumber(
              drive.current
            );

          const firebaseDrivePower =
            safeNumber(
              drive.power
            );

          /*
           * If Firebase already provides
           * power, use it.
           *
           * Otherwise:
           *
           * Power = Voltage × Current
           */

          const calculatedDrivePower =
            firebaseDrivePower > 0
              ? firebaseDrivePower
              : driveVoltage *
                driveCurrent;

          setDriveBattery({
            voltage:
              driveVoltage,

            current:
              driveCurrent,

            power:
              calculatedDrivePower,

            percentage:
              safeNumber(
                drive.percentage
              ),

            status:
              String(
                drive.status ||
                  "UNKNOWN"
              ),
          });

          // ==========================================
          // MOWING
          // ==========================================

          const mowing =
            data?.mowing || {};

          const mowingVoltage =
            safeNumber(
              mowing.voltage
            );

          const mowingCurrent =
            safeNumber(
              mowing.current
            );

          const firebaseMowingPower =
            safeNumber(
              mowing.power
            );

          const calculatedMowingPower =
            firebaseMowingPower > 0
              ? firebaseMowingPower
              : mowingVoltage *
                mowingCurrent;

          setMowingBattery({
            voltage:
              mowingVoltage,

            current:
              mowingCurrent,

            power:
              calculatedMowingPower,

            percentage:
              safeNumber(
                mowing.percentage
              ),

            status:
              String(
                mowing.status ||
                  "UNKNOWN"
              ),
          });

          setFirebaseOnline(true);
          setLoading(false);

        },
        (error) => {

          console.error(
            "ENERGY FIREBASE ERROR:",
            error
          );

          setFirebaseOnline(false);
          setLoading(false);

        }
      );

    return () => {

      console.log(
        "STOPPING ENERGY FIREBASE LISTENER"
      );

      unsubscribe();

    };

  }, []);

  // ===================================================
  // CURRENT POWER
  // ===================================================

  const totalPower =
    driveBattery.power +
    mowingBattery.power;

  // ===================================================
  // AVERAGE POWER
  // ===================================================

  const averagePower =
    totalPower > 0
      ? totalPower
      : 0;

  // ===================================================
  // ENERGY CALCULATION
  // ===================================================

  useEffect(() => {

    const now =
      Date.now();

    /*
     * First reading
     */

    if (
      lastCalculationTime.current ===
      null
    ) {

      lastCalculationTime.current =
        now;

      previousDrivePower.current =
        driveBattery.power;

      previousMowingPower.current =
        mowingBattery.power;

      return;

    }

    const elapsedMilliseconds =
      now -
      lastCalculationTime.current;

    /*
     * Ignore unusually large gaps.
     *
     * Example:
     * App was closed for 3 hours.
     *
     * We don't want to calculate
     * 3 hours of fake energy.
     */

    const elapsedHours =
      Math.min(
        elapsedMilliseconds /
          3600000,
        0.05
      );

    if (
      elapsedHours <= 0
    ) {
      return;
    }

    // ==========================================
    // ENERGY
    // ==========================================

    const driveIncrement =
      driveBattery.power *
      elapsedHours;

    const mowingIncrement =
      mowingBattery.power *
      elapsedHours;

    setDriveEnergy(
      (previous) =>
        previous +
        driveIncrement
    );

    setMowingEnergy(
      (previous) =>
        previous +
        mowingIncrement
    );

    lastCalculationTime.current =
      now;

    previousDrivePower.current =
      driveBattery.power;

    previousMowingPower.current =
      mowingBattery.power;

  }, [
    driveBattery.power,
    mowingBattery.power,
  ]);

  // ===================================================
  // RUNTIME CALCULATION
  // ===================================================

  useEffect(() => {

    const now =
      Date.now();

    if (
      lastRuntimeTime.current ===
      null
    ) {

      lastRuntimeTime.current =
        now;

      return;

    }

    const elapsed =
      Math.floor(
        (
          now -
          lastRuntimeTime.current
        ) / 1000
      );

    if (
      elapsed <= 0
    ) {
      return;
    }

    /*
     * Runtime only increases
     * when the system is consuming power.
     */

    if (
      totalPower > 1
    ) {

      setRuntimeSeconds(
        (previous) =>
          previous +
          elapsed
      );

    }

    lastRuntimeTime.current =
      now;

  }, [
    totalPower,
  ]);

  // ===================================================
  // BATTERY HISTORY
  // ===================================================

  useEffect(() => {

    const now =
      new Date();

    const time =
      now.toLocaleTimeString(
        [],
        {
          hour: "2-digit",
          minute: "2-digit",
        }
      );

    const point: BatteryChartPoint = {
      time,
      level:
        driveBattery.percentage,
    };

    setBatteryHistory(
      (previous) => {

        const next = [
          ...previous,
          point,
        ];

        return next.slice(-12);

      }
    );

  }, [
    driveBattery.percentage,
  ]);

  // ===================================================
  // ENERGY HISTORY
  // ===================================================

  useEffect(() => {

    const now =
      new Date();

    const time =
      now.toLocaleTimeString(
        [],
        {
          hour: "2-digit",
          minute: "2-digit",
        }
      );

    const point: EnergyChartPoint = {
      time,

      drive:
        Number(
          driveEnergy.toFixed(3)
        ),

      mowing:
        Number(
          mowingEnergy.toFixed(3)
        ),

      total:
        Number(
          (
            driveEnergy +
            mowingEnergy
          ).toFixed(3)
        ),
    };

    setEnergyHistory(
      (previous) => {

        const next = [
          ...previous,
          point,
        ];

        return next.slice(-12);

      }
    );

  }, [
    driveEnergy,
    mowingEnergy,
  ]);

  // ===================================================
  // TOTAL ENERGY
  // ===================================================

  const totalEnergy =
    driveEnergy +
    mowingEnergy;

  // ===================================================
  // BATTERY LEVEL
  // ===================================================

  const batteryLevel =
    driveBattery.percentage;

  // ===================================================
  // STATUS
  // ===================================================

  const batteryStatus =
    batteryLevel >= 70
      ? "GOOD"
      : batteryLevel >= 30
        ? "MEDIUM"
        : "LOW";

  // ===================================================
  // RUNTIME FORMAT
  // ===================================================

  const formatRuntime =
    (
      seconds: number
    ) => {

      const hours =
        Math.floor(
          seconds / 3600
        );

      const minutes =
        Math.floor(
          (
            seconds % 3600
          ) / 60
        );

      return `${hours}h ${minutes}m`;

    };

  // ===================================================
  // ENERGY FORMAT
  // ===================================================

  const formatEnergy =
    (
      value: number
    ) => {

      if (
        value >= 1000
      ) {

        return `${(
          value / 1000
        ).toFixed(2)} kWh`;

      }

      return `${value.toFixed(2)} Wh`;

    };

  // ===================================================
  // REFRESH
  // ===================================================

  const handleRefresh =
    () => {

      setLoading(true);

      setTimeout(() => {

        setLoading(false);

      }, 500);

    };

  // ===================================================
  // LOADING
  // ===================================================

  if (loading) {

    return (
      <div
        className="
          min-h-[60vh]
          flex
          items-center
          justify-center
        "
      >

        <div
          className="
            bg-white
            rounded-3xl
            shadow-xl
            p-8
            text-center
          "
        >

          <RefreshCw
            size={35}
            className="
              mx-auto
              text-[#628141]
              animate-spin
            "
          />

          <p
            className="
              mt-4
              font-black
              text-[#40513B]
            "
          >
            Connecting to Firebase...
          </p>

        </div>

      </div>
    );

  }

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div
      className="
        w-full
        max-w-7xl
        mx-auto
        px-3
        sm:px-5
        lg:px-8
        pb-28
        lg:pb-10
      "
    >

      {/* =================================================
          HEADER
      ================================================= */}

      <div
        className="
          mb-8
          sm:mb-10
        "
      >

        <div
          className="
            flex
            flex-col
            lg:flex-row
            lg:items-end
            lg:justify-between
            gap-5
          "
        >

          <div>

            <div
              className="
                flex
                items-center
                gap-2
                mb-3
              "
            >

              <div
                className="
                  w-9
                  h-9
                  rounded-xl
                  bg-[#628141]/10
                  flex
                  items-center
                  justify-center
                "
              >

                <Leaf
                  size={18}
                  className="
                    text-[#628141]
                  "
                />

              </div>

              <span
                className="
                  text-[10px]
                  font-black
                  text-[#628141]
                  uppercase
                  tracking-[3px]
                "
              >
                ECOMOW SYSTEM
              </span>

            </div>

            <h1
              className="
                text-3xl
                sm:text-4xl
                lg:text-5xl
                font-black
                text-[#40513B]
                tracking-tight
              "
            >
              Energy Analytics
            </h1>

            <p
              className="
                mt-2
                text-sm
                sm:text-base
                text-[#6D7C66]
                font-medium
              "
            >
              Monitor real-time battery performance,
              power consumption, and energy usage.
            </p>

          </div>

          {/* FIREBASE STATUS */}

          <div
            className="
              flex
              items-center
              gap-3
              bg-white
              rounded-2xl
              px-4
              py-3
              border
              border-[#E5D9B6]/50
              shadow-sm
              w-fit
            "
          >

            <div
              className="
                relative
              "
            >

              <span
                className={`
                  block
                  w-3
                  h-3
                  rounded-full
                  ${
                    firebaseOnline
                      ? "bg-green-500"
                      : "bg-red-500"
                  }
                `}
              />

              {firebaseOnline && (
                <span
                  className="
                    absolute
                    inset-0
                    rounded-full
                    bg-green-400
                    animate-ping
                    opacity-40
                  "
                />
              )}

            </div>

            <div>

              <p
                className="
                  text-[9px]
                  font-black
                  text-[#6D7C66]
                  uppercase
                  tracking-widest
                "
              >
                Firebase
              </p>

              <p
                className="
                  text-sm
                  font-black
                  text-[#40513B]
                "
              >
                {firebaseOnline
                  ? "Realtime Connected"
                  : "Disconnected"}
              </p>

            </div>

            {firebaseOnline ? (
              <Wifi
                size={18}
                className="text-green-600"
              />
            ) : (
              <WifiOff
                size={18}
                className="text-red-500"
              />
            )}

          </div>

        </div>

      </div>

      {/* =================================================
          QUICK OVERVIEW
      ================================================= */}

      <div
        className="
          grid
          grid-cols-2
          lg:grid-cols-4
          gap-3
          sm:gap-5
          mb-8
        "
      >

        {/* SOLAR */}

        <div
          className="
            bg-white
            rounded-[1.7rem]
            sm:rounded-[2rem]
            p-5
            sm:p-6
            border
            border-[#E5D9B6]/50
            shadow-sm
            hover:shadow-lg
            transition-all
          "
        >

          <div
            className="
              flex
              items-start
              justify-between
              mb-5
            "
          >

            <div
              className="
                w-11
                h-11
                rounded-2xl
                bg-[#E67E22]/10
                flex
                items-center
                justify-center
              "
            >

              <Sun
                className="
                  w-5
                  h-5
                  text-[#E67E22]
                "
              />

            </div>

            <TrendingUp
              size={16}
              className="
                text-[#628141]
              "
            />

          </div>

          <p
            className="
              text-[9px]
              font-black
              text-[#6D7C66]
              uppercase
              tracking-[1.5px]
            "
          >
            Solar Input
          </p>

          <p
            className="
              mt-1
              text-2xl
              sm:text-3xl
              font-black
              text-[#40513B]
            "
          >
            —

          </p>

          <p
            className="
              mt-2
              text-[9px]
              font-bold
              text-[#6D7C66]
              uppercase
            "
          >
            Solar sensor not connected
          </p>

        </div>

        {/* BATTERY */}

        <div
          className="
            bg-white
            rounded-[1.7rem]
            sm:rounded-[2rem]
            p-5
            sm:p-6
            border
            border-[#E5D9B6]/50
            shadow-sm
          "
        >

          <div
            className="
              flex
              items-start
              justify-between
              mb-5
            "
          >

            <div
              className="
                w-11
                h-11
                rounded-2xl
                bg-[#628141]/10
                flex
                items-center
                justify-center
              "
            >

              <Battery
                className="
                  w-5
                  h-5
                  text-[#628141]
                "
              />

            </div>

            <span
              className="
                text-[9px]
                font-black
                text-green-600
                bg-green-50
                px-2
                py-1
                rounded-full
              "
            >
              {batteryStatus}
            </span>

          </div>

          <p
            className="
              text-[9px]
              font-black
              text-[#6D7C66]
              uppercase
              tracking-[1.5px]
            "
          >
            Battery Level
          </p>

          <p
            className="
              mt-1
              text-2xl
              sm:text-3xl
              font-black
              text-[#40513B]
            "
          >
            {batteryLevel}%
          </p>

          <div
            className="
              mt-3
              h-2
              bg-[#F1F4EE]
              rounded-full
              overflow-hidden
            "
          >

            <div
              className="
                h-full
                bg-[#628141]
                rounded-full
                transition-all
                duration-500
              "
              style={{
                width:
                  `${Math.max(
                    0,
                    Math.min(
                      100,
                      batteryLevel
                    )
                  )}%`,
              }}
            />

          </div>

          <p
            className="
              mt-2
              text-[9px]
              font-bold
              text-[#6D7C66]
              uppercase
            "
          >
            Drive battery
          </p>

        </div>

        {/* RUNTIME */}

        <div
          className="
            bg-white
            rounded-[1.7rem]
            sm:rounded-[2rem]
            p-5
            sm:p-6
            border
            border-[#E5D9B6]/50
            shadow-sm
          "
        >

          <div
            className="
              flex
              items-start
              justify-between
              mb-5
            "
          >

            <div
              className="
                w-11
                h-11
                rounded-2xl
                bg-[#40513B]/10
                flex
                items-center
                justify-center
              "
            >

              <Clock
                className="
                  w-5
                  h-5
                  text-[#40513B]
                "
              />

            </div>

            <Activity
              size={16}
              className="
                text-[#628141]
              "
            />

          </div>

          <p
            className="
              text-[9px]
              font-black
              text-[#6D7C66]
              uppercase
              tracking-[1.5px]
            "
          >
            Runtime
          </p>

          <p
            className="
              mt-1
              text-2xl
              sm:text-3xl
              font-black
              text-[#40513B]
            "
          >
            {formatRuntime(
              runtimeSeconds
            )}
          </p>

          <p
            className="
              mt-2
              text-[9px]
              font-bold
              text-[#6D7C66]
              uppercase
            "
          >
            Active energy usage
          </p>

        </div>

        {/* POWER */}

        <div
          className="
            bg-white
            rounded-[1.7rem]
            sm:rounded-[2rem]
            p-5
            sm:p-6
            border
            border-[#E5D9B6]/50
            shadow-sm
          "
        >

          <div
            className="
              flex
              items-start
              justify-between
              mb-5
            "
          >

            <div
              className="
                w-11
                h-11
                rounded-2xl
                bg-[#E67E22]/10
                flex
                items-center
                justify-center
              "
            >

              <Zap
                className="
                  w-5
                  h-5
                  text-[#E67E22]
                "
              />

            </div>

            <Gauge
              size={16}
              className="
                text-[#E67E22]
              "
            />

          </div>

          <p
            className="
              text-[9px]
              font-black
              text-[#6D7C66]
              uppercase
              tracking-[1.5px]
            "
          >
            Current Power
          </p>

          <p
            className="
              mt-1
              text-2xl
              sm:text-3xl
              font-black
              text-[#40513B]
            "
          >
            {averagePower.toFixed(1)}
            <span
              className="
                text-sm
                ml-1
                text-[#6D7C66]
              "
            >
              W
            </span>
          </p>

          <p
            className="
              mt-2
              text-[9px]
              font-bold
              text-[#E67E22]
              uppercase
            "
          >
            Realtime
          </p>

        </div>

      </div>

      {/* =================================================
          REALTIME BATTERY DETAILS
      ================================================= */}

      <div
        className="
          grid
          grid-cols-1
          md:grid-cols-2
          gap-5
          mb-8
        "
      >

        {/* DRIVE */}

        <div
          className="
            bg-white
            rounded-[2rem]
            p-6
            border
            border-[#E5D9B6]/50
            shadow-sm
          "
        >

          <div
            className="
              flex
              items-center
              justify-between
              mb-5
            "
          >

            <div
              className="
                flex
                items-center
                gap-3
              "
            >

              <div
                className="
                  w-11
                  h-11
                  rounded-2xl
                  bg-[#628141]/10
                  flex
                  items-center
                  justify-center
                "
              >

                <Battery
                  size={20}
                  className="
                    text-[#628141]
                  "
                />

              </div>

              <div>

                <h2
                  className="
                    font-black
                    text-[#40513B]
                  "
                >
                  Drive Battery
                </h2>

                <p
                  className="
                    text-[10px]
                    text-[#6D7C66]
                    uppercase
                    tracking-widest
                  "
                >
                  Firebase realtime
                </p>

              </div>

            </div>

            <span
              className="
                px-3
                py-1
                rounded-full
                bg-green-50
                text-green-700
                text-[9px]
                font-black
              "
            >
              {driveBattery.status}
            </span>

          </div>

          <div
            className="
              grid
              grid-cols-2
              sm:grid-cols-4
              gap-3
            "
          >

            <div
              className="
                bg-[#F7F9F5]
                rounded-2xl
                p-4
              "
            >

              <p
                className="
                  text-[9px]
                  font-black
                  text-[#6D7C66]
                  uppercase
                "
              >
                Voltage
              </p>

              <p
                className="
                  mt-1
                  text-lg
                  font-black
                  text-[#40513B]
                "
              >
                {driveBattery.voltage.toFixed(1)}
                V
              </p>

            </div>

            <div
              className="
                bg-[#F7F9F5]
                rounded-2xl
                p-4
              "
            >

              <p
                className="
                  text-[9px]
                  font-black
                  text-[#6D7C66]
                  uppercase
                "
              >
                Current
              </p>

              <p
                className="
                  mt-1
                  text-lg
                  font-black
                  text-[#40513B]
                "
              >
                {driveBattery.current.toFixed(2)}
                A
              </p>

            </div>

            <div
              className="
                bg-[#F7F9F5]
                rounded-2xl
                p-4
              "
            >

              <p
                className="
                  text-[9px]
                  font-black
                  text-[#6D7C66]
                  uppercase
                "
              >
                Power
              </p>

              <p
                className="
                  mt-1
                  text-lg
                  font-black
                  text-[#E67E22]
                "
              >
                {driveBattery.power.toFixed(1)}
                W
              </p>

            </div>

            <div
              className="
                bg-[#F7F9F5]
                rounded-2xl
                p-4
              "
            >

              <p
                className="
                  text-[9px]
                  font-black
                  text-[#6D7C66]
                  uppercase
                "
              >
                Energy
              </p>

              <p
                className="
                  mt-1
                  text-lg
                  font-black
                  text-[#628141]
                "
              >
                {formatEnergy(
                  driveEnergy
                )}
              </p>

            </div>

          </div>

        </div>

        {/* MOWING */}

        <div
          className="
            bg-white
            rounded-[2rem]
            p-6
            border
            border-[#E5D9B6]/50
            shadow-sm
          "
        >

          <div
            className="
              flex
              items-center
              justify-between
              mb-5
            "
          >

            <div
              className="
                flex
                items-center
                gap-3
              "
            >

              <div
                className="
                  w-11
                  h-11
                  rounded-2xl
                  bg-[#E67E22]/10
                  flex
                  items-center
                  justify-center
                "
              >

                <Zap
                  size={20}
                  className="
                    text-[#E67E22]
                  "
                />

              </div>

              <div>

                <h2
                  className="
                    font-black
                    text-[#40513B]
                  "
                >
                  Mowing Battery
                </h2>

                <p
                  className="
                    text-[10px]
                    text-[#6D7C66]
                    uppercase
                    tracking-widest
                  "
                >
                  Firebase realtime
                </p>

              </div>

            </div>

            <span
              className="
                px-3
                py-1
                rounded-full
                bg-green-50
                text-green-700
                text-[9px]
                font-black
              "
            >
              {mowingBattery.status}
            </span>

          </div>

          <div
            className="
              grid
              grid-cols-2
              sm:grid-cols-4
              gap-3
            "
          >

            <div
              className="
                bg-[#F7F9F5]
                rounded-2xl
                p-4
              "
            >

              <p
                className="
                  text-[9px]
                  font-black
                  text-[#6D7C66]
                  uppercase
                "
              >
                Voltage
              </p>

              <p
                className="
                  mt-1
                  text-lg
                  font-black
                  text-[#40513B]
                "
              >
                {mowingBattery.voltage.toFixed(1)}
                V
              </p>

            </div>

            <div
              className="
                bg-[#F7F9F5]
                rounded-2xl
                p-4
              "
            >

              <p
                className="
                  text-[9px]
                  font-black
                  text-[#6D7C66]
                  uppercase
                "
              >
                Current
              </p>

              <p
                className="
                  mt-1
                  text-lg
                  font-black
                  text-[#40513B]
                "
              >
                {mowingBattery.current.toFixed(2)}
                A
              </p>

            </div>

            <div
              className="
                bg-[#F7F9F5]
                rounded-2xl
                p-4
              "
            >

              <p
                className="
                  text-[9px]
                  font-black
                  text-[#6D7C66]
                  uppercase
                "
              >
                Power
              </p>

              <p
                className="
                  mt-1
                  text-lg
                  font-black
                  text-[#E67E22]
                "
              >
                {mowingBattery.power.toFixed(1)}
                W
              </p>

            </div>

            <div
              className="
                bg-[#F7F9F5]
                rounded-2xl
                p-4
              "
            >

              <p
                className="
                  text-[9px]
                  font-black
                  text-[#6D7C66]
                  uppercase
                "
              >
                Energy
              </p>

              <p
                className="
                  mt-1
                  text-lg
                  font-black
                  text-[#628141]
                "
              >
                {formatEnergy(
                  mowingEnergy
                )}
              </p>

            </div>

          </div>

        </div>

      </div>

      {/* =================================================
          ENERGY PERFORMANCE
      ================================================= */}

      <div
        className="
          bg-[#40513B]
          rounded-[2rem]
          sm:rounded-[2.5rem]
          p-6
          sm:p-8
          mb-8
          relative
          overflow-hidden
          shadow-xl
        "
      >

        <div
          className="
            absolute
            -right-20
            -top-20
            w-64
            h-64
            rounded-full
            bg-[#628141]/20
            blur-3xl
          "
        />

        <div
          className="
            absolute
            -left-20
            -bottom-20
            w-64
            h-64
            rounded-full
            bg-[#E67E22]/10
            blur-3xl
          "
        />

        <div
          className="
            relative
            z-10
          "
        >

          <div
            className="
              flex
              flex-col
              sm:flex-row
              sm:items-center
              sm:justify-between
              gap-4
              mb-7
            "
          >

            <div>

              <div
                className="
                  flex
                  items-center
                  gap-2
                  mb-2
                "
              >

                <Sparkles
                  size={15}
                  className="
                    text-[#E5D9B6]
                  "
                />

                <span
                  className="
                    text-[9px]
                    font-black
                    text-[#E5D9B6]
                    uppercase
                    tracking-[2px]
                  "
                >
                  Realtime Energy
                </span>

              </div>

              <h2
                className="
                  text-xl
                  sm:text-2xl
                  font-black
                  text-white
                "
              >
                Energy Consumption
              </h2>

              <p
                className="
                  text-xs
                  text-white/60
                  mt-1
                "
              >
                Calculated from Firebase voltage
                and current readings.
              </p>

            </div>

            <div
              className="
                flex
                items-center
                gap-2
                bg-white/10
                border
                border-white/10
                rounded-2xl
                px-4
                py-3
                w-fit
              "
            >

              <Zap
                size={18}
                className="
                  text-[#E67E22]
                "
              />

              <div>

                <p
                  className="
                    text-[9px]
                    text-white/50
                    font-black
                    uppercase
                  "
                >
                  Total Energy
                </p>

                <p
                  className="
                    text-lg
                    font-black
                    text-white
                  "
                >
                  {formatEnergy(
                    totalEnergy
                  )}
                </p>

              </div>

            </div>

          </div>

          <div
            className="
              grid
              grid-cols-1
              sm:grid-cols-3
              gap-3
            "
          >

            <div
              className="
                bg-white/5
                border
                border-white/10
                rounded-2xl
                p-4
              "
            >

              <p
                className="
                  text-[9px]
                  text-white/40
                  font-black
                  uppercase
                  tracking-widest
                "
              >
                Drive Energy
              </p>

              <p
                className="
                  text-xl
                  font-black
                  text-white
                  mt-1
                "
              >
                {formatEnergy(
                  driveEnergy
                )}
              </p>

            </div>

            <div
              className="
                bg-white/5
                border
                border-white/10
                rounded-2xl
                p-4
              "
            >

              <p
                className="
                  text-[9px]
                  text-white/40
                  font-black
                  uppercase
                  tracking-widest
                "
              >
                Mowing Energy
              </p>

              <p
                className="
                  text-xl
                  font-black
                  text-white
                  mt-1
                "
              >
                {formatEnergy(
                  mowingEnergy
                )}
              </p>

            </div>

            <div
              className="
                bg-white/5
                border
                border-white/10
                rounded-2xl
                p-4
              "
            >

              <p
                className="
                  text-[9px]
                  text-white/40
                  font-black
                  uppercase
                  tracking-widest
                "
              >
                Current Power
              </p>

              <p
                className="
                  text-xl
                  font-black
                  text-[#D9E8C8]
                  mt-1
                "
              >
                {totalPower.toFixed(1)} W
              </p>

            </div>

          </div>

        </div>

      </div>

      {/* =================================================
          CHARTS
      ================================================= */}

      <div
        className="
          grid
          grid-cols-1
          xl:grid-cols-2
          gap-6
          sm:gap-8
        "
      >

        {/* BATTERY CHART */}

        <div
          className="
            bg-white
            rounded-[2rem]
            sm:rounded-[2.5rem]
            p-5
            sm:p-8
            border
            border-[#E5D9B6]/50
            shadow-sm
          "
        >

          <div
            className="
              flex
              items-start
              justify-between
              mb-7
            "
          >

            <div>

              <div
                className="
                  flex
                  items-center
                  gap-2
                "
              >

                <div
                  className="
                    w-9
                    h-9
                    rounded-xl
                    bg-[#628141]/10
                    flex
                    items-center
                    justify-center
                  "
                >

                  <Battery
                    size={17}
                    className="
                      text-[#628141]
                    "
                  />

                </div>

                <h2
                  className="
                    font-black
                    text-[#40513B]
                    text-sm
                    uppercase
                    tracking-widest
                  "
                >
                  Battery Cycle
                </h2>

              </div>

              <p
                className="
                  text-xs
                  text-[#6D7C66]
                  font-medium
                  mt-2
                "
              >
                Realtime drive battery level
              </p>

            </div>

            <div
              className="
                text-right
              "
            >

              <p
                className="
                  text-[9px]
                  font-black
                  text-[#6D7C66]
                  uppercase
                "
              >
                Current
              </p>

              <p
                className="
                  text-xl
                  font-black
                  text-[#628141]
                "
              >
                {batteryLevel}%
              </p>

            </div>

          </div>

          <div
            className="
              h-[280px]
              sm:h-[320px]
              w-full
            "
          >

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <AreaChart
                data={
                  batteryHistory
                }
                margin={{
                  top: 10,
                  right: 5,
                  left: -20,
                  bottom: 0,
                }}
              >

                <defs>

                  <linearGradient
                    id="batteryGradientRealtime"
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
                />

                <YAxis
                  stroke="#6D7C66"
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 100]}
                />

                <Tooltip
                  contentStyle={{
                    backgroundColor:
                      "#ffffff",
                    border:
                      "1px solid #E5D9B6",
                    borderRadius:
                      "16px",
                  }}
                  formatter={(
                    value: number
                  ) => [
                    `${value}%`,
                    "Battery",
                  ]}
                />

                <Area
                  type="monotone"
                  dataKey="level"
                  stroke="#628141"
                  strokeWidth={4}
                  fill="url(#batteryGradientRealtime)"
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

        </div>

        {/* ENERGY CHART */}

        <div
          className="
            bg-white
            rounded-[2rem]
            sm:rounded-[2.5rem]
            p-5
            sm:p-8
            border
            border-[#E5D9B6]/50
            shadow-sm
          "
        >

          <div
            className="
              flex
              items-start
              justify-between
              mb-7
            "
          >

            <div>

              <div
                className="
                  flex
                  items-center
                  gap-2
                "
              >

                <div
                  className="
                    w-9
                    h-9
                    rounded-xl
                    bg-[#E67E22]/10
                    flex
                    items-center
                    justify-center
                  "
                >

                  <Zap
                    size={17}
                    className="
                      text-[#E67E22]
                    "
                  />

                </div>

                <h2
                  className="
                    font-black
                    text-[#40513B]
                    text-sm
                    uppercase
                    tracking-widest
                  "
                >
                  Energy Usage
                </h2>

              </div>

              <p
                className="
                  text-xs
                  text-[#6D7C66]
                  font-medium
                  mt-2
                "
              >
                Drive vs mowing energy
              </p>

            </div>

            <div
              className="
                text-right
              "
            >

              <p
                className="
                  text-[9px]
                  font-black
                  text-[#6D7C66]
                  uppercase
                "
              >
                Total
              </p>

              <p
                className="
                  text-xl
                  font-black
                  text-[#628141]
                "
              >
                {formatEnergy(
                  totalEnergy
                )}
              </p>

            </div>

          </div>

          <div
            className="
              h-[280px]
              sm:h-[320px]
              w-full
            "
          >

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <BarChart
                data={
                  energyHistory
                }
                margin={{
                  top: 10,
                  right: 5,
                  left: -20,
                  bottom: 0,
                }}
              >

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
                />

                <YAxis
                  stroke="#6D7C66"
                  axisLine={false}
                  tickLine={false}
                />

                <Tooltip
                  contentStyle={{
                    backgroundColor:
                      "#ffffff",
                    border:
                      "1px solid #E5D9B6",
                    borderRadius:
                      "16px",
                  }}
                  formatter={(
                    value: number
                  ) => [
                    `${value.toFixed(
                      3
                    )} Wh`,
                    "Energy",
                  ]}
                />

                <Bar
                  dataKey="drive"
                  fill="#628141"
                  radius={[
                    7,
                    7,
                    0,
                    0,
                  ]}
                  name="Drive"
                />

                <Bar
                  dataKey="mowing"
                  fill="#E67E22"
                  radius={[
                    7,
                    7,
                    0,
                    0,
                  ]}
                  name="Mowing"
                />

              </BarChart>

            </ResponsiveContainer>

          </div>

        </div>

      </div>

      {/* =================================================
          ENERGY FORMULA
      ================================================= */}

      <div
        className="
          mt-8
          bg-white
          rounded-[2rem]
          p-6
          sm:p-8
          border
          border-[#E5D9B6]/50
          shadow-sm
        "
      >

        <div
          className="
            flex
            items-center
            gap-3
            mb-5
          "
        >

          <div
            className="
              w-11
              h-11
              rounded-2xl
              bg-[#628141]/10
              flex
              items-center
              justify-center
            "
          >

            <Gauge
              size={21}
              className="
                text-[#628141]
              "
            />

          </div>

          <div>

            <h2
              className="
                font-black
                text-[#40513B]
              "
            >
              Energy Calculation
            </h2>

            <p
              className="
                text-xs
                text-[#6D7C66]
              "
            >
              Based on realtime Firebase readings
            </p>

          </div>

        </div>

        <div
          className="
            grid
            grid-cols-1
            md:grid-cols-2
            gap-4
          "
        >

          <div
            className="
              bg-[#F7F9F5]
              rounded-2xl
              p-5
            "
          >

            <p
              className="
                text-[9px]
                font-black
                text-[#6D7C66]
                uppercase
                tracking-widest
              "
            >
              Power Formula
            </p>

            <p
              className="
                text-xl
                sm:text-2xl
                font-black
                text-[#40513B]
                mt-2
              "
            >
              P = V × I
            </p>

            <p
              className="
                text-xs
                text-[#6D7C66]
                mt-2
              "
            >
              Voltage × Current = Power
            </p>

          </div>

          <div
            className="
              bg-[#F7F9F5]
              rounded-2xl
              p-5
            "
          >

            <p
              className="
                text-[9px]
                font-black
                text-[#6D7C66]
                uppercase
                tracking-widest
              "
            >
              Energy Formula
            </p>

            <p
              className="
                text-xl
                sm:text-2xl
                font-black
                text-[#40513B]
                mt-2
              "
            >
              E = P × t
            </p>

            <p
              className="
                text-xs
                text-[#6D7C66]
                mt-2
              "
            >
              Power × Time = Energy
            </p>

          </div>

        </div>

      </div>

      {/* =================================================
          ENVIRONMENTAL IMPACT
      ================================================= */}

      <div
        className="
          mt-8
          bg-[#40513B]
          rounded-[2rem]
          sm:rounded-[2.5rem]
          p-6
          sm:p-10
          text-white
          relative
          overflow-hidden
          shadow-xl
        "
      >

        <div
          className="
            absolute
            top-0
            right-0
            w-72
            h-72
            bg-[#628141]/20
            rounded-full
            blur-3xl
          "
        />

        <div
          className="
            relative
            z-10
          "
        >

          <div
            className="
              flex
              items-center
              gap-3
              mb-7
            "
          >

            <div
              className="
                w-11
                h-11
                rounded-2xl
                bg-white/10
                flex
                items-center
                justify-center
              "
            >

              <Leaf
                className="
                  text-[#D9E8C8]
                "
                size={21}
              />

            </div>

            <div>

              <h2
                className="
                  font-black
                  text-lg
                  sm:text-xl
                  uppercase
                  tracking-widest
                "
              >
                Energy Summary
              </h2>

              <p
                className="
                  text-xs
                  text-white/50
                  mt-1
                "
              >
                Realtime ECOMOW energy monitoring
              </p>

            </div>

          </div>

          <div
            className="
              grid
              grid-cols-1
              md:grid-cols-3
              gap-4
            "
          >

            <div
              className="
                bg-white/5
                p-6
                rounded-[1.7rem]
                border
                border-white/10
              "
            >

              <div
                className="
                  flex
                  items-center
                  justify-between
                  mb-5
                "
              >

                <Zap
                  size={18}
                  className="
                    text-[#E5D9B6]
                  "
                />

                <ArrowUpRight
                  size={17}
                  className="
                    text-[#E5D9B6]
                  "
                />

              </div>

              <div
                className="
                  text-3xl
                  font-black
                  text-[#E5D9B6]
                "
              >
                {formatEnergy(
                  totalEnergy
                )}
              </div>

              <div
                className="
                  text-[9px]
                  font-black
                  text-white/40
                  uppercase
                  tracking-widest
                  mt-2
                "
              >
                Total Energy Used
              </div>

            </div>

            <div
              className="
                bg-white/5
                p-6
                rounded-[1.7rem]
                border
                border-white/10
              "
            >

              <div
                className="
                  flex
                  items-center
                  justify-between
                  mb-5
                "
              >

                <Battery
                  size={18}
                  className="
                    text-[#628141]
                  "
                />

              </div>

              <div
                className="
                  text-3xl
                  font-black
                  text-[#D9E8C8]
                "
              >
                {batteryLevel}%
              </div>

              <div
                className="
                  text-[9px]
                  font-black
                  text-white/40
                  uppercase
                  tracking-widest
                  mt-2
                "
              >
                Battery Remaining
              </div>

            </div>

            <div
              className="
                bg-white/5
                p-6
                rounded-[1.7rem]
                border
                border-white/10
              "
            >

              <div
                className="
                  flex
                  items-center
                  justify-between
                  mb-5
                "
              >

                <Clock
                  size={18}
                  className="
                    text-[#E67E22]
                  "
                />

              </div>

              <div
                className="
                  text-3xl
                  font-black
                  text-[#E67E22]
                "
              >
                {formatRuntime(
                  runtimeSeconds
                )}
              </div>

              <div
                className="
                  text-[9px]
                  font-black
                  text-white/40
                  uppercase
                  tracking-widest
                  mt-2
                "
              >
                Active Runtime
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* =================================================
          FOOTER
      ================================================= */}

      <div
        className="
          mt-6
          flex
          flex-col
          sm:flex-row
          sm:items-center
          sm:justify-between
          gap-3
          px-2
        "
      >

        <div
          className="
            flex
            items-center
            gap-2
          "
        >

          <span
            className={`
              w-2
              h-2
              rounded-full
              ${
                firebaseOnline
                  ? "bg-green-500"
                  : "bg-red-500"
              }
            `}
          />

          <span
            className="
              text-[9px]
              font-black
              text-[#6D7C66]
              uppercase
              tracking-widest
            "
          >
            {firebaseOnline
              ? "Energy monitoring active"
              : "Firebase disconnected"}
          </span>

        </div>

        <span
          className="
            text-[9px]
            font-bold
            text-[#6D7C66]
          "
        >
          ECOMOW • Realtime Energy System
        </span>

      </div>

    </div>
  );
}