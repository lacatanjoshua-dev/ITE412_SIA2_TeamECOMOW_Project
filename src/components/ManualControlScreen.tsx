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



type Movement =
  | "forward"
  | "backward"
  | null;

type Steering =
  | "LEFT"
  | "RIGHT"
  | "STOP";

type ActiveMovement =
  | "forward"
  | "backward"
  | null;

type ActiveSteering =
  | "left"
  | "right"
  | null;

type NotificationType =
  | "warning"
  | "system"
  | "completed"
  | "error";

const FIREBASE_PATHS = {
  // CONNECTION
  connectionStatus:
    "ecomow/mower/connection/status",
  connectionLastSeen:
    "ecomow/mower/connection/lastSeen",
  // DRIVE
  driveCommand:
    "ecomow/mower/drive/command",
  driveStatus:
    "ecomow/mower/drive/status",
  // MOVEMENT
  movementCommand:
    "ecomow/mower/movement/command",
  movementStatus:
    "ecomow/mower/movement/status",
  // STEERING
  steeringCommand:
    "ecomow/mower/steering/command",
  steeringStatus:
    "ecomow/mower/steering/status",
  // BLADES
  bladesCommand:
    "ecomow/mower/blades/command",
  bladesStatus:
    "ecomow/mower/blades/status",
  // AUTOMATIC
  automaticCommand:
    "ecomow/mower/automatic/command",
  automaticStatus:
    "ecomow/mower/automatic/status",

  // CAMERA
  cameraCommand:
    "ecomow/mower/camera/command",
  cameraStatus:
    "ecomow/mower/camera/status",
  cameraStreamUrl:
    "ecomow/mower/camera/streamUrl",

  // OBSTACLE
  obstacleStatus:
    "ecomow/mower/obstacle/status",
  obstacleDistance:
    "ecomow/mower/obstacle/distance",
};


// CAMERA FALLBACK


const DEFAULT_CAMERA_STREAM =
  "http://10.142.135.72/stream";

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

  const [lastSeen, setLastSeen] =
    useState<number | null>(null);

  // ===================================================
  // DRIVE
  // ===================================================

  const [driveActive, setDriveActive] =
    useState(false);

  // ===================================================
  // MOVEMENT
  // ===================================================

  const [movementStatus, setMovementStatus] =
    useState<Movement>(null);

  // ===================================================
  // STEERING
  // ===================================================

  const [steeringStatus, setSteeringStatus] =
    useState<Steering>("STOP");

  // ===================================================
  // BLADES
  // ===================================================

  const [bladesActive, setBladesActive] =
    useState(false);

  // ===================================================
  // AUTOMATIC
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
    useState<"front" | "rear">("rear");

  const [cameraError, setCameraError] =
    useState(false);

  const [cameraStreamUrl, setCameraStreamUrl] =
    useState(DEFAULT_CAMERA_STREAM);

  // ===================================================
  // OBSTACLE
  // ===================================================

  const [obstacleDetected, setObstacleDetected] =
    useState(false);

  const [obstacleDistance, setObstacleDistance] =
    useState<number | null>(null);

  const obstacleNotificationRef =
    useRef(false);

  // ===================================================
  // ACTIVE CONTROL
  // ===================================================

  const [activeControl, setActiveControl] =
    useState<
      | "forward"
      | "backward"
      | "left"
      | "right"
      | null
    >(null);

  // ===================================================
  // POINTERS
  // ===================================================

  const movementPointerRef =
    useRef<number | null>(null);

  const steeringPointerRef =
    useRef<number | null>(null);

  const activeMovementRef =
    useRef<ActiveMovement>(null);

  const activeSteeringRef =
    useRef<ActiveSteering>(null);

  // ===================================================
  // STOP LOCKS
  // ===================================================

  const movementStoppingRef =
    useRef(false);

  const steeringStoppingRef =
    useRef(false);

  const emergencyStoppingRef =
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
        "No authenticated user. Notification skipped."
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
          createdAt:
            serverTimestamp(),
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
  // GENERIC FIREBASE COMMAND
  // ===================================================

  const writeCommand = async (
    path: string,
    command: string
  ) => {
    try {
      console.log(
        "[FIREBASE COMMAND]",
        path,
        "=>",
        command
      );

      await set(
        ref(
          realtimeDb,
          path
        ),
        command
      );

      setIsConnected(true);

      return true;
    } catch (error) {
      console.error(
        "[FIREBASE COMMAND ERROR]",
        path,
        error
      );

      setIsConnected(false);

      return false;
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
          const value =
            String(
              snapshot.val() ?? ""
            ).toUpperCase();

          console.log(
            "[REALTIME] Connection:",
            value
          );

          setIsConnected(true);

          setMowerOnline(
            value === "ONLINE"
          );
        },
        (error) => {
          console.error(
            "Connection listener error:",
            error
          );

          setIsConnected(false);
          setMowerOnline(false);
        }
      );

    return () => unsubscribe();
  }, []);

  // ===================================================
  // CONNECTION LAST SEEN
  // ===================================================

  useEffect(() => {
    const lastSeenRef =
      ref(
        realtimeDb,
        FIREBASE_PATHS.connectionLastSeen
      );

    const unsubscribe =
      onValue(
        lastSeenRef,
        (snapshot) => {
          const value =
            Number(snapshot.val());

          if (
            Number.isFinite(value)
          ) {
            setLastSeen(value);
          } else {
            setLastSeen(null);
          }
        },
        (error) => {
          console.error(
            "Last seen listener error:",
            error
          );

          setLastSeen(null);
        }
      );

    return () => unsubscribe();
  }, []);

  // ===================================================
  // ONLINE TIMEOUT CHECK
  // ===================================================

  useEffect(() => {
    if (lastSeen === null) {
      return;
    }

    const checkOnline = () => {
      const now =
        Date.now();

      const difference =
        now - lastSeen;

      const isFresh =
        difference <= 15000;

      setMowerOnline(
        isFresh
      );
    };

    checkOnline();

    const timer =
      window.setInterval(
        checkOnline,
        3000
      );

    return () => {
      window.clearInterval(timer);
    };
  }, [lastSeen]);

  // ===================================================
  // DRIVE STATUS
  // ===================================================

  useEffect(() => {
    const driveRef =
      ref(
        realtimeDb,
        FIREBASE_PATHS.driveStatus
      );

    const unsubscribe =
      onValue(
        driveRef,
        (snapshot) => {
          const value =
            String(
              snapshot.val() ?? ""
            ).toUpperCase();

          console.log(
            "[REALTIME] Drive Status:",
            value
          );

          const active =
            value === "ON" ||
            value === "ENGAGED" ||
            value === "FORWARD" ||
            value === "BACKWARD";

          setDriveActive(active);

          if (!active) {
            setMovementStatus(null);
            setSteeringStatus("STOP");

            activeMovementRef.current =
              null;

            activeSteeringRef.current =
              null;

            movementPointerRef.current =
              null;

            steeringPointerRef.current =
              null;

            setActiveControl(null);
          }
        },
        (error) => {
          console.error(
            "Drive status listener error:",
            error
          );
        }
      );

    return () => unsubscribe();
  }, []);

  // ===================================================
  // MOVEMENT STATUS
  // IMPORTANT:
  // READ movement/status
  // NOT movement/command
  // ===================================================

  useEffect(() => {
    const movementRef =
      ref(
        realtimeDb,
        FIREBASE_PATHS.movementStatus
      );

    const unsubscribe =
      onValue(
        movementRef,
        (snapshot) => {
          const value =
            String(
              snapshot.val() ?? "STOP"
            ).toLowerCase();

          console.log(
            "[REALTIME] Movement Status:",
            value
          );

          if (
            value === "forward"
          ) {
            setMovementStatus(
              "forward"
            );
          } else if (
            value === "backward"
          ) {
            setMovementStatus(
              "backward"
            );
          } else {
            setMovementStatus(null);
          }
        },
        (error) => {
          console.error(
            "Movement status listener error:",
            error
          );
        }
      );

    return () => unsubscribe();
  }, []);

  // ===================================================
  // STEERING STATUS
  // ===================================================

  useEffect(() => {
    const steeringRef =
      ref(
        realtimeDb,
        FIREBASE_PATHS.steeringStatus
      );

    const unsubscribe =
      onValue(
        steeringRef,
        (snapshot) => {
          const value =
            String(
              snapshot.val() ?? "STOP"
            ).toUpperCase();

          console.log(
            "[REALTIME] Steering:",
            value
          );

          if (
            value === "LEFT"
          ) {
            setSteeringStatus(
              "LEFT"
            );
          } else if (
            value === "RIGHT"
          ) {
            setSteeringStatus(
              "RIGHT"
            );
          } else {
            setSteeringStatus(
              "STOP"
            );
          }
        },
        (error) => {
          console.error(
            "Steering status listener error:",
            error
          );
        }
      );

    return () => unsubscribe();
  }, []);

  // ===================================================
  // BLADES STATUS
  // ===================================================

  useEffect(() => {
    const bladesRef =
      ref(
        realtimeDb,
        FIREBASE_PATHS.bladesStatus
      );

    const unsubscribe =
      onValue(
        bladesRef,
        (snapshot) => {
          const value =
            String(
              snapshot.val() ?? "OFF"
            ).toUpperCase();

          console.log(
            "[REALTIME] Blades:",
            value
          );

          setBladesActive(
            value === "ON" ||
            value === "RUNNING"
          );
        },
        (error) => {
          console.error(
            "Blades listener error:",
            error
          );
        }
      );

    return () => unsubscribe();
  }, []);

  // ===================================================
  // AUTOMATIC STATUS
  // ===================================================

  useEffect(() => {
    const automaticRef =
      ref(
        realtimeDb,
        FIREBASE_PATHS.automaticStatus
      );

    const unsubscribe =
      onValue(
        automaticRef,
        (snapshot) => {
          const value =
            String(
              snapshot.val() ?? "STOPPED"
            ).toUpperCase();

          console.log(
            "[REALTIME] Automatic:",
            value
          );

          setAutomaticStatus(
            value
          );

          setAutomaticRunning(
            value === "RUNNING" ||
            value === "ON" ||
            value === "ACTIVE"
          );
        },
        (error) => {
          console.error(
            "Automatic listener error:",
            error
          );
        }
      );

    return () => unsubscribe();
  }, []);

  // ===================================================
  // CAMERA STATUS
  // ===================================================

  useEffect(() => {
    const cameraRef =
      ref(
        realtimeDb,
        FIREBASE_PATHS.cameraStatus
      );

    const unsubscribe =
      onValue(
        cameraRef,
        (snapshot) => {
          const value =
            String(
              snapshot.val() ?? ""
            ).toUpperCase();

          console.log(
            "[REALTIME] Camera:",
            value
          );

          if (
            value === "OFF"
          ) {
            setCameraActive(false);
          } else if (
            value === "ON" ||
            value === "ONLINE"
          ) {
            setCameraActive(true);
          } else if (
            value === "FRONT"
          ) {
            setCameraActive(true);
            setCurrentCamera(
              "front"
            );
          } else if (
            value === "REAR"
          ) {
            setCameraActive(true);
            setCurrentCamera(
              "rear"
            );
          }
        },
        (error) => {
          console.error(
            "Camera status listener error:",
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
    const streamRef =
      ref(
        realtimeDb,
        FIREBASE_PATHS.cameraStreamUrl
      );

    const unsubscribe =
      onValue(
        streamRef,
        (snapshot) => {
          const value =
            snapshot.val();

          console.log(
            "[REALTIME] Camera Stream URL:",
            value
          );

          if (
            typeof value === "string" &&
            value.trim() !== ""
          ) {
            setCameraStreamUrl(
              value.trim()
            );

            setCameraError(false);
          } else {
            setCameraStreamUrl(
              DEFAULT_CAMERA_STREAM
            );

            setCameraError(false);
          }
        },
        (error) => {
          console.error(
            "Camera stream URL listener error:",
            error
          );

          setCameraStreamUrl(
            DEFAULT_CAMERA_STREAM
          );

          setCameraError(false);
        }
      );

    return () => unsubscribe();
  }, []);

  // ===================================================
  // OBSTACLE STATUS
  // ===================================================

  useEffect(() => {
    const obstacleRef =
      ref(
        realtimeDb,
        FIREBASE_PATHS.obstacleStatus
      );

    const unsubscribe =
      onValue(
        obstacleRef,
        async (snapshot) => {
          const value =
            String(
              snapshot.val() ?? "CLEAR"
            ).toUpperCase();

          console.log(
            "[REALTIME] Obstacle:",
            value
          );

          const detected =
            value === "DETECTED" ||
            value === "OBSTACLE" ||
            value === "BLOCKED";

          setObstacleDetected(
            detected
          );

          // =========================================
          // OBSTACLE DETECTED
          // =========================================

          if (
            detected &&
            !obstacleNotificationRef.current
          ) {
            obstacleNotificationRef.current =
              true;

            await createNotification(
              "Obstacle Detected",
              "May nakaharang sa mower.",
              "warning"
            );
          }

          // =========================================
          // OBSTACLE CLEARED
          // =========================================

          if (!detected) {
            obstacleNotificationRef.current =
              false;
          }
        },
        (error) => {
          console.error(
            "Obstacle listener error:",
            error
          );
        }
      );

    return () => unsubscribe();
  }, [user]);

  // ===================================================
  // OBSTACLE DISTANCE
  // ===================================================

  useEffect(() => {
    const distanceRef =
      ref(
        realtimeDb,
        FIREBASE_PATHS.obstacleDistance
      );

    const unsubscribe =
      onValue(
        distanceRef,
        (snapshot) => {
          const value =
            snapshot.val();

          console.log(
            "[REALTIME] Obstacle Distance:",
            value
          );

          const numericValue =
            Number(value);

          if (
            Number.isFinite(
              numericValue
            )
          ) {
            setObstacleDistance(
              numericValue
            );
          } else {
            setObstacleDistance(
              null
            );
          }
        },
        (error) => {
          console.error(
            "Obstacle distance listener error:",
            error
          );

          setObstacleDistance(null);
        }
      );

    return () => unsubscribe();
  }, []);

  // ===================================================
  // ENGAGE DRIVE
  // ===================================================

  const engageDrive = async () => {
    if (automaticRunning) {
      await createNotification(
        "Manual Control Locked",
        "Manual control is disabled while automatic mode is running.",
        "warning"
      );

      return;
    }

    if (!mowerOnline) {
      await createNotification(
        "Mower Offline",
        "The mower is currently offline.",
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
        "Unable to send DRIVE ON command to Firebase.",
        "error"
      );

      return;
    }

    await createNotification(
      "Drive ON",
      "Mower drive system has been engaged.",
      "system"
    );
  };

  // ===================================================
  // DISENGAGE DRIVE
  // ===================================================

  const disengageDrive = async () => {
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

          writeCommand(
            FIREBASE_PATHS.bladesCommand,
            "OFF"
          ),

          writeCommand(
            FIREBASE_PATHS.driveCommand,
            "OFF"
          ),
        ]);

      if (
        !results.every(Boolean)
      ) {
        throw new Error(
          "One or more drive shutdown commands failed."
        );
      }

      movementPointerRef.current =
        null;

      steeringPointerRef.current =
        null;

      activeMovementRef.current =
        null;

      activeSteeringRef.current =
        null;

      setMovementStatus(null);
      setSteeringStatus("STOP");
      setBladesActive(false);
      setActiveControl(null);

      await createNotification(
        "Drive OFF",
        "Drive, movement, steering, and blades have been stopped.",
        "system"
      );
    } catch (error) {
      console.error(
        "Disengage drive error:",
        error
      );

      await createNotification(
        "Drive Shutdown Failed",
        "Failed to completely shut down the drive system.",
        "error"
      );
    }
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
      return false;
    }

    if (!mowerOnline) {
      return false;
    }

    if (!driveActive) {
      return false;
    }

    // SAFETY:
    // Forward movement blocked by obstacle

    if (
      obstacleDetected &&
      movement === "forward"
    ) {
      await createNotification(
        "Movement Blocked",
        "Forward movement is blocked because an obstacle was detected.",
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

    setMovementStatus(
      movement
    );

    activeMovementRef.current =
      movement;

    return true;
  };

  // ===================================================
  // STOP MOVEMENT
  // ===================================================

  const stopMovementOnly =
    async () => {
      if (
        movementStoppingRef.current
      ) {
        return;
      }

      movementStoppingRef.current =
        true;

      try {
        const success =
          await writeCommand(
            FIREBASE_PATHS.movementCommand,
            "stop"
          );

        if (!success) {
          return;
        }

        activeMovementRef.current =
          null;

        setMovementStatus(null);

        if (
          activeSteeringRef.current ===
          "left"
        ) {
          setActiveControl(
            "left"
          );
        } else if (
          activeSteeringRef.current ===
          "right"
        ) {
          setActiveControl(
            "right"
          );
        } else {
          setActiveControl(null);
        }
      } finally {
        movementStoppingRef.current =
          false;
      }
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
      return false;
    }

    if (!mowerOnline) {
      return false;
    }

    if (!driveActive) {
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

    setSteeringStatus(
      steering
    );

    activeSteeringRef.current =
      steering === "LEFT"
        ? "left"
        : "right";

    return true;
  };

  // ===================================================
  // STOP STEERING
  // ===================================================

  const stopSteeringOnly =
    async () => {
      if (
        steeringStoppingRef.current
      ) {
        return;
      }

      steeringStoppingRef.current =
        true;

      try {
        const success =
          await writeCommand(
            FIREBASE_PATHS.steeringCommand,
            "STOP"
          );

        if (!success) {
          return;
        }

        activeSteeringRef.current =
          null;

        setSteeringStatus(
          "STOP"
        );

        if (
          activeMovementRef.current ===
          "forward"
        ) {
          setActiveControl(
            "forward"
          );
        } else if (
          activeMovementRef.current ===
          "backward"
        ) {
          setActiveControl(
            "backward"
          );
        } else {
          setActiveControl(null);
        }
      } finally {
        steeringStoppingRef.current =
          false;
      }
    };

  // ===================================================
  // START MOVEMENT
  // ===================================================

  const startMovementControl =
    async (
      movement:
        | "forward"
        | "backward",
      pointerId: number
    ) => {
      if (
        movementPointerRef.current !==
        null
      ) {
        return;
      }

      if (
        !driveActive ||
        automaticRunning ||
        !mowerOnline
      ) {
        return;
      }

      if (
        obstacleDetected &&
        movement === "forward"
      ) {
        await createNotification(
          "Obstacle Detected",
          "Forward movement cannot start while an obstacle is detected.",
          "warning"
        );

        return;
      }

      movementPointerRef.current =
        pointerId;

      activeMovementRef.current =
        movement;

      setActiveControl(
        movement
      );

      const success =
        await moveMower(
          movement
        );

      if (!success) {
        movementPointerRef.current =
          null;

        activeMovementRef.current =
          null;

        setActiveControl(null);
      }
    };

  // ===================================================
  // START STEERING
  // ===================================================

  const startSteeringControl =
    async (
      steering:
        | "left"
        | "right",
      pointerId: number
    ) => {
      if (
        steeringPointerRef.current !==
        null
      ) {
        return;
      }

      if (
        !driveActive ||
        automaticRunning ||
        !mowerOnline
      ) {
        return;
      }

      steeringPointerRef.current =
        pointerId;

      activeSteeringRef.current =
        steering;

      setActiveControl(
        steering
      );

      const success =
        await steerMower(
          steering === "left"
            ? "LEFT"
            : "RIGHT"
        );

      if (!success) {
        steeringPointerRef.current =
          null;

        activeSteeringRef.current =
          null;

        setActiveControl(null);
      }
    };

  // ===================================================
  // RELEASE MOVEMENT
  // ===================================================

  const releaseMovementControl =
    async (
      pointerId: number
    ) => {
      if (
        movementPointerRef.current !==
        pointerId
      ) {
        return;
      }

      movementPointerRef.current =
        null;

      await stopMovementOnly();
    };

  // ===================================================
  // RELEASE STEERING
  // ===================================================

  const releaseSteeringControl =
    async (
      pointerId: number
    ) => {
      if (
        steeringPointerRef.current !==
        pointerId
      ) {
        return;
      }

      steeringPointerRef.current =
        null;

      await stopSteeringOnly();
    };

  // ===================================================
  // BLADES ON
  // ===================================================

  const engageBlades = async () => {
    if (automaticRunning) {
      await createNotification(
        "Manual Control Locked",
        "Blade control is disabled while automatic mode is running.",
        "warning"
      );

      return;
    }

    if (!mowerOnline) {
      await createNotification(
        "Mower Offline",
        "The mower is currently offline.",
        "warning"
      );

      return;
    }

    if (!driveActive) {
      await createNotification(
        "Drive Required",
        "Engage the drive before starting the blades.",
        "warning"
      );

      return;
    }

    if (bladesActive) {
      return;
    }

    if (obstacleDetected) {
      await createNotification(
        "Blades Blocked",
        "Blades cannot start while an obstacle is detected.",
        "warning"
      );

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
        "Unable to send BLADES ON command.",
        "error"
      );

      return;
    }

    await createNotification(
      "Blades ON",
      "Cutting blades have been engaged.",
      "warning"
    );
  };

  // ===================================================
  // BLADES OFF
  // ===================================================

  const disengageBlades =
    async () => {
      const success =
        await writeCommand(
          FIREBASE_PATHS.bladesCommand,
          "OFF"
        );

      if (!success) {
        await createNotification(
          "Blade Command Failed",
          "Unable to send BLADES OFF command.",
          "error"
        );

        return;
      }

      await createNotification(
        "Blades OFF",
        "Cutting blades have been disengaged.",
        "system"
      );
    };

  // ===================================================
  // CAMERA SWITCH
  // ===================================================

  const toggleCamera =
    async () => {
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

      await createNotification(
        "Camera Switched",
        `Camera changed to ${newCamera.toUpperCase()}.`,
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

      await createNotification(
        newState
          ? "Camera ON"
          : "Camera OFF",
        newState
          ? "Camera feed enabled."
          : "Camera feed disabled.",
        "system"
      );
    };

  // ===================================================
  // RETRY CAMERA
  // ===================================================

  const retryCamera = () => {
    setCameraError(false);

    setCameraStreamUrl(
      (current) =>
        current || DEFAULT_CAMERA_STREAM
    );
  };

  // ===================================================
  // EMERGENCY STOP
  // ===================================================

  const stopMower = async () => {
    if (
      emergencyStoppingRef.current
    ) {
      return;
    }

    emergencyStoppingRef.current =
      true;

    try {
      movementPointerRef.current =
        null;

      steeringPointerRef.current =
        null;

      activeMovementRef.current =
        null;

      activeSteeringRef.current =
        null;

      setActiveControl(null);

      const results =
        await Promise.all([
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

          writeCommand(
            FIREBASE_PATHS.bladesCommand,
            "OFF"
          ),

          writeCommand(
            FIREBASE_PATHS.automaticCommand,
            "STOP"
          ),
        ]);

      if (
        !results.every(Boolean)
      ) {
        throw new Error(
          "Emergency stop command failed."
        );
      }

      setDriveActive(false);
      setMovementStatus(null);
      setSteeringStatus("STOP");
      setBladesActive(false);
      setAutomaticRunning(false);
      setAutomaticStatus("STOPPED");
      setActiveControl(null);

      await createNotification(
        "Emergency Stop",
        "Drive, movement, steering, blades, and automatic mode were stopped.",
        "error"
      );
    } catch (error) {
      console.error(
        "Emergency stop error:",
        error
      );

      await createNotification(
        "Emergency Stop Failed",
        "One or more emergency stop commands failed.",
        "error"
      );
    } finally {
      emergencyStoppingRef.current =
        false;
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
      className="relative z-0 min-h-screen overflow-x-hidden pb-28 sm:pb-24"
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
          {isConnected &&
          mowerOnline ? (
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
      {/* OBSTACLE WARNING */}
      {/* ================================================= */}

      {obstacleDetected && (
        <div className="relative z-30 mb-8 flex items-center gap-4 rounded-3xl border-2 border-red-300 bg-red-50 p-5 shadow-lg">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-600">
            <ShieldAlert
              className="h-6 w-6 text-white"
              strokeWidth={2.5}
            />
          </div>

          <div className="flex-1">
            <p className="text-sm font-black uppercase tracking-wider text-red-700">
              OBSTACLE DETECTED
            </p>

            <p className="mt-1 text-xs font-semibold text-red-600">
              May nakaharang sa mower.
            </p>

            {obstacleDistance !== null && (
              <p className="mt-1 text-[10px] font-black text-red-500">
                Distance: {obstacleDistance} cm
              </p>
            )}
          </div>

          <span className="h-4 w-4 animate-pulse rounded-full bg-red-600" />
        </div>
      )}

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
              Manual movement, steering, and blade controls are locked.
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
              {cameraActive ? (
                <div className="absolute inset-0 bg-black">
                  {cameraStreamUrl &&
                  !cameraError ? (
                    <img
                      key={`${currentCamera}-${cameraStreamUrl}`}
                      src={cameraStreamUrl}
                      alt="ESP32-CAM Live Feed"
                      className="absolute inset-0 h-full w-full object-cover"
                      onLoad={() => {
                        console.log(
                          "[CAMERA] Stream loaded:",
                          cameraStreamUrl
                        );

                        setCameraError(false);
                      }}
                      onError={() => {
                        console.error(
                          "[CAMERA] Stream failed:",
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
                        Waiting for ESP32-CAM stream...
                      </p>

                      {cameraStreamUrl && (
                        <p className="mt-3 max-w-full break-all rounded-lg bg-black/40 px-3 py-2 font-mono text-[10px] text-emerald-400">
                          {cameraStreamUrl}
                        </p>
                      )}

                      <button
                        type="button"
                        onClick={
                          retryCamera
                        }
                        className="mt-4 rounded-xl bg-emerald-600 px-4 py-2 text-[10px] font-black uppercase text-white"
                      >
                        Retry Camera
                      </button>
                    </div>
                  )}

                  {cameraStreamUrl &&
                  !cameraError && (
                    <div className="absolute left-4 top-4 z-20 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/80 px-3 py-1.5 shadow-lg backdrop-blur-md">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />

                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300">
                        Live Feed (
                        {currentCamera.toUpperCase()}
                        )
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
                </div>
              )}

              {/* CAMERA CONTROLS */}

              <div className="absolute bottom-4 left-1/2 z-[100] flex w-[calc(100%-1rem)] max-w-[620px] -translate-x-1/2 flex-wrap items-center justify-center gap-2 rounded-2xl bg-black/30 p-2 backdrop-blur-sm">
                <button
                  type="button"
                  onClick={
                    toggleCamera
                  }
                  className="flex min-h-11 items-center gap-2 rounded-xl border border-white/20 bg-black/80 px-4 py-2.5 text-xs font-black text-white shadow-lg"
                >
                  <RotateCw className="h-4 w-4 text-emerald-400" />

                  {currentCamera ===
                  "front"
                    ? "REAR CAM"
                    : "FRONT CAM"}
                </button>

                <button
                  type="button"
                  onClick={
                    toggleCameraPower
                  }
                  className={`flex min-h-11 items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-black text-white shadow-lg ${
                    cameraActive
                      ? "border-emerald-400/40 bg-emerald-700/90"
                      : "border-red-400/40 bg-red-700/90"
                  }`}
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
          {/* DRIVE COMMAND */}
          {/* ================================================= */}

          <div className="relative z-30 flex select-none flex-col items-center rounded-[2.5rem] border border-gray-100 bg-white p-6 shadow-xl sm:p-8">
            <div className="mb-6 flex w-full items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-[3px] text-[#2C3627]">
                Drive Command
              </h2>

              <span
                className={`rounded-lg border px-2.5 py-1 text-[10px] font-bold ${
                  driveActive
                    ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                    : "border-amber-200 bg-amber-50 text-amber-600"
                }`}
              >
                {driveActive
                  ? "Drive Engaged"
                  : "Drive Disengaged"}
              </span>
            </div>

            {/* DIRECTION PAD */}

            <div
              className="relative z-40 flex h-64 w-64 items-center justify-center sm:h-72 sm:w-72"
              style={{
                touchAction: "none",
                userSelect: "none",
                WebkitUserSelect:
                  "none",
              }}
              onContextMenu={(e) =>
                e.preventDefault()
              }
            >
              <div className="pointer-events-none absolute inset-0 rounded-full border-4 border-slate-100 bg-slate-50 shadow-inner" />

              {/* FORWARD */}

              <button
                type="button"
                disabled={
                  !driveActive ||
                  automaticRunning ||
                  obstacleDetected ||
                  !mowerOnline
                }
                aria-label="Move forward"
                className={`pointer-events-auto absolute top-2 z-50 flex h-16 w-16 touch-none select-none items-center justify-center rounded-2xl border shadow-md transition-all active:scale-95 sm:h-20 sm:w-20 ${
                  activeControl ===
                  "forward"
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : "border-slate-200 bg-white text-[#2C3627]"
                } ${
                  !driveActive ||
                  automaticRunning ||
                  obstacleDetected ||
                  !mowerOnline
                    ? "cursor-not-allowed opacity-50"
                    : "cursor-pointer"
                }`}
                style={{
                  touchAction:
                    "none",
                }}
                onPointerDown={async (
                  e
                ) => {
                  e.preventDefault();
                  e.stopPropagation();

                  if (
                    !driveActive ||
                    automaticRunning ||
                    obstacleDetected ||
                    !mowerOnline
                  ) {
                    return;
                  }

                  try {
                    e.currentTarget.setPointerCapture(
                      e.pointerId
                    );
                  } catch {}

                  await startMovementControl(
                    "forward",
                    e.pointerId
                  );
                }}
                onPointerUp={async (
                  e
                ) => {
                  e.preventDefault();
                  e.stopPropagation();

                  await releaseMovementControl(
                    e.pointerId
                  );
                }}
                onPointerCancel={async (
                  e
                ) => {
                  e.preventDefault();
                  e.stopPropagation();

                  await releaseMovementControl(
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
                  automaticRunning ||
                  !mowerOnline
                }
                aria-label="Steer right"
                className={`pointer-events-auto absolute right-2 z-50 flex h-16 w-16 touch-none select-none items-center justify-center rounded-2xl border shadow-md transition-all active:scale-95 sm:h-20 sm:w-20 ${
                  activeControl ===
                  "right"
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : "border-slate-200 bg-white text-[#2C3627]"
                } ${
                  !driveActive ||
                  automaticRunning ||
                  !mowerOnline
                    ? "cursor-not-allowed opacity-50"
                    : "cursor-pointer"
                }`}
                style={{
                  touchAction:
                    "none",
                }}
                onPointerDown={async (
                  e
                ) => {
                  e.preventDefault();
                  e.stopPropagation();

                  if (
                    !driveActive ||
                    automaticRunning ||
                    !mowerOnline
                  ) {
                    return;
                  }

                  try {
                    e.currentTarget.setPointerCapture(
                      e.pointerId
                    );
                  } catch {}

                  await startSteeringControl(
                    "right",
                    e.pointerId
                  );
                }}
                onPointerUp={async (
                  e
                ) => {
                  e.preventDefault();
                  e.stopPropagation();

                  await releaseSteeringControl(
                    e.pointerId
                  );
                }}
                onPointerCancel={async (
                  e
                ) => {
                  e.preventDefault();
                  e.stopPropagation();

                  await releaseSteeringControl(
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
                  automaticRunning ||
                  !mowerOnline
                }
                aria-label="Move backward"
                className={`pointer-events-auto absolute bottom-2 z-50 flex h-16 w-16 touch-none select-none items-center justify-center rounded-2xl border shadow-md transition-all active:scale-95 sm:h-20 sm:w-20 ${
                  activeControl ===
                  "backward"
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : "border-slate-200 bg-white text-[#2C3627]"
                } ${
                  !driveActive ||
                  automaticRunning ||
                  !mowerOnline
                    ? "cursor-not-allowed opacity-50"
                    : "cursor-pointer"
                }`}
                style={{
                  touchAction:
                    "none",
                }}
                onPointerDown={async (
                  e
                ) => {
                  e.preventDefault();
                  e.stopPropagation();

                  if (
                    !driveActive ||
                    automaticRunning ||
                    !mowerOnline
                  ) {
                    return;
                  }

                  try {
                    e.currentTarget.setPointerCapture(
                      e.pointerId
                    );
                  } catch {}

                  await startMovementControl(
                    "backward",
                    e.pointerId
                  );
                }}
                onPointerUp={async (
                  e
                ) => {
                  e.preventDefault();
                  e.stopPropagation();

                  await releaseMovementControl(
                    e.pointerId
                  );
                }}
                onPointerCancel={async (
                  e
                ) => {
                  e.preventDefault();
                  e.stopPropagation();

                  await releaseMovementControl(
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
                  automaticRunning ||
                  !mowerOnline
                }
                aria-label="Steer left"
                className={`pointer-events-auto absolute left-2 z-50 flex h-16 w-16 touch-none select-none items-center justify-center rounded-2xl border shadow-md transition-all active:scale-95 sm:h-20 sm:w-20 ${
                  activeControl ===
                  "left"
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : "border-slate-200 bg-white text-[#2C3627]"
                } ${
                  !driveActive ||
                  automaticRunning ||
                  !mowerOnline
                    ? "cursor-not-allowed opacity-50"
                    : "cursor-pointer"
                }`}
                style={{
                  touchAction:
                    "none",
                }}
                onPointerDown={async (
                  e
                ) => {
                  e.preventDefault();
                  e.stopPropagation();

                  if (
                    !driveActive ||
                    automaticRunning ||
                    !mowerOnline
                  ) {
                    return;
                  }

                  try {
                    e.currentTarget.setPointerCapture(
                      e.pointerId
                    );
                  } catch {}

                  await startSteeringControl(
                    "left",
                    e.pointerId
                  );
                }}
                onPointerUp={async (
                  e
                ) => {
                  e.preventDefault();
                  e.stopPropagation();

                  await releaseSteeringControl(
                    e.pointerId
                  );
                }}
                onPointerCancel={async (
                  e
                ) => {
                  e.preventDefault();
                  e.stopPropagation();

                  await releaseSteeringControl(
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

            {/* STATUS */}

            <div className="mt-5 grid w-full grid-cols-2 gap-3">
              <div className="rounded-2xl bg-slate-50 p-4 text-center">
                <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                  Movement
                </p>

                <p
                  className={`mt-2 text-lg font-black uppercase ${
                    movementStatus
                      ? "text-emerald-600"
                      : "text-slate-500"
                  }`}
                >
                  {movementStatus ||
                    "STOP"}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 text-center">
                <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                  Steering
                </p>

                <p
                  className={`mt-2 text-lg font-black ${
                    steeringStatus !==
                    "STOP"
                      ? "text-emerald-600"
                      : "text-slate-500"
                  }`}
                >
                  {steeringStatus}
                </p>
              </div>
            </div>

            <div className="mt-4 text-center">
              {!mowerOnline ? (
                <p className="text-[10px] font-black text-red-600">
                  MOWER OFFLINE — CONTROLS LOCKED
                </p>
              ) : !driveActive ? (
                <p className="text-[10px] font-bold text-amber-600">
                  ENGAGE DRIVE TO ENABLE CONTROLS
                </p>
              ) : obstacleDetected ? (
                <p className="text-[10px] font-black text-red-600">
                  OBSTACLE DETECTED — FORWARD MOVEMENT LOCKED
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
              Hold ↑ / ↓ for movement. Hold ← / → for steering.
              <br />
              Movement and steering can operate simultaneously.
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
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={stopMower}
              className="relative isolate flex h-[72px] w-full items-center justify-center gap-3 overflow-hidden rounded-full border-4 border-red-300 !bg-red-600 !text-white shadow-xl transition-all hover:!bg-red-700 active:scale-[0.98]"
            >
              <div className="absolute inset-0 -z-10 animate-pulse rounded-full bg-red-500 opacity-20" />

              <div className="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-4 border-white bg-red-700">
                <CircleStop
                  className="h-9 w-9 text-white"
                  strokeWidth={2.5}
                />
              </div>

              <div className="relative z-10 text-left">
                <p className="text-[11px] font-black tracking-[0.25em]">
                  Emergency
                </p>

                <p className="text-3xl font-black leading-none">
                  STOP
                </p>

                <p className="text-[9px] font-bold uppercase">
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
                onClick={
                  engageDrive
                }
                disabled={
                  driveActive ||
                  automaticRunning ||
                  !mowerOnline
                }
                className={`flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-black ${
                  driveActive ||
                  automaticRunning ||
                  !mowerOnline
                    ? "cursor-not-allowed bg-[#40513B] text-white opacity-40"
                    : "bg-[#40513B] text-white hover:bg-[#2C3627]"
                }`}
              >
                <Power className="h-4 w-4" />

                ENGAGE DRIVE
              </button>

              <button
                type="button"
                onClick={
                  disengageDrive
                }
                disabled={
                  !driveActive
                }
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
          {/* STEERING */}
          {/* ================================================= */}

          <div className="relative z-20 rounded-[2rem] border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-[2px] text-[#2C3627]">
                Steering
              </h3>

              <span
                className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase ${
                  steeringStatus !==
                  "STOP"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                    : "border-slate-200 bg-slate-100 text-[#40513B]"
                }`}
              >
                {steeringStatus}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* LEFT */}

              <button
                type="button"
                disabled={
                  !driveActive ||
                  automaticRunning ||
                  !mowerOnline
                }
                onPointerDown={async (
                  e
                ) => {
                  e.preventDefault();

                  if (
                    !driveActive ||
                    automaticRunning ||
                    !mowerOnline
                  ) {
                    return;
                  }

                  try {
                    e.currentTarget.setPointerCapture(
                      e.pointerId
                    );
                  } catch {}

                  await startSteeringControl(
                    "left",
                    e.pointerId
                  );
                }}
                onPointerUp={async (
                  e
                ) => {
                  e.preventDefault();

                  await releaseSteeringControl(
                    e.pointerId
                  );
                }}
                onPointerCancel={async (
                  e
                ) => {
                  e.preventDefault();

                  await releaseSteeringControl(
                    e.pointerId
                  );
                }}
                className={`flex min-h-16 items-center justify-center gap-2 rounded-2xl border text-sm font-black transition active:scale-95 ${
                  steeringStatus ===
                  "LEFT"
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : "border-slate-200 bg-white text-[#2C3627]"
                } ${
                  !driveActive ||
                  automaticRunning ||
                  !mowerOnline
                    ? "cursor-not-allowed opacity-40"
                    : ""
                }`}
                style={{
                  touchAction:
                    "none",
                }}
              >
                <ArrowLeft className="h-6 w-6" />

                LEFT
              </button>

              {/* RIGHT */}

              <button
                type="button"
                disabled={
                  !driveActive ||
                  automaticRunning ||
                  !mowerOnline
                }
                onPointerDown={async (
                  e
                ) => {
                  e.preventDefault();

                  if (
                    !driveActive ||
                    automaticRunning ||
                    !mowerOnline
                  ) {
                    return;
                  }

                  try {
                    e.currentTarget.setPointerCapture(
                      e.pointerId
                    );
                  } catch {}

                  await startSteeringControl(
                    "right",
                    e.pointerId
                  );
                }}
                onPointerUp={async (
                  e
                ) => {
                  e.preventDefault();

                  await releaseSteeringControl(
                    e.pointerId
                  );
                }}
                onPointerCancel={async (
                  e
                ) => {
                  e.preventDefault();

                  await releaseSteeringControl(
                    e.pointerId
                  );
                }}
                className={`flex min-h-16 items-center justify-center gap-2 rounded-2xl border text-sm font-black transition active:scale-95 ${
                  steeringStatus ===
                  "RIGHT"
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : "border-slate-200 bg-white text-[#2C3627]"
                } ${
                  !driveActive ||
                  automaticRunning ||
                  !mowerOnline
                    ? "cursor-not-allowed opacity-40"
                    : ""
                }`}
                style={{
                  touchAction:
                    "none",
                }}
              >
                RIGHT

                <ArrowRight className="h-6 w-6" />
              </button>
            </div>

            <p className="mt-3 text-center text-[10px] font-semibold text-slate-400">
              Hold LEFT or RIGHT to steer.
            </p>
          </div>

          {/* ================================================= */}
          {/* BLADES */}
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
                      Engage the drive before starting the blades.
                    </p>
                  </div>
                </div>
              )}

            <button
              type="button"
              onClick={
                engageBlades
              }
              disabled={
                bladesActive ||
                automaticRunning ||
                !driveActive ||
                !mowerOnline ||
                obstacleDetected
              }
              className={`flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl py-4 text-sm font-black ${
                bladesActive ||
                automaticRunning ||
                !driveActive ||
                !mowerOnline ||
                obstacleDetected
                  ? "cursor-not-allowed bg-[#40513B] text-white opacity-40"
                  : "bg-[#40513B] text-white hover:bg-[#2C3627]"
              }`}
            >
              <Scissors className="h-4 w-4" />

              ENGAGE BLADES
            </button>

            <button
              type="button"
              onClick={
                disengageBlades
              }
              disabled={
                !bladesActive
              }
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

              <span className="text-[10px] font-bold text-emerald-600">
                REALTIME
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* DRIVE */}

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

              {/* BLADES */}

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

              {/* MOVEMENT */}

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                  Movement
                </p>

                <p className="mt-2 text-lg font-black uppercase text-[#40513B]">
                  {movementStatus ||
                    "STOP"}
                </p>
              </div>

              {/* STEERING */}

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                  Steering
                </p>

                <p
                  className={`mt-2 text-lg font-black ${
                    steeringStatus !==
                    "STOP"
                      ? "text-emerald-600"
                      : "text-slate-500"
                  }`}
                >
                  {steeringStatus}
                </p>
              </div>

              {/* AUTOMATIC */}

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

              {/* CAMERA */}

              <div
                className={`rounded-2xl p-4 ${
                  cameraActive
                    ? "bg-emerald-50"
                    : "bg-slate-50"
                }`}
              >
                <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                  Camera
                </p>

                <p
                  className={`mt-2 text-lg font-black ${
                    cameraActive
                      ? "text-emerald-600"
                      : "text-slate-500"
                  }`}
                >
                  {cameraActive
                    ? currentCamera.toUpperCase()
                    : "OFF"}
                </p>
              </div>

              {/* OBSTACLE */}

              <div
                className={`rounded-2xl p-4 ${
                  obstacleDetected
                    ? "bg-red-50"
                    : "bg-emerald-50"
                }`}
              >
                <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                  Obstacle
                </p>

                <p
                  className={`mt-2 text-lg font-black ${
                    obstacleDetected
                      ? "text-red-600"
                      : "text-emerald-600"
                  }`}
                >
                  {obstacleDetected
                    ? "DETECTED"
                    : "CLEAR"}
                </p>

                {obstacleDistance !== null && (
                  <p className="mt-1 text-[10px] font-bold text-slate-500">
                    {obstacleDistance} cm
                  </p>
                )}
              </div>

              {/* MOWER CONNECTION */}

              <div
                className={`rounded-2xl p-4 ${
                  mowerOnline
                    ? "bg-emerald-50"
                    : "bg-red-50"
                }`}
              >
                <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                  Connection
                </p>

                <p
                  className={`mt-2 text-lg font-black ${
                    mowerOnline
                      ? "text-emerald-600"
                      : "text-red-600"
                  }`}
                >
                  {mowerOnline
                    ? "ONLINE"
                    : "OFFLINE"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pointer-events-none h-8 w-full sm:h-4" />
    </div>
  );
}