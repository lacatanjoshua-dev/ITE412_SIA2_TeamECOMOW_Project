import React, { useEffect, useRef, useState } from "react";

import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Wifi,
  WifiOff,
  Video,
  VideoOff,
  RotateCw,
  CircleStop,
  ShieldAlert,
  Scissors,
  LockKeyhole,
  Power,
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
// TYPES
// =====================================================

type Direction =
  | "forward"
  | "backward"
  | "left"
  | "right";

type NotificationType =
  | "warning"
  | "system"
  | "completed"
  | "error";

// =====================================================
// FIREBASE PATHS
// =====================================================

const FIREBASE_PATHS = {
  connectionStatus:
    "ecomow/mower/connection/status",

  driveCommand:
    "ecomow/mower/drive/command",

  driveStatus:
    "ecomow/mower/drive/status",

  movementCommand:
    "ecomow/mower/movement/command",

  steeringCommand:
    "ecomow/mower/steering/command",

  steeringStatus:
    "ecomow/mower/steering/status",

  bladesCommand:
    "ecomow/mower/blades/command",

  bladesStatus:
    "ecomow/mower/blades/status",

  automaticCommand:
    "ecomow/mower/automatic/command",

  automaticStatus:
    "ecomow/mower/automatic/status",

  cameraCommand:
    "ecomow/mower/camera/command",

  cameraStatus:
    "ecomow/mower/camera/status",

  // IMPORTANT:
  // Camera URL will now come from Firebase.
  cameraStreamUrl:
    "ecomow/mower/camera/streamUrl",
};

// =====================================================
// COMPONENT
// =====================================================

export default function ManualControlScreen() {

  // ===================================================
  // AUTH
  // ===================================================

  const [user, setUser] =
    useState<User | null>(null);

  const [authReady, setAuthReady] =
    useState(false);

  // ===================================================
  // CONNECTION
  // ===================================================

  const [isConnected, setIsConnected] =
    useState(false);

  const [mowerOnline, setMowerOnline] =
    useState(false);

  // ===================================================
  // DRIVE
  // ===================================================

  const [driveActive, setDriveActive] =
    useState(false);

  // ===================================================
  // MOVEMENT
  // ===================================================

  const [direction, setDirection] =
    useState<Direction | null>(null);

  // ===================================================
  // BLADES
  // ===================================================

  const [bladesActive, setBladesActive] =
    useState(false);

  // ===================================================
  // STEERING
  // ===================================================

  const [steeringStatus, setSteeringStatus] =
    useState("STOP");

  // ===================================================
  // AUTOMATIC MODE
  // ===================================================

  const [automaticRunning, setAutomaticRunning] =
    useState(false);

  const [automaticStatus, setAutomaticStatus] =
    useState("STOPPED");

  // ===================================================
  // CAMERA
  // ===================================================

  const [cameraActive, setCameraActive] =
    useState(true);

  const [currentCamera, setCurrentCamera] =
    useState<"front" | "rear">("front");

  const [cameraError, setCameraError] =
    useState(false);

  // IMPORTANT:
  // No hardcoded ESP32-CAM IP anymore.
  // This URL comes from Firebase:
  //
  // ecomow/mower/camera/streamUrl
  //
  const [cameraStreamUrl, setCameraStreamUrl] =
    useState("");

  // ===================================================
  // ACTIVE CONTROL
  // ===================================================

  const [activeControl, setActiveControl] =
    useState<Direction | null>(null);

  // ===================================================
  // POINTER CONTROL
  // ===================================================

  const activePointerRef =
    useRef<number | null>(null);

  const activeDirectionRef =
    useRef<Direction | null>(null);

  const stoppingRef =
    useRef(false);

  // ===================================================
  // AUTH LISTENER
  // ===================================================

  useEffect(() => {

    const unsubscribe =
      onAuthStateChanged(
        auth,
        (currentUser) => {

          setUser(currentUser);
          setAuthReady(true);

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
    type: NotificationType
  ) => {

    if (!user) {

      console.warn(
        "Cannot create notification: no authenticated user."
      );

      return;
    }

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
  // CONNECTION STATUS
  // ===================================================

  useEffect(() => {

    const connectionRef =
      ref(
        realtimeDb,
        FIREBASE_PATHS.connectionStatus
      );

    const unsubscribe =
      onValue(
        connectionRef,

        (snapshot) => {

          const status =
            snapshot.val();

          console.log(
            "Mower Connection:",
            status
          );

          if (status === "ONLINE") {

            setIsConnected(true);
            setMowerOnline(true);

          } else {

            setIsConnected(true);
            setMowerOnline(false);

          }

        },

        (error) => {

          console.error(
            "Connection status error:",
            error
          );

          setIsConnected(false);
          setMowerOnline(false);

        }
      );

    return () => unsubscribe();

  }, []);

  // ===================================================
  // DRIVE STATUS
  // ===================================================

  useEffect(() => {

    const driveStatusRef =
      ref(
        realtimeDb,
        FIREBASE_PATHS.driveStatus
      );

    const unsubscribe =
      onValue(
        driveStatusRef,

        (snapshot) => {

          const status =
            snapshot.val();

          console.log(
            "Drive Status:",
            status
          );

          if (
            status === "ON" ||
            status === "FORWARD" ||
            status === "BACKWARD"
          ) {

            setDriveActive(true);

          } else {

            setDriveActive(false);
            setActiveControl(null);

          }

        }
      );

    return () => unsubscribe();

  }, []);

  // ===================================================
  // MOVEMENT STATUS
  // ===================================================

  useEffect(() => {

    const movementRef =
      ref(
        realtimeDb,
        FIREBASE_PATHS.movementCommand
      );

    const unsubscribe =
      onValue(
        movementRef,

        (snapshot) => {

          const movement =
            snapshot.val();

          console.log(
            "Movement Command:",
            movement
          );

          if (
            movement === "forward"
          ) {

            setDirection("forward");

          } else if (
            movement === "backward"
          ) {

            setDirection("backward");

          } else if (
            movement === "stop"
          ) {

            setDirection(null);

          }

        }
      );

    return () => unsubscribe();

  }, []);

  // ===================================================
  // STEERING STATUS
  // ===================================================

  useEffect(() => {

    const steeringStatusRef =
      ref(
        realtimeDb,
        FIREBASE_PATHS.steeringStatus
      );

    const unsubscribe =
      onValue(
        steeringStatusRef,

        (snapshot) => {

          const status =
            snapshot.val();

          console.log(
            "Steering Status:",
            status
          );

          const normalizedStatus =
            String(
              status || "STOP"
            ).toUpperCase();

          setSteeringStatus(
            normalizedStatus
          );

          if (
            normalizedStatus === "LEFT"
          ) {

            setDirection("left");

          } else if (
            normalizedStatus === "RIGHT"
          ) {

            setDirection("right");

          } else if (
            normalizedStatus === "STOP"
          ) {

            setDirection(null);

          }

        }
      );

    return () => unsubscribe();

  }, []);

  // ===================================================
  // BLADE STATUS
  // ===================================================

  useEffect(() => {

    const bladesStatusRef =
      ref(
        realtimeDb,
        FIREBASE_PATHS.bladesStatus
      );

    const unsubscribe =
      onValue(
        bladesStatusRef,

        (snapshot) => {

          const status =
            snapshot.val();

          console.log(
            "Blade Status:",
            status
          );

          setBladesActive(
            status === "ON"
          );

        }
      );

    return () => unsubscribe();

  }, []);

  // ===================================================
  // AUTOMATIC STATUS
  // ===================================================

  useEffect(() => {

    const automaticStatusRef =
      ref(
        realtimeDb,
        FIREBASE_PATHS.automaticStatus
      );

    const unsubscribe =
      onValue(
        automaticStatusRef,

        (snapshot) => {

          const status =
            snapshot.val();

          console.log(
            "Automatic Status:",
            status
          );

          const normalizedStatus =
            String(
              status || "STOPPED"
            ).toUpperCase();

          setAutomaticStatus(
            normalizedStatus
          );

          setAutomaticRunning(
            normalizedStatus === "RUNNING"
          );

        }
      );

    return () => unsubscribe();

  }, []);

  // ===================================================
  // CAMERA STATUS
  // ===================================================

  useEffect(() => {

    const cameraStatusRef =
      ref(
        realtimeDb,
        FIREBASE_PATHS.cameraStatus
      );

    const unsubscribe =
      onValue(
        cameraStatusRef,

        (snapshot) => {

          const status =
            snapshot.val();

          console.log(
            "Camera Status:",
            status
          );

          const normalizedStatus =
            String(
              status || ""
            ).toUpperCase();

          if (
            normalizedStatus === "OFF"
          ) {

            setCameraActive(false);

          } else if (
            normalizedStatus === "ON"
          ) {

            setCameraActive(true);

          } else if (
            normalizedStatus === "ONLINE"
          ) {

            setCameraActive(true);

          } else if (
            normalizedStatus === "FRONT"
          ) {

            setCameraActive(true);
            setCurrentCamera("front");

          } else if (
            normalizedStatus === "REAR"
          ) {

            setCameraActive(true);
            setCurrentCamera("rear");

          }

        },

        (error) => {

          console.error(
            "Camera status error:",
            error
          );

        }
      );

    return () => unsubscribe();

  }, []);

  // ===================================================
  // CAMERA STREAM URL
  // ===================================================

  useEffect(() => {

    const cameraStreamRef =
      ref(
        realtimeDb,
        FIREBASE_PATHS.cameraStreamUrl
      );

    const unsubscribe =
      onValue(
        cameraStreamRef,

        (snapshot) => {

          const url =
            snapshot.val();

          console.log(
            "Firebase Camera Stream URL:",
            url
          );

          if (
            typeof url === "string" &&
            url.trim() !== ""
          ) {

            setCameraStreamUrl(
              url.trim()
            );

            setCameraError(false);

          } else {

            setCameraStreamUrl("");

          }

        },

        (error) => {

          console.error(
            "Camera stream URL error:",
            error
          );

          setCameraStreamUrl("");
          setCameraError(true);

        }
      );

    return () => unsubscribe();

  }, []);

  // ===================================================
  // WRITE FIREBASE COMMAND
  // ===================================================

  const writeCommand = async (
    path: string,
    command: string
  ) => {

    try {

      console.log(
        `Firebase Command -> ${path}:`,
        command
      );

      await set(
        ref(
          realtimeDb,
          path
        ),
        command
      );

      return true;

    } catch (error) {

      console.error(
        `Firebase command failed (${path}):`,
        error
      );

      setIsConnected(false);

      return false;

    }
  };

  // ===================================================
  // DRIVE ON
  // ===================================================

  const engageDrive = async () => {

    if (automaticRunning) {

      await createNotification(
        "Manual Control Locked",
        "Manual drive control is disabled while automatic mode is running.",
        "warning"
      );

      return;
    }

    if (driveActive) {
      return;
    }

    const success =
      await writeCommand(
        FIREBASE_PATHS.driveCommand,
        "ON"
      );

    if (!success) {

      await createNotification(
        "Drive Command Failed",
        "Failed to engage the mower drive system.",
        "error"
      );

      return;
    }

    setDriveActive(true);
    setIsConnected(true);

    await createNotification(
      "Drive ON",
      "Mower drive system has been engaged.",
      "system"
    );
  };

  // ===================================================
  // DRIVE OFF
  // ===================================================

  const disengageDrive = async () => {

    try {

      const results =
        await Promise.all([
          writeCommand(
            FIREBASE_PATHS.bladesCommand,
            "OFF"
          ),

          writeCommand(
            FIREBASE_PATHS.driveCommand,
            "OFF"
          ),

          writeCommand(
            FIREBASE_PATHS.movementCommand,
            "stop"
          ),

          writeCommand(
            FIREBASE_PATHS.steeringCommand,
            "STOP"
          ),
        ]);

      if (!results.every(Boolean)) {

        throw new Error(
          "One or more drive shutdown commands failed."
        );

      }

      setDriveActive(false);
      setBladesActive(false);
      setDirection(null);
      setSteeringStatus("STOP");
      setActiveControl(null);

      activeDirectionRef.current =
        null;

      setIsConnected(true);

      await createNotification(
        "Drive OFF",
        "Mower drive system has been disengaged and cutting blades were stopped.",
        "system"
      );

    } catch (error) {

      console.error(
        "Drive OFF error:",
        error
      );

      await createNotification(
        "Drive Shutdown Failed",
        "One or more mower shutdown commands failed.",
        "error"
      );

    }
  };

  // ===================================================
  // BLADE ON
  // ===================================================

  const engageBlades = async () => {

    if (!driveActive) {

      await createNotification(
        "Drive Required",
        "Engage the drive system before turning on the cutting blades.",
        "warning"
      );

      return;
    }

    if (automaticRunning) {

      await createNotification(
        "Manual Control Locked",
        "Blade control is disabled while automatic mode is running.",
        "warning"
      );

      return;
    }

    if (bladesActive) {
      return;
    }

    const success =
      await writeCommand(
        FIREBASE_PATHS.bladesCommand,
        "ON"
      );

    if (!success) {

      await createNotification(
        "Blade Command Failed",
        "Failed to turn ON the cutting blades.",
        "error"
      );

      return;
    }

    setBladesActive(true);
    setIsConnected(true);

    await createNotification(
      "Blades ON",
      "Cutting blades have been engaged.",
      "warning"
    );
  };

  // ===================================================
  // BLADE OFF
  // ===================================================

  const disengageBlades = async () => {

    const success =
      await writeCommand(
        FIREBASE_PATHS.bladesCommand,
        "OFF"
      );

    if (!success) {

      await createNotification(
        "Blade Command Failed",
        "Failed to turn OFF the cutting blades.",
        "error"
      );

      return;
    }

    setBladesActive(false);
    setIsConnected(true);

    await createNotification(
      "Blades OFF",
      "Cutting blades have been disengaged.",
      "system"
    );
  };

  // ===================================================
  // MOVE MOWER
  // ===================================================

  const moveMower = async (
    movement:
      | "forward"
      | "backward"
  ) => {

    if (automaticRunning) {

      await createNotification(
        "Manual Control Locked",
        "Movement controls are disabled while automatic mode is running.",
        "warning"
      );

      return false;
    }

    if (!driveActive) {

      await createNotification(
        "Drive Required",
        "Engage the drive system before moving the mower.",
        "warning"
      );

      return false;
    }

    const success =
      await writeCommand(
        FIREBASE_PATHS.movementCommand,
        movement
      );

    if (!success) {
      return false;
    }

    setActiveControl(
      movement
    );

    setDirection(
      movement
    );

    setIsConnected(true);

    return true;
  };

  // ===================================================
  // STEER MOWER
  // ===================================================

  const steerMower = async (
    steering:
      | "LEFT"
      | "RIGHT"
  ) => {

    if (automaticRunning) {

      await createNotification(
        "Manual Control Locked",
        "Steering controls are disabled while automatic mode is running.",
        "warning"
      );

      return false;
    }

    if (!driveActive) {

      await createNotification(
        "Drive Required",
        "Engage the drive system before steering the mower.",
        "warning"
      );

      return false;
    }

    const success =
      await writeCommand(
        FIREBASE_PATHS.steeringCommand,
        steering
      );

    if (!success) {
      return false;
    }

    const directionValue =
      steering.toLowerCase() as Direction;

    setActiveControl(
      directionValue
    );

    setSteeringStatus(
      steering
    );

    setDirection(
      directionValue
    );

    setIsConnected(true);

    return true;
  };

  // ===================================================
  // STOP MOVEMENT
  // ===================================================

  const stopMovement = async () => {

    if (stoppingRef.current) {
      return;
    }

    stoppingRef.current = true;

    try {

      const results =
        await Promise.all([
          writeCommand(
            FIREBASE_PATHS.movementCommand,
            "stop"
          ),

          writeCommand(
            FIREBASE_PATHS.steeringCommand,
            "STOP"
          ),
        ]);

      if (!results.every(Boolean)) {

        throw new Error(
          "Movement stop command failed."
        );

      }

      setDirection(null);
      setSteeringStatus("STOP");
      setActiveControl(null);

      activeDirectionRef.current =
        null;

      setIsConnected(true);

    } catch (error) {

      console.error(
        "Movement stop error:",
        error
      );

    } finally {

      stoppingRef.current =
        false;

    }
  };

  // ===================================================
  // START DIRECTIONAL CONTROL
  // ===================================================

  const startDirectionalControl =
    async (
      directionValue: Direction,
      pointerId: number
    ) => {

      if (
        activePointerRef.current !==
        null
      ) {
        return;
      }

      if (
        !driveActive ||
        automaticRunning
      ) {
        return;
      }

      activePointerRef.current =
        pointerId;

      activeDirectionRef.current =
        directionValue;

      setActiveControl(
        directionValue
      );

      if (
        directionValue === "forward" ||
        directionValue === "backward"
      ) {

        await moveMower(
          directionValue
        );

      } else if (
        directionValue === "left"
      ) {

        await steerMower(
          "LEFT"
        );

      } else if (
        directionValue === "right"
      ) {

        await steerMower(
          "RIGHT"
        );

      }
    };

  // ===================================================
  // RELEASE DIRECTIONAL CONTROL
  // ===================================================

  const releaseDirectionalControl =
    async (
      pointerId?: number
    ) => {

      if (
        pointerId !== undefined &&
        activePointerRef.current !==
          pointerId
      ) {
        return;
      }

      activePointerRef.current =
        null;

      activeDirectionRef.current =
        null;

      await stopMovement();
    };

  // ===================================================
  // CAMERA SWITCH
  // ===================================================

  const toggleCamera = async () => {

    const newCamera =
      currentCamera === "front"
        ? "rear"
        : "front";

    const success =
      await writeCommand(
        FIREBASE_PATHS.cameraCommand,
        newCamera.toUpperCase()
      );

    if (!success) {
      return;
    }

    setCurrentCamera(
      newCamera
    );

    setCameraActive(true);
    setCameraError(false);
    setIsConnected(true);

    await createNotification(
      "Camera Switched",
      `Camera view changed to ${newCamera.toUpperCase()} camera.`,
      "system"
    );
  };

  // ===================================================
  // CAMERA POWER
  // ===================================================

  const toggleCameraPower =
    async () => {

      const newState =
        !cameraActive;

      const success =
        await writeCommand(
          FIREBASE_PATHS.cameraCommand,
          newState
            ? "ON"
            : "OFF"
        );

      if (!success) {
        return;
      }

      setCameraActive(
        newState
      );

      setCameraError(false);
      setIsConnected(true);

      await createNotification(
        newState
          ? "Camera ON"
          : "Camera OFF",

        newState
          ? "Camera feed has been enabled."
          : "Camera feed has been disabled.",

        "system"
      );
    };

  // ===================================================
  // EMERGENCY STOP
  // ===================================================

  const stopMower = async () => {

    try {

      activePointerRef.current =
        null;

      activeDirectionRef.current =
        null;

      const results =
        await Promise.all([
          writeCommand(
            FIREBASE_PATHS.driveCommand,
            "OFF"
          ),

          writeCommand(
            FIREBASE_PATHS.bladesCommand,
            "OFF"
          ),

          writeCommand(
            FIREBASE_PATHS.movementCommand,
            "stop"
          ),

          writeCommand(
            FIREBASE_PATHS.steeringCommand,
            "STOP"
          ),

          writeCommand(
            FIREBASE_PATHS.automaticCommand,
            "STOP"
          ),
        ]);

      if (!results.every(Boolean)) {

        throw new Error(
          "One or more emergency stop commands failed."
        );

      }

      setDriveActive(false);
      setBladesActive(false);
      setDirection(null);
      setSteeringStatus("STOP");
      setAutomaticRunning(false);
      setAutomaticStatus("STOPPED");
      setActiveControl(null);

      setIsConnected(true);

      await createNotification(
        "Emergency Stop",
        "Drive, blades, movement, steering, and automatic mode were stopped.",
        "error"
      );

    } catch (error) {

      console.error(
        "Emergency stop error:",
        error
      );

      await createNotification(
        "Emergency Stop Failed",
        "One or more mower shutdown commands could not be sent.",
        "error"
      );

    }
  };

  // ===================================================
  // AUTH LOADING
  // ===================================================

  if (!authReady) {

    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">

        <div className="rounded-2xl bg-white px-6 py-5 shadow-lg">

          <span className="text-sm font-semibold text-emerald-800">
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

    <div
      className="
        relative
        z-0
        min-h-screen
        overflow-x-hidden
        pb-28
        sm:pb-24
      "
      style={{
        WebkitTapHighlightColor:
          "transparent",
      }}
    >

      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <div className="relative z-10 mb-8 flex flex-col justify-between gap-4 rounded-3xl border border-white/60 bg-white/40 p-6 shadow-sm backdrop-blur-md md:flex-row md:items-center">

        <div>

          <h1 className="flex items-center gap-3 text-2xl font-black uppercase tracking-wider text-[#2C3627] sm:text-3xl">
            Tactical Control
          </h1>

          <p className="mt-1 text-xs font-semibold text-[#40513B] sm:text-sm">
            ECOMOW Manual Mower Control
          </p>

        </div>

        <div
          className={`flex items-center gap-3 rounded-2xl border px-5 py-2.5 shadow-sm ${
            isConnected && mowerOnline
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-600"
          }`}
        >

          {isConnected && mowerOnline ? (

            <>

              <Wifi className="h-4 w-4 text-emerald-600" />

              <span className="text-xs font-black uppercase tracking-widest">
                Mower Online
              </span>

              <span className="h-2.5 w-2.5 animate-ping rounded-full bg-emerald-500" />

            </>

          ) : (

            <>

              <WifiOff className="h-4 w-4 text-rose-600" />

              <span className="text-xs font-black uppercase tracking-widest">
                Mower Offline
              </span>

            </>

          )}

        </div>

      </div>

      {/* ================================================= */}
      {/* AUTOMATIC LOCK */}
      {/* ================================================= */}

      {automaticRunning && (

        <div className="relative z-10 mb-8 flex items-center gap-3 rounded-3xl border border-amber-200 bg-amber-50 p-5">

          <LockKeyhole className="h-6 w-6 shrink-0 text-amber-600" />

          <div>

            <p className="text-sm font-black text-amber-800">
              AUTOMATIC MODE ACTIVE
            </p>

            <p className="text-xs font-medium text-amber-700">
              Manual movement and blade controls are temporarily locked.
            </p>

          </div>

        </div>

      )}

      {/* ================================================= */}
      {/* MAIN GRID */}
      {/* ================================================= */}

      <div className="relative z-0 grid grid-cols-1 gap-8 lg:grid-cols-12">

        {/* ================================================= */}
        {/* LEFT */}
        {/* ================================================= */}

        <div className="relative z-0 space-y-8 lg:col-span-7">

          {/* ================================================= */}
          {/* CAMERA */}
          {/* ================================================= */}

          <div className="relative z-10 rounded-[2.5rem] border border-gray-100 bg-white p-3 shadow-xl sm:p-4">

            <div className="relative aspect-video overflow-hidden rounded-[2rem] bg-[#1A2118]">

              {/* CAMERA FEED */}

              {cameraActive ? (

                <div className="absolute inset-0 bg-black">

                  {cameraStreamUrl &&
                  !cameraError ? (

                    <img
                      key={`${currentCamera}-${cameraActive}-${cameraStreamUrl}`}
                      src={cameraStreamUrl}
                      alt="ESP32-CAM Live Feed"
                      className="absolute inset-0 h-full w-full object-cover"
                      onLoad={() => {

                        console.log(
                          "ESP32-CAM stream connected:",
                          cameraStreamUrl
                        );

                        setCameraError(false);

                      }}
                      onError={() => {

                        console.error(
                          "ESP32-CAM stream failed:",
                          cameraStreamUrl
                        );

                        setCameraError(true);

                      }}
                    />

                  ) : (

                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#101510] px-6 text-center">

                      <VideoOff className="mb-4 h-14 w-14 text-red-400" />

                      <p className="text-sm font-black uppercase tracking-wider text-white">
                        Camera Stream Unavailable
                      </p>

                      <p className="mt-2 text-[10px] font-medium text-white/50">
                        Waiting for the ESP32-CAM internet stream...
                      </p>

                      {!cameraStreamUrl && (

                        <p className="mt-3 rounded-lg bg-black/40 px-3 py-2 text-[10px] text-amber-400">
                          No stream URL available in Firebase.
                        </p>

                      )}

                      {cameraStreamUrl && (

                        <p className="mt-3 max-w-full break-all rounded-lg bg-black/40 px-3 py-2 font-mono text-[10px] text-emerald-400">
                          {cameraStreamUrl}
                        </p>

                      )}

                      <button
                        type="button"
                        onClick={() => {

                          setCameraError(false);

                        }}
                        className="mt-4 rounded-xl bg-emerald-600 px-4 py-2 text-[10px] font-black uppercase text-white hover:bg-emerald-700"
                      >
                        Retry Camera
                      </button>

                    </div>

                  )}

                  {/* LIVE INDICATOR */}

                  {!cameraError &&
                  cameraStreamUrl && (

                    <div className="absolute left-4 top-4 z-20 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/80 px-3 py-1.5 shadow-lg backdrop-blur-md">

                      <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />

                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300">
                        Live Feed ({currentCamera.toUpperCase()})
                      </span>

                    </div>

                  )}

                </div>

              ) : (

                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#101510] text-white/40">

                  <VideoOff className="h-14 w-14" />

                  <span className="text-xs font-bold uppercase tracking-wider">
                    Camera OFF
                  </span>

                  <span className="text-[10px] text-white/30">
                    Turn on the camera to view the feed.
                  </span>

                </div>

              )}

              {/* DIRECTION */}

              {direction && (

                <div className="absolute right-4 top-4 z-20 animate-pulse rounded-xl border border-emerald-400/40 bg-emerald-600/90 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-white shadow-lg backdrop-blur-md">

                  {direction} Active

                </div>

              )}

              {/* ================================================= */}
              {/* CAMERA CONTROLS */}
              {/* ================================================= */}

              <div
                className="
                  absolute
                  bottom-4
                  left-1/2
                  z-[100]
                  flex
                  w-[calc(100%-1rem)]
                  max-w-[620px]
                  -translate-x-1/2
                  flex-wrap
                  items-center
                  justify-center
                  gap-2
                  rounded-2xl
                  bg-black/30
                  p-2
                  backdrop-blur-sm
                "
              >

                {/* SWITCH CAMERA */}

                <button
                  type="button"
                  onClick={toggleCamera}
                  className="
                    flex
                    min-h-11
                    touch-manipulation
                    select-none
                    items-center
                    gap-2
                    rounded-xl
                    border
                    border-white/20
                    bg-black/80
                    px-4
                    py-2.5
                    text-xs
                    font-black
                    text-white
                    shadow-lg
                    backdrop-blur-md
                    transition
                    hover:bg-black
                    active:scale-95
                  "
                >

                  <RotateCw className="h-4 w-4 text-emerald-400" />

                  {currentCamera === "front"
                    ? "REAR CAM"
                    : "FRONT CAM"}

                </button>

                {/* CAMERA POWER */}

                <button
                  type="button"
                  onClick={toggleCameraPower}
                  className={`
                    flex
                    min-h-11
                    touch-manipulation
                    select-none
                    items-center
                    gap-2
                    rounded-xl
                    border
                    px-4
                    py-2.5
                    text-xs
                    font-black
                    text-white
                    shadow-lg
                    backdrop-blur-md
                    transition
                    active:scale-95
                    ${
                      cameraActive
                        ? "border-emerald-400/40 bg-emerald-700/90 hover:bg-emerald-800"
                        : "border-red-400/40 bg-red-700/90 hover:bg-red-800"
                    }
                  `}
                >

                  {cameraActive ? (
                    <Video className="h-4 w-4" />
                  ) : (
                    <VideoOff className="h-4 w-4" />
                  )}

                  CAMERA{" "}
                  {cameraActive
                    ? "ON"
                    : "OFF"}

                </button>

              </div>

            </div>

          </div>

          {/* ================================================= */}
          {/* DRIVE COMMAND PAD */}
          {/* ================================================= */}

          <div className="relative z-30 flex select-none flex-col items-center rounded-[2.5rem] border border-gray-100 bg-white p-6 shadow-xl sm:p-8">

            <div className="mb-6 flex w-full items-center justify-between">

              <h2 className="text-xs font-black uppercase tracking-[3px] text-[#2C3627]">
                Drive Command
              </h2>

              {!driveActive && (

                <span className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-600">
                  Drive Disengaged
                </span>

              )}

            </div>

            <div
              className="relative z-40 flex h-64 w-64 items-center justify-center sm:h-72 sm:w-72"
              style={{
                touchAction: "none",
                userSelect: "none",
                WebkitUserSelect: "none",
              }}
              onContextMenu={(e) => {
                e.preventDefault();
              }}
            >

              <div className="pointer-events-none absolute inset-0 rounded-full border-4 border-slate-100 bg-slate-50 shadow-inner" />

              {/* FORWARD */}

              <button
                type="button"
                disabled={
                  !driveActive ||
                  automaticRunning
                }
                aria-label="Move forward"
                className={`pointer-events-auto absolute top-2 z-50 flex h-16 w-16 touch-none select-none items-center justify-center rounded-2xl border shadow-md transition-all active:scale-95 sm:h-20 sm:w-20 ${
                  activeControl === "forward"
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : "border-slate-200 bg-white text-[#2C3627]"
                } ${
                  !driveActive ||
                  automaticRunning
                    ? "cursor-not-allowed opacity-50"
                    : "cursor-pointer"
                }`}
                style={{
                  touchAction: "none",
                }}
                onPointerDown={async (e) => {

                  e.preventDefault();
                  e.stopPropagation();

                  if (
                    !driveActive ||
                    automaticRunning
                  ) {
                    return;
                  }

                  try {
                    e.currentTarget.setPointerCapture(
                      e.pointerId
                    );
                  } catch {}

                  await startDirectionalControl(
                    "forward",
                    e.pointerId
                  );
                }}
                onPointerUp={async (e) => {

                  e.preventDefault();
                  e.stopPropagation();

                  try {

                    if (
                      e.currentTarget.hasPointerCapture(
                        e.pointerId
                      )
                    ) {

                      e.currentTarget.releasePointerCapture(
                        e.pointerId
                      );

                    }

                  } catch {}

                  await releaseDirectionalControl(
                    e.pointerId
                  );
                }}
                onPointerCancel={async (e) => {

                  e.preventDefault();
                  e.stopPropagation();

                  await releaseDirectionalControl(
                    e.pointerId
                  );
                }}
              >

                <ArrowUp
                  className="h-8 w-8 sm:h-10 sm:w-10"
                  strokeWidth={2.5}
                />

              </button>

              {/* RIGHT */}

              <button
                type="button"
                disabled={
                  !driveActive ||
                  automaticRunning
                }
                aria-label="Steer right"
                className={`pointer-events-auto absolute right-2 z-50 flex h-16 w-16 touch-none select-none items-center justify-center rounded-2xl border shadow-md transition-all active:scale-95 sm:h-20 sm:w-20 ${
                  activeControl === "right"
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : "border-slate-200 bg-white text-[#2C3627]"
                } ${
                  !driveActive ||
                  automaticRunning
                    ? "cursor-not-allowed opacity-50"
                    : "cursor-pointer"
                }`}
                style={{
                  touchAction: "none",
                }}
                onPointerDown={async (e) => {

                  e.preventDefault();
                  e.stopPropagation();

                  if (
                    !driveActive ||
                    automaticRunning
                  ) {
                    return;
                  }

                  try {
                    e.currentTarget.setPointerCapture(
                      e.pointerId
                    );
                  } catch {}

                  await startDirectionalControl(
                    "right",
                    e.pointerId
                  );
                }}
                onPointerUp={async (e) => {

                  e.preventDefault();
                  e.stopPropagation();

                  await releaseDirectionalControl(
                    e.pointerId
                  );
                }}
                onPointerCancel={async (e) => {

                  e.preventDefault();
                  e.stopPropagation();

                  await releaseDirectionalControl(
                    e.pointerId
                  );
                }}
              >

                <ArrowRight
                  className="h-8 w-8 sm:h-10 sm:w-10"
                  strokeWidth={2.5}
                />

              </button>

              {/* BACKWARD */}

              <button
                type="button"
                disabled={
                  !driveActive ||
                  automaticRunning
                }
                aria-label="Move backward"
                className={`pointer-events-auto absolute bottom-2 z-50 flex h-16 w-16 touch-none select-none items-center justify-center rounded-2xl border shadow-md transition-all active:scale-95 sm:h-20 sm:w-20 ${
                  activeControl === "backward"
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : "border-slate-200 bg-white text-[#2C3627]"
                } ${
                  !driveActive ||
                  automaticRunning
                    ? "cursor-not-allowed opacity-50"
                    : "cursor-pointer"
                }`}
                style={{
                  touchAction: "none",
                }}
                onPointerDown={async (e) => {

                  e.preventDefault();
                  e.stopPropagation();

                  if (
                    !driveActive ||
                    automaticRunning
                  ) {
                    return;
                  }

                  try {
                    e.currentTarget.setPointerCapture(
                      e.pointerId
                    );
                  } catch {}

                  await startDirectionalControl(
                    "backward",
                    e.pointerId
                  );
                }}
                onPointerUp={async (e) => {

                  e.preventDefault();
                  e.stopPropagation();

                  await releaseDirectionalControl(
                    e.pointerId
                  );
                }}
                onPointerCancel={async (e) => {

                  e.preventDefault();
                  e.stopPropagation();

                  await releaseDirectionalControl(
                    e.pointerId
                  );
                }}
              >

                <ArrowDown
                  className="h-8 w-8 sm:h-10 sm:w-10"
                  strokeWidth={2.5}
                />

              </button>

              {/* LEFT */}

              <button
                type="button"
                disabled={
                  !driveActive ||
                  automaticRunning
                }
                aria-label="Steer left"
                className={`pointer-events-auto absolute left-2 z-50 flex h-16 w-16 touch-none select-none items-center justify-center rounded-2xl border shadow-md transition-all active:scale-95 sm:h-20 sm:w-20 ${
                  activeControl === "left"
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : "border-slate-200 bg-white text-[#2C3627]"
                } ${
                  !driveActive ||
                  automaticRunning
                    ? "cursor-not-allowed opacity-50"
                    : "cursor-pointer"
                }`}
                style={{
                  touchAction: "none",
                }}
                onPointerDown={async (e) => {

                  e.preventDefault();
                  e.stopPropagation();

                  if (
                    !driveActive ||
                    automaticRunning
                  ) {
                    return;
                  }

                  try {
                    e.currentTarget.setPointerCapture(
                      e.pointerId
                    );
                  } catch {}

                  await startDirectionalControl(
                    "left",
                    e.pointerId
                  );
                }}
                onPointerUp={async (e) => {

                  e.preventDefault();
                  e.stopPropagation();

                  await releaseDirectionalControl(
                    e.pointerId
                  );
                }}
                onPointerCancel={async (e) => {

                  e.preventDefault();
                  e.stopPropagation();

                  await releaseDirectionalControl(
                    e.pointerId
                  );
                }}
              >

                <ArrowLeft
                  className="h-8 w-8 sm:h-10 sm:w-10"
                  strokeWidth={2.5}
                />

              </button>

              {/* CENTER */}

              <div className="pointer-events-none relative z-20 flex h-16 w-16 items-center justify-center rounded-full border border-slate-200 bg-slate-100 shadow-inner sm:h-20 sm:w-20">

                <div
                  className={`h-6 w-6 rounded-full ${
                    driveActive
                      ? "animate-pulse bg-emerald-500"
                      : "bg-slate-300"
                  }`}
                />

              </div>

            </div>

            {/* COMMAND STATUS */}

            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">

              <span className="text-[10px] font-semibold text-slate-400">
                Movement:
              </span>

              <span
                className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${
                  direction
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {direction || "STOP"}
              </span>

              <span className="text-[10px] font-semibold text-slate-400">
                Steering:
              </span>

              <span
                className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${
                  steeringStatus !== "STOP"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {steeringStatus}
              </span>

            </div>

            <div className="mt-4 text-center">

              {!driveActive ? (

                <p className="text-[10px] font-bold text-amber-600">
                  ENGAGE DRIVE TO ENABLE MOVEMENT CONTROLS
                </p>

              ) : automaticRunning ? (

                <p className="text-[10px] font-bold text-amber-600">
                  AUTOMATIC MODE ACTIVE — MANUAL CONTROL LOCKED
                </p>

              ) : (

                <p className="text-[10px] font-semibold text-emerald-600">
                  MANUAL CONTROL READY
                </p>

              )}

            </div>

            <p className="mt-3 text-center text-[10px] font-semibold text-slate-400">
              Press and hold a direction button to move.
            </p>

          </div>

        </div>

        {/* ================================================= */}
        {/* RIGHT */}
        {/* ================================================= */}

        <div className="relative z-10 space-y-6 lg:col-span-5">

          {/* ================================================= */}
          {/* EMERGENCY STOP */}
          {/* ================================================= */}

          <div className="rounded-[2rem] border border-red-100 bg-white p-5 shadow-sm sm:p-6">

            <div className="mb-5 flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-600">

                <ShieldAlert
                  className="h-6 w-6 text-white"
                  strokeWidth={2.5}
                />

              </div>

              <div>

                <h3 className="text-sm font-black uppercase tracking-[3px] text-red-700">
                  Safety Control
                </h3>

                <p className="mt-1 text-[11px] font-semibold text-red-500">
                  Emergency shutdown system
                </p>

              </div>

            </div>

            <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">

              <ShieldAlert
                className="mt-0.5 h-5 w-5 shrink-0 text-red-600"
                strokeWidth={2.5}
              />

              <div>

                <p className="text-xs font-black uppercase tracking-wider text-red-700">
                  Emergency Shutdown
                </p>

                <p className="mt-1 text-[10px] font-medium leading-relaxed text-red-600">
                  Immediately stop all mower systems.
                  Use this button only when an emergency
                  or unsafe condition occurs.
                </p>

              </div>

            </div>

            <button
              type="button"
              onClick={stopMower}
              aria-label="Emergency stop mower"
              className="
                group
                relative
                flex
                min-h-[110px]
                w-full
                touch-manipulation
                select-none
                items-center
                justify-center
                gap-4
                overflow-hidden
                rounded-[2rem]
                border-4
                border-red-700
                bg-red-600
                px-6
                py-7
                text-white
                shadow-lg
                transition-all
                hover:bg-red-700
                active:scale-[0.97]
              "
            >

              <div className="absolute inset-0 animate-pulse bg-red-500/20" />

              <div className="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-4 border-white bg-red-700">

                <CircleStop
                  className="h-9 w-9 text-white"
                  strokeWidth={2.5}
                />

              </div>

              <div className="relative z-10 text-left">

                <p className="text-[10px] font-black uppercase tracking-[3px] text-red-100">
                  Emergency
                </p>

                <p className="text-xl font-black uppercase tracking-wider text-white sm:text-2xl">
                  STOP
                </p>

                <p className="text-[9px] font-bold uppercase tracking-wider text-red-100">
                  Stop all mower systems
                </p>

              </div>

            </button>

            <div className="mt-5 flex items-center justify-center gap-2">

              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />

              <span className="text-[9px] font-black uppercase tracking-[2px] text-red-600">
                Emergency Stop Ready
              </span>

            </div>

          </div>

          {/* ================================================= */}
          {/* DRIVE */}
          {/* ================================================= */}

          <div className="relative z-20 rounded-[2rem] border border-gray-100 bg-white p-5 shadow-sm sm:p-6">

            <div className="mb-3 flex items-center justify-between">

              <h3 className="text-xs font-black uppercase tracking-[2px] text-[#2C3627]">
                Drive Relay
              </h3>

              <span
                className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase ${
                  driveActive
                    ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                    : "border-slate-200 bg-slate-100 text-[#40513B]"
                }`}
              >
                {driveActive
                  ? "ENGAGED"
                  : "DISENGAGED"}
              </span>

            </div>

            <div className="space-y-3">

              <button
                type="button"
                onClick={engageDrive}
                disabled={
                  driveActive ||
                  automaticRunning
                }
                className={`flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-black ${
                  driveActive ||
                  automaticRunning
                    ? "cursor-not-allowed bg-[#40513B] text-white opacity-40"
                    : "bg-[#40513B] text-white hover:bg-[#2C3627]"
                }`}
              >

                <Power className="h-4 w-4" />

                ENGAGE DRIVE

              </button>

              <button
                type="button"
                onClick={disengageDrive}
                disabled={!driveActive}
                className={`flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border py-4 text-sm font-black ${
                  !driveActive
                    ? "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300"
                    : "border-slate-200 bg-white text-[#2C3627] hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                }`}
              >

                <CircleStop className="h-4 w-4" />

                DISENGAGE DRIVE

              </button>

            </div>

          </div>

          {/* ================================================= */}
          {/* CUTTING BLADES */}
          {/* ================================================= */}

          <div className="relative z-20 rounded-[2rem] border border-gray-100 bg-white p-5 shadow-sm sm:p-6">

            <div className="mb-3 flex items-center justify-between">

              <h3 className="text-xs font-black uppercase tracking-[2px] text-[#2C3627]">
                Cutting Blades
              </h3>

              <span
                className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase ${
                  bladesActive
                    ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                    : "border-slate-200 bg-slate-100 text-[#40513B]"
                }`}
              >
                {bladesActive
                  ? "ENGAGED"
                  : "STOPPED"}
              </span>

            </div>

            {!driveActive &&
              !automaticRunning &&
              !bladesActive && (

                <div className="mb-3 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5">

                  <ShieldAlert className="h-4 w-4 text-[#40513B]" />

                  <div>

                    <p className="text-[9px] font-black uppercase tracking-wide text-[#40513B]">
                      Drive Required
                    </p>

                    <p className="text-[9px] text-slate-400">
                      Engage the drive before starting the cutting blades.
                    </p>

                  </div>

                </div>

              )}

            {automaticRunning && (

              <div className="mb-3 flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2.5">

                <LockKeyhole className="h-4 w-4 text-amber-600" />

                <div>

                  <p className="text-[9px] font-black uppercase tracking-wide text-amber-800">
                    Manual Control Locked
                  </p>

                  <p className="text-[9px] text-amber-600">
                    Automatic mode currently controls the mower.
                  </p>

                </div>

              </div>

            )}

            <button
              type="button"
              onClick={engageBlades}
              disabled={
                bladesActive ||
                automaticRunning ||
                !driveActive
              }
              className={`flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl py-4 text-sm font-black ${
                bladesActive ||
                automaticRunning ||
                !driveActive
                  ? "cursor-not-allowed bg-[#40513B] text-white opacity-40"
                  : "bg-[#40513B] text-white hover:bg-[#2C3627]"
              }`}
            >

              <Scissors className="h-4 w-4" />

              ENGAGE BLADES

            </button>

            <button
              type="button"
              onClick={disengageBlades}
              disabled={!bladesActive}
              className={`mt-3 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border py-4 text-sm font-black ${
                !bladesActive
                  ? "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300"
                  : "border-slate-200 bg-white text-[#2C3627] hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
              }`}
            >

              <CircleStop className="h-4 w-4" />

              DISENGAGE BLADES

            </button>

          </div>

          {/* ================================================= */}
          {/* SYSTEM STATUS */}
          {/* ================================================= */}

          <div className="relative z-20 rounded-[2.5rem] border border-gray-100 bg-white p-6 shadow-xl">

            <div className="mb-5 flex items-center justify-between">

              <h3 className="text-xs font-black uppercase tracking-widest text-[#2C3627]">
                System Status
              </h3>

              <span className="text-[10px] font-bold text-slate-400">
                REALTIME
              </span>

            </div>

            <div className="grid grid-cols-2 gap-3">

              <div
                className={`rounded-2xl p-4 ${
                  driveActive
                    ? "bg-emerald-50"
                    : "bg-slate-50"
                }`}
              >

                <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                  Drive
                </p>

                <p
                  className={`mt-2 text-lg font-black ${
                    driveActive
                      ? "text-emerald-600"
                      : "text-slate-500"
                  }`}
                >
                  {driveActive
                    ? "ON"
                    : "OFF"}
                </p>

              </div>

              <div
                className={`rounded-2xl p-4 ${
                  bladesActive
                    ? "bg-emerald-50"
                    : "bg-slate-50"
                }`}
              >

                <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                  Blades
                </p>

                <p
                  className={`mt-2 text-lg font-black ${
                    bladesActive
                      ? "text-emerald-600"
                      : "text-slate-500"
                  }`}
                >
                  {bladesActive
                    ? "ON"
                    : "OFF"}
                </p>

              </div>

              <div className="rounded-2xl bg-slate-50 p-4">

                <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                  Steering
                </p>

                <p className="mt-2 text-lg font-black text-[#40513B]">
                  {steeringStatus}
                </p>

              </div>

              <div
                className={`rounded-2xl p-4 ${
                  automaticRunning
                    ? "bg-amber-50"
                    : "bg-slate-50"
                }`}
              >

                <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                  Automatic
                </p>

                <p
                  className={`mt-2 text-lg font-black ${
                    automaticRunning
                      ? "text-amber-600"
                      : "text-slate-500"
                  }`}
                >
                  {automaticStatus}
                </p>

              </div>

            </div>

          </div>

        </div>

      </div>

      <div
        className="pointer-events-none h-8 w-full sm:h-4"
        aria-hidden="true"
      />

    </div>
  );
}