import React, { useEffect, useState, useCallback } from "react";
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
  Calendar,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
} from "firebase/firestore";

import { auth, db } from "../firebase";
import { onAuthStateChanged, User } from "firebase/auth";

type NotificationType = "warning" | "system" | "completed" | "error";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  createdAt: Timestamp;
  read: boolean;
}

export default function NotificationsScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [lastVisible, setLastVisible] =
    useState<QueryDocumentSnapshot | null>(null);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const lastNotifRef = React.useRef("");

  // =========================
  // AUTH
  // =========================
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsub();
  }, []);

  // =========================
  // REAL-TIME LISTENER
  // =========================
  const fetchNotifications = useCallback(() => {
    if (!user) {
      setLoading(false);
      return () => {};
    }

    setLoading(true);

    const q = query(
      collection(db, "users", user.uid, "notifications"),
      orderBy("createdAt", "desc"),
      limit(20)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Notification[];

        setNotifications(data);
        setLastVisible(snapshot.docs[snapshot.docs.length - 1] || null);
        setLoading(false);
      },
      (error) => {
        console.error("Realtime error:", error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const unsub = fetchNotifications();
    return () => unsub?.();
  }, [user, fetchNotifications]);

  // =========================
  // LOAD MORE (PAGINATION)
  // =========================
  const loadMore = async () => {
    if (!user || !lastVisible || loadingMore) return;

    setLoadingMore(true);

    try {
      const q = query(
        collection(db, "users", user.uid, "notifications"),
        orderBy("createdAt", "desc"),
        limit(20)
      );

      const snapshot = await getDocs(q);

      const more = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Notification[];

      setNotifications((prev) => [...prev, ...more]);
      setLastVisible(snapshot.docs[snapshot.docs.length - 1] || null);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingMore(false);
    }
  };

  // =========================
  // MARK AS READ
  // =========================
  const markAsRead = async (id: string) => {
    if (!user) return;

    try {
      await updateDoc(
        doc(db, "users", user.uid, "notifications", id),
        { read: true }
      );

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error(error);
    }
  };

  // =========================
  // MARK ALL AS READ (NO INDEX ERROR)
  // =========================
  const markAllAsRead = async () => {
    if (!user) return;

    const confirm = window.confirm("Mark all as read?");
    if (!confirm) return;

    setActionLoading("all");

    try {
      const unread = notifications.filter((n) => !n.read);

      const batch = writeBatch(db);

      unread.forEach((n) => {
        batch.update(
          doc(db, "users", user.uid, "notifications", n.id),
          { read: true }
        );
      });

      await batch.commit();

      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true }))
      );
    } catch (error) {
      console.error(error);
    } finally {
      setActionLoading(null);
    }
  };

  // =========================
  // DELETE SINGLE
  // =========================
  const removeNotification = async (id: string) => {
    if (!user) return;

    try {
      await deleteDoc(doc(db, "users", user.uid, "notifications", id));
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      console.error(error);
    }
  };

  // =========================
  // DELETE ALL
  // =========================
  const removeAllNotifications = async () => {
    if (!user) return;

    const confirm = window.confirm("Delete ALL notifications?");
    if (!confirm) return;

    setActionLoading("all_delete");

    try {
      const snapshot = await getDocs(
        collection(db, "users", user.uid, "notifications")
      );

      const batch = writeBatch(db);

      snapshot.docs.forEach((d) => {
        batch.delete(doc(db, "users", user.uid, "notifications", d.id));
      });

      await batch.commit();

      setNotifications([]);
    } catch (error) {
      console.error(error);
    } finally {
      setActionLoading(null);
    }
  };

  // =========================
  // EXPORT CSV
  // =========================
  const generateReport = () => {
    const headers = ["Title", "Description", "Type", "Status", "Date"];

    const rows = notifications.map((n) => [
      n.title,
      n.description,
      n.type,
      n.read ? "Read" : "Unread",
      n.createdAt?.toDate?.().toLocaleString() || "",
    ]);

    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "notifications.csv";
    a.click();
  };

  // =========================
  // UI
  // =========================
  const filtered =
    filter === "unread"
      ? notifications.filter((n) => !n.read)
      : notifications;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const iconMap = {
    completed: <CheckCircle className="text-green-500 w-5 h-5" />,
    warning: <AlertTriangle className="text-yellow-500 w-5 h-5" />,
    error: <WifiOff className="text-red-500 w-5 h-5" />,
    system: <AlertCircle className="text-blue-500 w-5 h-5" />,
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin w-8 h-8 border-b-2 border-green-600 rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-black">Notifications</h1>

        <div className="flex gap-2">
          <button onClick={generateReport}>
            <FileDown />
          </button>

          <button onClick={markAllAsRead} disabled={!unreadCount}>
            <CheckCheck />
          </button>

          <button onClick={removeAllNotifications}>
            <Trash2 />
          </button>
        </div>
      </div>

      {/* FILTER */}
      <div className="flex gap-4 mb-4">
        <button onClick={() => setFilter("all")}>
          All ({notifications.length})
        </button>
        <button onClick={() => setFilter("unread")}>
          Unread ({unreadCount})
        </button>
      </div>

      {/* LIST */}
      <div className="space-y-3">
        <AnimatePresence>
          {filtered.map((n) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-xl border flex justify-between ${
                n.read ? "bg-white" : "bg-blue-50"
              }`}
            >
              <div onClick={() => markAsRead(n.id)}>
                <div className="flex gap-2 items-center">
                  {iconMap[n.type]}
                  <b>{n.title}</b>
                </div>
                <p className="text-sm text-gray-500">
                  {n.description}
                </p>
              </div>

              <button onClick={() => removeNotification(n.id)}>
                <Trash2 size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* LOAD MORE */}
      {lastVisible && (
        <button
          onClick={loadMore}
          className="mt-6 w-full py-2 bg-gray-100 rounded-xl"
        >
          Load More
        </button>
      )}
    </div>
  );
}