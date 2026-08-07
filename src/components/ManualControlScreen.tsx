import React, { useState, useEffect } from "react";

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
  | "right";


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

    const unsubscribe = onAuthStateChanged(
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

        const status = snapshot.val();

        console.log(
          "Firebase Drive Status:",
          status
        );


        // =============================================
        // DRIVE ON
        // =============================================

        if (status === "ON") {

          setDriveActive(true);

          setIsConnected(true);

        }


        // =============================================
        // DRIVE OFF
        // =============================================

        else if (status === "OFF") {

          setDriveActive(false);

          setDirection(null);

          setIsConnected(true);

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
  // REALTIME BLADE STATUS
  // ===================================================

  useEffect(() => {

    const bladeStatusRef = ref(
      realtimeDb,
      "ecomow/mower/blades/status"
    );

    const unsubscribe = onValue(
      bladeStatusRef,

      (snapshot) => {

        const status = snapshot.val();

        console.log(
          "Firebase Blade Status:",
          status
        );


        if (status === "ON") {

          setBladesActive(true);

          setIsConnected(true);

        }

        else if (status === "OFF") {

          setBladesActive(false);

          setIsConnected(true);

        }

      },

      (error) => {

        console.error(
          "Blade realtime listener error:",
          error
        );

      }
    );


    return () => unsubscribe();

  }, []);


  // ===================================================
  // SEND MOVEMENT COMMAND
  // ===================================================

  const sendCommand = async (
    cmd: Command,
    notify: boolean = true
  ) => {

    try {

      await set(
        ref(
          realtimeDb,
          "ecomow/mower/movement/command"
        ),
        cmd
      );


      setIsConnected(true);


      if (notify) {

        const commandNames: Record<
          Command,
          string
        > = {

          forward: "Forward",

          backward: "Backward",

          stop: "Emergency Stop",

          left: "Left Turn",

          right: "Right Turn",

        };


        await createNotification(
          `Manual Command: ${commandNames[cmd]}`,

          `User executed ${commandNames[cmd]} command on the mower.`,

          cmd === "stop"
            ? "error"
            : "system"
        );

      }

    } catch (error) {

      console.error(
        "Firebase movement command error:",
        error
      );

      setIsConnected(false);


      if (notify) {

        await createNotification(
          "Command Failed",

          `Failed to send ${cmd} command.`,

          "error"
        );

      }

    }

  };


  // ===================================================
  // DRIVE ON
  // ===================================================

  const engageDrive = async () => {

    try {

      console.log(
        "Sending DRIVE ON..."
      );


      await set(
        ref(
          realtimeDb,
          "ecomow/mower/drive/command"
        ),
        "ON"
      );


      setIsConnected(true);


      await createNotification(
        "Drive Engaged",
        "Mower drive system has been engaged.",
        "completed"
      );


      console.log(
        "DRIVE ON command sent."
      );

    } catch (error) {

      console.error(
        "Firebase drive ON error:",
        error
      );

      setIsConnected(false);


      await createNotification(
        "Drive Engagement Failed",
        "Unable to send drive ON command.",
        "error"
      );

    }

  };


  // ===================================================
  // DRIVE OFF
  // ===================================================

  const disengageDrive = async () => {

    try {

      console.log(
        "Sending DRIVE OFF..."
      );


      await set(
        ref(
          realtimeDb,
          "ecomow/mower/drive/command"
        ),
        "OFF"
      );


      // Stop movement too
      await set(
        ref(
          realtimeDb,
          "ecomow/mower/movement/command"
        ),
        "stop"
      );


      setDirection(null);

      setIsConnected(true);


      await createNotification(
        "Drive Disengaged",
        "Mower drive system has been disengaged.",
        "warning"
      );


      console.log(
        "DRIVE OFF command sent."
      );

    } catch (error) {

      console.error(
        "Firebase drive OFF error:",
        error
      );

      setIsConnected(false);


      await createNotification(
        "Drive Disengagement Failed",
        "Unable to send drive OFF command.",
        "error"
      );

    }

  };


  // ===================================================
  // BLADE ON
  // ===================================================

  const engageBlades = async () => {

    try {

      await set(
        ref(
          realtimeDb,
          "ecomow/mower/blades/command"
        ),
        "ON"
      );


      setIsConnected(true);


      await createNotification(
        "Blades Engaged",
        "Mower blades have been engaged manually.",
        "completed"
      );

    } catch (error) {

      console.error(
        "Firebase blade ON error:",
        error
      );

      setIsConnected(false);


      await createNotification(
        "Blade Engagement Failed",
        "Unable to send blade ON command.",
        "error"
      );

    }

  };


  // ===================================================
  // BLADE OFF
  // ===================================================

  const disengageBlades = async () => {

    try {

      await set(
        ref(
          realtimeDb,
          "ecomow/mower/blades/command"
        ),
        "OFF"
      );


      setIsConnected(true);


      await createNotification(
        "Blades Disengaged",
        "Mower blades have been disengaged manually.",
        "warning"
      );

    } catch (error) {

      console.error(
        "Firebase blade OFF error:",
        error
      );

      setIsConnected(false);


      await createNotification(
        "Blade Disengagement Failed",
        "Unable to send blade OFF command.",
        "error"
      );

    }

  };


  // ===================================================
  // EMERGENCY STOP
  // ===================================================

  const stopMower = async () => {

    try {

      console.log(
        "EMERGENCY STOP"
      );


      // Stop movement
      await set(
        ref(
          realtimeDb,
          "ecomow/mower/movement/command"
        ),
        "stop"
      );


      // Turn drive OFF
      await set(
        ref(
          realtimeDb,
          "ecomow/mower/drive/command"
        ),
        "OFF"
      );


      // Turn blades OFF
      await set(
        ref(
          realtimeDb,
          "ecomow/mower/blades/command"
        ),
        "OFF"
      );


      setDriveActive(false);

      setBladesActive(false);

      setDirection(null);

      setIsConnected(true);


      await createNotification(
        "Emergency Stop",
        "All mower movement and active systems have been stopped.",
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


    setCurrentCamera(newCamera);


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


    setLedActive(newLEDState);


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
    dir: string
  ) => {

    if (!driveActive) return;

    setDirection(dir);

  };


  // ===================================================
  // DIRECTION RELEASE
  // ===================================================

  const handleDirectionRelease = () => {

    setDirection(null);

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

          <h1 className="text-2xl sm:text-3xl font-black text-[#2C3627] tracking-wider uppercase drop-shadow-sm flex items-center gap-3">

            Tactical Control

          </h1>

          <p className="text-[#40513B] font-semibold text-xs sm:text-sm mt-1">

            Direct navigation, live video feed & active telemetry

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

                Link Secured

              </span>

              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />

            </>

          ) : (

            <>

              <WifiOff className="w-4 h-4 text-rose-600" />

              <span className="text-xs font-black uppercase tracking-widest">

                Signal Lost

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

            <div className="relative bg-[#1A2118] rounded-[2rem] overflow-hidden aspect-video shadow-inner group">


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


                  {/* LIVE BADGE */}

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


              {/* ACTIVE VECTOR */}

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

                  <span className="capitalize">

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
          {/* JOYSTICK */}
          {/* ================================================= */}

          <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 shadow-xl border border-gray-100 flex flex-col items-center select-none">

            <div className="flex items-center justify-between w-full mb-6">

              <h2 className="font-black text-[#2C3627] text-xs uppercase tracking-[3px]">

                Thrust Vectoring

              </h2>


              {!driveActive && (

                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">

                  Drive Disengaged

                </span>

              )}

            </div>


            <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">

              {/* OUTER RING */}

              <div className="absolute inset-0 rounded-full bg-slate-50 border-4 border-slate-100 shadow-inner" />


              {/* FORWARD */}

              <button
                disabled={!driveActive}
                onMouseDown={() => {

                  handleDirectionPress("FORWARD");

                  sendCommand(
                    "forward",
                    true
                  );

                }}
                onMouseUp={handleDirectionRelease}
                onMouseLeave={handleDirectionRelease}
                onTouchStart={() => {

                  handleDirectionPress("FORWARD");

                  sendCommand(
                    "forward",
                    true
                  );

                }}
                onTouchEnd={handleDirectionRelease}
                className="absolute top-2 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white shadow-md hover:shadow-lg active:scale-95 border border-slate-100 flex items-center justify-center text-[#2C3627] disabled:opacity-30 disabled:cursor-not-allowed transition"
              >

                <ArrowUp className="w-8 h-8 sm:w-10 sm:h-10" />

              </button>


              {/* RIGHT */}

              <button
                disabled={!driveActive}
                onMouseDown={() => {

                  handleDirectionPress("RIGHT");

                  sendCommand(
                    "right",
                    true
                  );

                }}
                onMouseUp={handleDirectionRelease}
                onMouseLeave={handleDirectionRelease}
                onTouchStart={() => {

                  handleDirectionPress("RIGHT");

                  sendCommand(
                    "right",
                    true
                  );

                }}
                onTouchEnd={handleDirectionRelease}
                className="absolute right-2 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white shadow-md hover:shadow-lg active:scale-95 border border-slate-100 flex items-center justify-center text-[#2C3627] disabled:opacity-30 disabled:cursor-not-allowed transition"
              >

                <ArrowRight className="w-8 h-8 sm:w-10 sm:h-10" />

              </button>


              {/* BACKWARD */}

              <button
                disabled={!driveActive}
                onMouseDown={() => {

                  handleDirectionPress("BACKWARD");

                  sendCommand(
                    "backward",
                    true
                  );

                }}
                onMouseUp={handleDirectionRelease}
                onMouseLeave={handleDirectionRelease}
                onTouchStart={() => {

                  handleDirectionPress("BACKWARD");

                  sendCommand(
                    "backward",
                    true
                  );

                }}
                onTouchEnd={handleDirectionRelease}
                className="absolute bottom-2 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white shadow-md hover:shadow-lg active:scale-95 border border-slate-100 flex items-center justify-center text-[#2C3627] disabled:opacity-30 disabled:cursor-not-allowed transition"
              >

                <ArrowDown className="w-8 h-8 sm:w-10 sm:h-10" />

              </button>


              {/* LEFT */}

              <button
                disabled={!driveActive}
                onMouseDown={() => {

                  handleDirectionPress("LEFT");

                  sendCommand(
                    "left",
                    true
                  );

                }}
                onMouseUp={handleDirectionRelease}
                onMouseLeave={handleDirectionRelease}
                onTouchStart={() => {

                  handleDirectionPress("LEFT");

                  sendCommand(
                    "left",
                    true
                  );

                }}
                onTouchEnd={handleDirectionRelease}
                className="absolute left-2 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white shadow-md hover:shadow-lg active:scale-95 border border-slate-100 flex items-center justify-center text-[#2C3627] disabled:opacity-30 disabled:cursor-not-allowed transition"
              >

                <ArrowLeft className="w-8 h-8 sm:w-10 sm:h-10" />

              </button>


              {/* CENTER */}

              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-100 border border-slate-200 shadow-inner flex items-center justify-center">

                <div className="w-6 h-6 rounded-full bg-slate-300" />

              </div>

            </div>

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

                Immediately stop all mower movement and active systems.

              </p>

            </div>


            <button
              type="button"
              onClick={stopMower}
              className="w-full !bg-rose-600 hover:!bg-rose-700 active:!bg-rose-800 active:scale-[0.98] !text-white py-6 rounded-[2rem] font-black text-lg tracking-wider flex items-center justify-center gap-3 transition-all duration-200 shadow-lg !shadow-rose-600/30 !border !border-rose-500"
            >

              <StopCircle
                className="w-8 h-8 !text-white"
                strokeWidth={2.5}
              />

              <span className="!text-white">

                EMERGENCY STOP

              </span>

            </button>


            <div className="mt-3 flex items-center justify-center gap-2">

              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />

              <span className="text-[9px] font-black uppercase tracking-[2px] text-red-500">

                Press to stop mower

              </span>

            </div>

          </div>



          {/* ================================================= */}
          {/* DRIVE CONTROL */}
          {/* ================================================= */}

          <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 shadow-xl border border-gray-100">

            <div className="flex items-center justify-between mb-5">

              <h3 className="font-black text-[#2C3627] text-xs uppercase tracking-widest">

                Drive System

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

          </div>



          {/* ================================================= */}
          {/* BLADE CONTROL */}
          {/* ================================================= */}

          <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 shadow-xl border border-gray-100">

            <div className="flex items-center justify-between mb-5">

              <h3 className="font-black text-[#2C3627] text-xs uppercase tracking-widest">

                Cutting Blades

              </h3>


              <span
                className={`text-xs font-black uppercase px-3 py-1 rounded-full border ${
                  bladesActive
                    ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                    : "bg-slate-100 text-slate-500 border-slate-200"
                }`}
              >

                {bladesActive
                  ? "Engaged"
                  : "Disengaged"}

              </span>

            </div>


            <div className="space-y-3">


              {/* BLADE ON */}

              <button
                onClick={engageBlades}
                disabled={bladesActive}
                className={`w-full py-4 rounded-2xl font-bold text-sm tracking-wider flex items-center justify-center gap-3 transition ${
                  bladesActive
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-[#40513B] hover:bg-[#2C3627] text-white shadow-md active:scale-[0.98]"
                }`}
              >

                <Power className="w-4 h-4" />

                ENGAGE BLADES

              </button>


              {/* BLADE OFF */}

              <button
                onClick={disengageBlades}
                disabled={!bladesActive}
                className={`w-full py-4 rounded-2xl font-bold text-sm tracking-wider flex items-center justify-center gap-3 border transition ${
                  !bladesActive
                    ? "border-slate-100 text-slate-300 cursor-not-allowed"
                    : "border-slate-200 text-slate-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 active:scale-[0.98]"
                }`}
              >

                <CircleStop className="w-4 h-4" />

                DISENGAGE BLADES

              </button>

            </div>

          </div>

        </div>

      </div>

    </div>

  );

}