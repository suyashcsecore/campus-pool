"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { LogOut, User, Car, ShieldAlert, Award } from "lucide-react";

interface NavbarUser {
  id: string;
  email: string;
  name: string;
  trustScore: number;
}

export default function Navbar() {
  const [user, setUser] = useState<NavbarUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchUser = async () => {
    try {
      const res = await fetch("/api/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Failed to fetch user in navbar:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [pathname]); // Refetch user on route changes

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        setUser(null);
        router.push("/");
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

  // Determine trust score badge
  const getTrustBadgeClass = (score: number) => {
    if (score >= 90) return "badge-emerald";
    if (score >= 75) return "badge-cyan";
    return "badge-rose";
  };

  const getTrustBadgeIcon = (score: number) => {
    if (score >= 90) return <Award size={12} />;
    return <ShieldAlert size={12} />;
  };

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(7, 4, 18, 0.6)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
        padding: "16px 24px",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {/* Logo */}
        <Link href={user ? "/dashboard" : "/"} style={{ textDecoration: "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, var(--accent-purple) 0%, var(--accent-cyan) 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 10px rgba(139, 92, 246, 0.3)",
              }}
            >
              <Car color="#fff" size={22} />
            </div>
            <span
              style={{
                fontSize: "1.35rem",
                fontWeight: 800,
                letterSpacing: "-0.5px",
                background: "linear-gradient(to right, #fff, #c084fc)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Campus<span style={{ color: "var(--accent-cyan)", WebkitTextFillColor: "initial" }}>Pool</span>
            </span>
          </div>
        </Link>

        {/* Navigation & Session Links */}
        <nav style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          {loading ? (
            <div style={{ width: "80px", height: "20px", background: "var(--border)", borderRadius: "4px" }} />
          ) : user ? (
            <>
              {/* Dashboard Link */}
              <Link
                href="/dashboard"
                style={{
                  color: pathname === "/dashboard" ? "#fff" : "var(--text-muted)",
                  textDecoration: "none",
                  fontWeight: 600,
                  fontSize: "0.95rem",
                  transition: "color 0.2s",
                }}
              >
                Find Rides
              </Link>
              
              <Link
                href="/rides/create"
                style={{
                  color: pathname === "/rides/create" ? "#fff" : "var(--text-muted)",
                  textDecoration: "none",
                  fontWeight: 600,
                  fontSize: "0.95rem",
                  transition: "color 0.2s",
                }}
              >
                Offer Ride
              </Link>

              {/* User profile info widget */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid var(--border)",
                  padding: "6px 14px",
                  borderRadius: "9999px",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#fff" }}>
                    {user.name}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <span className={`badge ${getTrustBadgeClass(user.trustScore)}`} style={{ padding: "1px 6px", fontSize: "0.65rem" }}>
                      {getTrustBadgeIcon(user.trustScore)}
                      Trust: {user.trustScore}%
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: "var(--border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <User size={16} color="var(--text-muted)" />
                </div>
              </div>

              {/* Logout button */}
              <button
                onClick={handleLogout}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "8px",
                  borderRadius: "8px",
                  transition: "background 0.2s, color 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(244, 63, 94, 0.1)";
                  e.currentTarget.style.color = "var(--accent-rose)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "none";
                  e.currentTarget.style.color = "var(--text-muted)";
                }}
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <Link href="/login" style={{ textDecoration: "none" }}>
              <button className="btn-primary" style={{ padding: "8px 18px", fontSize: "0.9rem" }}>
                Sign In
              </button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
