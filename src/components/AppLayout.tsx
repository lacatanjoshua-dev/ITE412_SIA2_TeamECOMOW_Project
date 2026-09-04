import React, { useEffect, useState } from "react";

import {
  Link,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  Home,
  Calendar,
  Zap,
  Plus,
  Wifi,
  Bluetooth,
  RefreshCw,
  X,
  LogOut,
  CircleCheck,
  CircleX,
  Bell,
} from "lucide-react";

import { createPortal } from "react-dom";

import {
  auth,
  realtimeDb,
  db,
} from "../firebase";

import {
  onAuthStateChanged,
  User,
} from "firebase/auth";

import {
  ref,
  onValue,
} from "firebase/database";

import {
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";


// =====================================================
// IMAGES
// =====================================================

const logoImage = "/images/Ecomow.png";
const bgImage = "/images/mower.jpg";


// =====================================================
// PROPS
// =====================================================

interface AppLayoutProps {
  onLogout: () => Promise<void>;
}


// =====================================================
// CONNECT CONTENT PROPS
// =====================================================

interface ConnectContentProps {
  connected: boolean;
  connecting: boolean;
  connectMsg: string | null;
  close: () => void;
}


// =====================================================
// CONNECT CONTENT
// =====================================================

const ConnectContent = ({
  connected,
  connecting,
  connectMsg,
  close,
}: ConnectContentProps) => {
  return (
    <div className="w-full">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex items-center justify-between mb-5">

        <div>
          <h2 className="text-xl font-black text-gray-800">
            Mower Connection
          </h2>

          <p className="text-xs text-gray-500 mt-1">
            ESP32 connection through Firebase
          </p>
        </div>

        <button
          type="button"
          onClick={close}
          className="
            w-8
            h-8
            rounded-full
            bg-gray-100
            flex
            items-center
            justify-center
            hover:bg-gray-200
            transition
          "
          aria-label="Close connection popup"
        >
          <X size={18} />
        </button>

      </div>


      {/* =================================================
          CONNECTION ITEMS
      ================================================= */}

      <div className="space-y-3">

        {/* =================================================
            ESP32 CONNECTION
        ================================================= */}

        <div
          className="
            flex
            items-center
            gap-4
            w-full
            border
            border-gray-200
            rounded-2xl
            p-4
            bg-white
          "
        >

          <div
            className={`
              w-10
              h-10
              rounded-full
              flex
              items-center
              justify-center
              ${
                connected
                  ? "bg-green-100"
                  : "bg-gray-100"
              }
            `}
          >

            <Wifi
              size={22}
              className={
                connected
                  ? "text-green-600"
                  : "text-gray-400"
              }
            />

          </div>


          <div className="flex-1 text-left">

            <p className="font-bold text-gray-800">
              ESP32 Mower
            </p>

            <p className="text-xs text-gray-500 mt-1">
              {connected
                ? "ESP32 is communicating with Firebase"
                : "Waiting for ESP32 heartbeat"}
            </p>

          </div>


          {connecting ? (

            <RefreshCw
              className="animate-spin text-gray-400"
              size={21}
            />

          ) : connected ? (

            <CircleCheck
              className="text-green-600"
              size={24}
            />

          ) : (

            <CircleX
              className="text-red-500"
              size={24}
            />

          )}

        </div>


        {/* =================================================
            BLUETOOTH
        ================================================= */}

        <button
          type="button"
          disabled
          className="
            flex
            items-center
            gap-4
            w-full
            border
            border-gray-200
            rounded-2xl
            p-4
            bg-white
            opacity-50
            cursor-not-allowed
          "
        >

          <div
            className="
              w-10
              h-10
              rounded-full
              bg-gray-100
              flex
              items-center
              justify-center
            "
          >

            <Bluetooth
              size={22}
              className="text-gray-400"
            />

          </div>


          <div className="flex-1 text-left">

            <p className="font-bold text-gray-500">
              Bluetooth
            </p>

            <p className="text-xs text-gray-400 mt-1">
              Not required for Firebase control
            </p>

          </div>

        </button>


        {/* =================================================
            CONNECTION MESSAGE
        ================================================= */}

        {connectMsg && (

          <div
            className={`
              p-3
              rounded-xl
              text-sm
              ${
                connected
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }
            `}
          >
            {connectMsg}
          </div>

        )}

      </div>

    </div>
  );
};


// =====================================================
// APP LAYOUT
// =====================================================

export default function AppLayout({
  onLogout,
}: AppLayoutProps) {

  const location = useLocation();
  const navigate = useNavigate();


  // ===================================================
  // USER
  // ===================================================

  const [user, setUser] =
    useState<User | null>(null);


  // ===================================================
  // NOTIFICATION COUNT
  // ===================================================

  const [
    notificationCount,
    setNotificationCount,
  ] = useState(0);


  // ===================================================
  // CONNECTION
  // ===================================================

  const [connectOpen, setConnectOpen] =
    useState(false);

  const [connecting, setConnecting] =
    useState(false);

  /*
   * IMPORTANT:
   *
   * connected = TRUE ONLY WHEN
   * ESP32 heartbeat is valid.
   *
   * Firebase login alone does NOT
   * make the mower connected.
   */
  const [connected, setConnected] =
    useState(false);

  const [connectMsg, setConnectMsg] =
    useState<string | null>(null);


  // ===================================================
  // MOWER
  // ===================================================

  const [mowerOnline, setMowerOnline] =
    useState(false);

  const [mowerLastSeen, setMowerLastSeen] =
    useState<number | null>(null);

  const [driveStatus, setDriveStatus] =
    useState("OFF");


  // ===================================================
  // FIREBASE AUTH LISTENER
  // ===================================================

  useEffect(() => {

    console.log(
      "Starting Firebase Auth listener..."
    );

    const unsubscribe =
      onAuthStateChanged(
        auth,
        (currentUser) => {

          console.log(
            "Firebase Auth user:",
            currentUser?.email || "No user"
          );

          console.log(
            "Firebase Auth UID:",
            currentUser?.uid || "No UID"
          );


          // =============================================
          // USER LOGGED IN
          // =============================================

          if (currentUser) {

            setUser(currentUser);

            /*
             * DO NOT set connected = true here.
             *
             * User login and ESP32 connection
             * are two different things.
             */

            setConnectMsg(
              "Checking ESP32 connection..."
            );

          }


          // =============================================
          // USER LOGGED OUT
          // =============================================

          else {

            setUser(null);

            setConnected(false);

            setMowerOnline(false);

            setMowerLastSeen(null);

            setNotificationCount(0);

            setConnectMsg(null);

          }

        }
      );


    return () => {

      console.log(
        "Stopping Firebase Auth listener..."
      );

      unsubscribe();

    };

  }, []);


  // ===================================================
  // FIREBASE NOTIFICATION LISTENER
  //
  // users/{UID}/notifications
  // read == false
  // ===================================================

  useEffect(() => {

    // =================================================
    // NO USER
    // =================================================

    if (!user) {

      console.log(
        "No authenticated user."
      );

      setNotificationCount(0);

      return;

    }


    console.log(
      "=========================================="
    );

    console.log(
      "STARTING FIRESTORE NOTIFICATION LISTENER"
    );

    console.log(
      "USER UID:",
      user.uid
    );

    console.log(
      "PATH:",
      `users/${user.uid}/notifications`
    );

    console.log(
      "FILTER: read == false"
    );

    console.log(
      "=========================================="
    );


    // =================================================
    // COLLECTION
    // =================================================

    const notificationsRef =
      collection(
        db,
        "users",
        user.uid,
        "notifications"
      );


    // =================================================
    // UNREAD QUERY
    // =================================================

    const unreadQuery =
      query(
        notificationsRef,
        where(
          "read",
          "==",
          false
        )
      );


    // =================================================
    // REAL-TIME LISTENER
    // =================================================

    const unsubscribe =
      onSnapshot(

        unreadQuery,

        (snapshot) => {

          console.log(
            "=========================================="
          );

          console.log(
            "FIRESTORE NOTIFICATION UPDATE"
          );

          console.log(
            "USER UID:",
            user.uid
          );

          console.log(
            "Unread notifications:",
            snapshot.size
          );

          console.log(
            "=========================================="
          );


          setNotificationCount(
            snapshot.size
          );

        },

        (error) => {

          console.error(
            "=========================================="
          );

          console.error(
            "FIRESTORE NOTIFICATION LISTENER ERROR"
          );

          console.error(
            error
          );

          console.error(
            "=========================================="
          );


          setNotificationCount(0);

        }
      );


    // =================================================
    // CLEANUP
    // =================================================

    return () => {

      console.log(
        "Stopping Firestore notification listener..."
      );

      unsubscribe();

    };

  }, [user]);


  // ===================================================
  // REAL ESP32 CONNECTION LISTENER
  //
  // ESP32 MUST WRITE:
  //
  // ecomow/mower/connection/status
  // ecomow/mower/connection/lastSeen
  //
  // Example:
  //
  // status:
  // ONLINE
  //
  // lastSeen:
  // 1787654321000
  //
  // lastSeen must be Unix time in MILLISECONDS.
  // ===================================================

  useEffect(() => {

    console.log(
      "=========================================="
    );

    console.log(
      "STARTING REAL ESP32 CONNECTION LISTENER"
    );

    console.log(
      "=========================================="
    );


    // =================================================
    // STATUS REFERENCE
    // =================================================

    const statusRef =
      ref(
        realtimeDb,
        "ecomow/mower/connection/status"
      );


    // =================================================
    // LAST SEEN REFERENCE
    // =================================================

    const lastSeenRef =
      ref(
        realtimeDb,
        "ecomow/mower/connection/lastSeen"
      );


    // =================================================
    // LOCAL VALUES
    // =================================================

    let latestStatus = "";

    let latestLastSeen: number | null = null;


    // =================================================
    // UPDATE CONNECTION
    // =================================================

    const updateConnection = () => {

      const now =
        Date.now();


      // ===============================================
      // HEARTBEAT AGE
      // ===============================================

      const heartbeatAge =
        latestLastSeen !== null
          ? now - latestLastSeen
          : Infinity;


      // ===============================================
      // HEARTBEAT VALID
      //
      // 15 seconds timeout
      // ===============================================

      const heartbeatValid =
        latestLastSeen !== null &&
        heartbeatAge >= 0 &&
        heartbeatAge < 15000;


      // ===============================================
      // STATUS VALID
      // ===============================================

      const statusValid =
        latestStatus
          .trim()
          .toUpperCase() ===
        "ONLINE";


      // ===============================================
      // ACTUAL ESP32 CONNECTION
      // ===============================================

      const isActuallyOnline =
        statusValid &&
        heartbeatValid;


      // ===============================================
      // UPDATE STATE
      // ===============================================

      setConnected(
        isActuallyOnline
      );

      setMowerOnline(
        isActuallyOnline
      );

      setMowerLastSeen(
        latestLastSeen
      );


      // ===============================================
      // MESSAGE
      // ===============================================

      if (isActuallyOnline) {

        setConnectMsg(
          "ESP32 CONNECTED — live heartbeat detected."
        );

      }

      else if (
        latestLastSeen !== null &&
        heartbeatAge >= 15000
      ) {

        setConnectMsg(
          "ESP32 OFFLINE — heartbeat timeout."
        );

      }

      else {

        setConnectMsg(
          "ESP32 OFFLINE — waiting for heartbeat."
        );

      }


      // ===============================================
      // DEBUG
      // ===============================================

      console.log(
        "=========================================="
      );

      console.log(
        "ESP32 CONNECTION CHECK"
      );

      console.log(
        "Status:",
        latestStatus
      );

      console.log(
        "Last Seen:",
        latestLastSeen
      );

      console.log(
        "Heartbeat Age:",
        heartbeatAge,
        "ms"
      );

      console.log(
        "Heartbeat Valid:",
        heartbeatValid
      );

      console.log(
        "Status Valid:",
        statusValid
      );

      console.log(
        "ESP32 ONLINE:",
        isActuallyOnline
      );

      console.log(
        "=========================================="
      );

    };


    // =================================================
    // STATUS LISTENER
    // =================================================

    const unsubscribeStatus =
      onValue(

        statusRef,

        (snapshot) => {

          latestStatus =
            snapshot.exists()
              ? String(
                  snapshot.val()
                )
              : "";

          console.log(
            "ESP32 status changed:",
            latestStatus
          );

          updateConnection();

        },

        (error) => {

          console.error(
            "ESP32 status listener error:",
            error
          );

          setConnected(false);
          setMowerOnline(false);

          setConnectMsg(
            "Unable to read ESP32 status."
          );

        }

      );


    // =================================================
    // LAST SEEN LISTENER
    // =================================================

    const unsubscribeLastSeen =
      onValue(

        lastSeenRef,

        (snapshot) => {

          if (snapshot.exists()) {

            const value =
              Number(
                snapshot.val()
              );


            latestLastSeen =
              Number.isFinite(value)
                ? value
                : null;

          }

          else {

            latestLastSeen =
              null;

          }


          console.log(
            "ESP32 lastSeen changed:",
            latestLastSeen
          );


          updateConnection();

        },

        (error) => {

          console.error(
            "ESP32 lastSeen listener error:",
            error
          );

          setConnected(false);
          setMowerOnline(false);

          setConnectMsg(
            "Unable to read ESP32 heartbeat."
          );

        }

      );


    // =================================================
    // PERIODIC HEARTBEAT CHECK
    //
    // Important:
    // Kahit walang bagong Firebase event,
    // mache-check pa rin kung expired na
    // ang lastSeen.
    // =================================================

    const interval =
      window.setInterval(() => {

        updateConnection();

      }, 2000);


    // =================================================
    // CLEANUP
    // =================================================

    return () => {

      console.log(
        "Stopping ESP32 connection listener..."
      );

      unsubscribeStatus();

      unsubscribeLastSeen();

      window.clearInterval(
        interval
      );

    };

  }, []);


  // ===================================================
  // DRIVE STATUS LISTENER
  //
  // ecomow/mower/drive/status
  // ===================================================

  useEffect(() => {

    console.log(
      "Starting drive status listener..."
    );


    const driveStatusRef =
      ref(
        realtimeDb,
        "ecomow/mower/drive/status"
      );


    const unsubscribe =
      onValue(

        driveStatusRef,

        (snapshot) => {

          if (snapshot.exists()) {

            const value =
              snapshot.val();


            console.log(
              "Drive status:",
              value
            );


            setDriveStatus(
              String(value).toUpperCase()
            );

          }

          else {

            setDriveStatus(
              "OFF"
            );

          }

        },

        (error) => {

          console.error(
            "Drive status listener error:",
            error
          );

          setDriveStatus(
            "OFF"
          );

        }
      );


    return () => {

      console.log(
        "Stopping drive status listener..."
      );

      unsubscribe();

    };

  }, []);


  // ===================================================
  // ACTIVE ROUTE
  // ===================================================

  const isActive = (
    path: string
  ) => {

    if (path === ".") {

      return (
        location.pathname ===
        "/app"
      );

    }


    return location.pathname.startsWith(
      `/app/${path}`
    );

  };


  // ===================================================
  // OPEN NOTIFICATIONS
  // ===================================================

  const openNotifications = () => {

    console.log(
      "=========================================="
    );

    console.log(
      "🔔 NOTIFICATION BELL CLICKED"
    );

    console.log(
      "CURRENT PATH:",
      location.pathname
    );

    console.log(
      "NOTIFICATION COUNT:",
      notificationCount
    );

    console.log(
      "CURRENT USER:",
      user?.email
    );

    console.log(
      "CURRENT UID:",
      user?.uid
    );

    console.log(
      "NAVIGATING TO:",
      "/app/notifications"
    );

    console.log(
      "=========================================="
    );


    navigate(
      "/app/notifications",
      {
        replace: false,
      }
    );

  };


  // ===================================================
  // LOGOUT
  // ===================================================

  const handleLogout = async () => {

    try {

      console.log(
        "Logging out..."
      );


      await onLogout();


      console.log(
        "Logout successful."
      );


      setUser(null);

      setNotificationCount(0);

      setConnected(false);

      setMowerOnline(false);

      setMowerLastSeen(null);

      setConnectMsg(null);


      navigate(
        "/login",
        {
          replace: true,
        }
      );

    }

    catch (error) {

      console.error(
        "Logout failed:",
        error
      );

    }

  };


  // ===================================================
  // OPEN CONNECTION
  // ===================================================

  const openConnect = () => {

    console.log(
      "Opening ESP32 connection popup..."
    );


    setConnectOpen(true);

    setConnecting(true);


    // =================================================
    // CHECK USER AUTH
    // =================================================

    if (!auth.currentUser) {

      setConnected(false);

      setMowerOnline(false);

      setConnectMsg(
        "Please login to Firebase first."
      );

      setConnecting(false);

      return;

    }


    // =================================================
    // CHECK ACTUAL ESP32 STATE
    // =================================================

    if (mowerOnline) {

      setConnected(true);

      setConnectMsg(
        "ESP32 CONNECTED — live heartbeat detected."
      );

    }

    else {

      setConnected(false);

      setConnectMsg(
        "ESP32 OFFLINE — waiting for heartbeat."
      );

    }


    setConnecting(false);

  };


  // ===================================================
  // CLOSE CONNECTION
  // ===================================================

  const closeConnect = () => {

    console.log(
      "Closing connection popup..."
    );

    setConnectOpen(false);

  };


  // ===================================================
  // CONNECTION POPUP
  // ===================================================

  const firebasePopup =
    connectOpen &&
    typeof document !==
      "undefined"
      ? createPortal(

          <div
            className="
              fixed
              inset-0
              z-[9999999]
              flex
              items-center
              justify-center
              px-4
              py-6
            "
            style={{
              position: "fixed",
              zIndex: 9999999,
              isolation: "isolate",
            }}
          >

            {/* =================================================
                BACKDROP
            ================================================= */}

            <div
              className="
                fixed
                inset-0
                bg-black/50
                backdrop-blur-sm
              "
              style={{
                zIndex: 9999998,
              }}
              onClick={
                closeConnect
              }
            />


            {/* =================================================
                CARD
            ================================================= */}

            <div
              className="
                relative
                w-full
                max-w-md
                max-h-[85vh]
                overflow-y-auto
                bg-white
                rounded-3xl
                shadow-2xl
                p-6
              "
              style={{
                zIndex: 9999999,
              }}
              onClick={(event) => {
                event.stopPropagation();
              }}
            >

              <ConnectContent
                connected={connected}
                connecting={connecting}
                connectMsg={connectMsg}
                close={closeConnect}
              />


              {/* =================================================
                  MOWER STATUS
              ================================================= */}

              <div
                className="
                  mt-5
                  pt-4
                  border-t
                  border-gray-100
                "
              >

                <div
                  className="
                    flex
                    items-center
                    justify-between
                  "
                >

                  {/* =================================================
                      ESP32
                  ================================================= */}

                  <div>

                    <p
                      className="
                        text-xs
                        text-gray-400
                      "
                    >
                      ESP32 Status
                    </p>


                    <div
                      className="
                        flex
                        items-center
                        gap-2
                        mt-1
                      "
                    >

                      <span
                        className={`
                          w-2.5
                          h-2.5
                          rounded-full
                          ${
                            mowerOnline
                              ? "bg-green-500"
                              : "bg-red-500"
                          }
                        `}
                      />


                      <p
                        className="
                          font-bold
                          text-gray-800
                        "
                      >
                        {mowerOnline
                          ? "CONNECTED"
                          : "OFFLINE"}
                      </p>

                    </div>


                    {/* =================================================
                        HEARTBEAT INFO
                    ================================================= */}

                    {mowerOnline &&
                      mowerLastSeen !== null && (

                        <p
                          className="
                            text-[10px]
                            text-green-600
                            mt-1
                          "
                        >
                          Live heartbeat detected
                        </p>

                      )}

                  </div>


                  {/* =================================================
                      DRIVE
                  ================================================= */}

                  <div>

                    <p
                      className="
                        text-xs
                        text-gray-400
                        text-right
                      "
                    >
                      Drive
                    </p>


                    <p
                      className={`
                        font-bold
                        text-right
                        mt-1
                        ${
                          driveStatus ===
                          "ON"
                            ? "text-green-600"
                            : "text-gray-500"
                        }
                      `}
                    >
                      {driveStatus}
                    </p>

                  </div>

                </div>

              </div>


              {/* =================================================
                  LAST SEEN
              ================================================= */}

              {mowerLastSeen !== null && (

                <div
                  className="
                    mt-4
                    p-3
                    rounded-xl
                    bg-gray-50
                    text-xs
                    text-gray-500
                  "
                >

                  <div
                    className="
                      flex
                      justify-between
                    "
                  >

                    <span>
                      Last heartbeat
                    </span>

                    <span
                      className="
                        font-semibold
                        text-gray-700
                      "
                    >
                      {new Date(
                        mowerLastSeen
                      ).toLocaleTimeString()}

                    </span>

                  </div>

                </div>

              )}


              {/* =================================================
                  CLOSE
              ================================================= */}

              <button
                type="button"
                onClick={
                  closeConnect
                }
                className="
                  w-full
                  mt-5
                  py-3
                  rounded-xl
                  bg-gray-800
                  text-white
                  font-semibold
                  hover:bg-gray-900
                  active:scale-[0.98]
                  transition
                "
              >
                Close
              </button>

            </div>

          </div>,

          document.body

        )
      : null;


  // ===================================================
  // RENDER
  // ===================================================

  return (

    <div
      className="
        relative
        min-h-screen
        pb-28
        md:pb-0
        overflow-x-hidden
      "
    >

      {/* =================================================
          BACKGROUND
      ================================================= */}

      <div
        className="
          fixed
          inset-0
          z-0
          bg-cover
          bg-center
          pointer-events-none
        "
        style={{
          backgroundImage:
            `url(${bgImage})`,
          transform:
            "scale(1.05)",
        }}
      />


      <div
        className="
          fixed
          inset-0
          z-[1]
          bg-white/30
          pointer-events-none
        "
      />


      {/* =================================================
          MOBILE NOTIFICATION BELL
      ================================================= */}

      <div
        className="
          md:hidden
          fixed
          pointer-events-auto
          z-[999999]
        "
        style={{
          position: "fixed",
          top:
            "calc(env(safe-area-inset-top, 0px) + 12px)",
          right: "16px",
          zIndex: 999999,
          isolation: "isolate",
        }}
      >

        <button
          type="button"
          onClick={
            openNotifications
          }
          className="
            group
            relative
            w-12
            h-12
            rounded-full
            bg-white
            border
            border-white
            shadow-[0_8px_30px_rgba(0,0,0,0.20)]
            flex
            items-center
            justify-center
            cursor-pointer
            pointer-events-auto
            transition-all
            duration-200
            hover:scale-105
            active:scale-90
          "
          aria-label="Open notifications"
        >

          <Bell
            size={25}
            strokeWidth={2}
            className="
              text-[#40513B]
              transition-transform
              duration-200
              group-hover:scale-110
            "
          />


          {notificationCount > 0 && (

            <span
              className="
                absolute
                -top-1
                -right-1
                min-w-[21px]
                h-[21px]
                px-1
                rounded-full
                bg-red-500
                text-white
                text-[10px]
                font-black
                flex
                items-center
                justify-center
                border-2
                border-white
                shadow-lg
                z-[1000000]
                pointer-events-none
              "
            >

              {notificationCount > 99
                ? "99+"
                : notificationCount}

            </span>

          )}

        </button>

      </div>


      {/* =================================================
          DESKTOP HEADER
      ================================================= */}

      <header
        className="
          sticky
          top-0
          z-50
          hidden
          md:block
        "
      >

        <div
          className="
            bg-white/70
            backdrop-blur-xl
            border-b
            border-white/40
            shadow-sm
          "
        >

          <div
            className="
              max-w-7xl
              mx-auto
              px-6
              h-16
              flex
              items-center
              justify-between
            "
          >

            {/* =================================================
                LOGO
            ================================================= */}

            <Link
              to="/app"
              className="
                flex
                items-center
                gap-3
              "
            >

              <div
                className="
                  w-10
                  h-10
                  rounded-full
                  bg-white
                  shadow-md
                  flex
                  items-center
                  justify-center
                "
              >

                <img
                  src={logoImage}
                  className="
                    w-9
                    h-9
                    rounded-full
                    object-cover
                  "
                  alt="ECOMOW Logo"
                />

              </div>


              <span
                className="
                  font-bold
                  text-green-700
                  text-lg
                "
              >
                SOLAR MOWER
              </span>

            </Link>


            {/* =================================================
                DESKTOP NAVIGATION
            ================================================= */}

            <nav
              className="
                flex
                items-center
                gap-8
                font-semibold
                text-sm
              "
            >

              {/* HOME */}

              <Link
                to="/app"
                className={`transition ${
                  isActive(".")
                    ? "text-green-700 border-b-2 border-green-600 pb-1"
                    : "text-gray-600 hover:text-green-700"
                }`}
              >
                HOME
              </Link>


              {/* SCHEDULE */}

              <Link
                to="/app/schedule"
                className={`transition ${
                  isActive("schedule")
                    ? "text-green-700 border-b-2 border-green-600 pb-1"
                    : "text-gray-600 hover:text-green-700"
                }`}
              >
                SCHEDULE
              </Link>


              {/* DASHBOARD */}

              <Link
                to="/app/energy"
                className={`transition ${
                  isActive("energy")
                    ? "text-green-700 border-b-2 border-green-600 pb-1"
                    : "text-gray-600 hover:text-green-700"
                }`}
              >
                DASHBOARD
              </Link>


              {/* NOTIFICATIONS */}

              <button
                type="button"
                onClick={
                  openNotifications
                }
                className="
                  relative
                  flex
                  items-center
                  justify-center
                  w-10
                  h-10
                  rounded-full
                  bg-white/80
                  hover:bg-white
                  shadow-sm
                  transition
                  active:scale-95
                  cursor-pointer
                "
                aria-label="Open notifications"
              >

                <Bell
                  size={21}
                  strokeWidth={1.8}
                  className="
                    text-[#40513B]
                  "
                />


                {notificationCount > 0 && (

                  <span
                    className="
                      absolute
                      -top-1
                      -right-1
                      min-w-[18px]
                      h-[18px]
                      px-1
                      rounded-full
                      bg-red-500
                      text-white
                      text-[9px]
                      font-black
                      flex
                      items-center
                      justify-center
                      border-2
                      border-white
                      shadow-sm
                      pointer-events-none
                    "
                  >

                    {notificationCount > 99
                      ? "99+"
                      : notificationCount}

                  </span>

                )}

              </button>

            </nav>


            {/* =================================================
                RIGHT SIDE
            ================================================= */}

            <div
              className="
                flex
                items-center
                gap-3
              "
            >

              {/* =================================================
                  MOWER STATUS
              ================================================= */}

              <div
                className="
                  hidden
                  lg:flex
                  items-center
                  gap-2
                  px-3
                  py-2
                  bg-white/70
                  rounded-xl
                "
              >

                <span
                  className={`
                    w-2.5
                    h-2.5
                    rounded-full
                    ${
                      mowerOnline
                        ? "bg-green-500"
                        : "bg-red-500"
                    }
                  `}
                />


                <span
                  className="
                    text-xs
                    font-semibold
                    text-gray-600
                  "
                >
                  {mowerOnline
                    ? "ESP32 Connected"
                    : "ESP32 Offline"}
                </span>

              </div>


              {/* =================================================
                  LOGOUT
              ================================================= */}

              <button
                type="button"
                onClick={
                  handleLogout
                }
                className="
                  flex
                  items-center
                  gap-2
                  px-4
                  py-2
                  rounded-xl
                  bg-gray-700
                  hover:bg-gray-800
                  text-white
                  text-sm
                  font-semibold
                  transition
                "
              >

                <LogOut
                  size={16}
                />

                Logout

              </button>

            </div>

          </div>

        </div>

      </header>


      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <main
        className="
          relative
          z-10
          transition-all
          duration-200
        "
      >

        <div
          className="
            max-w-7xl
            mx-auto
            py-6
            px-4
          "
        >

          <Outlet />

        </div>

      </main>


      {/* =================================================
          MOBILE BOTTOM NAVIGATION
      ================================================= */}

      <nav
        className="
          md:hidden
          fixed
          bottom-6
          left-0
          right-0
          z-50
          flex
          justify-center
          px-3
          pointer-events-auto
        "
      >

        <div
          className="
            bg-white
            rounded-full
            shadow-2xl
            flex
            items-center
            justify-center
            px-4
            py-3
            gap-5
            border
            border-gray-100
            w-full
            max-w-[390px]
          "
        >

          {/* HOME */}

          <Link
            to="/app"
            className={`
              w-12
              h-12
              rounded-full
              flex
              items-center
              justify-center
              transition
              ${
                isActive(".")
                  ? "bg-gray-100"
                  : ""
              }
            `}
            aria-label="Home"
          >

            <Home
              size={24}
              strokeWidth={1.5}
              className={
                isActive(".")
                  ? "text-green-700"
                  : "text-gray-600"
              }
            />

          </Link>


          {/* SCHEDULE */}

          <Link
            to="/app/schedule"
            className={`
              w-12
              h-12
              rounded-full
              flex
              items-center
              justify-center
              transition
              ${
                isActive("schedule")
                  ? "bg-gray-100"
                  : ""
              }
            `}
            aria-label="Schedule"
          >

            <Calendar
              size={24}
              strokeWidth={1.5}
              className={
                isActive("schedule")
                  ? "text-green-700"
                  : "text-gray-600"
              }
            />

          </Link>


          {/* CONNECTION */}

          <button
            type="button"
            onClick={
              openConnect
            }
            className="
              relative
              w-16
              h-16
              -mt-8
              rounded-full
              bg-white
              flex
              items-center
              justify-center
              shadow-xl
              border-4
              border-gray-50
              transition
              hover:scale-105
              active:scale-95
              flex-shrink-0
              cursor-pointer
            "
            aria-label="Open ESP32 connection"
          >

            <Plus
              size={32}
              strokeWidth={1}
              className="
                text-gray-800
              "
            />


            {/* =================================================
                SMALL CONNECTION INDICATOR
            ================================================= */}

            <span
              className={`
                absolute
                top-1
                right-1
                w-3
                h-3
                rounded-full
                border-2
                border-white
                ${
                  mowerOnline
                    ? "bg-green-500"
                    : "bg-red-500"
                }
              `}
            />

          </button>


          {/* ENERGY */}

          <Link
            to="/app/energy"
            className={`
              w-12
              h-12
              rounded-full
              flex
              items-center
              justify-center
              transition
              ${
                isActive("energy")
                  ? "bg-gray-100"
                  : ""
              }
            `}
            aria-label="Energy dashboard"
          >

            <Zap
              size={24}
              strokeWidth={1.5}
              className={
                isActive("energy")
                  ? "text-green-700"
                  : "text-gray-600"
              }
            />

          </Link>


          {/* LOGOUT */}

          <button
            type="button"
            onClick={
              handleLogout
            }
            className="
              w-12
              h-12
              rounded-full
              flex
              items-center
              justify-center
              transition
              hover:bg-red-50
              active:scale-95
              cursor-pointer
            "
            aria-label="Logout"
          >

            <LogOut
              size={24}
              strokeWidth={1.5}
              className="
                text-red-500
              "
            />

          </button>

        </div>

      </nav>


      {/* =================================================
          ESP32 CONNECTION POPUP
      ================================================= */}

      {firebasePopup}

    </div>

  );

}