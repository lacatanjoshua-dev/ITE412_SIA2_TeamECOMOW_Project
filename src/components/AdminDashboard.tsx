import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

import {
  signOut,
} from "firebase/auth";

import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  User,
  Tractor,
  AlertCircle,
  LogOut,
  ShieldCheck,
  Users,
  ClipboardList,
  Menu,
  X,
} from "lucide-react";

import { db, auth } from "../firebase";

// =====================================================
// TYPES
// =====================================================

interface ReservationRequest {
  id: string;

  userId: string;

  userEmail: string;

  mowerId: string;

  mowerName: string;

  rentalDate: string;

  startTime: string;

  endTime: string;

  durationHours: number;

  status:
    | "pending"
    | "approved"
    | "rejected"
    | "cancelled"
    | "completed";

  createdAt?: any;

  reviewedAt?: any;
}

// =====================================================
// ADMIN DASHBOARD
// =====================================================

export default function AdminDashboard() {
  const navigate = useNavigate();

  // ===================================================
  // STATE
  // ===================================================

  const [requests, setRequests] = useState<
    ReservationRequest[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [processingId, setProcessingId] =
    useState<string | null>(null);

  const [message, setMessage] =
    useState<string | null>(null);

  const [loggingOut, setLoggingOut] =
    useState(false);

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  // ===================================================
  // LOAD REQUESTS
  // ===================================================

  const loadRequests = async () => {
    try {
      setLoading(true);
      setMessage(null);

      const requestsRef = collection(
        db,
        "rentalRequests"
      );

      const q = query(
        requestsRef,
        orderBy("createdAt", "desc")
      );

      const snapshot =
        await getDocs(q);

      const data: ReservationRequest[] =
        snapshot.docs.map((item) => ({
          id: item.id,
          ...(item.data() as Omit<
            ReservationRequest,
            "id"
          >),
        }));

      setRequests(data);
    } catch (error) {
      console.error(
        "Failed to load schedule requests:",
        error
      );

      setMessage(
        "Failed to load schedule requests. Please check your Firestore data and rules."
      );
    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {
    loadRequests();
  }, []);

  // ===================================================
  // LOGOUT
  // ===================================================

  const handleLogout = async () => {
    try {
      setLoggingOut(true);

      await signOut(auth);

      localStorage.removeItem("userId");

      navigate("/login", {
        replace: true,
      });
    } catch (error) {
      console.error(
        "Logout error:",
        error
      );

      setMessage(
        "Failed to logout. Please try again."
      );

      setLoggingOut(false);
    }
  };

  // ===================================================
  // UPDATE REQUEST STATUS
  // ===================================================

  const updateRequestStatus = async (
    requestId: string,
    status: "approved" | "rejected"
  ) => {
    try {
      setProcessingId(requestId);
      setMessage(null);

      const requestRef = doc(
        db,
        "rentalRequests",
        requestId
      );

      await updateDoc(requestRef, {
        status,
        reviewedAt:
          serverTimestamp(),
      });

      setRequests((previous) =>
        previous.map((request) =>
          request.id === requestId
            ? {
                ...request,
                status,
              }
            : request
        )
      );

      if (status === "approved") {
        setMessage(
          "Schedule approved successfully."
        );
      } else {
        setMessage(
          "Schedule rejected successfully."
        );
      }
    } catch (error) {
      console.error(
        "Failed to update schedule:",
        error
      );

      setMessage(
        "Failed to update schedule request."
      );
    } finally {
      setProcessingId(null);
    }
  };

  // ===================================================
  // STATUS STYLE
  // ===================================================

  const getStatusStyle = (
    status: ReservationRequest["status"]
  ) => {
    switch (status) {
      case "approved":
        return "bg-green-50 text-green-700 border-green-200";

      case "rejected":
        return "bg-red-50 text-red-700 border-red-200";

      case "cancelled":
        return "bg-gray-50 text-gray-600 border-gray-200";

      case "completed":
        return "bg-blue-50 text-blue-700 border-blue-200";

      default:
        return "bg-amber-50 text-amber-700 border-amber-200";
    }
  };

  // ===================================================
  // STATISTICS
  // ===================================================

  const pendingCount =
    requests.filter(
      (request) =>
        request.status === "pending"
    ).length;

  const approvedCount =
    requests.filter(
      (request) =>
        request.status === "approved"
    ).length;

  const rejectedCount =
    requests.filter(
      (request) =>
        request.status === "rejected"
    ).length;

  // ===================================================
  // LOADING
  // ===================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F6F8F3] flex items-center justify-center px-5">

        <div className="bg-white rounded-[2rem] p-10 shadow-xl border border-[#E5D9B6]/60 text-center max-w-sm w-full">

          <div className="w-16 h-16 rounded-2xl bg-[#628141]/10 flex items-center justify-center mx-auto mb-5">

            <div className="w-8 h-8 border-4 border-[#628141]/20 border-t-[#628141] rounded-full animate-spin" />

          </div>

          <h2 className="text-lg font-black text-[#40513B]">
            Loading Admin Dashboard
          </h2>

          <p className="text-sm text-[#6D7C66] mt-2">
            Checking schedule requests...
          </p>

        </div>

      </div>
    );
  }

  // ===================================================
  // UI
  // ===================================================

  return (
    <div className="min-h-screen bg-[#F6F8F3]">

      {/* =================================================
          TOP NAVIGATION
      ================================================= */}

      <header className="sticky top-0 z-50 bg-[#40513B] text-white shadow-lg">

        <div className="max-w-[1500px] mx-auto px-5 sm:px-8">

          <div className="h-[76px] flex items-center justify-between">

            {/* BRAND */}

            <div className="flex items-center gap-3">

              <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center">

                <ShieldCheck
                  size={24}
                  className="text-[#E5D9B6]"
                />

              </div>

              <div>

                <h1 className="text-lg sm:text-xl font-black tracking-tight">
                  ECOMOW
                </h1>

                <p className="text-[9px] uppercase tracking-[2px] text-white/60 font-bold">
                  Administration
                </p>

              </div>

            </div>

            {/* DESKTOP ACTIONS */}

            <div className="hidden md:flex items-center gap-3">

              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/10">

                <ShieldCheck
                  size={15}
                  className="text-[#E5D9B6]"
                />

                <span className="text-xs font-bold">
                  Admin
                </span>

              </div>

              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-300/20 text-red-100 hover:bg-red-500/20 transition font-black text-xs uppercase tracking-wider disabled:opacity-50"
              >

                <LogOut size={16} />

                {loggingOut
                  ? "Logging out..."
                  : "Logout"}

              </button>

            </div>

            {/* MOBILE MENU */}

            <button
              onClick={() =>
                setMobileMenuOpen(
                  !mobileMenuOpen
                )
              }
              className="md:hidden w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"
            >

              {mobileMenuOpen ? (
                <X size={20} />
              ) : (
                <Menu size={20} />
              )}

            </button>

          </div>

          {/* MOBILE MENU */}

          {mobileMenuOpen && (
            <div className="md:hidden pb-4">

              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/10 border border-red-300/20 text-red-100 font-black text-xs uppercase tracking-wider"
              >

                <LogOut size={16} />

                {loggingOut
                  ? "Logging out..."
                  : "Logout"}

              </button>

            </div>
          )}

        </div>

      </header>

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <main className="max-w-[1500px] mx-auto px-5 sm:px-8 py-8">

        {/* PAGE HEADER */}

        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 mb-8">

          <div>

            <div className="flex items-center gap-2 mb-3">

              <span className="w-2.5 h-2.5 rounded-full bg-[#628141]" />

              <span className="text-[10px] font-black uppercase tracking-[3px] text-[#628141]">
                ECOMOW Control Center
              </span>

            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#40513B] tracking-tight">
              Admin Dashboard
            </h2>

            <p className="text-sm sm:text-base text-[#6D7C66] mt-2 max-w-2xl">
              Manage mower reservations and review
              schedule requests from ECOMOW users.
            </p>

          </div>

          <button
            onClick={loadRequests}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#40513B] text-white text-xs font-black uppercase tracking-wider hover:bg-[#2C3627] transition shadow-lg"
          >

            <RefreshCw size={16} />

            Refresh Requests

          </button>

        </div>

        {/* =================================================
            STATISTICS
        ================================================= */}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

          {/* TOTAL */}

          <div className="bg-white rounded-[1.5rem] p-5 border border-[#E5D9B6]/60 shadow-sm">

            <div className="flex items-center justify-between">

              <div className="w-11 h-11 rounded-xl bg-[#628141]/10 flex items-center justify-center">

                <ClipboardList
                  size={21}
                  className="text-[#628141]"
                />

              </div>

              <span className="text-[9px] uppercase tracking-wider font-black text-[#6D7C66]">
                Total
              </span>

            </div>

            <p className="text-3xl font-black text-[#40513B] mt-4">
              {requests.length}
            </p>

            <p className="text-xs font-bold text-[#6D7C66] mt-1">
              All Requests
            </p>

          </div>

          {/* PENDING */}

          <div className="bg-white rounded-[1.5rem] p-5 border border-amber-200/70 shadow-sm">

            <div className="flex items-center justify-between">

              <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center">

                <Clock
                  size={21}
                  className="text-amber-600"
                />

              </div>

              <span className="text-[9px] uppercase tracking-wider font-black text-amber-600">
                Pending
              </span>

            </div>

            <p className="text-3xl font-black text-[#40513B] mt-4">
              {pendingCount}
            </p>

            <p className="text-xs font-bold text-[#6D7C66] mt-1">
              Need Review
            </p>

          </div>

          {/* APPROVED */}

          <div className="bg-white rounded-[1.5rem] p-5 border border-green-200/70 shadow-sm">

            <div className="flex items-center justify-between">

              <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center">

                <CheckCircle2
                  size={21}
                  className="text-green-600"
                />

              </div>

              <span className="text-[9px] uppercase tracking-wider font-black text-green-600">
                Approved
              </span>

            </div>

            <p className="text-3xl font-black text-[#40513B] mt-4">
              {approvedCount}
            </p>

            <p className="text-xs font-bold text-[#6D7C66] mt-1">
              Accepted
            </p>

          </div>

          {/* REJECTED */}

          <div className="bg-white rounded-[1.5rem] p-5 border border-red-200/70 shadow-sm">

            <div className="flex items-center justify-between">

              <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center">

                <XCircle
                  size={21}
                  className="text-red-600"
                />

              </div>

              <span className="text-[9px] uppercase tracking-wider font-black text-red-600">
                Rejected
              </span>

            </div>

            <p className="text-3xl font-black text-[#40513B] mt-4">
              {rejectedCount}
            </p>

            <p className="text-xs font-bold text-[#6D7C66] mt-1">
              Declined
            </p>

          </div>

        </div>

        {/* =================================================
            MESSAGE
        ================================================= */}

        {message && (
          <div className="mb-6 flex items-start gap-3 p-4 rounded-2xl bg-white border border-[#E5D9B6] shadow-sm">

            <AlertCircle
              size={18}
              className="text-[#628141] mt-0.5 flex-shrink-0"
            />

            <p className="text-sm font-bold text-[#40513B]">
              {message}
            </p>

          </div>
        )}

        {/* =================================================
            REQUESTS HEADER
        ================================================= */}

        <div className="flex items-center justify-between mb-5">

          <div>

            <h3 className="text-xl sm:text-2xl font-black text-[#40513B]">
              Schedule Requests
            </h3>

            <p className="text-xs sm:text-sm text-[#6D7C66] mt-1">
              Review incoming mower reservations.
            </p>

          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-[#6D7C66]">

            <Users size={15} />

            {requests.length} request
            {requests.length !== 1
              ? "s"
              : ""}

          </div>

        </div>

        {/* =================================================
            EMPTY
        ================================================= */}

        {requests.length === 0 ? (
          <div className="bg-white rounded-[2rem] p-12 text-center shadow-sm border border-[#E5D9B6]/60">

            <div className="w-20 h-20 rounded-3xl bg-[#628141]/10 flex items-center justify-center mx-auto mb-5">

              <Calendar
                size={36}
                className="text-[#628141]"
              />

            </div>

            <h2 className="text-xl sm:text-2xl font-black text-[#40513B]">
              No Schedule Requests
            </h2>

            <p className="text-sm text-[#6D7C66] mt-2 max-w-md mx-auto">
              User mower reservation requests will
              appear here once they are submitted.
            </p>

            <button
              onClick={loadRequests}
              className="mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#40513B] text-white text-xs font-black uppercase tracking-wider"
            >

              <RefreshCw size={15} />

              Check Again

            </button>

          </div>
        ) : (

          /* =================================================
             REQUEST CARDS
          ================================================= */

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

            {requests.map((request) => (

              <div
                key={request.id}
                className="bg-white rounded-[2rem] p-5 sm:p-6 shadow-sm hover:shadow-lg border border-[#E5D9B6]/60 transition"
              >

                {/* MOWER HEADER */}

                <div className="flex items-start justify-between gap-4">

                  <div className="flex items-center gap-3">

                    <div className="w-12 h-12 rounded-2xl bg-[#628141]/10 flex items-center justify-center flex-shrink-0">

                      <Tractor
                        size={23}
                        className="text-[#628141]"
                      />

                    </div>

                    <div className="min-w-0">

                      <h4 className="font-black text-[#40513B] truncate">
                        {request.mowerName ||
                          "ECOMOW Mower"}
                      </h4>

                      <p className="text-xs text-[#6D7C66] font-bold mt-0.5">
                        ID:{" "}
                        {request.mowerId ||
                          "Unknown"}
                      </p>

                    </div>

                  </div>

                  <span
                    className={`px-3 py-1.5 rounded-xl border text-[9px] sm:text-[10px] font-black uppercase tracking-wider whitespace-nowrap ${getStatusStyle(
                      request.status
                    )}`}
                  >
                    {request.status}
                  </span>

                </div>

                {/* USER */}

                <div className="mt-5 p-4 rounded-2xl bg-[#F7F9F5] border border-[#E5D9B6]/30">

                  <div className="flex items-center gap-2">

                    <User
                      size={16}
                      className="text-[#628141]"
                    />

                    <span className="text-[10px] font-black uppercase tracking-wider text-[#40513B]">
                      Requested By
                    </span>

                  </div>

                  <p className="text-sm font-bold text-[#6D7C66] mt-2 break-all">
                    {request.userEmail ||
                      "Unknown user"}
                  </p>

                </div>

                {/* DATE / TIME */}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">

                  <div className="p-4 rounded-2xl border border-[#E5D9B6]/50">

                    <div className="flex items-center gap-2 mb-2">

                      <Calendar
                        size={15}
                        className="text-[#628141]"
                      />

                      <span className="text-[9px] font-black uppercase tracking-wider text-[#6D7C66]">
                        Rental Date
                      </span>

                    </div>

                    <p className="text-sm font-black text-[#40513B]">
                      {request.rentalDate ||
                        "Not specified"}
                    </p>

                  </div>

                  <div className="p-4 rounded-2xl border border-[#E5D9B6]/50">

                    <div className="flex items-center gap-2 mb-2">

                      <Clock
                        size={15}
                        className="text-[#628141]"
                      />

                      <span className="text-[9px] font-black uppercase tracking-wider text-[#6D7C66]">
                        Schedule
                      </span>

                    </div>

                    <p className="text-sm font-black text-[#40513B]">
                      {request.startTime ||
                        "--"}{" "}
                      -{" "}
                      {request.endTime ||
                        "--"}
                    </p>

                  </div>

                </div>

                {/* DURATION */}

                <div className="mt-4 flex items-center justify-between">

                  <p className="text-xs font-bold text-[#6D7C66]">

                    Duration

                    <span className="text-[#40513B] ml-1">
                      {request.durationHours ||
                        0}{" "}
                      hour
                      {request.durationHours !==
                      1
                        ? "s"
                        : ""}
                    </span>

                  </p>

                  <span className="text-[9px] uppercase tracking-wider font-black text-[#628141]">
                    ECOMOW
                  </span>

                </div>

                {/* =================================================
                    PENDING ACTIONS
                ================================================= */}

                {request.status ===
                  "pending" && (

                  <div className="grid grid-cols-2 gap-3 mt-6">

                    {/* REJECT */}

                    <button
                      onClick={() =>
                        updateRequestStatus(
                          request.id,
                          "rejected"
                        )
                      }
                      disabled={
                        processingId ===
                        request.id
                      }
                      className="flex items-center justify-center gap-2 py-3.5 rounded-xl border border-red-200 bg-red-50 text-red-700 font-black text-[10px] uppercase tracking-wider hover:bg-red-100 transition disabled:opacity-50"
                    >

                      <XCircle size={17} />

                      Reject

                    </button>

                    {/* APPROVE */}

                    <button
                      onClick={() =>
                        updateRequestStatus(
                          request.id,
                          "approved"
                        )
                      }
                      disabled={
                        processingId ===
                        request.id
                      }
                      className="flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#40513B] text-white font-black text-[10px] uppercase tracking-wider hover:bg-[#2C3627] transition shadow-md disabled:opacity-50"
                    >

                      <CheckCircle2
                        size={17}
                      />

                      {processingId ===
                      request.id
                        ? "Processing..."
                        : "Approve"}

                    </button>

                  </div>
                )}

                {/* APPROVED */}

                {request.status ===
                  "approved" && (

                  <div className="mt-6 p-4 rounded-2xl bg-green-50 border border-green-200">

                    <div className="flex items-center gap-2">

                      <CheckCircle2
                        size={18}
                        className="text-green-600"
                      />

                      <span className="text-sm font-black text-green-800">
                        Schedule Approved
                      </span>

                    </div>

                    <p className="text-xs text-green-700 mt-1">
                      This reservation has been
                      accepted by the administrator.
                    </p>

                  </div>
                )}

                {/* REJECTED */}

                {request.status ===
                  "rejected" && (

                  <div className="mt-6 p-4 rounded-2xl bg-red-50 border border-red-200">

                    <div className="flex items-center gap-2">

                      <XCircle
                        size={18}
                        className="text-red-600"
                      />

                      <span className="text-sm font-black text-red-800">
                        Schedule Rejected
                      </span>

                    </div>

                    <p className="text-xs text-red-700 mt-1">
                      This reservation was rejected by
                      the administrator.
                    </p>

                  </div>
                )}

                {/* COMPLETED */}

                {request.status ===
                  "completed" && (

                  <div className="mt-6 p-4 rounded-2xl bg-blue-50 border border-blue-200">

                    <div className="flex items-center gap-2">

                      <CheckCircle2
                        size={18}
                        className="text-blue-600"
                      />

                      <span className="text-sm font-black text-blue-800">
                        Reservation Completed
                      </span>

                    </div>

                  </div>
                )}

                {/* CANCELLED */}

                {request.status ===
                  "cancelled" && (

                  <div className="mt-6 p-4 rounded-2xl bg-gray-50 border border-gray-200">

                    <div className="flex items-center gap-2">

                      <XCircle
                        size={18}
                        className="text-gray-500"
                      />

                      <span className="text-sm font-black text-gray-700">
                        Reservation Cancelled
                      </span>

                    </div>

                  </div>
                )}

              </div>

            ))}

          </div>
        )}

      </main>

      {/* =================================================
          FOOTER
      ================================================= */}

      <footer className="max-w-[1500px] mx-auto px-5 sm:px-8 pb-8 pt-4">

        <div className="border-t border-[#E5D9B6]/60 pt-5 flex flex-col sm:flex-row items-center justify-between gap-2">

          <p className="text-[10px] uppercase tracking-wider font-bold text-[#8A9684]">
            ECOMOW Smart Autonomous Lawn System
          </p>

          <p className="text-[10px] font-bold text-[#8A9684]">
            Administrator Panel
          </p>

        </div>

      </footer>

    </div>
  );
}