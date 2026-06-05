"use client";

import { useEffect, useState, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ChatBox from "@/components/ChatBox";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { 
  ArrowLeft, MapPin, MapPinCheck, 
  Calendar, Clock, CreditCard, 
  Users, CheckCircle2, UserX, 
  LogOut, ShieldAlert, Sparkles, HelpCircle 
} from "lucide-react";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone: string;
  trustScore: number;
}

interface Participant {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  userTrustScore: number;
  status: "joined" | "arrived" | "noshow" | "completed";
  reportedBy?: string[];
}

interface Message {
  id: string;
  content: string;
}

interface Ride {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorTrustScore: number;
  source: string;
  destination: string;
  departureTime: string;
  maxPoolSize: number;
  estimatedFare: number;
  status: "active" | "completed" | "cancelled";
  description: string;
  participants: Participant[];
  messages: Message[];
  availableSpots: number;
}

export default function RideWorkspace({ params }: { params: Promise<{ id: string }> }) {
  const { id: rideId } = use(params);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [ride, setRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actualFare, setActualFare] = useState("");
  const [splitResult, setSplitResult] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const router = useRouter();

  const loadWorkspace = useCallback(async () => {
    try {
      const userRes = await fetch("/api/me");
      if (!userRes.ok) {
        router.push("/login");
        return;
      }
      const userData = await userRes.json();
      setUser(userData.user);

      const rideRes = await fetch(`/api/rides/${rideId}`);
      if (!rideRes.ok) {
        setErrorMsg("Failed to load ride pool details.");
        return;
      }
      const rideData = await rideRes.json();
      setRide(rideData.ride);

      if (rideData.ride.estimatedFare) {
        setActualFare(rideData.ride.estimatedFare.toString());
      }
    } catch (error) {
      console.error("Workspace loading failed:", error);
    } finally {
      setLoading(false);
    }
  }, [rideId, router]);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;

    let supabase;
    try {
      supabase = createSupabaseBrowserClient();
    } catch {
      return;
    }

    const channel = supabase
      .channel(`ride-workspace-${rideId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "participants", filter: `ride_id=eq.${rideId}` },
        () => {
          loadWorkspace();
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rides", filter: `id=eq.${rideId}` },
        () => {
          loadWorkspace();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [rideId, loadWorkspace]);

  // Join or Leave ride
  const handleJoinLeave = async (action: "join" | "leave") => {
    setActionLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/rides/${rideId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || `Failed to ${action} pool`);
      } else {
        setSuccessMsg(data.message);
        loadWorkspace();
        router.refresh();
      }
    } catch (error) {
      setErrorMsg("Connection error. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle "Arrived at Pickup" status
  const handleArrivalToggle = async (currentStatus: string) => {
    setActionLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const nextStatus = currentStatus === "arrived" ? "joined" : "arrived";

    try {
      const res = await fetch(`/api/rides/${rideId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (res.ok) {
        setSuccessMsg(nextStatus === "arrived" ? "Marked as arrived!" : "Arrival status cancelled.");
        loadWorkspace();
      }
    } catch (error) {
      setErrorMsg("Failed to update arrival status.");
    } finally {
      setActionLoading(false);
    }
  };

  // Report no show
  const handleReportNoShow = async (reportedUserId: string) => {
    setActionLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/rides/${rideId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportedUserId }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to submit report");
      } else {
        setSuccessMsg(data.message);
        loadWorkspace();
      }
    } catch (error) {
      setErrorMsg("Failed to report participant.");
    } finally {
      setActionLoading(false);
    }
  };

  // Complete or Cancel ride (Host only)
  const handleUpdateRideStatus = async (status: "completed" | "cancelled") => {
    setActionLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/rides/${rideId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to update ride status");
      } else {
        setSuccessMsg(data.message);
        loadWorkspace();
        router.refresh();
      }
    } catch (error) {
      setErrorMsg("Connection failure.");
    } finally {
      setActionLoading(false);
    }
  };

  // Split fare calculator
  const calculateFareSplit = () => {
    if (!ride) return;
    const total = parseFloat(actualFare);
    if (isNaN(total) || total <= 0) {
      setErrorMsg("Please enter a valid bill amount.");
      return;
    }

    // Split only among attendees (status is completed, arrived or joined - excluding no-shows)
    const presentRidersCount = ride.participants.filter(p => p.status !== "noshow").length;
    if (presentRidersCount === 0) return;

    setSplitResult(Math.round(total / presentRidersCount));
  };

  // Date formatter helper
  const formatDateTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  // Check if departure time has passed (to enable no-show reporting)
  const hasDeparturePassed = () => {
    if (!ride) return false;
    return new Date(ride.departureTime).getTime() < Date.now();
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", minHeight: "80vh" }}>
        <span style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>Opening workspace console...</span>
      </div>
    );
  }

  if (!user || !ride) {
    return (
      <div className="page-container" style={{ textAlign: "center", padding: "80px 24px" }}>
        <h3 style={{ color: "var(--accent-rose)", marginBottom: "16px" }}>Error Loading Ride</h3>
        <p style={{ color: "var(--text-muted)" }}>{errorMsg || "Ride pool listing could not be found."}</p>
        <Link href="/dashboard" style={{ textDecoration: "none", marginTop: "20px" }}>
          <button className="btn-secondary">Back to Dashboard</button>
        </Link>
      </div>
    );
  }

  const isHost = ride.creatorId === user.id;
  const myParticipantRecord = ride.participants.find((p) => p.userId === user.id);
  const isParticipant = !!myParticipantRecord;
  const isFull = ride.participants.length >= ride.maxPoolSize;

  return (
    <div className="page-container" style={{ padding: "40px 24px" }}>
      {/* Back to dashboard */}
      <Link href="/dashboard" style={{ textDecoration: "none", display: "inline-flex", alignSelf: "flex-start", marginBottom: "24px" }}>
        <button className="btn-secondary" style={{ padding: "8px 16px", fontSize: "0.85rem" }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
      </Link>

      {/* Header Feedback Alerts */}
      {errorMsg && (
        <div className="badge badge-rose" style={{ width: "100%", padding: "12px 16px", borderRadius: "10px", marginBottom: "24px", textTransform: "none", letterSpacing: "normal" }}>
          <ShieldAlert size={16} style={{ flexShrink: 0, marginRight: "8px" }} />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="badge badge-emerald" style={{ width: "100%", padding: "12px 16px", borderRadius: "10px", marginBottom: "24px", textTransform: "none", letterSpacing: "normal" }}>
          <CheckCircle2 size={16} style={{ flexShrink: 0, marginRight: "8px" }} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Workspace layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "32px" }} className="lg:grid-cols-3">
        
        {/* Left Side: Ride Details & Fare splits (Span 2) */}
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }} className="lg:col-span-2">
          
          {/* Details Glass Card */}
          <div className="glass-panel glass-card-purple" style={{ padding: "32px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <span className="badge badge-purple" style={{ marginBottom: "8px" }}>
                  Active Pool
                </span>
                <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#fff" }}>
                  Ride Coordination Room
                </h2>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  Pool ID: {ride.id} • Hosted by {ride.creatorName} (Trust: {ride.creatorTrustScore}%)
                </span>
              </div>

              {/* Ride status tags */}
              <div>
                {ride.status === "completed" ? (
                  <span className="badge badge-emerald" style={{ padding: "6px 14px", fontSize: "0.85rem" }}>
                    Completed
                  </span>
                ) : ride.status === "cancelled" ? (
                  <span className="badge badge-rose" style={{ padding: "6px 14px", fontSize: "0.85rem" }}>
                    Cancelled
                  </span>
                ) : (
                  <span className="badge badge-cyan" style={{ padding: "6px 14px", fontSize: "0.85rem" }}>
                    Active Board
                  </span>
                )}
              </div>
            </div>

            {/* Route Map List */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "20px",
                background: "rgba(0, 0, 0, 0.25)",
                padding: "20px",
                borderRadius: "16px",
                border: "1px solid var(--border)",
                marginBottom: "24px",
              }}
            >
              <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                <MapPin size={18} color="var(--accent-purple)" style={{ marginTop: "3px", flexShrink: 0 }} />
                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>START POINT</span>
                  <span style={{ fontSize: "1rem", fontWeight: 700, color: "#fff" }}>{ride.source}</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                <MapPinCheck size={18} color="var(--accent-cyan)" style={{ marginTop: "3px", flexShrink: 0 }} />
                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>DESTINATION</span>
                  <span style={{ fontSize: "1rem", fontWeight: 700, color: "#fff" }}>{ride.destination}</span>
                </div>
              </div>
            </div>

            {/* Time & Est Fares Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
              <div style={{ background: "rgba(255, 255, 255, 0.02)", padding: "14px", borderRadius: "12px", border: "1px solid var(--border)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", marginBottom: "6px" }}>
                  <Calendar size={14} />
                  <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>SCHEDULED DEPARTURE</span>
                </div>
                <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "#fff" }}>
                  {formatDateTime(ride.departureTime)}
                </span>
                {hasDeparturePassed() && ride.status === "active" && (
                  <span style={{ display: "block", fontSize: "0.72rem", color: "var(--accent-rose)", marginTop: "4px" }}>
                    ⚠️ Departure time has passed.
                  </span>
                )}
              </div>

              <div style={{ background: "rgba(255, 255, 255, 0.02)", padding: "14px", borderRadius: "12px", border: "1px solid var(--border)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", marginBottom: "6px" }}>
                  <CreditCard size={14} />
                  <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>ESTIMATED TOTAL FARE</span>
                </div>
                <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "#fff" }}>
                  {ride.estimatedFare > 0 ? `₹${ride.estimatedFare}` : "To Be Decided"}
                </span>
                {ride.estimatedFare > 0 && (
                  <span style={{ display: "block", fontSize: "0.72rem", color: "var(--accent-cyan)", marginTop: "4px" }}>
                    ₹{Math.round(ride.estimatedFare / ride.participants.length)} / rider (current split)
                  </span>
                )}
              </div>
            </div>

            {/* Description Notes */}
            {ride.description && (
              <div style={{ marginBottom: "24px" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                  HOST WORKSPACE NOTES
                </span>
                <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", fontStyle: "italic", background: "rgba(0, 0, 0, 0.15)", padding: "12px 16px", borderRadius: "10px" }}>
                  "{ride.description}"
                </p>
              </div>
            )}

            {/* Core Interaction Buttons */}
            {ride.status === "active" && (
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", borderTop: "1px solid var(--border)", paddingTop: "24px" }}>
                {/* Join / Leave Actions */}
                {!isParticipant ? (
                  <button
                    onClick={() => handleJoinLeave("join")}
                    className="btn-primary"
                    disabled={actionLoading || isFull}
                    style={{ flex: 1, minWidth: "150px", justifyContent: "center" }}
                  >
                    {isFull ? "Ride Pool Full" : "Join Ride Pool"}
                  </button>
                ) : (
                  !isHost && (
                    <button
                      onClick={() => handleJoinLeave("leave")}
                      className="btn-secondary"
                      disabled={actionLoading}
                      style={{ color: "var(--accent-rose)", borderColor: "rgba(244, 63, 94, 0.3)" }}
                    >
                      <LogOut size={14} /> Leave Ride Pool
                    </button>
                  )
                )}

                {/* Arrived status toggle (Any Rider) */}
                {isParticipant && (
                  <button
                    onClick={() => handleArrivalToggle(myParticipantRecord.status)}
                    className={myParticipantRecord.status === "arrived" ? "btn-cyan" : "btn-secondary"}
                    disabled={actionLoading}
                    style={{ flex: 1, minWidth: "150px", justifyContent: "center" }}
                  >
                    {myParticipantRecord.status === "arrived" ? "✓ Arrived at Pickup" : "Mark as Arrived"}
                  </button>
                )}

                {/* Host Actions */}
                {isHost && (
                  <>
                    <button
                      onClick={() => handleUpdateRideStatus("cancelled")}
                      className="btn-secondary"
                      disabled={actionLoading}
                      style={{ color: "var(--accent-rose)", borderColor: "rgba(244, 63, 94, 0.3)" }}
                    >
                      Cancel Pool
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Fare Split Calculator Card */}
          {isParticipant && ride.status !== "cancelled" && (
            <div className="glass-panel" style={{ padding: "32px", background: "rgba(6, 182, 212, 0.02)", border: "1px solid rgba(6, 182, 212, 0.15)" }}>
              <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "12px" }}>
                <Sparkles size={20} color="var(--accent-cyan)" />
                <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#fff" }}>
                  Interactive Fare Split Calculator
                </h3>
              </div>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "20px" }}>
                Once the ride is complete, enter the actual amount billed by the cab/auto. The platform splits it fairly among students who showed up (excluding no-shows).
              </p>

              <div style={{ display: "flex", gap: "12px", alignItems: "flex-end", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: "180px" }}>
                  <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                    Actual Bill Amount (₹)
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="e.g. 560"
                    value={actualFare}
                    onChange={(e) => setActualFare(e.target.value)}
                    style={{ height: "42px" }}
                  />
                </div>
                <button
                  onClick={calculateFareSplit}
                  className="btn-cyan"
                  style={{ height: "42px", padding: "0 24px" }}
                >
                  Calculate Share
                </button>

                {isHost && ride.status === "active" && (
                  <button
                    onClick={() => handleUpdateRideStatus("completed")}
                    className="btn-primary"
                    style={{ height: "42px", background: "linear-gradient(135deg, var(--accent-emerald) 0%, #059669 100%)", boxShadow: "0 4px 15px rgba(16, 185, 129, 0.3)" }}
                    disabled={actionLoading}
                  >
                    Complete Pool & Close
                  </button>
                )}
              </div>

              {splitResult !== null && (
                <div
                  style={{
                    marginTop: "20px",
                    background: "rgba(6, 182, 212, 0.05)",
                    border: "1px solid rgba(6, 182, 212, 0.2)",
                    padding: "16px",
                    borderRadius: "12px",
                    textAlign: "center",
                  }}
                >
                  <span style={{ fontSize: "0.82rem", color: "var(--text-muted)", display: "block" }}>
                    EACH STUDENT'S SHARE (SPLIT BY {ride.participants.filter(p => p.status !== "noshow").length} RIDERS)
                  </span>
                  <span style={{ fontSize: "2rem", fontWeight: 900, color: "var(--accent-cyan)", textShadow: "0 0 10px rgba(6, 182, 212, 0.3)" }}>
                    ₹{splitResult}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Coordination Chat panel */}
          {isParticipant && (
            <ChatBox rideId={ride.id} currentUserId={user.id} />
          )}
        </div>

        {/* Right Side: Participants Panel (Span 1) */}
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          
          {/* Participants glass card */}
          <div className="glass-panel" style={{ padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#fff" }}>
                Riders Pool ({ride.participants.length}/{ride.maxPoolSize})
              </h3>
              <span className="badge badge-purple" style={{ fontSize: "0.65rem" }}>
                {ride.maxPoolSize - ride.participants.length} spots left
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {ride.participants.map((part) => {
                const isPartCreator = part.userId === ride.creatorId;
                const isMe = part.userId === user.id;
                
                // Determine color for status
                const getStatusColor = (status: string) => {
                  if (status === "arrived") return "var(--accent-emerald)";
                  if (status === "noshow") return "var(--accent-rose)";
                  return "var(--accent-purple)";
                };

                return (
                  <div
                    key={part.id}
                    style={{
                      padding: "16px",
                      background: "rgba(255, 255, 255, 0.02)",
                      border: "1px solid var(--border)",
                      borderRadius: "12px",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    {/* Status vertical band */}
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: "4px",
                        background: getStatusColor(part.status),
                      }}
                    />

                    {/* Rider Info Row */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                      <div>
                        <span style={{ fontSize: "0.92rem", fontWeight: 700, color: "#fff", display: "block" }}>
                          {part.userName} {isMe && "(You)"}
                        </span>
                        <a
                          href={`mailto:${part.userEmail}`}
                          style={{ fontSize: "0.72rem", color: "var(--accent-cyan)", textDecoration: "none", display: "block" }}
                        >
                          {part.userEmail}
                        </a>
                        <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block" }}>
                          📞 {part.userPhone}
                        </span>
                      </div>
                      
                      {/* Host Tag */}
                      {isPartCreator && (
                        <span className="badge badge-purple" style={{ fontSize: "0.6rem", padding: "0 6px" }}>
                          Host
                        </span>
                      )}
                    </div>

                    {/* Trust Score & Status display */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: "12px",
                        paddingTop: "10px",
                        borderTop: "1px solid rgba(255, 255, 255, 0.05)",
                      }}
                    >
                      <span
                        className={`badge ${
                          part.userTrustScore >= 90 
                            ? "badge-emerald" 
                            : part.userTrustScore >= 75 
                            ? "badge-cyan" 
                            : "badge-rose"
                        }`}
                        style={{ fontSize: "0.62rem", padding: "0 6px" }}
                      >
                        Trust Score: {part.userTrustScore}%
                      </span>

                      {/* Participant Status */}
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          color: getStatusColor(part.status),
                          textTransform: "uppercase",
                        }}
                      >
                        {part.status === "arrived" && "✓ Arrived"}
                        {part.status === "joined" && "Joined"}
                        {part.status === "noshow" && "No Show 🚫"}
                        {part.status === "completed" && "Completed"}
                      </span>
                    </div>

                    {/* Report No-Show panel */}
                    {isParticipant && !isMe && ride.status === "active" && part.status !== "noshow" && hasDeparturePassed() && (
                      <div
                        style={{
                          marginTop: "14px",
                          borderTop: "1px dashed rgba(255, 255, 255, 0.08)",
                          paddingTop: "10px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span style={{ fontSize: "0.7rem", color: "var(--accent-rose)", display: "flex", alignItems: "center", gap: "4px" }}>
                          <ShieldAlert size={12} /> Rider missing?
                        </span>
                        
                        <button
                          onClick={() => handleReportNoShow(part.userId)}
                          className="btn-secondary"
                          style={{
                            padding: "4px 8px",
                            fontSize: "0.7rem",
                            borderColor: "rgba(244, 63, 94, 0.2)",
                            color: "var(--accent-rose)",
                            borderRadius: "6px",
                            height: "auto",
                          }}
                          disabled={part.reportedBy?.includes(user.id)}
                        >
                          <UserX size={10} /> {part.reportedBy?.includes(user.id) ? "Reported" : "Report No-Show"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Account Guidelines Widget */}
          <div className="glass-panel" style={{ padding: "24px", background: "rgba(255, 255, 255, 0.01)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <HelpCircle size={16} color="var(--accent-purple)" />
              <h4 style={{ fontSize: "0.9rem", fontWeight: 700, color: "#fff" }}>
                Campus Pool Guidelines
              </h4>
            </div>
            
            <ul style={{ paddingLeft: "16px", color: "var(--text-muted)", fontSize: "0.8rem", display: "flex", flexDirection: "column", gap: "8px" }}>
              <li>
                <strong>Arrival:</strong> Click "Mark as Arrived" when you reach the pickup location so other riders know you are ready.
              </li>
              <li>
                <strong>No-Shows:</strong> If a student does not show up by the scheduled departure time, the other riders can report them.
              </li>
              <li>
                <strong>Penalty:</strong> A confirmed no-show consensus reduces the rider's Trust Score by 15 points.
              </li>
              <li>
                <strong>Trust Rating:</strong> Riders below 70% Trust Score display warnings, and may be blocked from joining elite pools.
              </li>
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
}
