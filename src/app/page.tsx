"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, ShieldCheck, CreditCard, Star, Users, Navigation, Landmark } from "lucide-react";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if user has active session
    fetch("/api/me")
      .then((res) => {
        if (res.ok) setIsLoggedIn(true);
      })
      .catch(() => {});
  }, []);

  return (
    <div style={{ position: "relative", overflow: "hidden", flex: 1 }}>
      {/* Background Animated Gradient Mesh */}
      <div
        style={{
          position: "absolute",
          top: "-20%",
          left: "-10%",
          width: "600px",
          height: "600px",
          background: "radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)",
          filter: "blur(80px)",
          zIndex: -1,
        }}
        className="animate-spin-slow"
      />
      <div
        style={{
          position: "absolute",
          bottom: "-10%",
          right: "-10%",
          width: "500px",
          height: "500px",
          background: "radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, transparent 70%)",
          filter: "blur(80px)",
          zIndex: -1,
        }}
        className="animate-spin-slow"
      />

      {/* Main Container */}
      <div className="page-container" style={{ padding: "80px 24px 120px 24px" }}>
        
        {/* Badge Intro */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
          <span className="badge badge-purple" style={{ padding: "6px 14px", fontSize: "0.8rem" }}>
            🚀 Re-Imagining College Cab Sharing
          </span>
        </div>

        {/* Hero Headline */}
        <div style={{ textAlign: "center", maxWidth: "800px", margin: "0 auto 48px auto" }}>
          <h1
            style={{
              fontSize: "3.5rem",
              fontWeight: 900,
              lineHeight: 1.15,
              letterSpacing: "-1.5px",
              marginBottom: "20px",
            }}
          >
            Never Ride Alone. <br />
            <span
              style={{
                background: "linear-gradient(to right, var(--accent-purple), var(--accent-cyan))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Split Cabs, Save Money.
            </span>
          </h1>
          
          <p
            style={{
              fontSize: "1.2rem",
              color: "var(--text-muted)",
              lineHeight: 1.6,
              maxWidth: "600px",
              margin: "0 auto",
            }}
          >
            CampusPool connects college students traveling to the same destinations. Coordinate rides securely, verify peers by college email, and penalize no-shows with automated trust ratings.
          </p>
        </div>

        {/* CTAs */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "16px",
            marginBottom: "80px",
            flexWrap: "wrap",
          }}
        >
          <Link href={isLoggedIn ? "/dashboard" : "/login"} style={{ textDecoration: "none" }}>
            <button className="btn-primary" style={{ fontSize: "1.05rem", padding: "14px 32px" }}>
              Find Ride Pools <ArrowRight size={18} />
            </button>
          </Link>
          <a href="#how-it-works" style={{ textDecoration: "none" }}>
            <button className="btn-secondary" style={{ fontSize: "1.05rem", padding: "14px 32px" }}>
              How it Works
            </button>
          </a>
        </div>

        {/* Value Proposition Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "24px",
            marginBottom: "100px",
          }}
        >
          {/* Card 1: College Locked */}
          <div className="glass-panel glass-card-purple" style={{ padding: "32px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: "rgba(139, 92, 246, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "20px",
                border: "1px solid rgba(139, 92, 246, 0.2)",
              }}
            >
              <ShieldCheck size={24} color="var(--accent-purple)" />
            </div>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "12px", color: "#fff" }}>
              Verified Campus Only
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.5 }}>
              Restricted exclusively to college email addresses (e.g., <code>@kiit.ac.in</code>). Ride safely with verified members of your own student community.
            </p>
          </div>

          {/* Card 2: Cost Splitting */}
          <div className="glass-panel glass-card-cyan" style={{ padding: "32px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: "rgba(6, 182, 212, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "20px",
                border: "1px solid rgba(6, 182, 212, 0.2)",
              }}
            >
              <CreditCard size={24} color="var(--accent-cyan)" />
            </div>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "12px", color: "#fff" }}>
              Split Fare Fairly
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.5 }}>
              Enter cab quotes or final meter prices to calculate exact, fair splits based on riders count. Save up to 75% on standard travel fares.
            </p>
          </div>

          {/* Card 3: Accountability Trust Scores */}
          <div className="glass-panel glass-card-rose" style={{ padding: "32px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: "rgba(244, 63, 94, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "20px",
                border: "1px solid rgba(244, 63, 94, 0.2)",
              }}
            >
              <Star size={24} color="var(--accent-rose)" />
            </div>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "12px", color: "#fff" }}>
              Rider Accountability
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.5 }}>
              If a rider fails to show up on schedule, other riders can file a report. Verified no-shows drop their Trust Score, filtering out unreliable poolers.
            </p>
          </div>
        </div>

        {/* Stats Panel */}
        <div
          className="glass-panel"
          style={{
            padding: "40px",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-around",
            gap: "32px",
            textAlign: "center",
            background: "rgba(255, 255, 255, 0.02)",
            marginBottom: "100px",
          }}
        >
          <div>
            <span
              style={{
                fontSize: "2.5rem",
                fontWeight: 800,
                color: "#fff",
                display: "block",
                marginBottom: "4px",
              }}
            >
              5,200+
            </span>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
              Student Rides Pool
            </span>
          </div>
          <div>
            <span
              style={{
                fontSize: "2.5rem",
                fontWeight: 800,
                color: "var(--accent-cyan)",
                display: "block",
                marginBottom: "4px",
              }}
            >
              ₹12.5L+
            </span>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
              Student Fare Saved
            </span>
          </div>
          <div>
            <span
              style={{
                fontSize: "2.5rem",
                fontWeight: 800,
                color: "var(--accent-purple)",
                display: "block",
                marginBottom: "4px",
              }}
            >
              98.2%
            </span>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
              Ride On-Time Rate
            </span>
          </div>
        </div>

        {/* How It Works Section */}
        <div id="how-it-works" style={{ scrollMarginTop: "100px" }}>
          <h2
            style={{
              fontSize: "2rem",
              fontWeight: 800,
              textAlign: "center",
              marginBottom: "50px",
              color: "#fff",
            }}
          >
            How CampusPool Works
          </h2>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "40px",
              maxWidth: "700px",
              margin: "0 auto",
            }}
          >
            {/* Step 1 */}
            <div style={{ display: "flex", gap: "24px", alignItems: "flex-start" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: "rgba(139, 92, 246, 0.15)",
                  border: "1px solid var(--accent-purple)",
                  color: "var(--accent-purple)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  flexShrink: 0,
                }}
              >
                1
              </div>
              <div>
                <h4 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "6px", color: "#fff" }}>
                  Join with College Email
                </h4>
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                  Sign up with your university email. The system verifies domain patterns like KIIT (<code>@kiit.ac.in</code>) or standard college handles to block outsiders.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div style={{ display: "flex", gap: "24px", alignItems: "flex-start" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: "rgba(6, 182, 212, 0.15)",
                  border: "1px solid var(--accent-cyan)",
                  color: "var(--accent-cyan)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  flexShrink: 0,
                }}
              >
                2
              </div>
              <div>
                <h4 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "6px", color: "#fff" }}>
                  Find or Offer a Ride
                </h4>
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                  Browse the pool board filtered by starting point (campus hostels, gates) and target (airports, stations). If you don't find a matching ride, create one!
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div style={{ display: "flex", gap: "24px", alignItems: "flex-start" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: "rgba(244, 63, 94, 0.15)",
                  border: "1px solid var(--accent-rose)",
                  color: "var(--accent-rose)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  flexShrink: 0,
                }}
              >
                3
              </div>
              <div>
                <h4 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "6px", color: "#fff" }}>
                  Coordinate & Arrive
                </h4>
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                  Use the integrated coordination chat room to decide pickup points, cab details, or split settings. Click "Arrived" to let others know you've reached.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div style={{ display: "flex", gap: "24px", alignItems: "flex-start" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: "rgba(16, 185, 129, 0.15)",
                  border: "1px solid #10b981",
                  color: "#34d399",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  flexShrink: 0,
                }}
              >
                4
              </div>
              <div>
                <h4 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "6px", color: "#fff" }}>
                  Split and Rate Accountability
                </h4>
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                  Complete the ride and share the cost. Flag any rider who didn't show up. If confirmed by others, their Trust Score drops, keeping the pool clean!
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
