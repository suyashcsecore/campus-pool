"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, Award, AlertTriangle } from "lucide-react";

interface TrustMeterProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  showDetails?: boolean;
}

export default function TrustMeter({
  score,
  size = 120,
  strokeWidth = 10,
  showDetails = true,
}: TrustMeterProps) {
  const [offset, setOffset] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  useEffect(() => {
    // Animate progress ring on mount
    const progressOffset = circumference - (score / 100) * circumference;
    const timeout = setTimeout(() => {
      setOffset(progressOffset);
    }, 100);
    return () => clearTimeout(timeout);
  }, [score, circumference]);

  // Color helper based on trust tier
  const getColor = (val: number) => {
    if (val >= 90) return "var(--accent-emerald, #10b981)"; // Elite Pooler
    if (val >= 75) return "var(--accent-cyan, #06b6d4)";    // Reliable
    return "var(--accent-rose, #f43f5e)";       // Suspended/Risk
  };

  const getTierName = (val: number) => {
    if (val >= 90) return "Elite Pooler";
    if (val >= 75) return "Reliable";
    return "Caution Needed";
  };

  const getTierIcon = (val: number) => {
    if (val >= 90) return <Award color="#34d399" size={18} />;
    if (val >= 75) return <ShieldCheck color="#22d3ee" size={18} />;
    return <AlertTriangle color="#fb7185" size={18} />;
  };

  const color = getColor(score);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
      {/* SVG Ring */}
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.05)"
            strokeWidth={strokeWidth}
          />
          {/* Foreground circle with animation */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{
              transition: "stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
        </svg>

        {/* Core display text */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff", textShadow: `0 0 10px ${color}40` }}>
            {score}
          </span>
          <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
            Trust Score
          </span>
        </div>
      </div>

      {/* Profile tier badges */}
      {showDetails && (
        <div
          className="glass-panel"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 14px",
            borderRadius: "12px",
            background: "rgba(255, 255, 255, 0.02)",
            border: "1px solid var(--border)",
          }}
        >
          {getTierIcon(score)}
          <span style={{ fontSize: "0.8rem", fontWeight: 700, color: color }}>
            {getTierName(score)}
          </span>
        </div>
      )}
    </div>
  );
}
