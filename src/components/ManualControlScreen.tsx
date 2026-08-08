import React, { useEffect, useState } from "react";

import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  StopCircle,
  Power,
  Wifi,
  WifiOff,
  VideoOff,
  Lightbulb,
  RotateCw,
  CircleStop,
  ShieldAlert,
} from "lucide-react";

import { auth, db, realtimeDb } from "../firebase";

import {
  onAuthStateChanged,
  User,
} from "firebase/auth";

import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

import {
  ref,
  set,
  onValue,
} from "firebase/database";

// =====================================================
// COMMAND TYPES
// =====================================================

type Command =
  | "forward"
  | "backward"
  | "stop"
  | "left"
  | "right"
  | "ON"
  | "OFF";

// =====================================================
// COMPONENT
// =====================================================

export default function ManualControlScreen() {

  // ===================================================
  // AUTH
  // ===================================================

  const [user, setUser] = useState<User | null>(null);

  // ===================================================
  // CONNECTION
  // ===================================================

  const [isConnected, setIsConnected] = useState(false);

  // ===================================================
  // DRIVE
  // ===================================================

  const [driveActive, setDriveActive] = useState(false);

  // ===================================================
  // BLADES
  // ===================================================

  const [bladesActive, setBladesActive] = useState(false);

  // ===================================================
  // DIRECTION
  // ===================================================

  const [direction, setDirection] =
    useState<string | null>(null);

  // ===================================================
  // CAMERA
  // ===================================================

  const [cameraActive, setCameraActive] =
    useState(true);

  const [currentCamera, setCurrentCamera] =
    useState<"front" | "rear">("front");

  // ===================================================
  // LED
  // ===================================================

  const [ledActive, setLedActive] =
    useState(false);

  // ===================================================
  // AUTH LISTENER
  // ===================================================

  useEffect(() => {

    const unsubscribe =
      onAuthStateChanged(
        auth,
        (currentUser) => {

          setUser(currentUser);

        }
      );

    return () => unsubscribe();

  }, []);

  // ===================================================
  // FIRESTORE NOTIFICATION
  // ===================================================

  const createNotification = async (
    title: string,
    description: string,
    type:
      | "warning"
      | "system"
      | "completed"
      | "error"
  ) => {

    if (!user) return;

    try {

      await addDoc(
        collection(
          db,
          "users",
          user.uid,
          "notifications"
        ),
        {
          title,
          description,
          type,
          read: false,
          createdAt: serverTimestamp(),
        }
      );

    } catch (error) {

      console.error(
        "Firestore notification error:",
        error
      );

    }
  };

  // ===================================================
  // REALTIME DRIVE STATUS
  // ===================================================

  useEffect(() => {

    const driveStatusRef = ref(
      realtimeDb,
      "ecomow/mower/drive/status"
    );

    const unsubscribe = onValue(
      driveStatusRef,

      (snapshot) => {

        const status =
          snapshot.val();

        console.log(
          "Firebase Drive Status:",
          status
        );

        setIsConnected(true);

        // =============================================
        // DRIVE ON
        // =============================================

        if (
          status === "ON" ||
          status === "FORWARD" ||
          status === "BACKWARD"
        ) {

          setDriveActive(true);

        }

        // =============================================
        // DRIVE STOPPED / OFF
        // =============================================

        else if (
          status === "OFF" ||
          status === "STOPPED"
        ) {

          setDriveActive(false);

          setDirection(null);

        }

        // =============================================
        // STEERING COMMAND
        // =============================================

        else if (
          status === "STEERING_LEFT"
        ) {

          setDriveActive(true);

          setDirection("LEFT");

        }

        else if (
          status === "STEERING_RIGHT"
        ) {

          setDriveActive(true);

          setDirection("RIGHT");

        }

      },

      (error) => {

        console.error(
          "Realtime Database listener error:",
          error
        );

        setIsConnected(false);

      }
    );

    return () => unsubscribe();

  }, []);

  // ===================================================
  // SEND DRIVE COMMAND
  // ===================================================

  const sendCommand = async (
    cmd: Command,
    notify: boolean = true
  ) => {

    try {

      console.log(
        "Sending drive command:",
        cmd
      );

      await set(
        ref(
          realtimeDb,
          "ecomow/mower/drive/command"
        ),
        cmd
      );

      setIsConnected(true);

      // =============================================
      // LOCAL UI
      // =============================================

      if (cmd === "ON") {

        setDriveActive(true);

      }

      else if (cmd === "OFF") {

        setDriveActive(false);

        setDirection(null);

      }

      else if (cmd === "stop") {

        setDriveActive(false);

        setDirection(null);

      }

      else if (
        cmd === "forward" ||
        cmd === "backward" ||
        cmd === "left" ||
        cmd === "right"
      ) {

        setDriveActive(true);

        setDirection(
          cmd.toUpperCase()
        );

      }

      // =============================================
      // NOTIFICATION
      // =============================================

      if (notify) {

        const commandNames:
          Record<Command, string> = {

            ON: "Drive ON",

            OFF: "Drive OFF",

            forward: "Forward",

            backward: "Backward",

            stop: "Emergency Stop",

            left: "Left Turn",

            right: "Right Turn",

          };

        await createNotification(
          `Manual Command: ${commandNames[cmd]}`,

          `User executed ${commandNames[cmd]} command on the mower drive system.`,

          cmd === "stop" ||
          cmd === "OFF"
            ? "error"
            : "system"
        );

      }

    } catch (error) {

      console.error(
        "Firebase drive command error:",
        error
      );

      setIsConnected(false);

      if (notify) {

        await createNotification(
          "Command Failed",

          `Failed to send ${cmd} command to the mower.`,

          "error"
        );

      }

    }
  };

  // ===================================================
  // DRIVE ON
  // ===================================================

  const engageDrive = async () => {

    console.log(
      "Sending DRIVE ON..."
    );

    await sendCommand(
      "ON",
      true
    );

  };

  // ===================================================
  // DRIVE OFF
  // ===================================================

  const disengageDrive = async () => {

    console.log(
      "Sending DRIVE OFF..."
    );

    // ===============================================
    // DRIVE OFF
    // ===============================================

    await sendCommand(
      "OFF",
      true
    );

    setDirection(null);

  };

  // ===================================================
  // BLADE ON
  // TEMPORARILY DISABLED FOR DRIVE TEST
  // ===================================================

  const engageBlades = async () => {

    console.log(
      "Blade control is not active yet."
    );

    await createNotification(
      "Blade Control",
      "Blade control is disabled while testing the drive relay.",
      "warning"
    );

  };

  // ===================================================
  // BLADE OFF
  // ===================================================

  const disengageBlades = async () => {

    console.log(
      "Blade control is not active yet."
    );

    setBladesActive(false);

  };

  // ===================================================
  // EMERGENCY STOP
  // ===================================================

  const stopMower = async () => {

    try {

      console.log(
        "================================"
      );

      console.log(
        "EMERGENCY STOP"
      );

      console.log(
        "================================"
      );

      // =============================================
      // STOP DRIVE RELAY
      // =============================================

      await set(
        ref(
          realtimeDb,
          "ecomow/mower/drive/command"
        ),
        "OFF"
      );

      // =============================================
      // LOCAL UI
      // =============================================

      setDriveActive(false);

      setBladesActive(false);

      setDirection(null);

      setIsConnected(true);

      // =============================================
      // NOTIFICATION
      // =============================================

      await createNotification(
        "Emergency Stop",

        "Drive relay has been turned OFF.",

        "error"
      );

    } catch (error) {

      console.error(
        "Emergency stop error:",
        error
      );

      setIsConnected(false);

    }
  };

  // ===================================================
  // CAMERA
  // ===================================================

  const toggleCamera = () => {

    const newCamera =
      currentCamera === "front"
        ? "rear"
        : "front";

    setCurrentCamera(
      newCamera
    );

    createNotification(
      "Camera Switched",

      `Camera view changed to ${newCamera.toUpperCase()} camera.`,

      "system"
    );

  };

  // ===================================================
  // LED
  // ===================================================

  const toggleLED = () => {

    const newLEDState =
      !ledActive;

    setLedActive(
      newLEDState
    );

    createNotification(
      `LED ${newLEDState ? "ON" : "OFF"}`,

      `Manual LED control turned ${
        newLEDState
          ? "on"
          : "off"
      }.`,

      "system"
    );

  };

  // ===================================================
  // DIRECTION PRESS
  // ===================================================

  const handleDirectionPress = (
    dir: Command
  ) => {

    if (!driveActive) {

      console.log(
        "Drive is not engaged."
      );

      return;

    }

    setDirection(
      dir.toString().toUpperCase()
    );

    sendCommand(
      dir,
      true
    );

  };

  // ===================================================
  // DIRECTION RELEASE
  // ===================================================

  const handleDirectionRelease = () => {

    setDirection(null);

    // ===============================================
    // Stop relay when button is released
    // ===============================================

    sendCommand(
      "stop",
      false
    );

  };

  // ===================================================
  // LOADING
  // ===================================================

  if (user === null) {

    return (

      <div className="flex items-center justify-center min-h-[400px]">

        <div className="flex items-center gap-3 text-emerald-800 bg-white px-6 py-4 rounded-2xl shadow-sm border border-emerald-100">

          <div className="w-4 h-4 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />

          <span className="font-semibold text-sm">

            Authenticating Session...

          </span>

        </div>

      </div>

    );

  }

  // ===================================================
  // UI
  // ===================================================

  return (

    <div className="p-4 sm:p-6 max-w-7xl mx-auto pb-28 lg:pb-10 font-sans">

      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/40 backdrop-blur-md p-6 rounded-3xl border border-white/60 shadow-sm">

        <div>

          <h1 className="text-2xl sm:text-3xl font-black text-[#2C3627] tracking-wider uppercase flex items-center gap-3">

            Tactical Control

          </h1>

          <p className="text-[#40513B] font-semibold text-xs sm:text-sm mt-1">

            Firebase Drive Relay Control

          </p>

        </div>

        {/* CONNECTION STATUS */}

        <div
          className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl border transition-all shadow-sm ${
            isConnected
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-600 animate-pulse"
          }`}
        >

          {isConnected ? (

            <>

              <Wifi className="w-4 h-4 text-emerald-600" />

              <span className="text-xs font-black uppercase tracking-widest">

                Firebase Connected

              </span>

              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />

            </>

          ) : (

            <>

              <WifiOff className="w-4 h-4 text-rose-600" />

              <span className="text-xs font-black uppercase tracking-widest">

                Firebase Offline

              </span>

            </>

          )}

        </div>

      </div>

      {/* ================================================= */}
      {/* MAIN GRID */}
      {/* ================================================= */}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* ================================================= */}
        {/* LEFT COLUMN */}
        {/* ================================================= */}

        <div className="lg:col-span-7 space-y-8">

          {/* ================================================= */}
          {/* CAMERA */}
          {/* ================================================= */}

          <div className="bg-white rounded-[2.5rem] p-3 sm:p-4 shadow-xl border border-gray-100">

            <div className="relative bg-[#1A2118] rounded-[2rem] overflow-hidden aspect-video shadow-inner">

              {cameraActive ? (

                <div className="absolute inset-0">

                  <svg
                    width="100%"
                    height="100%"
                    viewBox="0 0 800 450"
                    className="w-full h-full object-cover"
                  >

                    <rect
                      width="800"
                      height="225"
                      fill="#33412E"
                      opacity="0.5"
                    />

                    <rect
                      y="225"
                      width="800"
                      height="225"
                      fill="#253021"
                    />

                    <line
                      x1="0"
                      y1="450"
                      x2="350"
                      y2="225"
                      stroke="#ffffff"
                      strokeOpacity="0.08"
                      strokeWidth="2"
                    />

                    <line
                      x1="800"
                      y1="450"
                      x2="450"
                      y2="225"
                      stroke="#ffffff"
                      strokeOpacity="0.08"
                      strokeWidth="2"
                    />

                  </svg>

                  <div className="absolute top-4 left-4 flex items-center gap-2 bg-emerald-950/80 backdrop-blur-md border border-emerald-500/30 px-3 py-1.5 rounded-xl shadow-lg">

                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />

                    <span className="text-emerald-300 text-[10px] font-black uppercase tracking-widest">

                      Live Feed ({currentCamera.toUpperCase()})

                    </span>

                  </div>

                </div>

              ) : (

                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/40">

                  <VideoOff className="w-12 h-12" />

                  <span className="text-xs font-bold uppercase tracking-wider">

                    Camera Offline

                  </span>

                </div>

              )}

              {/* ACTIVE COMMAND */}

              {direction && (

                <div className="absolute top-4 right-4 bg-emerald-600/90 backdrop-blur-md border border-emerald-400/40 px-4 py-1.5 rounded-xl text-white text-[10px] font-black uppercase tracking-widest shadow-lg animate-pulse">

                  {direction} Active

                </div>

              )}

              {/* CAMERA CONTROLS */}

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3 w-auto max-w-[90%]">

                <button
                  onClick={toggleCamera}
                  className="flex items-center gap-2 bg-black/60 hover:bg-black/80 backdrop-blur-md px-4 py-2.5 rounded-xl text-white text-xs font-bold border border-white/10 transition active:scale-95 shadow-lg"
                >

                  <RotateCw className="w-3.5 h-3.5 text-emerald-400" />

                  <span>

                    {currentCamera} Cam

                  </span>

                </button>

                <button
                  onClick={toggleLED}
                  className={`flex items-center gap-2 backdrop-blur-md px-4 py-2.5 rounded-xl text-xs font-bold border transition active:scale-95 shadow-lg ${
                    ledActive
                      ? "bg-amber-500/80 text-white border-amber-300/50"
                      : "bg-black/60 hover:bg-black/80 text-white border-white/10"
                  }`}
                >

                  <Lightbulb
                    className={`w-3.5 h-3.5 ${
                      ledActive
                        ? "text-amber-200 fill-amber-200"
                        : "text-gray-400"
                    }`}
                  />

                  <span>

                    Lamp {ledActive ? "ON" : "OFF"}

                  </span>

                </button>

              </div>

            </div>

          </div>

          {/* ================================================= */}
          {/* DRIVE COMMAND PAD */}
          {/* ================================================= */}

          <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 shadow-xl border border-gray-100 flex flex-col items-center select-none">

            <div className="flex items-center justify-between w-full mb-6">

              <h2 className="font-black text-[#2C3627] text-xs uppercase tracking-[3px]">

                Drive Command

              </h2>

              {!driveActive && (

                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">

                  Drive Disengaged

                </span>

              )}

            </div>

            <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">

              <div className="absolute inset-0 rounded-full bg-slate-50 border-4 border-slate-100 shadow-inner" />

              {/* FORWARD */}

              <button
                disabled={!driveActive}
                onMouseDown={() =>
                  handleDirectionPress("forward")
                }
                onMouseUp={handleDirectionRelease}
                onMouseLeave={handleDirectionRelease}
                onTouchStart={() =>
                  handleDirectionPress("forward")
                }
                onTouchEnd={handleDirectionRelease}
                className="absolute top-2 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white shadow-md hover:shadow-lg active:scale-95 border border-slate-100 flex items-center justify-center text-[#2C3627] disabled:opacity-30 disabled:cursor-not-allowed transition"
              >

                <ArrowUp className="w-8 h-8 sm:w-10 sm:h-10" />

              </button>

              {/* RIGHT */}

              <button
                disabled={!driveActive}
                onMouseDown={() =>
                  handleDirectionPress("right")
                }
                onMouseUp={handleDirectionRelease}
                onMouseLeave={handleDirectionRelease}
                onTouchStart={() =>
                  handleDirectionPress("right")
                }
                onTouchEnd={handleDirectionRelease}
                className="absolute right-2 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white shadow-md hover:shadow-lg active:scale-95 border border-slate-100 flex items-center justify-center text-[#2C3627] disabled:opacity-30 disabled:cursor-not-allowed transition"
              >

                <ArrowRight className="w-8 h-8 sm:w-10 sm:h-10" />

              </button>

              {/* BACKWARD */}

              <button
                disabled={!driveActive}
                onMouseDown={() =>
                  handleDirectionPress("backward")
                }
                onMouseUp={handleDirectionRelease}
                onMouseLeave={handleDirectionRelease}
                onTouchStart={() =>
                  handleDirectionPress("backward")
                }
                onTouchEnd={handleDirectionRelease}
                className="absolute bottom-2 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white shadow-md hover:shadow-lg active:scale-95 border border-slate-100 flex items-center justify-center text-[#2C3627] disabled:opacity-30 disabled:cursor-not-allowed transition"
              >

                <ArrowDown className="w-8 h-8 sm:w-10 sm:h-10" />

              </button>

              {/* LEFT */}

              <button
                disabled={!driveActive}
                onMouseDown={() =>
                  handleDirectionPress("left")
                }
                onMouseUp={handleDirectionRelease}
                onMouseLeave={handleDirectionRelease}
                onTouchStart={() =>
                  handleDirectionPress("left")
                }
                onTouchEnd={handleDirectionRelease}
                className="absolute left-2 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white shadow-md hover:shadow-lg active:scale-95 border border-slate-100 flex items-center justify-center text-[#2C3627] disabled:opacity-30 disabled:cursor-not-allowed transition"
              >

                <ArrowLeft className="w-8 h-8 sm:w-10 sm:h-10" />

              </button>

              {/* CENTER */}

              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-100 border border-slate-200 shadow-inner flex items-center justify-center">

                <div
                  className={`w-6 h-6 rounded-full ${
                    driveActive
                      ? "bg-emerald-500 animate-pulse"
                      : "bg-slate-300"
                  }`}
                />

              </div>

            </div>

            <p className="mt-5 text-[10px] text-slate-400 font-semibold text-center">

              Commands are sent through Firebase Realtime Database.

            </p>

          </div>

        </div>

        {/* ================================================= */}
        {/* RIGHT COLUMN */}
        {/* ================================================= */}

        <div className="lg:col-span-5 space-y-6">

          {/* ================================================= */}
          {/* EMERGENCY STOP */}
          {/* ================================================= */}

          <div className="bg-white rounded-[2.5rem] p-6 shadow-xl border border-red-100">

            <div className="mb-4">

              <div className="flex items-center gap-2">

                <ShieldAlert className="w-5 h-5 text-red-600" />

                <h3 className="font-black text-red-700 text-xs uppercase tracking-[3px]">

                  Safety Control

                </h3>

              </div>

              <p className="text-[11px] text-slate-500 font-medium mt-1">

                Immediately turn OFF the drive relay.

              </p>

            </div>

            <button
              type="button"
              onClick={stopMower}
              className="w-full bg-rose-600 hover:bg-rose-700 active:bg-rose-800 active:scale-[0.98] text-white py-6 rounded-[2rem] font-black text-lg tracking-wider flex items-center justify-center gap-3 transition-all duration-200 shadow-lg shadow-rose-600/30 border border-rose-500"
            >

              <StopCircle
                className="w-8 h-8 text-white"
                strokeWidth={2.5}
              />

              <span>

                EMERGENCY STOP

              </span>

            </button>

            <div className="mt-3 flex items-center justify-center gap-2">

              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />

              <span className="text-[9px] font-black uppercase tracking-[2px] text-red-500">

                Press to stop relay

              </span>

            </div>

          </div>

          {/* ================================================= */}
          {/* DRIVE CONTROL */}
          {/* ================================================= */}

          <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 shadow-xl border border-gray-100">

            <div className="flex items-center justify-between mb-5">

              <h3 className="font-black text-[#2C3627] text-xs uppercase tracking-widest">

                Drive Relay

              </h3>

              <span
                className={`text-xs font-black uppercase px-3 py-1 rounded-full border ${
                  driveActive
                    ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                    : "bg-slate-100 text-slate-500 border-slate-200"
                }`}
              >

                {driveActive
                  ? "Engaged"
                  : "Disengaged"}

              </span>

            </div>

            <div className="space-y-3">

              {/* DRIVE ON */}

              <button
                onClick={engageDrive}
                disabled={driveActive}
                className={`w-full py-4 rounded-2xl font-bold text-sm tracking-wider flex items-center justify-center gap-3 transition ${
                  driveActive
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-[#40513B] hover:bg-[#2C3627] text-white shadow-md active:scale-[0.98]"
                }`}
              >

                <Power className="w-4 h-4" />

                ENGAGE DRIVE

              </button>

              {/* DRIVE OFF */}

              <button
                onClick={disengageDrive}
                disabled={!driveActive}
                className={`w-full py-4 rounded-2xl font-bold text-sm tracking-wider flex items-center justify-center gap-3 border transition ${
                  !driveActive
                    ? "border-slate-100 text-slate-300 cursor-not-allowed"
                    : "border-slate-200 text-slate-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 active:scale-[0.98]"
                }`}
              >

                <CircleStop className="w-4 h-4" />

                DISENGAGE DRIVE

              </button>

            </div>

            {/* FIREBASE PATH */}

            <div className="mt-5 p-3 bg-slate-50 rounded-xl border border-slate-100">

              <p className="text-[9px] uppercase tracking-widest font-black text-slate-400">

                Firebase Command Path

              </p>

              <p className="text-[10px] font-mono text-slate-600 mt-1 break-all">

                /ecomow/mower/drive/command

              </p>

            </div>

          </div>

          {/* ================================================= */}
          {/* BLADE CONTROL - TEMPORARILY DISABLED */}
          {/* ================================================= */}

          <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 shadow-xl border border-gray-100 opacity-60">

            <div className="flex items-center justify-between mb-5">

              <h3 className="font-black text-[#2C3627] text-xs uppercase tracking-widest">

                Cutting Blades

              </h3>

              <span className="text-xs font-black uppercase px-3 py-1 rounded-full border bg-slate-100 text-slate-500 border-slate-200">

                Testing Later

              </span>

            </div>

            <div className="space-y-3">

              <button
                onClick={engageBlades}
                className="w-full py-4 rounded-2xl font-bold text-sm tracking-wider bg-slate-100 text-slate-400"
              >

                ENGAGE BLADES

              </button>

              <button
                onClick={disengageBlades}
                className="w-full py-4 rounded-2xl font-bold text-sm tracking-wider border border-slate-100 text-slate-400"
              >

                DISENGAGE BLADES

              </button>

            </div>

            <p className="text-[10px] text-slate-400 mt-4 text-center">

              Blade control will be connected after drive relay testing.

            </p>

          </div>

        </div>

      </div>

    </div>
  );
}

