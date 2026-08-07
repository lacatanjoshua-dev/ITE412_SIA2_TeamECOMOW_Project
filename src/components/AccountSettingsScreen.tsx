import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { User, Phone, Save, ShieldCheck, Mail } from "lucide-react";
import {
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";

const bgImage = "/images/mower.png";
const ACCENT = "#185928";

type ProfileData = {
  name?: string;
  phone?: string;
  email?: string;
};

export default function AccountSettingsScreen() {
  const [fbUser, setFbUser] = useState<FirebaseUser | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setFbUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    const run = async () => {
      if (!fbUser?.uid) return;

      setLoading(true);
      setErr(null);
      setMsg(null);

      try {
        const snap = await getDoc(doc(db, "users", fbUser.uid));
        const data = snap.exists() ? (snap.data() as ProfileData) : {};

        setName(data.name || "");
        setPhone(data.phone || "");
      } catch (e) {
        console.error(e);
        setErr("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [fbUser?.uid]);

  const save = async () => {
    if (!fbUser?.uid) return;

    setSaving(true);
    setErr(null);
    setMsg(null);

    try {
      await setDoc(
        doc(db, "users", fbUser.uid),
        {
          uid: fbUser.uid,
          name: name.trim(),
          phone: phone.trim(),
          email: fbUser.email || "",
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setMsg("Changes saved successfully.");
    } catch (e) {
      console.error(e);
      setErr("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-white/80 font-bold">
        Loading...
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-64px)] px-4 py-8 sm:py-12">

      {/* Background */}
      <div
        className="absolute inset-0 -z-10 bg-cover bg-center"
        style={{
          backgroundImage: `url(${bgImage})`,
          filter: "brightness(0.92)",
        }}
      />
      <div className="absolute inset-0 -z-10 bg-white/70 backdrop-blur-sm" />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto"
      >
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#1b1b1b]">
            Account Settings
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage your personal information.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl border border-black/5 shadow-sm p-6 sm:p-8 space-y-6">

          {/* Email (Read Only) */}
          <div>
            <label className="text-xs font-black uppercase tracking-widest text-slate-600">
              Email Address
            </label>
            <div className="mt-2 relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                value={fbUser?.email || ""}
                disabled
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-100 border border-slate-200 text-slate-500 font-semibold"
              />
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="text-xs font-black uppercase tracking-widest text-slate-600">
              Full Name
            </label>
            <div className="mt-2 relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#185928]/20 focus:border-[#185928]/30"
                placeholder="Enter your full name"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="text-xs font-black uppercase tracking-widest text-slate-600">
              Phone Number
            </label>
            <div className="mt-2 relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#185928]/20 focus:border-[#185928]/30"
                placeholder="09xx xxx xxxx"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between pt-4">
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <ShieldCheck className="w-4 h-4" />
              Secure session
            </div>

            <button
              onClick={save}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest text-white shadow-sm disabled:opacity-60 active:scale-[0.99] transition"
              style={{ backgroundColor: ACCENT }}
            >
              {saving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Saving
                </>
              ) : (
                <>
                  Save Changes <Save className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Messages */}
          {err && (
            <div className="text-sm bg-red-50 border border-red-200 text-red-700 p-3 rounded-2xl">
              {err}
            </div>
          )}

          {msg && (
            <div className="text-sm bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-2xl">
              {msg}
            </div>
          )}

        </div>
      </motion.div>
    </div>
  );
}
