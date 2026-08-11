import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Play,
  Square,
  Power,
  Scissors,
  RefreshCw,
  Wifi,
  WifiOff,
  ArrowRight,
  Hand,
  ShieldAlert,
  CheckCircle2,
  Circle,
} from "lucide-react";

import { realtimeDb } from "../firebase";

import {
  ref,
  set,
  onValue,
} from "firebase/database";

// =====================================================
// PROPS
// =====================================================

interface AutomaticControlProps {
  onNavigate?: (screen: "manual" | "automatic") => void;
}

// =====================================================
// COMPONENT
// =====================================================

export default function AutomaticControl({
  onNavigate,
}: AutomaticControlProps) {

  // ===================================================
  // REACT ROUTER
  // ===================================================

  const navigate = useNavigate();

  // ===================================================
  // FIREBASE CONNECTION
  // ===================================================

  const [firebaseOnline, setFirebaseOnline] =
    useState(false);

  // ===================================================
  // DRIVE
  // ===================================================

  const [driveStatus, setDriveStatus] =
    useState<"ON" | "OFF">("OFF");

  // ===================================================
  // BLADES
  // ===================================================

  const [mowingStatus, setMowingStatus] =
    useState<"ON" | "OFF">("OFF");

  // ===================================================
  // MOVEMENT
  // ===================================================

  const [movementStatus, setMovementStatus] =
    useState("STOP");

  // ===================================================
  // AUTOMATIC STATUS
  // ===================================================

  const [automaticStatus, setAutomaticStatus] =
    useState("STOPPED");

  // ===================================================
  // LOADING
  // ===================================================

  const [loading, setLoading] =
    useState(false);

  // ===================================================
  // FIREBASE LISTENERS
  // ===================================================

  useEffect(() => {

    // -----------------------------------------------
    // DRIVE STATUS
    // -----------------------------------------------

    const driveStatusRef = ref(
      realtimeDb,
      "ecomow/mower/drive/status"
    );

    const unsubscribeDrive = onValue(
      driveStatusRef,
      (snapshot) => {

        const value = snapshot.val();

        setFirebaseOnline(true);

        if (value === "ON") {
          setDriveStatus("ON");
        } else {
          setDriveStatus("OFF");
        }
      },
      () => {
        setFirebaseOnline(false);
      }
    );

    // -----------------------------------------------
    // MOWING STATUS
    // -----------------------------------------------

    const mowingStatusRef = ref(
      realtimeDb,
      "ecomow/mower/blades/status"
    );

    const unsubscribeMowing = onValue(
      mowingStatusRef,
      (snapshot) => {

        const value = snapshot.val();

        if (value === "ON") {
          setMowingStatus("ON");
        } else {
          setMowingStatus("OFF");
        }
      }
    );

    // -----------------------------------------------
    // MOVEMENT STATUS
    // -----------------------------------------------

    const movementStatusRef = ref(
      realtimeDb,
      "ecomow/mower/movement/command"
    );

    const unsubscribeMovement = onValue(
      movementStatusRef,
      (snapshot) => {

        const value = snapshot.val();

        if (value) {
          setMovementStatus(
            String(value).toUpperCase()
          );
        }
      }
    );

    // -----------------------------------------------
    // AUTOMATIC STATUS
    // -----------------------------------------------

    const automaticStatusRef = ref(
      realtimeDb,
      "ecomow/mower/automatic/status"
    );

    const unsubscribeAutomatic = onValue(
      automaticStatusRef,
      (snapshot) => {

        const value = snapshot.val();

        if (value) {
          setAutomaticStatus(
            String(value).toUpperCase()
          );
        }
      }
    );

    // -----------------------------------------------
    // CLEANUP
    // -----------------------------------------------

    return () => {

      unsubscribeDrive();
      unsubscribeMowing();
      unsubscribeMovement();
      unsubscribeAutomatic();

    };

  }, []);

  // ===================================================
  // FIREBASE COMMAND HELPER
  // ===================================================

  const sendFirebaseCommand = async (
    path: string,
    command: string
  ) => {

    try {

      await set(
        ref(realtimeDb, path),
        command
      );

      setFirebaseOnline(true);

    } catch (error) {

      console.error(
        "Firebase command error:",
        error
      );

      setFirebaseOnline(false);

    }

  };

  // ===================================================
  // START AUTOMATIC MOWING
  // ===================================================

  const startAutomaticMowing = async () => {

    if (loading) return;

    try {

      setLoading(true);

      console.log(
        "START AUTOMATIC MOWING"
      );

      // ---------------------------------------------
      // AUTOMATIC COMMAND
      // ---------------------------------------------

      await sendFirebaseCommand(
        "ecomow/mower/automatic/command",
        "START"
      );

      // ---------------------------------------------
      // DRIVE ON
      // ---------------------------------------------

      await sendFirebaseCommand(
        "ecomow/mower/drive/command",
        "ON"
      );

      // ---------------------------------------------
      // BLADES ON
      // ---------------------------------------------

      await sendFirebaseCommand(
        "ecomow/mower/blades/command",
        "ON"
      );

      // ---------------------------------------------
      // MOVEMENT
      // ---------------------------------------------

      await sendFirebaseCommand(
        "ecomow/mower/movement/command",
        "forward"
      );

      setAutomaticStatus("RUNNING");

    } catch (error) {

      console.error(
        "Start automatic mowing error:",
        error
      );

    } finally {

      setLoading(false);

    }

  };

  // ===================================================
  // STOP AUTOMATIC MOWING
  // ===================================================

  const stopAutomaticMowing = async () => {

    if (loading) return;

    try {

      setLoading(true);

      console.log(
        "STOP AUTOMATIC MOWING"
      );

      // ---------------------------------------------
      // AUTOMATIC STOP
      // ---------------------------------------------

      await sendFirebaseCommand(
        "ecomow/mower/automatic/command",
        "STOP"
      );

      // ---------------------------------------------
      // DRIVE OFF
      // ---------------------------------------------

      await sendFirebaseCommand(
        "ecomow/mower/drive/command",
        "OFF"
      );

      // ---------------------------------------------
      // BLADES OFF
      // ---------------------------------------------

      await sendFirebaseCommand(
        "ecomow/mower/blades/command",
        "OFF"
      );

      // ---------------------------------------------
      // MOVEMENT STOP
      // ---------------------------------------------

      await sendFirebaseCommand(
        "ecomow/mower/movement/command",
        "stop"
      );

      setAutomaticStatus("STOPPED");
      setDriveStatus("OFF");
      setMowingStatus("OFF");
      setMovementStatus("STOP");

    } catch (error) {

      console.error(
        "Stop automatic mowing error:",
        error
      );

    } finally {

      setLoading(false);

    }

  };

  // ===================================================
  // DRIVE ON
  // ===================================================

  const driveOn = async () => {

    await sendFirebaseCommand(
      "ecomow/mower/drive/command",
      "ON"
    );

  };

  // ===================================================
  // DRIVE OFF
  // ===================================================

  const driveOff = async () => {

    await sendFirebaseCommand(
      "ecomow/mower/drive/command",
      "OFF"
    );

  };

  // ===================================================
  // MOWING ON
  // ===================================================

  const mowingOn = async () => {

    await sendFirebaseCommand(
      "ecomow/mower/blades/command",
      "ON"
    );

  };

  // ===================================================
  // MOWING OFF
  // ===================================================

  const mowingOff = async () => {

    await sendFirebaseCommand(
      "ecomow/mower/blades/command",
      "OFF"
    );

  };

  // ===================================================
  // MANUAL CONTROL NAVIGATION
  // ===================================================

  const openManualControl = () => {

    // If parent navigation is provided,
    // keep supporting it.
    if (onNavigate) {

      onNavigate("manual");

      return;

    }

    // React Router navigation
    navigate("/app/manual-control");

  };

  // ===================================================
  // STATUS COLOR
  // ===================================================

  const isRunning =
    automaticStatus === "RUNNING";

  // ===================================================
  // UI
  // ===================================================

  return (

    <div className="min-h-screen bg-[#f7f6ed] p-4 sm:p-6 lg:p-8">

      <div className="max-w-7xl mx-auto space-y-6">

        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div className="bg-white rounded-[2rem] border border-[#e4e4d8] shadow-sm p-5 sm:p-7">

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

            {/* TITLE */}

            <div className="flex items-center gap-4">

              <div className="w-14 h-14 rounded-2xl bg-[#40513B] flex items-center justify-center shadow-md">

                <RefreshCw
                  className="w-7 h-7 text-white"
                />

              </div>

              <div>

                <h1 className="text-2xl sm:text-3xl font-black text-[#2C3627]">

                  Automatic Control

                </h1>

                <p className="text-sm text-[#687362] mt-1">

                  ECOMOW automatic mowing control

                </p>

              </div>

            </div>

            {/* RIGHT SIDE */}

            <div className="flex flex-wrap items-center gap-3">

              {/* FIREBASE */}

              <div
                className={`flex items-center gap-2 px-4 py-3 rounded-2xl border ${
                  firebaseOnline
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-red-50 border-red-200 text-red-600"
                }`}
              >

                {firebaseOnline ? (

                  <Wifi className="w-4 h-4" />

                ) : (

                  <WifiOff className="w-4 h-4" />

                )}

                <span className="text-xs font-black uppercase tracking-wide">

                  {firebaseOnline
                    ? "Firebase Online"
                    : "Firebase Offline"}

                </span>

              </div>

              {/* MANUAL BUTTON */}

              <button
                type="button"
                onClick={openManualControl}
                className="group flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#40513B] hover:bg-[#2C3627] text-white font-black text-xs uppercase tracking-wide shadow-md hover:shadow-lg active:scale-95 transition-all"
              >

                <Hand className="w-4 h-4" />

                Manual Control

                <ArrowRight
                  className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                />

              </button>

            </div>

          </div>

        </div>

        {/* ================================================= */}
        {/* STATUS CARD */}
        {/* ================================================= */}

        <div className="bg-white rounded-[2rem] border border-[#e4e4d8] shadow-sm p-6">

          <div className="flex flex-col lg:flex-row lg:items-center gap-6">

            <div className="lg:w-56">

              <p className="text-[11px] font-black tracking-[3px] text-[#40513B] uppercase">

                Automatic Mowing Status

              </p>

              <h2
                className={`text-3xl font-black mt-2 ${
                  isRunning
                    ? "text-emerald-600"
                    : "text-[#2C3627]"
                }`}
              >

                {automaticStatus}

              </h2>

            </div>

            <div className="flex flex-wrap gap-3">

              {/* DRIVE STATUS */}

              <div className="min-w-[105px] px-5 py-4 rounded-2xl border border-[#e4e4d8] bg-[#fafaf5]">

                <p className="text-[9px] font-black text-[#687362] uppercase tracking-wider">

                  Drive

                </p>

                <div className="flex items-center gap-2 mt-2">

                  <Circle
                    className={`w-3 h-3 ${
                      driveStatus === "ON"
                        ? "fill-emerald-500 text-emerald-500"
                        : "fill-slate-300 text-slate-300"
                    }`}
                  />

                  <span className="font-black text-sm text-[#2C3627]">

                    {driveStatus}

                  </span>

                </div>

              </div>

              {/* MOWING STATUS */}

              <div className="min-w-[105px] px-5 py-4 rounded-2xl border border-[#e4e4d8] bg-[#fafaf5]">

                <p className="text-[9px] font-black text-[#687362] uppercase tracking-wider">

                  Mowing

                </p>

                <div className="flex items-center gap-2 mt-2">

                  <Circle
                    className={`w-3 h-3 ${
                      mowingStatus === "ON"
                        ? "fill-emerald-500 text-emerald-500"
                        : "fill-slate-300 text-slate-300"
                    }`}
                  />

                  <span className="font-black text-sm text-[#2C3627]">

                    {mowingStatus}

                  </span>

                </div>

              </div>

              {/* MOVEMENT */}

              <div className="min-w-[105px] px-5 py-4 rounded-2xl border border-[#e4e4d8] bg-[#fafaf5]">

                <p className="text-[9px] font-black text-[#687362] uppercase tracking-wider">

                  Movement

                </p>

                <div className="flex items-center gap-2 mt-2">

                  <Circle
                    className={`w-3 h-3 ${
                      movementStatus !== "STOP"
                        ? "fill-emerald-500 text-emerald-500"
                        : "fill-slate-300 text-slate-300"
                    }`}
                  />

                  <span className="font-black text-sm text-[#2C3627]">

                    {movementStatus}

                  </span>

                </div>

              </div>

            </div>

          </div>

        </div>

        {/* ================================================= */}
        {/* START / STOP */}
        {/* ================================================= */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* START */}

          <div className="bg-white rounded-[2rem] border border-[#e4e4d8] shadow-sm p-6 sm:p-7">

            <div className="flex items-start gap-4">

              <div className="w-12 h-12 rounded-2xl bg-[#edf3e9] flex items-center justify-center">

                <Play
                  className="w-6 h-6 text-[#40513B] fill-[#40513B]"
                />

              </div>

              <div>

                <h3 className="text-lg font-black text-[#2C3627]">

                  Start Automatic Mowing

                </h3>

                <p className="text-sm text-[#687362] mt-1">

                  Drive ON + Mowing ON

                </p>

              </div>

            </div>

            <button
              type="button"
              onClick={startAutomaticMowing}
              disabled={loading || isRunning}
              className="mt-5 w-full bg-[#40513B] hover:bg-[#2C3627] disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-5 rounded-2xl font-black text-sm tracking-wide flex items-center justify-center gap-3 shadow-md active:scale-[0.98] transition-all"
            >

              <Play className="w-5 h-5 fill-white" />

              {loading
                ? "STARTING..."
                : isRunning
                ? "MOWING ACTIVE"
                : "START AUTOMATIC MOWING"}

            </button>

            <p className="text-[10px] text-center text-[#899183] mt-3 font-semibold">

              One click turns the automatic mowing system ON.

            </p>

          </div>

          {/* STOP */}

          <div className="bg-white rounded-[2rem] border border-red-100 shadow-sm p-6 sm:p-7">

            <div className="flex items-start gap-4">

              <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center">

                <Square
                  className="w-6 h-6 text-red-600 fill-red-600"
                />

              </div>

              <div>

                <h3 className="text-lg font-black text-red-700">

                  Stop Automatic Mowing

                </h3>

                <p className="text-sm text-[#687362] mt-1">

                  Drive OFF + Mowing OFF

                </p>

              </div>

            </div>

            <button
              type="button"
              onClick={stopAutomaticMowing}
              disabled={loading}
              className="mt-5 w-full bg-white hover:bg-red-50 text-red-600 border-2 border-red-600 py-5 rounded-2xl font-black text-sm tracking-wide flex items-center justify-center gap-3 shadow-md active:scale-[0.98] transition-all"
            >

              <Square className="w-5 h-5 fill-white" />

              {loading
                ? "STOPPING..."
                : "STOP AUTOMATIC MOWING"}

            </button>

            <p className="text-[10px] text-center text-[#899183] mt-3 font-semibold">

              Turns Drive, Mowing, and Movement OFF.

            </p>

          </div>

        </div>

        {/* ================================================= */}
        {/* RELAY CONTROL */}
        {/* ================================================= */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* DRIVE RELAY */}

          <div className="bg-white rounded-[2rem] border border-[#e4e4d8] shadow-sm p-6 sm:p-7">

            <div className="flex items-center justify-between mb-5">

              <div className="flex items-center gap-3">

                <div className="w-11 h-11 rounded-xl bg-[#edf3e9] flex items-center justify-center">

                  <Power className="w-5 h-5 text-[#40513B]" />

                </div>

                <div>

                  <h3 className="font-black text-[#2C3627]">

                    Drive Relay

                  </h3>

                  <p className="text-xs text-[#899183]">

                    ESP32 Drive Control

                  </p>

                </div>

              </div>

              <span
                className={`text-xs font-black ${
                  driveStatus === "ON"
                    ? "text-emerald-600"
                    : "text-slate-500"
                }`}
              >

                {driveStatus}

              </span>

            </div>

            <div className="grid grid-cols-2 gap-3">

              <button
                type="button"
                onClick={driveOn}
                className="py-4 rounded-xl bg-[#40513B] hover:bg-[#2C3627] text-white font-black text-sm transition active:scale-95"
              >

                DRIVE ON

              </button>

              <button
                type="button"
                onClick={driveOff}
                className="py-4 rounded-xl border border-[#dfe2d9] hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-[#40513B] font-black text-sm transition active:scale-95"
              >

                DRIVE OFF

              </button>

            </div>

            <div className="mt-4 p-4 rounded-xl bg-[#fafaf5] border border-[#e9eadf]">

              <p className="text-[9px] font-black uppercase tracking-wider text-[#899183]">

                Firebase Command

              </p>

              <p className="text-[10px] font-mono text-[#52604d] mt-1 break-all">

                ecomow/mower/drive/command

              </p>

            </div>

          </div>

          {/* MOWING RELAY */}

          <div className="bg-white rounded-[2rem] border border-[#e4e4d8] shadow-sm p-6 sm:p-7">

            <div className="flex items-center justify-between mb-5">

              <div className="flex items-center gap-3">

                <div className="w-11 h-11 rounded-xl bg-[#edf3e9] flex items-center justify-center">

                  <Scissors className="w-5 h-5 text-[#40513B]" />

                </div>

                <div>

                  <h3 className="font-black text-[#2C3627]">

                    Mowing Relay

                  </h3>

                  <p className="text-xs text-[#899183]">

                    Blade Motor Control

                  </p>

                </div>

              </div>

              <span
                className={`text-xs font-black ${
                  mowingStatus === "ON"
                    ? "text-emerald-600"
                    : "text-slate-500"
                }`}
              >

                {mowingStatus}

              </span>

            </div>

            <div className="grid grid-cols-2 gap-3">

              <button
                type="button"
                onClick={mowingOn}
                className="py-4 rounded-xl bg-[#40513B] hover:bg-[#2C3627] text-white font-black text-sm transition active:scale-95"
              >

                MOWING ON

              </button>

              <button
                type="button"
                onClick={mowingOff}
                className="py-4 rounded-xl border border-[#dfe2d9] hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-[#40513B] font-black text-sm transition active:scale-95"
              >

                MOWING OFF

              </button>

            </div>

            <div className="mt-4 p-4 rounded-xl bg-[#fafaf5] border border-[#e9eadf]">

              <p className="text-[9px] font-black uppercase tracking-wider text-[#899183]">

                Firebase Command

              </p>

              <p className="text-[10px] font-mono text-[#52604d] mt-1 break-all">

                ecomow/mower/blades/command

              </p>

            </div>

          </div>

        </div>

        {/* ================================================= */}
        {/* MANUAL CONTROL CARD */}
        {/* ================================================= */}

        <div className="bg-[#2C3627] rounded-[2rem] p-6 sm:p-8 shadow-lg">

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

            <div className="flex items-center gap-4">

              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">

                <Hand className="w-6 h-6 text-white" />

              </div>

              <div>

                <h3 className="text-lg font-black text-white">

                  Need Manual Control?

                </h3>

                <p className="text-sm text-white/60 mt-1">

                  Control the mower direction manually.

                </p>

              </div>

            </div>

            <button
              type="button"
              onClick={openManualControl}
              className="flex items-center justify-center gap-3 bg-white text-[#2C3627] hover:bg-[#f0f2e9] px-6 py-4 rounded-2xl font-black text-sm transition active:scale-95"
            >

              <Hand className="w-5 h-5" />

              OPEN MANUAL CONTROL

              <ArrowRight className="w-5 h-5" />

            </button>

          </div>

        </div>

        {/* ================================================= */}
        {/* SAFETY */}
        {/* ================================================= */}

        <div className="flex items-center justify-center gap-2 py-3 text-xs text-[#687362]">

          <ShieldAlert className="w-4 h-4 text-red-500" />

          <span className="font-semibold">

            Always stop the mower before switching between automatic and manual control.

          </span>

          <CheckCircle2 className="w-4 h-4 text-emerald-500" />

        </div>

      </div>

    </div>

  );

}