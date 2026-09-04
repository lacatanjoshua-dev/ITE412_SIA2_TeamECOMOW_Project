import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  WifiOff,
  Trash2,
  FileDown,
  Inbox,
  CheckCheck,
  RefreshCw,
} from "lucide-react";

import {
  motion,
  AnimatePresence,
} from "framer-motion";

import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  writeBatch,
  Timestamp,
  QueryDocumentSnapshot,
  DocumentData,
  startAfter,
} from "firebase/firestore";

import {
  auth,
  db,
} from "../firebase";

import {
  onAuthStateChanged,
  User,
} from "firebase/auth";

import { Capacitor } from "@capacitor/core";

import {
  Filesystem,
  Directory,
} from "@capacitor/filesystem";

import {
  Share,
} from "@capacitor/share";


// =====================================================
// TYPES
// =====================================================

type NotificationType =
  | "warning"
  | "system"
  | "completed"
  | "error";

interface Notification {
  id: string;

  type: NotificationType;

  title: string;

  description: string;

  createdAt?: Timestamp | null;

  read: boolean;
}


// =====================================================
// PAGE SIZE
// =====================================================

const PAGE_SIZE = 20;


// =====================================================
// TEXT TO BASE64
//
// Used for Android / Capacitor CSV export.
// This version supports Unicode characters.
// =====================================================

const textToBase64 = (
  text: string
): string => {

  const bytes =
    new TextEncoder().encode(text);

  let binary = "";

  const chunkSize = 0x8000;

  for (
    let i = 0;
    i < bytes.length;
    i += chunkSize
  ) {

    const chunk =
      bytes.subarray(
        i,
        i + chunkSize
      );

    binary += String.fromCharCode(
      ...chunk
    );
  }

  return btoa(binary);
};


// =====================================================
// COMPONENT
// =====================================================

export default function NotificationsScreen() {

  // ===================================================
  // USER
  // ===================================================

  const [
    user,
    setUser,
  ] = useState<User | null>(null);


  // ===================================================
  // NOTIFICATIONS
  // ===================================================

  const [
    notifications,
    setNotifications,
  ] = useState<Notification[]>([]);


  // ===================================================
  // PAGINATION
  // ===================================================

  const [
    lastVisible,
    setLastVisible,
  ] =
    useState<
      QueryDocumentSnapshot<DocumentData> | null
    >(null);

  const [
    hasMore,
    setHasMore,
  ] = useState(false);


  // ===================================================
  // FILTER
  // ===================================================

  const [
    filter,
    setFilter,
  ] =
    useState<
      "all" | "unread"
    >("all");


  // ===================================================
  // LOADING
  // ===================================================

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    loadingMore,
    setLoadingMore,
  ] = useState(false);


  // ===================================================
  // ACTION LOADING
  // ===================================================

  const [
    actionLoading,
    setActionLoading,
  ] =
    useState<string | null>(null);


  // ===================================================
  // AUTH LISTENER
  // ===================================================

  useEffect(() => {

    console.log(
      "NotificationsScreen: starting auth listener..."
    );

    const unsubscribe =
      onAuthStateChanged(
        auth,
        (currentUser) => {

          console.log(
            "NotificationsScreen user:",
            currentUser?.email ||
              "No user"
          );

          console.log(
            "NotificationsScreen UID:",
            currentUser?.uid ||
              "No UID"
          );

          setUser(
            currentUser
          );

        }
      );


    return () => {

      console.log(
        "NotificationsScreen: stopping auth listener..."
      );

      unsubscribe();

    };

  }, []);


  // ===================================================
  // FETCH NOTIFICATIONS
  // ===================================================

  const fetchNotifications =
    useCallback(() => {

      // ===============================================
      // NO USER
      // ===============================================

      if (!user) {

        console.log(
          "NotificationsScreen: no authenticated user."
        );

        setNotifications([]);

        setLastVisible(null);

        setHasMore(false);

        setLoading(false);

        return () => {};

      }


      // ===============================================
      // LOGGING
      // ===============================================

      console.log(
        "=========================================="
      );

      console.log(
        "STARTING NOTIFICATIONS SCREEN"
      );

      console.log(
        "USER:",
        user.email
      );

      console.log(
        "UID:",
        user.uid
      );

      console.log(
        "PATH:",
        `users/${user.uid}/notifications`
      );

      console.log(
        "=========================================="
      );


      setLoading(true);


      // ===============================================
      // FIRESTORE COLLECTION
      // ===============================================

      const notificationsRef =
        collection(
          db,
          "users",
          user.uid,
          "notifications"
        );


      // ===============================================
      // QUERY
      // ===============================================

      const q =
        query(
          notificationsRef,

          orderBy(
            "createdAt",
            "desc"
          ),

          limit(
            PAGE_SIZE
          )
        );


      // ===============================================
      // REAL-TIME LISTENER
      // ===============================================

      const unsubscribe =
        onSnapshot(

          q,

          (snapshot) => {

            console.log(
              "=========================================="
            );

            console.log(
              "NOTIFICATIONS SNAPSHOT"
            );

            console.log(
              "DOCUMENTS:",
              snapshot.size
            );

            console.log(
              "=========================================="
            );


            // =========================================
            // MAP DATA
            // =========================================

            const data =
              snapshot.docs.map(
                (
                  notificationDoc
                ) => {

                  const raw =
                    notificationDoc.data();


                  return {

                    id:
                      notificationDoc.id,

                    type:
                      (
                        raw.type ||
                        "system"
                      ) as NotificationType,

                    title:
                      String(
                        raw.title ||
                        "Notification"
                      ),

                    description:
                      String(
                        raw.description ||
                        ""
                      ),

                    createdAt:
                      raw.createdAt ||
                      null,

                    read:
                      raw.read === true,

                  };

                }
              );


            // =========================================
            // UPDATE STATE
            // =========================================

            setNotifications(
              data
            );


            // =========================================
            // LAST DOCUMENT
            // =========================================

            const last =
              snapshot.docs[
                snapshot.docs.length - 1
              ] || null;


            setLastVisible(
              last
            );


            // =========================================
            // MORE AVAILABLE
            // =========================================

            setHasMore(
              snapshot.size ===
                PAGE_SIZE
            );


            setLoading(
              false
            );

          },

          (error) => {

            console.error(
              "=========================================="
            );

            console.error(
              "NOTIFICATIONS REALTIME ERROR"
            );

            console.error(
              error
            );

            console.error(
              "=========================================="
            );


            setNotifications([]);

            setLastVisible(null);

            setHasMore(false);

            setLoading(false);

          }
        );


      // ===============================================
      // CLEANUP
      // ===============================================

      return unsubscribe;

    }, [user]);


  // ===================================================
  // START REALTIME LISTENER
  // ===================================================

  useEffect(() => {

    const unsubscribe =
      fetchNotifications();


    return () => {

      unsubscribe?.();

    };

  }, [
    fetchNotifications,
  ]);


  // ===================================================
  // REFRESH
  // ===================================================

  const refreshNotifications =
    () => {

      console.log(
        "Refreshing notifications..."
      );


      setLoading(true);


      setTimeout(() => {

        setLoading(false);

      }, 300);

    };


  // ===================================================
  // LOAD MORE
  // ===================================================

  const loadMore =
    async () => {

      if (
        !user ||
        !lastVisible ||
        loadingMore ||
        !hasMore
      ) {

        return;

      }


      console.log(
        "Loading more notifications..."
      );


      setLoadingMore(true);


      try {

        // =============================================
        // COLLECTION
        // =============================================

        const notificationsRef =
          collection(
            db,
            "users",
            user.uid,
            "notifications"
          );


        // =============================================
        // QUERY
        // =============================================

        const q =
          query(

            notificationsRef,

            orderBy(
              "createdAt",
              "desc"
            ),

            startAfter(
              lastVisible
            ),

            limit(
              PAGE_SIZE
            )

          );


        // =============================================
        // FETCH
        // =============================================

        const snapshot =
          await getDocs(q);


        console.log(
          "Loaded additional notifications:",
          snapshot.size
        );


        // =============================================
        // MAP
        // =============================================

        const more =
          snapshot.docs.map(
            (
              notificationDoc
            ) => {

              const raw =
                notificationDoc.data();


              return {

                id:
                  notificationDoc.id,

                type:
                  (
                    raw.type ||
                    "system"
                  ) as NotificationType,

                title:
                  String(
                    raw.title ||
                    "Notification"
                  ),

                description:
                  String(
                    raw.description ||
                    ""
                  ),

                createdAt:
                  raw.createdAt ||
                  null,

                read:
                  raw.read === true,

              };

            }
          );


        // =============================================
        // ADD UNIQUE
        // =============================================

        setNotifications(
          (previous) => {

            const existingIds =
              new Set(
                previous.map(
                  (item) =>
                    item.id
                )
              );


            const uniqueMore =
              more.filter(
                (item) =>
                  !existingIds.has(
                    item.id
                  )
              );


            return [
              ...previous,
              ...uniqueMore,
            ];

          }
        );


        // =============================================
        // NEW LAST DOCUMENT
        // =============================================

        const newLast =
          snapshot.docs[
            snapshot.docs.length - 1
          ] || null;


        setLastVisible(
          newLast
        );


        // =============================================
        // MORE?
        // =============================================

        setHasMore(
          snapshot.size ===
            PAGE_SIZE
        );

      } catch (error) {

        console.error(
          "Load more notifications error:",
          error
        );

      } finally {

        setLoadingMore(false);

      }

    };


  // ===================================================
  // MARK AS READ
  // ===================================================

  const markAsRead =
    async (
      id: string
    ) => {

      if (!user) {
        return;
      }


      try {

        console.log(
          "Marking notification as read:",
          id
        );


        await updateDoc(

          doc(
            db,
            "users",
            user.uid,
            "notifications",
            id
          ),

          {
            read: true,
          }

        );


        setNotifications(
          (previous) =>
            previous.map(
              (notification) =>
                notification.id ===
                id
                  ? {
                      ...notification,
                      read: true,
                    }
                  : notification
            )
        );

      } catch (error) {

        console.error(
          "Mark as read error:",
          error
        );

      }

    };


  // ===================================================
  // MARK ALL AS READ
  // ===================================================

  const markAllAsRead =
    async () => {

      if (!user) {
        return;
      }


      const unread =
        notifications.filter(
          (notification) =>
            !notification.read
        );


      if (
        unread.length ===
        0
      ) {

        return;

      }


      const confirmed =
        window.confirm(
          "Mark all notifications as read?"
        );


      if (!confirmed) {
        return;
      }


      setActionLoading(
        "mark-all"
      );


      try {

        const batch =
          writeBatch(db);


        unread.forEach(
          (notification) => {

            batch.update(

              doc(
                db,
                "users",
                user.uid,
                "notifications",
                notification.id
              ),

              {
                read: true,
              }

            );

          }
        );


        await batch.commit();


        setNotifications(
          (previous) =>
            previous.map(
              (notification) => ({
                ...notification,
                read: true,
              })
            )
        );


      } catch (error) {

        console.error(
          "Mark all as read error:",
          error
        );

      } finally {

        setActionLoading(
          null
        );

      }

    };


  // ===================================================
  // DELETE SINGLE
  // ===================================================

  const removeNotification =
    async (
      id: string
    ) => {

      if (!user) {
        return;
      }


      try {

        console.log(
          "Deleting notification:",
          id
        );


        await deleteDoc(

          doc(
            db,
            "users",
            user.uid,
            "notifications",
            id
          )

        );


        setNotifications(
          (previous) =>
            previous.filter(
              (notification) =>
                notification.id !==
                id
            )
        );


      } catch (error) {

        console.error(
          "Delete notification error:",
          error
        );

      }

    };


  // ===================================================
  // DELETE ALL
  // ===================================================

  const removeAllNotifications =
    async () => {

      if (!user) {
        return;
      }


      if (
        notifications.length ===
        0
      ) {

        return;

      }


      const confirmed =
        window.confirm(
          "Delete ALL notifications?"
        );


      if (!confirmed) {
        return;
      }


      setActionLoading(
        "delete-all"
      );


      try {

        const snapshot =
          await getDocs(

            collection(
              db,
              "users",
              user.uid,
              "notifications"
            )

          );


        const batch =
          writeBatch(db);


        snapshot.docs.forEach(
          (
            notificationDoc
          ) => {

            batch.delete(
              notificationDoc.ref
            );

          }
        );


        await batch.commit();


        setNotifications([]);

        setLastVisible(null);

        setHasMore(false);


      } catch (error) {

        console.error(
          "Delete all notifications error:",
          error
        );

      } finally {

        setActionLoading(
          null
        );

      }

    };


  // ===================================================
  // GENERATE CSV REPORT
  // ===================================================

  const generateReport =
    async () => {

      // ===============================================
      // CHECK NOTIFICATIONS
      // ===============================================

      if (
        notifications.length ===
        0
      ) {

        console.log(
          "No notifications to export."
        );

        return;

      }


      try {

        console.log(
          "=========================================="
        );

        console.log(
          "STARTING NOTIFICATION EXPORT"
        );

        console.log(
          "PLATFORM:",
          Capacitor.getPlatform()
        );

        console.log(
          "NOTIFICATION COUNT:",
          notifications.length
        );

        console.log(
          "=========================================="
        );


        // =============================================
        // HEADERS
        // =============================================

        const headers = [
          "Title",
          "Description",
          "Type",
          "Status",
          "Date",
        ];


        // =============================================
        // ESCAPE CSV
        // =============================================

        const escapeCsv =
          (value: string) => {

            const safe =
              String(value)

                .replace(
                  /\r?\n|\r/g,
                  " "
                )

                .replace(
                  /"/g,
                  '""'
                );


            return `"${safe}"`;

          };


        // =============================================
        // ROWS
        // =============================================

        const rows =
          notifications.map(
            (
              notification
            ) => {

              const date =
                notification
                  .createdAt
                  ?.toDate

                  ? notification
                      .createdAt
                      .toDate()
                      .toLocaleString()

                  : "";


              return [

                escapeCsv(
                  notification.title
                ),

                escapeCsv(
                  notification.description
                ),

                escapeCsv(
                  notification.type
                ),

                escapeCsv(
                  notification.read
                    ? "Read"
                    : "Unread"
                ),

                escapeCsv(
                  date
                ),

              ];

            }
          );


        // =============================================
        // CSV STRING
        // =============================================

        const csv = [

          headers
            .map(escapeCsv)
            .join(","),

          ...rows.map(
            (row) =>
              row.join(",")
          ),

        ].join("\r\n");


        // =============================================
        // GET PLATFORM
        // =============================================

        const platform =
          Capacitor.getPlatform();


        // =============================================
        // ANDROID / IOS
        // =============================================

        if (
          platform ===
            "android" ||
          platform ===
            "ios"
        ) {

          console.log(
            "Mobile platform detected."
          );

          console.log(
            "Creating CSV using Capacitor Filesystem..."
          );


          // ===========================================
          // BASE64
          // ===========================================

          const base64Data =
            textToBase64(csv);


          // ===========================================
          // FILE NAME
          // ===========================================

          const fileName =
            `ecomow-notifications-${Date.now()}.csv`;


          // ===========================================
          // WRITE FILE
          // ===========================================

          const result =
            await Filesystem.writeFile({

              path:
                fileName,

              data:
                base64Data,

              directory:
                Directory.Cache,

            });


          console.log(
            "CSV file created successfully:"
          );

          console.log(
            result.uri
          );


          // ===========================================
          // CHECK SHARE
          // ===========================================

          const canShare =
            await Share.canShare();


          console.log(
            "Share available:",
            canShare.value
          );


          // ===========================================
          // OPEN SHARE / SAVE
          // ===========================================

          if (
            canShare.value
          ) {

            await Share.share({

              title:
                "ECOMOW Notifications",

              text:
                "ECOMOW notification report",

              url:
                result.uri,

              dialogTitle:
                "Save or share notification report",

            });


            console.log(
              "Share dialog opened."
            );

          } else {

            alert(
              "The notification report was created, but the Android share/save dialog is not available."
            );

          }


          return;

        }


        // =============================================
        // DESKTOP / WEB BROWSER
        // =============================================

        console.log(
          "Browser platform detected."
        );

        console.log(
          "Starting normal CSV download..."
        );


        const blob =
          new Blob(

            [csv],

            {
              type:
                "text/csv;charset=utf-8;",
            }

          );


        const url =
          URL.createObjectURL(
            blob
          );


        const link =
          document.createElement(
            "a"
          );


        link.href =
          url;


        link.download =
          "ecomow-notifications.csv";


        link.style.display =
          "none";


        document.body.appendChild(
          link
        );


        link.click();


        document.body.removeChild(
          link
        );


        setTimeout(
          () => {

            URL.revokeObjectURL(
              url
            );

          },
          1000
        );


        console.log(
          "Browser CSV download started."
        );


      } catch (error) {

        console.error(
          "=========================================="
        );

        console.error(
          "NOTIFICATION EXPORT ERROR"
        );

        console.error(
          error
        );

        console.error(
          "=========================================="
        );


        alert(
          "Failed to export notifications. Please try again."
        );

      }

    };


  // ===================================================
  // COUNTS
  // ===================================================

  const unreadCount =
    notifications.filter(
      (notification) =>
        !notification.read
    ).length;


  // ===================================================
  // FILTERED NOTIFICATIONS
  // ===================================================

  const filtered =
    filter === "unread"

      ? notifications.filter(
          (notification) =>
            !notification.read
        )

      : notifications;


  // ===================================================
  // ICON
  // ===================================================

  const getIcon =
    (
      type: NotificationType
    ) => {

      switch (type) {

        case "completed":

          return (
            <CheckCircle
              className="
                text-green-500
                w-6
                h-6
              "
            />
          );


        case "warning":

          return (
            <AlertTriangle
              className="
                text-yellow-500
                w-6
                h-6
              "
            />
          );


        case "error":

          return (
            <WifiOff
              className="
                text-red-500
                w-6
                h-6
              "
            />
          );


        case "system":

        default:

          return (
            <AlertCircle
              className="
                text-blue-500
                w-6
                h-6
              "
            />
          );

      }

    };


  // ===================================================
  // DATE
  // ===================================================

  const formatDate =
    (
      timestamp?: Timestamp | null
    ) => {

      if (
        !timestamp ||
        !timestamp.toDate
      ) {

        return "Date unavailable";

      }


      try {

        return timestamp
          .toDate()
          .toLocaleString();

      } catch {

        return "Date unavailable";

      }

    };


  // ===================================================
  // LOADING SCREEN
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
            bg-white/90
            backdrop-blur-xl
            rounded-3xl
            shadow-xl
            px-8
            py-7
            text-center
          "
        >

          <div
            className="
              w-10
              h-10
              mx-auto
              border-4
              border-green-100
              border-t-green-600
              rounded-full
              animate-spin
            "
          />


          <p
            className="
              mt-4
              font-bold
              text-gray-700
            "
          >
            Loading notifications...
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
        max-w-5xl
        mx-auto
        px-1
        sm:px-2
        pb-8
      "
    >

      {/* =================================================
          HEADER
      ================================================= */}

      <div
        className="
          bg-white/90
          backdrop-blur-xl
          rounded-3xl
          shadow-xl
          border
          border-white
          p-5
          sm:p-6
          mb-5
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
          "
        >

          {/* =============================================
              TITLE
          ============================================= */}

          <div
            className="
              flex
              items-center
              gap-3
            "
          >

            <div
              className="
                w-12
                h-12
                rounded-2xl
                bg-green-100
                flex
                items-center
                justify-center
              "
            >

              <Inbox
                className="
                  text-green-700
                "
                size={25}
              />

            </div>


            <div>

              <h1
                className="
                  text-2xl
                  sm:text-3xl
                  font-black
                  text-[#40513B]
                "
              >
                Notifications
              </h1>


              <p
                className="
                  text-sm
                  text-gray-500
                  mt-1
                "
              >

                {unreadCount > 0

                  ? `${unreadCount} unread notification${
                      unreadCount > 1
                        ? "s"
                        : ""
                    }`

                  : "You're all caught up"}

              </p>

            </div>

          </div>


          {/* =============================================
              ACTION BUTTONS
          ============================================= */}

          <div
            className="
              flex
              items-center
              gap-2
              flex-wrap
            "
          >

            {/* =========================================
                REFRESH
            ========================================= */}

            <button
              type="button"
              onClick={
                refreshNotifications
              }
              className="
                w-10
                h-10
                rounded-xl
                bg-gray-100
                hover:bg-gray-200
                flex
                items-center
                justify-center
                transition
              "
              title="Refresh"
              aria-label="Refresh notifications"
            >

              <RefreshCw
                size={18}
              />

            </button>


            {/* =========================================
                EXPORT
            ========================================= */}

            <button
              type="button"
              onClick={
                generateReport
              }
              disabled={
                notifications.length ===
                0
              }
              className="
                w-10
                h-10
                rounded-xl
                bg-gray-100
                hover:bg-gray-200
                disabled:opacity-40
                flex
                items-center
                justify-center
                transition
              "
              title="Export CSV"
              aria-label="Export notifications"
            >

              <FileDown
                size={18}
              />

            </button>


            {/* =========================================
                MARK ALL
            ========================================= */}

            <button
              type="button"
              onClick={
                markAllAsRead
              }
              disabled={
                unreadCount === 0 ||
                actionLoading ===
                  "mark-all"
              }
              className="
                w-10
                h-10
                rounded-xl
                bg-green-100
                text-green-700
                hover:bg-green-200
                disabled:opacity-40
                flex
                items-center
                justify-center
                transition
              "
              title="Mark all as read"
              aria-label="Mark all as read"
            >

              {actionLoading ===
              "mark-all" ? (

                <RefreshCw
                  size={18}
                  className="
                    animate-spin
                  "
                />

              ) : (

                <CheckCheck
                  size={18}
                />

              )}

            </button>


            {/* =========================================
                DELETE ALL
            ========================================= */}

            <button
              type="button"
              onClick={
                removeAllNotifications
              }
              disabled={
                notifications.length ===
                  0 ||
                actionLoading ===
                  "delete-all"
              }
              className="
                w-10
                h-10
                rounded-xl
                bg-red-100
                text-red-600
                hover:bg-red-200
                disabled:opacity-40
                flex
                items-center
                justify-center
                transition
              "
              title="Delete all"
              aria-label="Delete all notifications"
            >

              {actionLoading ===
              "delete-all" ? (

                <RefreshCw
                  size={18}
                  className="
                    animate-spin
                  "
                />

              ) : (

                <Trash2
                  size={18}
                />

              )}

            </button>

          </div>

        </div>


        {/* =================================================
            FILTER
        ================================================= */}

        <div
          className="
            flex
            gap-2
            mt-5
            overflow-x-auto
          "
        >

          {/* ALL */}

          <button
            type="button"
            onClick={() =>
              setFilter("all")
            }
            className={`
              px-4
              py-2
              rounded-xl
              text-sm
              font-bold
              whitespace-nowrap
              transition
              ${
                filter === "all"
                  ? "bg-green-700 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }
            `}
          >

            All (
              {notifications.length}
            )

          </button>


          {/* UNREAD */}

          <button
            type="button"
            onClick={() =>
              setFilter("unread")
            }
            className={`
              px-4
              py-2
              rounded-xl
              text-sm
              font-bold
              whitespace-nowrap
              transition
              ${
                filter === "unread"
                  ? "bg-green-700 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }
            `}
          >

            Unread (
              {unreadCount}
            )

          </button>

        </div>

      </div>


      {/* =================================================
          EMPTY STATE
      ================================================= */}

      {filtered.length ===
      0 ? (

        <motion.div
          initial={{
            opacity: 0,
            y: 10,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="
            bg-white/90
            backdrop-blur-xl
            rounded-3xl
            shadow-xl
            border
            border-white
            p-10
            text-center
          "
        >

          <div
            className="
              w-16
              h-16
              mx-auto
              rounded-2xl
              bg-gray-100
              flex
              items-center
              justify-center
              mb-4
            "
          >

            <Inbox
              className="
                text-gray-400
              "
              size={30}
            />

          </div>


          <h2
            className="
              text-xl
              font-black
              text-gray-700
            "
          >

            {filter === "unread"

              ? "No unread notifications"

              : "No notifications"}

          </h2>


          <p
            className="
              text-sm
              text-gray-500
              mt-2
            "
          >

            {filter === "unread"

              ? "All your notifications have been read."

              : "You don't have any notifications yet."}

          </p>

        </motion.div>

      ) : (

        /* =================================================
           NOTIFICATION LIST
        ================================================= */

        <div
          className="
            space-y-3
          "
        >

          <AnimatePresence>

            {filtered.map(
              (
                notification
              ) => (

                <motion.div
                  key={
                    notification.id
                  }

                  initial={{
                    opacity: 0,
                    y: 10,
                  }}

                  animate={{
                    opacity: 1,
                    y: 0,
                  }}

                  exit={{
                    opacity: 0,
                    x: -20,
                  }}

                  layout

                  className={`
                    bg-white/95
                    backdrop-blur-xl
                    rounded-2xl
                    shadow-md
                    border
                    p-4
                    sm:p-5
                    transition
                    ${
                      notification.read

                        ? "border-gray-100"

                        : "border-blue-200 bg-blue-50/90"
                    }
                  `}
                >

                  <div
                    className="
                      flex
                      gap-4
                      items-start
                    "
                  >

                    {/* ===================================
                        ICON
                    =================================== */}

                    <div
                      className="
                        w-11
                        h-11
                        rounded-xl
                        bg-white
                        shadow-sm
                        flex
                        items-center
                        justify-center
                        flex-shrink-0
                      "
                    >

                      {getIcon(
                        notification.type
                      )}

                    </div>


                    {/* ===================================
                        CONTENT
                    =================================== */}

                    <div
                      className="
                        flex-1
                        min-w-0
                        cursor-pointer
                      "
                      onClick={() => {

                        if (
                          !notification.read
                        ) {

                          markAsRead(
                            notification.id
                          );

                        }

                      }}
                    >

                      <div
                        className="
                          flex
                          flex-wrap
                          items-center
                          gap-2
                        "
                      >

                        <h3
                          className="
                            font-black
                            text-gray-800
                          "
                        >

                          {
                            notification.title
                          }

                        </h3>


                        {/* NEW BADGE */}

                        {!notification.read && (

                          <span
                            className="
                              px-2
                              py-0.5
                              rounded-full
                              bg-blue-100
                              text-blue-700
                              text-[10px]
                              font-black
                              uppercase
                            "
                          >
                            New
                          </span>

                        )}

                      </div>


                      <p
                        className="
                          text-sm
                          text-gray-600
                          mt-1
                          leading-relaxed
                        "
                      >

                        {
                          notification.description
                        }

                      </p>


                      <p
                        className="
                          text-xs
                          text-gray-400
                          mt-3
                        "
                      >

                        {formatDate(
                          notification.createdAt
                        )}

                      </p>

                    </div>


                    {/* ===================================
                        DELETE
                    =================================== */}

                    <button
                      type="button"
                      onClick={() =>
                        removeNotification(
                          notification.id
                        )
                      }
                      className="
                        w-9
                        h-9
                        rounded-xl
                        flex
                        items-center
                        justify-center
                        text-gray-400
                        hover:text-red-600
                        hover:bg-red-50
                        transition
                        flex-shrink-0
                      "
                      title="Delete notification"
                      aria-label="Delete notification"
                    >

                      <Trash2
                        size={17}
                      />

                    </button>

                  </div>

                </motion.div>

              )
            )}

          </AnimatePresence>

        </div>

      )}


      {/* =================================================
          LOAD MORE
      ================================================= */}

      {hasMore && (

        <button
          type="button"
          onClick={
            loadMore
          }
          disabled={
            loadingMore
          }
          className="
            mt-6
            w-full
            py-3
            rounded-2xl
            bg-white/90
            hover:bg-white
            shadow-md
            border
            border-gray-100
            text-gray-700
            font-bold
            transition
            disabled:opacity-50
            flex
            items-center
            justify-center
            gap-2
          "
        >

          {loadingMore ? (

            <>

              <RefreshCw
                size={17}
                className="
                  animate-spin
                "
              />

              Loading...

            </>

          ) : (

            "Load More"

          )}

        </button>

      )}

    </div>

  );

}