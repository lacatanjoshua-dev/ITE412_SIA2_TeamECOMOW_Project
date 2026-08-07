import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  User,
  Phone,
  Image as ImageIcon,
  KeyRound,
  ShieldCheck,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  createUserWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  updateProfile,
} from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, storage } from "../firebase";

const logoImage = "/images/logo.jpg";
const grassBg = "/images/mower.jpg";

interface SignupScreenProps {
  onLogin: () => void;
}

export default function SignupScreen({ onLogin }: SignupScreenProps) {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    setPersistence(auth, browserLocalPersistence).catch(console.error);
  }, []);

  useEffect(() => {
    if (!profileFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(profileFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [profileFile]);

  const friendlyError = (e: any) => {
    const code = e?.code || "";
    if (code === "auth/email-already-in-use") return "Email already used.";
    if (code === "auth/weak-password") return "Password too weak (min 6 chars).";
    if (code === "auth/invalid-email") return "Invalid email.";
    return "Sign up failed.";
  };

  const validate = () => {
    if (!name.trim()) return "Please enter your name.";
    if (!email.trim()) return "Please enter your email.";
    if (!phone.trim()) return "Please enter your phone number.";
    if (password.length < 6) return "Password too weak (min 6 chars).";
    if (password !== confirmPassword) return "Passwords do not match.";
    if (!profileFile) return "Please upload a profile picture.";
    if (profileFile.size > 2 * 1024 * 1024) return "Profile picture too large (max 2MB).";
    return null;
  };

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const v = validate();
    if (v) return setError(v);

    try {
      setLoading(true);

      // 1) Create account
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const uid = cred.user.uid;

      // 2) Upload profile pic
      const ext = profileFile!.name.split(".").pop() || "jpg";
      const fileRef = ref(storage, `users/${uid}/profile.${ext}`);
      await uploadBytes(fileRef, profileFile!);
      const photoURL = await getDownloadURL(fileRef);

      // 3) Update auth profile (displayName + photoURL)
      await updateProfile(cred.user, { displayName: name.trim(), photoURL });

      // 4) Save extra fields to Firestore
      await setDoc(
        doc(db, "users", uid),
        {
          uid,
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          photoURL,
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );

      onLogin();
      navigate("/app"); // ✅ match sa App.tsx mo
    } catch (e: any) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-black">
      {/* Background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${grassBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "brightness(0.4)",
        }}
      />
      <div className="absolute inset-0 bg-black/60 z-[1]" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[440px] z-10"
      >
        <div className="relative">
          <div className="absolute -inset-1 bg-white/40 rounded-[3rem] blur-[40px] opacity-60" />

          <div className="relative bg-white/10 backdrop-blur-2xl rounded-[3rem] p-8 border border-white/20 shadow-2xl">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-24 h-24 mx-auto rounded-full bg-white overflow-hidden mb-4">
                <img src={logoImage} className="w-full h-full object-cover" />
              </div>
              <h1 className="text-3xl font-black text-white uppercase">SOLAR MOWER</h1>
              <p className="text-white/60 text-[10px] uppercase tracking-widest">Create Account</p>
            </div>

            {/* Profile Pic Upload */}
            <div className="mb-5 flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 overflow-hidden flex items-center justify-center">
                {previewUrl ? (
                  <img src={previewUrl} className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="text-white/60" />
                )}
              </div>

              <label className="flex-1 cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setProfileFile(e.target.files?.[0] || null)}
                />
                <div className="px-4 py-3 rounded-xl g-white/10 border border-white/20 text-white/80 text-xs font-bold hover:bg-white/15 transition">
                  Upload Profile Picture
                </div>
                <div className="mt-1 text-white/50 text-[10px]">JPG/PNG, max 2MB</div>
              </label>
            </div>

            {/* Form */}
            <form onSubmit={signUp} className="space-y-4">
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/80" />
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Name"
                  className="w-full pl-12 pr-4 py-3 rounded-xl font-bold bg-white/10 text-white placeholder:text-white/60 border border-white/20 shadow-lg backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-white/30"
                  required
                />
              </div>

              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/80" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full pl-12 pr-4 py-3 rounded-xl font-bold bg-white/10 text-white placeholder:text-white/60 border border-white/20 shadow-lg backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-white/30"
                  required
                />
              </div>

              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/80" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone number"
                  className="w-full pl-12 pr-4 py-3 rounded-xl font-bold bg-white/10 text-white placeholder:text-white/60 border border-white/20 shadow-lg backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-white/30"
                  required
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/80" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full pl-12 pr-12 py-3 rounded-xl font-bold bg-white/10 text-white placeholder:text-white/60 border border-white/20 shadow-lg backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-white/30"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>

              <div className="relative">
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/80" />
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="w-full pl-12 pr-12 py-3 rounded-xl font-bold bg-white/10 text-white placeholder:text-white/60 border border-white/20 shadow-lg backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-white/30"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
                >
                  {showConfirm ? <EyeOff /> : <Eye />}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#E5D9B6] py-4 rounded-xl font-black uppercase text-xs flex justify-center items-center gap-2 disabled:opacity-60"
              >
                {loading ? "Creating..." : "Create Account"} <ArrowRight size={16} />
              </button>

              <Link to="/login" className="block w-full text-center text-white/70 text-xs hover:text-white">
                May account na? Sign in
              </Link>
            </form>

            {error && (
              <div className="mt-4 text-center text-red-200 text-xs bg-red-900/40 p-3 rounded-xl">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 flex justify-center">
          <div className="flex items-center gap-2 text-white/40 text-[9px] uppercase">
            <ShieldCheck size={14} /> Secure Session
          </div>
        </div>
      </motion.div>
    </div>
  );
}
