"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, User, Phone, ArrowRight, CheckCircle, AlertTriangle } from "lucide-react";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleToggle = () => {
    setIsLogin(!isLogin);
    setError(null);
    setSuccess(null);
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setName("");
    setPhone("");
  };

  const validateForm = () => {
    setError(null);

    if (isLogin) {
      if (!email || !password) {
        setError("Please fill in all fields");
        return false;
      }
    } else {
      if (!email || !password || !name || !phone || !confirmPassword) {
        setError("All registration fields are required");
        return false;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return false;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters long");
        return false;
      }
      // Simple format check for phone
      if (!/^\+?[0-9\s-]{10,15}$/.test(phone)) {
        setError("Please enter a valid phone number (e.g. +91 9876543210)");
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || loading) return;

    setLoading(true);
    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
    const payload = isLogin 
      ? { email, password }
      : { email, password, name, phone };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Authentication failed");
      } else {
        setSuccess(isLogin ? "Logged in successfully!" : "Account created successfully!");
        setTimeout(() => {
          router.push("/dashboard");
          router.refresh();
        }, 1200);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please check your network connection.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
        position: "relative",
      }}
    >
      {/* Dynamic Background Meshs */}
      <div
        style={{
          position: "absolute",
          top: "30%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "450px",
          height: "450px",
          background: "radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, transparent 70%)",
          filter: "blur(60px)",
          zIndex: -1,
        }}
      />

      <div
        className="glass-panel"
        style={{
          width: "100%",
          maxWidth: "460px",
          padding: "40px",
          background: "rgba(12, 8, 34, 0.4)",
          border: "1px solid rgba(255, 255, 255, 0.06)",
        }}
      >
        {/* Toggle tabs */}
        <div
          style={{
            display: "flex",
            background: "rgba(0, 0, 0, 0.3)",
            padding: "4px",
            borderRadius: "10px",
            marginBottom: "32px",
            border: "1px solid var(--border)",
          }}
        >
          <button
            onClick={() => !isLogin && handleToggle()}
            style={{
              flex: 1,
              padding: "10px",
              background: isLogin ? "rgba(255, 255, 255, 0.05)" : "transparent",
              color: isLogin ? "#fff" : "var(--text-muted)",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: 600,
              transition: "all 0.2s",
            }}
          >
            Sign In
          </button>
          <button
            onClick={() => isLogin && handleToggle()}
            style={{
              flex: 1,
              padding: "10px",
              background: !isLogin ? "rgba(255, 255, 255, 0.05)" : "transparent",
              color: !isLogin ? "#fff" : "var(--text-muted)",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: 600,
              transition: "all 0.2s",
            }}
          >
            Register
          </button>
        </div>

        {/* Headings */}
        <div style={{ marginBottom: "24px" }}>
          <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#fff", marginBottom: "8px" }}>
            {isLogin ? "Welcome Back" : "Create Account"}
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            {isLogin 
              ? "Access your campus ride pools" 
              : "Register using your verified college email ID"}
          </p>
        </div>

        {/* Feedback alerts */}
        {error && (
          <div
            className="badge badge-rose"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              width: "100%",
              padding: "12px 16px",
              borderRadius: "10px",
              marginBottom: "24px",
              fontSize: "0.85rem",
              textTransform: "initial",
              letterSpacing: "initial",
            }}
          >
            <AlertTriangle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div
            className="badge badge-emerald"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              width: "100%",
              padding: "12px 16px",
              borderRadius: "10px",
              marginBottom: "24px",
              fontSize: "0.85rem",
              textTransform: "initial",
              letterSpacing: "initial",
            }}
          >
            <CheckCircle size={16} style={{ flexShrink: 0 }} />
            <span>{success}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          {/* Register Name */}
          {!isLogin && (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)" }}>
                Full Name
              </label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "14px", top: "14px", color: "var(--text-muted)" }}>
                  <User size={16} />
                </span>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Suyash Mishra"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ paddingLeft: "42px" }}
                  required={!isLogin}
                />
              </div>
            </div>
          )}

          {/* College Email */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)" }}>
              College Email ID
            </label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "14px", top: "14px", color: "var(--text-muted)" }}>
                <Mail size={16} />
              </span>
              <input
                type="email"
                className="input-field"
                placeholder={isLogin ? "rollno@kiit.ac.in" : "e.g. 2005123@kiit.ac.in"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: "42px" }}
                required
              />
            </div>
            {!isLogin && (
              <span style={{ fontSize: "0.72rem", color: "var(--accent-cyan)", opacity: 0.9 }}>
                * Verified KIIT (@kiit.ac.in), ac.in, or .edu address required.
              </span>
            )}
          </div>

          {/* Register Phone */}
          {!isLogin && (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)" }}>
                Phone Number
              </label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "14px", top: "14px", color: "var(--text-muted)" }}>
                  <Phone size={16} />
                </span>
                <input
                  type="tel"
                  className="input-field"
                  placeholder="e.g. +91 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{ paddingLeft: "42px" }}
                  required={!isLogin}
                />
              </div>
            </div>
          )}

          {/* Password */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)" }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "14px", top: "14px", color: "var(--text-muted)" }}>
                <Lock size={16} />
              </span>
              <input
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: "42px" }}
                required
              />
            </div>
          </div>

          {/* Confirm Password */}
          {!isLogin && (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)" }}>
                Confirm Password
              </label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "14px", top: "14px", color: "var(--text-muted)" }}>
                  <Lock size={16} />
                </span>
                <input
                  type="password"
                  className="input-field"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ paddingLeft: "42px" }}
                  required={!isLogin}
                />
              </div>
            </div>
          )}

          {/* Action button */}
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{
              marginTop: "10px",
              justifyContent: "center",
              fontSize: "1rem",
              padding: "14px",
            }}
          >
            {loading ? "Processing..." : isLogin ? "Sign In" : "Register Now"}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: "24px" }}>
          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
            By continuing, you agree to ride coordinates guidelines.
          </span>
        </div>
      </div>
    </div>
  );
}
