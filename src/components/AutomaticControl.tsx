// src/pages/AutomaticControl.tsx

import React, { useEffect, useState } from "react";
import {
  Play,
  Square,
  Power,
  CircleStop,
  Scissors,
  ShieldAlert,
  Wifi,
  WifiOff,
  RotateCw,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

import { realtimeDb } from "../firebase";

import {
  ref,
  set,
  onValue,
} from "firebase/database";

// =====================================================
// TYPES
// =====================================================

type RelayState = "ON" | "OFF";
type AutomaticState = "RUNNING" | "STOPPED" | "IDLE" | "ERROR";

// =====================================================
// COMPONENT
// =====================================================

export default function AutomaticControl() {
  // ===================================================
  // CONNECTION
  // ===================================================

  const [firebaseConnected, setFirebaseConnected] =
    useState(false);

  // ===================================================
  // DRIVE
  // ===================================================

  const [driveStatus, setDriveStatus] =
    useState<RelayState>("OFF");

  const [driveLoading, setDriveLoading] =
    useState(false);

  // ===================================================
  // MOWING / BLADES
  // ===================================================

  const [mowingStatus, setMowingStatus] =
    useState<RelayState>("OFF");

  const [mowingLoading, setMowingLoading] =
    useState(false);

  // ===================================================
  // AUTOMATIC
  // ===================================================

  const [automaticStatus, setAutomaticStatus] =
    useState<AutomaticState>("IDLE");

  const [automaticLoading, setAutomaticLoading] =
    useState(false);

  // ===================================================
  // MOVEMENT
  // ===================================================

  const [movementCommand, setMovementCommand] =
    useState("stop");

  // ===================================================
  // MESSAGE
  // ===================================================

  const [message, setMessage] =
    useState("");

  const [messageType, setMessageType] =
    useState<"success" | "error" | "warning">(
      "success"
    );

  // ===================================================
  // FIREBASE PATHS
  // ===================================================

  const driveCommandRef = ref(
    realtimeDb,
    "ecomow/mower/drive/command"
  );

  const driveStatusRef = ref(
    realtimeDb,
    "ecomow/mower/drive/status"
  );

  const bladesCommandRef = ref(
    realtimeDb,
    "ecomow/mower/blades/command"
  );

  const bladesStatusRef = ref(
    realtimeDb,
    "ecomow/mower/blades/status"
  );

  const movementCommandRef = ref(
    realtimeDb,
    "ecomow/mower/movement/command"
  );

  const automaticCommandRef = ref(
    realtimeDb,
    "ecomow/mower/automatic/command"
  );

  const automaticStatusRef = ref(
    realtimeDb,
    "ecomow/mower/automatic/status"
  );

  // ===================================================
  // MESSAGE HELPER
  // ===================================================

  const showMessage = (
    text: string,
    type: "success" | "error" | "warning" = "success"
  ) => {
    setMessage(text);
    setMessageType(type);

    setTimeout(() => {
      setMessage("");
    }, 3000);
  };

  // ===================================================
  // FIREBASE LISTENERS
  // ===================================================

  useEffect(() => {
    const unsubDrive = onValue(
      driveStatusRef,
      (snapshot) => {
        const value = snapshot.val();

        if (value === "ON" || value === "OFF") {
          setDriveStatus(value);
          setFirebaseConnected(true);
        }
      },
      () => {
        setFirebaseConnected(false);
      }
    );

    const unsubBlades = onValue(
      bladesStatusRef,
      (snapshot) => {
        const value = snapshot.val();

        if (value === "ON" || value === "OFF") {
          setMowingStatus(value);
          setFirebaseConnected(true);
        }
      },
      () => {
        setFirebaseConnected(false);
      }
    );

    const unsubAutomatic = onValue(
      automaticStatusRef,
      (snapshot) => {
        const value = snapshot.val();

        if (
          value === "RUNNING" ||
          value === "STOPPED" ||
          value === "IDLE" ||
          value === "ERROR"
        ) {
          setAutomaticStatus(value);
        }

        setFirebaseConnected(true);
      },
      () => {
        setFirebaseConnected(false);
      }
    );

    const unsubMovement = onValue(
      movementCommandRef,
      (snapshot) => {
        const value = snapshot.val();

        if (typeof value === "string") {
          setMovementCommand(value);
        }
      }
    );

    return () => {
      unsubDrive();
      unsubBlades();
      unsubAutomatic();
      unsubMovement();
    };
  }, []);

  // ===================================================
  // INITIAL FIREBASE STATUS
  // ===================================================

  useEffect(() => {
    set(
      ref(
        realtimeDb,
        "ecomow/mower/connection/status"
      ),
      "ONLINE"
    ).catch((error) => {
      console.error(
        "Connection status error:",
        error
      );
    });
  }, []);

  // ===================================================
  // DRIVE ON
  // ===================================================

  const turnDriveOn = async () => {
    if (automaticStatus === "RUNNING") {
      showMessage(
        "Stop automatic mowing first.",
        "warning"
      );
      return;
    }

    setDriveLoading(true);

    try {
      await set(
        driveCommandRef,
        "ON"
      );

      showMessage(
        "Drive ON command sent.",
        "success"
      );
    } catch (error) {
      console.error(error);

      showMessage(
        "Failed to send Drive ON command.",
        "error"
      );
    } finally {
      setDriveLoading(false);
    }
  };

  // ===================================================
  // DRIVE OFF
  // ===================================================

  const turnDriveOff = async () => {
    setDriveLoading(true);

    try {
      await set(
        driveCommandRef,
        "OFF"
      );

      await set(
        movementCommandRef,
        "stop"
      );

      setMovementCommand("stop");

      showMessage(
        "Drive OFF command sent.",
        "success"
      );
    } catch (error) {
      console.error(error);

      showMessage(
        "Failed to send Drive OFF command.",
        "error"
      );
    } finally {
      setDriveLoading(false);
    }
  };

  // ===================================================
  // MOWING ON
  // ===================================================

  const turnMowingOn = async () => {
    if (automaticStatus === "RUNNING") {
      showMessage(
        "Mowing is already controlled by automatic mode.",
        "warning"
      );
      return;
    }

    setMowingLoading(true);

    try {
      await set(
        bladesCommandRef,
        "ON"
      );

      showMessage(
        "Mowing relay ON command sent.",
        "success"
      );
    } catch (error) {
      console.error(error);

      showMessage(
        "Failed to send Mowing ON command.",
        "error"
      );
    } finally {
      setMowingLoading(false);
    }
  };

  // ===================================================
  // MOWING OFF
  // ===================================================

  const turnMowingOff = async () => {
    setMowingLoading(true);

    try {
      await set(
        bladesCommandRef,
        "OFF"
      );

      showMessage(
        "Mowing relay OFF command sent.",
        "success"
      );
    } catch (error) {
      console.error(error);

      showMessage(
        "Failed to send Mowing OFF command.",
        "error"
      );
    } finally {
      setMowingLoading(false);
    }
  };

  // ===================================================
  // START AUTOMATIC MOWING
  // ===================================================

  const startAutomaticMowing = async () => {
    if (!firebaseConnected) {
      showMessage(
        "Firebase is not connected.",
        "error"
      );
      return;
    }

    if (driveStatus !== "ON") {
      showMessage(
        "Turn DRIVE ON before starting automatic mowing.",
        "warning"
      );
      return;
    }

    if (mowingStatus !== "ON") {
      showMessage(
        "Turn MOWING ON before starting automatic mowing.",
        "warning"
      );
      return;
    }

    setAutomaticLoading(true);

    try {
      // Set automatic command
      await set(
        automaticCommandRef,
        "START"
      );

      // Set initial automatic status
      await set(
        automaticStatusRef,
        "RUNNING"
      );

      // Make sure movement starts from stop
      await set(
        movementCommandRef,
        "forward"
      );

      setMovementCommand("forward");
      setAutomaticStatus("RUNNING");

      showMessage(
        "Automatic mowing STARTED.",
        "success"
      );
    } catch (error) {
      console.error(
        "Start automatic mowing error:",
        error
      );

      await set(
        automaticStatusRef,
        "ERROR"
      ).catch(() => {});

      showMessage(
        "Failed to start automatic mowing.",
        "error"
      );
    } finally {
      setAutomaticLoading(false);
    }
  };

  // ===================================================
  // STOP AUTOMATIC MOWING
  // ===================================================

  const stopAutomaticMowing = async () => {
    setAutomaticLoading(true);

    try {
      // =================================================
      // STOP AUTOMATIC MODE
      // =================================================

      await set(
        automaticCommandRef,
        "STOP"
      );

      // =================================================
      // STOP MOVEMENT
      // =================================================

      await set(
        movementCommandRef,
        "stop"
      );

      // =================================================
      // TURN DRIVE OFF
      // =================================================

      await set(
        driveCommandRef,
        "OFF"
      );

      // =================================================
      // TURN MOWING OFF
      // =================================================

      await set(
        bladesCommandRef,
        "OFF"
      );

      // =================================================
      // UPDATE AUTOMATIC STATUS
      // =================================================

      await set(
        automaticStatusRef,
        "STOPPED"
      );

      setDriveStatus("OFF");
      setMowingStatus("OFF");
      setMovementCommand("stop");
      setAutomaticStatus("STOPPED");

      showMessage(
        "AUTOMATIC MOWING STOPPED. Drive and mowing relay OFF.",
        "success"
      );
    } catch (error) {
      console.error(
        "Stop automatic mowing error:",
        error
      );

      showMessage(
        "Failed to stop automatic mowing.",
        "error"
      );
    } finally {
      setAutomaticLoading(false);
    }
  };

  // ===================================================
  // EMERGENCY STOP
  // ===================================================

  const emergencyStop = async () => {
    setAutomaticLoading(true);

    try {
      await set(
        movementCommandRef,
        "stop"
      );

      await set(
        driveCommandRef,
        "OFF"
      );

      await set(
        bladesCommandRef,
        "OFF"
      );

      await set(
        automaticCommandRef,
        "STOP"
      );

      await set(
        automaticStatusRef,
        "STOPPED"
      );

      setMovementCommand("stop");
      setDriveStatus("OFF");
      setMowingStatus("OFF");
      setAutomaticStatus("STOPPED");

      showMessage(
        "EMERGENCY STOP ACTIVATED.",
        "success"
      );
    } catch (error) {
      console.error(
        "Emergency stop error:",
        error
      );

      showMessage(
        "Emergency stop command failed.",
        "error"
      );
    } finally {
      setAutomaticLoading(false);
    }
  };

  // ===================================================
  // STATUS HELPERS
  // ===================================================

  const isRunning =
    automaticStatus === "RUNNING";

  // ===================================================
  // UI
  // ===================================================

  return (
    <div className="min-h-screen bg-[#F4F7F1] p-4 sm:p-6 lg:p-8">

      <div className="max-w-6xl mx-auto">

        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6 mb-6">

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

            <div>

              <div className="flex items-center gap-3">

                <div className="w-12 h-12 rounded-2xl bg-[#40513B] flex items-center justify-center">

                  <RotateCw
                    className="w-6 h-6 text-white"
                  />

                </div>

                <div>

                  <h1 className="text-2xl sm:text-3xl font-black text-[#2C3627]">

                    Automatic Control

                  </h1>

                  <p className="text-sm text-gray-500 mt-1">

                    ECOMOW automatic mowing control

                  </p>

                </div>

              </div>

            </div>

            {/* CONNECTION */}

            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${
                firebaseConnected
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-red-50 border-red-200 text-red-600"
              }`}
            >

              {firebaseConnected ? (
                <Wifi className="w-4 h-4" />
              ) : (
                <WifiOff className="w-4 h-4" />
              )}

              <span className="text-xs font-black uppercase">

                {firebaseConnected
                  ? "Firebase Online"
                  : "Firebase Offline"}

              </span>

            </div>

          </div>

        </div>

        {/* ================================================= */}
        {/* MESSAGE */}
        {/* ================================================= */}

        {message && (
          <div
            className={`mb-6 rounded-2xl px-5 py-4 flex items-center gap-3 border ${
              messageType === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : messageType === "warning"
                ? "bg-amber-50 border-amber-200 text-amber-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >

            {messageType === "success" && (
              <CheckCircle2 className="w-5 h-5" />
            )}

            {messageType === "warning" && (
              <AlertTriangle className="w-5 h-5" />
            )}

            {messageType === "error" && (
              <ShieldAlert className="w-5 h-5" />
            )}

            <span className="text-sm font-bold">
              {message}
            </span>

          </div>
        )}

        {/* ================================================= */}
        {/* AUTOMATIC STATUS */}
        {/* ================================================= */}

        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6 mb-6">

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

            <div>

              <p className="text-[10px] font-black uppercase tracking-[3px] text-gray-400">

                Automatic Mowing Status

              </p>

              <div className="flex items-center gap-3 mt-2">

                <span
                  className={`w-4 h-4 rounded-full ${
                    isRunning
                      ? "bg-emerald-500 animate-pulse"
                      : "bg-gray-300"
                  }`}
                />

                <h2 className="text-2xl font-black text-[#2C3627]">

                  {automaticStatus}

                </h2>

              </div>

            </div>

            <div className="flex flex-wrap gap-3">

              <div className="px-4 py-3 rounded-xl bg-gray-50 border border-gray-100">

                <p className="text-[9px] font-black uppercase text-gray-400">

                  Drive

                </p>

                <p
                  className={`font-black text-sm ${
                    driveStatus === "ON"
                      ? "text-emerald-600"
                      : "text-gray-500"
                  }`}
                >

                  {driveStatus}

                </p>

              </div>

              <div className="px-4 py-3 rounded-xl bg-gray-50 border border-gray-100">

                <p className="text-[9px] font-black uppercase text-gray-400">

                  Mowing

                </p>

                <p
                  className={`font-black text-sm ${
                    mowingStatus === "ON"
                      ? "text-emerald-600"
                      : "text-gray-500"
                  }`}
                >

                  {mowingStatus}

                </p>

              </div>

              <div className="px-4 py-3 rounded-xl bg-gray-50 border border-gray-100">

                <p className="text-[9px] font-black uppercase text-gray-400">

                  Movement

                </p>

                <p className="font-black text-sm uppercase text-gray-500">

                  {movementCommand}

                </p>

              </div>

            </div>

          </div>

        </div>

        {/* ================================================= */}
        {/* AUTOMATIC CONTROLS */}
        {/* ================================================= */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

          {/* START */}

          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6">

            <div className="flex items-center gap-3 mb-5">

              <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center">

                <Play
                  className="w-5 h-5 text-emerald-700"
                  fill="currentColor"
                />

              </div>

              <div>

                <h3 className="font-black text-[#2C3627]">

                  Start Automatic Mowing

                </h3>

                <p className="text-xs text-gray-500">

                  Start drive and blade operation

                </p>

              </div>

            </div>

            <button
              type="button"
              onClick={startAutomaticMowing}
              disabled={
                automaticLoading ||
                isRunning ||
                driveStatus !== "ON" ||
                mowingStatus !== "ON"
              }
              className="w-full py-5 rounded-2xl bg-[#40513B] hover:bg-[#2C3627] disabled:bg-gray-200 disabled:text-gray-400 text-white font-black tracking-wider transition active:scale-[0.98] flex items-center justify-center gap-3"
            >

              <Play
                className="w-5 h-5"
                fill="currentColor"
              />

              {automaticLoading
                ? "STARTING..."
                : "START AUTOMATIC MOWING"}

            </button>

            {(driveStatus !== "ON" ||
              mowingStatus !== "ON") && (
              <p className="text-xs text-amber-600 mt-3 text-center font-semibold">

                Drive and Mowing must both be ON.

              </p>
            )}

          </div>

          {/* STOP */}

          <div className="bg-white rounded-[2rem] shadow-sm border border-red-100 p-6">

            <div className="flex items-center gap-3 mb-5">

              <div className="w-11 h-11 rounded-xl bg-red-100 flex items-center justify-center">

                <Square
                  className="w-5 h-5 text-red-700"
                  fill="currentColor"
                />

              </div>

              <div>

                <h3 className="font-black text-red-700">

                  Stop Automatic Mowing

                </h3>

                <p className="text-xs text-gray-500">

                  Stop movement and both relays

                </p>

              </div>

            </div>

            <button
              type="button"
              onClick={stopAutomaticMowing}
              disabled={automaticLoading}
              className="w-full py-5 rounded-2xl bg-red-600 hover:bg-red-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-black tracking-wider transition active:scale-[0.98] flex items-center justify-center gap-3"
            >

              <CircleStop className="w-6 h-6" />

              {automaticLoading
                ? "STOPPING..."
                : "STOP AUTOMATIC MOWING"}

            </button>

          </div>

        </div>

        {/* ================================================= */}
        {/* RELAY CONTROLS */}
        {/* ================================================= */}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

          {/* DRIVE */}

          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6">

            <div className="flex items-center justify-between mb-6">

              <div className="flex items-center gap-3">

                <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center">

                  <Power className="w-5 h-5 text-[#40513B]" />

                </div>

                <div>

                  <h3 className="font-black text-[#2C3627]">

                    Drive Relay

                  </h3>

                  <p className="text-xs text-gray-500">

                    GPIO 27

                  </p>

                </div>

              </div>

              <span
                className={`px-3 py-1 rounded-full text-[10px] font-black ${
                  driveStatus === "ON"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >

                {driveStatus}

              </span>

            </div>

            <div className="grid grid-cols-2 gap-3">

              <button
                type="button"
                onClick={turnDriveOn}
                disabled={
                  driveLoading ||
                  driveStatus === "ON"
                }
                className="py-4 rounded-xl bg-[#40513B] text-white font-black text-sm disabled:bg-gray-200 disabled:text-gray-400"
              >

                DRIVE ON

              </button>

              <button
                type="button"
                onClick={turnDriveOff}
                disabled={
                  driveLoading ||
                  driveStatus === "OFF"
                }
                className="py-4 rounded-xl border border-gray-200 text-gray-700 font-black text-sm hover:bg-red-50 hover:text-red-600 disabled:text-gray-300"
              >

                DRIVE OFF

              </button>

            </div>

          </div>

          {/* MOWING */}

          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6">

            <div className="flex items-center justify-between mb-6">

              <div className="flex items-center gap-3">

                <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center">

                  <Scissors className="w-5 h-5 text-emerald-700" />

                </div>

                <div>

                  <h3 className="font-black text-[#2C3627]">

                    Mowing Relay

                  </h3>

                  <p className="text-xs text-gray-500">

                    Blade motor relay

                  </p>

                </div>

              </div>

              <span
                className={`px-3 py-1 rounded-full text-[10px] font-black ${
                  mowingStatus === "ON"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >

                {mowingStatus}

              </span>

            </div>

            <div className="grid grid-cols-2 gap-3">

              <button
                type="button"
                onClick={turnMowingOn}
                disabled={
                  mowingLoading ||
                  mowingStatus === "ON"
                }
                className="py-4 rounded-xl bg-[#40513B] text-white font-black text-sm disabled:bg-gray-200 disabled:text-gray-400"
              >

                MOWING ON

              </button>

              <button
                type="button"
                onClick={turnMowingOff}
                disabled={
                  mowingLoading ||
                  mowingStatus === "OFF"
                }
                className="py-4 rounded-xl border border-gray-200 text-gray-700 font-black text-sm hover:bg-red-50 hover:text-red-600 disabled:text-gray-300"
              >

                MOWING OFF

              </button>

            </div>

          </div>

        </div>

        {/* ================================================= */}
        {/* EMERGENCY STOP */}
        {/* ================================================= */}

        <div className="bg-red-50 rounded-[2rem] border border-red-200 p-6">

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

            <div className="flex items-start gap-3">

              <ShieldAlert className="w-7 h-7 text-red-600 mt-1" />

              <div>

                <h3 className="font-black text-red-700">

                  Emergency Stop

                </h3>

                <p className="text-sm text-red-600/80 mt-1">

                  Immediately turns OFF the drive relay,
                  mowing relay, and movement.

                </p>

              </div>

            </div>

            <button
              type="button"
              onClick={emergencyStop}
              disabled={automaticLoading}
              className="w-full md:w-auto px-8 py-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black tracking-wider transition active:scale-95 disabled:bg-gray-300"
            >

              EMERGENCY STOP

            </button>

          </div>

        </div>

      </div>

    </div>
  );
}