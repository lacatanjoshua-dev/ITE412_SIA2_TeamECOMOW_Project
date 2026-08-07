import React, { useEffect, useState } from "react";
import {
  MapPin,
  Lock,
  Shield,
  Bell,
  Volume2,
  ShieldCheck,
  Map,
  User,
  KeyRound,
  LogOut,
  Mail,
  AtSign,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  onAuthStateChanged,
  sendPasswordResetEmail,
  signOut,
  User as FbUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updateEmail,
} from "firebase/auth";
import { auth } from "../firebase";

export default function SecuritySettingsScreen() {
  const [gpsTracking, setGpsTracking] = useState(true);
  const [pinLock, setPinLock] = useState(true);
  const [autoShutdown, setAutoShutdown] = useState(true);
  const [alertsEnabled, setAlertsEnabled] = useState(true);

  // ✅ login state
  const [fbUser, setFbUser] = useState<FbUser | null>(null);
  const [acctMsg, setAcctMsg] = useState<string | null>(null);
  const [acctLoading, setAcctLoading] = useState<null | "reset" | "logout" | "changeEmail">(null);

  // ✅ change email form (optional)
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [showEmailForm, setShowEmailForm] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setFbUser(u);
      if (!u) {
        setShowEmailForm(false);
        setNewEmail("");
        setCurrentPassword("");
      }
    });
    return () => unsub();
  }, []);

  const displayName =
    fbUser?.displayName || (fbUser?.email ? fbUser.email.split("@")[0] : "Guest");
  const email = fbUser?.email ?? "";

  const handleResetPassword = async () => {
    setAcctMsg(null);

    if (!email) {
      setAcctMsg("❌ Walang email sa account na ito.");
      return;
    }

    try {
      setAcctLoading("reset");
      await sendPasswordResetEmail(auth, email);
      setAcctMsg(`✅ Password reset link sent to: ${email}`);
    } catch (e: any) {
      console.error(e);
      setAcctMsg("❌ Failed to send reset email. Check Email/Password provider settings.");
    } finally {
      setAcctLoading(null);
    }
  };

  const handleLogout = async () => {
    setAcctMsg(null);
    try {
      setAcctLoading("logout");
      await signOut(auth);
      setAcctMsg("✅ Logged out.");
    } catch (e) {
      console.error(e);
      setAcctMsg("❌ Logout failed.");
    } finally {
      setAcctLoading(null);
    }
  };

  // ✅ Change email (needs re-auth with current password)
  const handleChangeEmail = async () => {
    setAcctMsg(null);

    if (!fbUser) {
      setAcctMsg("❌ Not signed in.");
      return;
    }
    if (!email) {
      setAcctMsg("❌ Walang current email.");
      return;
    }
    if (!newEmail.trim()) {
      setAcctMsg("❌ Please enter a new email.");
      return;
    }
    if (!currentPassword) {
      setAcctMsg("❌ Please enter your current password.");
      return;
    }

    try {
      setAcctLoading("changeEmail");

      const cred = EmailAuthProvider.credential(email, currentPassword);
      await reauthenticateWithCredential(fbUser, cred);
      await updateEmail(fbUser, newEmail.trim());

      setAcctMsg(`✅ Email updated to: ${newEmail.trim()}`);
      setShowEmailForm(false);
      setNewEmail("");
      setCurrentPassword("");
    } catch (e: any) {
      console.error(e);
      const code = e?.code || "";
      if (code === "auth/wrong-password") setAcctMsg("❌ Wrong password.");
      else if (code === "auth/requires-recent-login")
        setAcctMsg("❌ Need recent login. Logout then login again, then try.");
      else if (code === "auth/invalid-email") setAcctMsg("❌ Invalid email format.");
      else if (code === "auth/email-already-in-use") setAcctMsg("❌ Email already in use.");
      else setAcctMsg("❌ Failed to update email.");
    } finally {
      setAcctLoading(null);
    }
  };

  return (
    <div className="p-0 max-w-4xl mx-auto pb-24 lg:pb-8">
      <div className="mb-10">
        <h1 className="text-3xl font-black text-[#40513B] tracking-tight mb-2 uppercase tracking-widest text-xl">
          Security & Safety
        </h1>
        <p className="text-[#6D7C66] font-medium flex items-center gap-2 text-sm">
          <ShieldCheck size={16} className="text-[#628141]" />
          Infrastructure protection protocols
        </p>
      </div>

      <div className="space-y-8">
        {/* ✅ LOGIN SETTINGS */}
        <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-[#E5D9B6]/50">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-[#40513B]/10 rounded-xl text-[#40513B]">
              <User className="w-5 h-5" />
            </div>
            <h2 className="font-black text-[#40513B] text-sm uppercase tracking-widest">
              Login Settings
            </h2>
          </div>

          <div className="bg-[#F8FAF7] rounded-[2rem] p-6 border border-[#E5D9B6]/30">
            <div className="flex items-start justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-[#E5D9B6]/30">
                  <Mail className="w-5 h-5 text-[#628141]" />
                </div>

                <div>
                  <div className="font-black text-[#40513B] text-sm uppercase tracking-widest">
                    {displayName}
                  </div>
                  <div className="text-[10px] font-bold text-[#6D7C66] uppercase tracking-widest mt-1">
                    {email || "Not signed in"}
                  </div>
                </div>
              </div>

              <div className="text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-full border border-[#E5D9B6]/40 bg-white">
                {fbUser ? "ACTIVE" : "GUEST"}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={handleResetPassword}
                disabled={!fbUser || acctLoading !== null}
                className="flex items-center justify-center gap-2 py-4 rounded-2xl font-black uppercase tracking-[2px] text-[10px] border border-[#E5D9B6] bg-white hover:bg-[#E5D9B6]/20 transition disabled:opacity-50"
              >
                <KeyRound className="w-4 h-4" />
                {acctLoading === "reset" ? "Sending..." : "Reset Password"}
              </button>

              <button
                onClick={() => setShowEmailForm((s) => !s)}
                disabled={!fbUser || acctLoading !== null}
                className="flex items-center justify-center gap-2 py-4 rounded-2xl font-black uppercase tracking-[2px] text-[10px] border border-[#E5D9B6] bg-white hover:bg-[#E5D9B6]/20 transition disabled:opacity-50"
              >
                <AtSign className="w-4 h-4" />
                Change Email
              </button>

              <button
                onClick={handleLogout}
                disabled={!fbUser || acctLoading !== null}
                className="flex items-center justify-center gap-2 py-4 rounded-2xl font-black uppercase tracking-[2px] text-[10px] bg-[#40513B] text-white hover:bg-[#2C3627] transition disabled:opacity-50"
              >
                <LogOut className="w-4 h-4" />
                {acctLoading === "logout" ? "Logging out..." : "Logout"}
              </button>
            </div>

            {/* Change Email Form */}
            {showEmailForm && fbUser && (
              <div className="mt-6 bg-white rounded-[1.5rem] p-6 border border-[#E5D9B6]/30">
                <div className="font-black text-[#40513B] text-xs uppercase tracking-widest mb-4">
                  Update Email (requires password)
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-[#6D7C66] uppercase tracking-widest">
                      New Email
                    </label>
                    <input
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="new@email.com"
                      className="mt-2 w-full px-4 py-3 rounded-2xl bg-[#F8FAF7] border border-[#E5D9B6]/40 focus:outline-none focus:ring-2 focus:ring-[#628141]/40 font-bold text-[#40513B]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-[#6D7C66] uppercase tracking-widest">
                      Current Password
                    </label>
                    <input
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      type="password"
                      className="mt-2 w-full px-4 py-3 rounded-2xl bg-[#F8FAF7] border border-[#E5D9B6]/40 focus:outline-none focus:ring-2 focus:ring-[#628141]/40 font-bold text-[#40513B]"
                    />
                  </div>
                </div>

                <div className="mt-5 flex gap-3">
                  <button
                    onClick={handleChangeEmail}
                    disabled={acctLoading !== null}
                    className="flex-1 py-4 rounded-2xl font-black uppercase tracking-[2px] text-[10px] bg-[#628141] text-white hover:bg-[#4f6b34] transition disabled:opacity-60"
                  >
                    {acctLoading === "changeEmail" ? "Updating..." : "Save Email"}
                  </button>
                  <button
                    onClick={() => {
                      setShowEmailForm(false);
                      setNewEmail("");
                      setCurrentPassword("");
                      setAcctMsg(null);
                    }}
                    disabled={acctLoading !== null}
                    className="flex-1 py-4 rounded-2xl font-black uppercase tracking-[2px] text-[10px] border border-[#E5D9B6] bg-white hover:bg-[#E5D9B6]/20 transition disabled:opacity-60"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {acctMsg && (
              <div className="mt-4 text-[11px] font-bold text-[#40513B]">
                {acctMsg}
              </div>
            )}
          </div>
        </div>

        {/* Anti-Theft Protection */}
        <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-[#E5D9B6]/50">
          <div className="flex items-center gap-3 mb-10">
            <div className="p-2 bg-[#628141]/10 rounded-xl text-[#628141]">
              <Shield className="w-5 h-5" />
            </div>
            <h2 className="font-black text-[#40513B] text-sm uppercase tracking-widest">
              Anti-Theft Matrix
            </h2>
          </div>

          <div className="space-y-8">
            {/* GPS Tracking */}
            <div className="flex items-start justify-between pb-8 border-b border-[#F8FAF7]">
              <div className="flex items-start gap-4 flex-1">
                <div className="w-12 h-12 bg-[#F8FAF7] rounded-2xl flex items-center justify-center flex-shrink-0 border border-[#E5D9B6]/30">
                  <MapPin className="w-5 h-5 text-[#628141]" />
                </div>
                <div className="flex-1">
                  <div className="font-black text-[#40513B] text-sm uppercase tracking-widest mb-1">
                    Global GPS Telemetry
                  </div>
                  <div className="text-[10px] font-bold text-[#6D7C66] uppercase tracking-widest leading-relaxed">
                    Continuous real-time tracking with geofence breach alerts.
                  </div>
                </div>
              </div>
              <button
                onClick={() => setGpsTracking(!gpsTracking)}
                className={`w-14 h-8 rounded-full transition-all flex-shrink-0 ml-6 relative ${
                  gpsTracking ? "bg-[#628141]" : "bg-[#E5D9B6]"
                }`}
              >
                <motion.div
                  animate={{ left: gpsTracking ? "28px" : "4px" }}
                  className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all"
                />
              </button>
            </div>

            {/* PIN Lock */}
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <div className="w-12 h-12 bg-[#F8FAF7] rounded-2xl flex items-center justify-center flex-shrink-0 border border-[#E5D9B6]/30">
                  <Lock className="w-5 h-5 text-[#40513B]" />
                </div>
                <div className="flex-1">
                  <div className="font-black text-[#40513B] text-sm uppercase tracking-widest mb-1">
                    Authorization Lock
                  </div>
                  <div className="text-[10px] font-bold text-[#6D7C66] uppercase tracking-widest leading-relaxed">
                    Require 6-digit biometric or PIN code for terminal access.
                  </div>
                </div>
              </div>
              <button
                onClick={() => setPinLock(!pinLock)}
                className={`w-14 h-8 rounded-full transition-all flex-shrink-0 ml-6 relative ${
                  pinLock ? "bg-[#628141]" : "bg-[#E5D9B6]"
                }`}
              >
                <motion.div
                  animate={{ left: pinLock ? "28px" : "4px" }}
                  className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all"
                />
              </button>
            </div>
          </div>

          {pinLock && (
            <button className="w-full mt-10 py-4 px-6 bg-[#F8FAF7] hover:bg-white text-[#40513B] border border-[#E5D9B6] rounded-2xl font-black uppercase tracking-[2px] text-[10px] transition-all active:scale-95 shadow-sm">
              Reset Access Code
            </button>
          )}
        </div>

        {/* Current Location */}
        {gpsTracking && (
          <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-[#E5D9B6]/50">
            <h2 className="font-black text-[#40513B] text-sm uppercase tracking-widest mb-8">
              Deployment Map
            </h2>

            <div className="relative bg-[#F8FAF7] rounded-[2rem] h-56 mb-6 overflow-hidden border border-[#E5D9B6]/30 shadow-inner">
              <svg width="100%" height="100%" viewBox="0 0 400 200" className="absolute inset-0">
                <defs>
                  <pattern id="grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E5D9B6" strokeWidth="1" opacity="0.3" />
                  </pattern>
                </defs>
                <rect width="400" height="200" fill="url(#grid)" />

                <g transform="translate(200, 100)">
                  <circle cx="0" cy="0" r="25" fill="#628141" opacity="0.1" className="animate-pulse" />
                  <circle cx="0" cy="0" r="10" fill="#628141" />
                  <circle cx="0" cy="0" r="4" fill="#E5D9B6" />
                </g>
              </svg>

              <div className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-md rounded-xl border border-[#E5D9B6] shadow-sm">
                <Map size={16} className="text-[#40513B]" />
              </div>
            </div>

            <div className="flex items-center justify-between p-6 bg-[#F8FAF7] rounded-[1.5rem] border border-[#E5D9B6]/20">
              <div>
                <div className="font-black text-[#40513B] text-sm">
                  123 Garden Street, Sector 2B
                </div>
                <div className="text-[10px] font-black text-[#6D7C66] uppercase tracking-widest mt-1">
                  Last Synced: 2m ago • Fixed
                </div>
              </div>
              <div className="p-3 bg-white rounded-xl shadow-sm border border-[#E5D9B6]/30">
                <MapPin className="w-5 h-5 text-[#E67E22]" />
              </div>
            </div>
          </div>
        )}

        {/* Safety Controls */}
        <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-[#E5D9B6]/50">
          <div className="flex items-center gap-3 mb-10">
            <div className="p-2 bg-[#E67E22]/10 rounded-xl text-[#E67E22]">
              <Shield className="w-5 h-5" />
            </div>
            <h2 className="font-black text-[#40513B] text-sm uppercase tracking-widest">
              Active Safety
            </h2>
          </div>

          <div className="space-y-8">
            {/* Auto Shutdown */}
            <div className="flex items-start justify-between pb-8 border-b border-[#F8FAF7]">
              <div className="flex items-start gap-4 flex-1">
                <div className="w-12 h-12 bg-[#F8FAF7] rounded-2xl flex items-center justify-center flex-shrink-0 border border-[#E5D9B6]/30">
                  <Shield className="w-5 h-5 text-[#E67E22]" />
                </div>
                <div className="flex-1">
                  <div className="font-black text-[#40513B] text-sm uppercase tracking-widest mb-1">
                    Tilt & Lift Killswitch
                  </div>
                  <div className="text-[10px] font-bold text-[#6D7C66] uppercase tracking-widest leading-relaxed">
                    Immediate blade halt if mower is moved from horizontal plane.
                  </div>
                </div>
              </div>
              <button
                onClick={() => setAutoShutdown(!autoShutdown)}
                className={`w-14 h-8 rounded-full transition-all flex-shrink-0 ml-6 relative ${
                  autoShutdown ? "bg-[#628141]" : "bg-[#E5D9B6]"
                }`}
              >
                <motion.div
                  animate={{ left: autoShutdown ? "28px" : "4px" }}
                  className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all"
                />
              </button>
            </div>

            {/* Movement Alerts */}
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <div className="w-12 h-12 bg-[#F8FAF7] rounded-2xl flex items-center justify-center flex-shrink-0 border border-[#E5D9B6]/30">
                  <Bell className="w-5 h-5 text-[#E67E22]" />
                </div>
                <div className="flex-1">
                  <div className="font-black text-[#40513B] text-sm uppercase tracking-widest mb-1">
                    Unscheduled Motion
                  </div>
                  <div className="text-[10px] font-bold text-[#6D7C66] uppercase tracking-widest leading-relaxed">
                    Critical alert if device moves during standby hours.
                  </div>
                </div>
              </div>
              <button
                onClick={() => setAlertsEnabled(!alertsEnabled)}
                className={`w-14 h-8 rounded-full transition-all flex-shrink-0 ml-6 relative ${
                  alertsEnabled ? "bg-[#628141]" : "bg-[#E5D9B6]"
                }`}
              >
                <motion.div
                  animate={{ left: alertsEnabled ? "28px" : "4px" }}
                  className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all"
                />
              </button>
            </div>
          </div>
        </div>

        {/* Remote Locators */}
        <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-[#E5D9B6]/50">
          <h2 className="font-black text-[#40513B] text-sm uppercase tracking-widest mb-4">
            Beacon Controls
          </h2>
          <p className="text-[10px] font-bold text-[#6D7C66] uppercase tracking-widest mb-8">
            Activate remote signals to locate units in high grass.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="flex flex-col items-center gap-3 p-6 bg-[#628141]/5 hover:bg-[#628141]/10 border border-[#628141]/20 rounded-[1.5rem] transition-all group">
              <div className="p-3 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                <Volume2 className="w-6 h-6 text-[#628141]" />
              </div>
              <span className="text-[10px] font-black text-[#40513B] uppercase tracking-widest">
                Audio Ping
              </span>
            </button>

            <button className="flex flex-col items-center gap-3 p-6 bg-[#E67E22]/5 hover:bg-[#E67E22]/10 border border-[#E67E22]/20 rounded-[1.5rem] transition-all group">
              <div className="p-3 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                <Bell className="w-6 h-6 text-[#E67E22]" />
              </div>
              <span className="text-[10px] font-black text-[#40513B] uppercase tracking-widest">
                LED Flash
              </span>
            </button>

            <button className="flex flex-col items-center gap-3 p-6 bg-[#40513B]/5 hover:bg-[#40513B]/10 border border-[#40513B]/20 rounded-[1.5rem] transition-all group">
              <div className="p-3 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                <MapPin className="w-6 h-6 text-[#40513B]" />
              </div>
              <span className="text-[10px] font-black text-[#40513B] uppercase tracking-widest">
                Map Link
              </span>
            </button>
          </div>
        </div>

        {/* Security Summary Badge */}
        <div className="bg-[#40513B] rounded-[2.5rem] p-10 text-white shadow-xl shadow-[#40513B]/20 relative overflow-hidden">
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#628141]/30 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />
          <div className="flex items-center gap-6 relative z-10">
            <div className="w-16 h-16 bg-[#628141] rounded-[1.5rem] flex items-center justify-center shadow-lg border border-white/10">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="font-black text-xl uppercase tracking-widest">System Secured</div>
              <div className="text-[10px] font-bold text-[#E5D9B6] uppercase tracking-[2px] mt-1">
                All 4 Security Vectors Operating at 100%
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
