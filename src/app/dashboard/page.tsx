"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TrustMeter from "@/components/TrustMeter";
import { 
  Search, MapPin, Calendar, Users, 
  Plus, ArrowRight, ShieldCheck, 
  MapPinCheck, Clock, CreditCard, RefreshCw 
} from "lucide-react";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone: string;
  trustScore: number;
  completedRidesCount: number;
  noShowsCount: number;
  joinedAt: string;
}

interface Participant {
  userId: string;
  userName: string;
  status: string;
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
  availableSpots: number;
}

export default function Dashboard() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [rides, setRides] = useState<Ride[]>([]);
  const [sourceFilter, setSourceFilter] = useState("");
  const [destFilter, setDestFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [ridesLoading, setRidesLoading] = useState(false);
  const router = useRouter();

  // Authentication check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/me");
        if (!res.ok) {
          router.push("/login");
        } else {
          const data = await res.json();
          setUser(data.user);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  // Fetch ride listings
  const fetchRides = async () => {
    setRidesLoading(true);
    try {
      const params = new URLSearchParams();
      if (sourceFilter) params.append("source", sourceFilter);
      if (destFilter) params.append("destination", destFilter);
      if (dateFilter) params.append("date", dateFilter);

      const res = await fetch(`/api/rides?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setRides(data.rides);
      }
    } catch (error) {
      console.error("Failed to fetch rides:", error);
    } finally {
      setRidesLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchRides();
    }
  }, [user, sourceFilter, destFilter, dateFilter]);

  const handleClearFilters = () => {
    setSourceFilter("");
    setDestFilter("");
    setDateFilter("");
  };

  // Date formatter (e.g. "Jun 7, 09:00 AM")
  const formatDateTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", minHeight: "80vh" }}>
        <span style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>Verifying session credentials...</span>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="page-container" style={{ padding: "40px 24px" }}>
      {/* Upper Grid Layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "32px",
          marginBottom: "40px",
        }}
        className="md:grid-cols-3"
      >
        {/* User Stats Card (Span 1) */}
        <div
          className="glass-panel"
          style={{
            padding: "32px",
            background: "rgba(12, 8, 34, 0.3)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
          }}
        >
          <TrustMeter score={user.trustScore} size={130} />
          
          <h3 style={{ fontSize: "1.25rem", fontWeight: 800, marginTop: "16px", color: "#fff" }}>
            {user.name}
          </h3>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "20px" }}>
            {user.email}
          </span>

          <div
            style={{
              display: "flex",
              width: "100%",
              justifyContent: "space-around",
              borderTop: "1px solid var(--border)",
              paddingTop: "16px",
            }}
          >
            <div>
              <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "#fff", display: "block" }}>
                {user.completedRidesCount}
              </span>
              <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                Pools Completed
              </span>
            </div>
            <div style={{ borderLeft: "1px solid var(--border)", height: "40px" }} />
            <div>
              <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--accent-rose)", display: "block" }}>
                {user.noShowsCount}
              </span>
              <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                No-Shows
              </span>
            </div>
          </div>
        </div>

        {/* Dashboard Main Console (Span 2) */}
        <div
          className="glass-panel"
          style={{
            padding: "32px",
            flex: 2,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <span className="badge badge-cyan" style={{ marginBottom: "12px" }}>
              Active Ride Matching Board
            </span>
            <h2 style={{ fontSize: "2rem", fontWeight: 800, color: "#fff", marginBottom: "12px" }}>
              Pool with Verified Peers
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "24px" }}>
              Select your travel parameters below to search active pools, or create a new listing to start inviting students. Sharing divides fares and lowers travel impact.
            </p>
          </div>

          {/* Quick Filter Inputs */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "16px",
              background: "rgba(0, 0, 0, 0.25)",
              padding: "16px",
              borderRadius: "16px",
              border: "1px solid var(--border)",
            }}
          >
            <div style={{ flex: 1, minWidth: "150px", position: "relative" }}>
              <span style={{ position: "absolute", left: "12px", top: "12px", color: "var(--text-muted)" }}>
                <MapPin size={16} />
              </span>
              <input
                type="text"
                className="input-field"
                placeholder="From: Campus, Hostel..."
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                style={{ paddingLeft: "36px", fontSize: "0.85rem", height: "40px" }}
              />
            </div>

            <div style={{ flex: 1, minWidth: "150px", position: "relative" }}>
              <span style={{ position: "absolute", left: "12px", top: "12px", color: "var(--text-muted)" }}>
                <MapPinCheck size={16} />
              </span>
              <input
                type="text"
                className="input-field"
                placeholder="To: Airport, Station..."
                value={destFilter}
                onChange={(e) => setDestFilter(e.target.value)}
                style={{ paddingLeft: "36px", fontSize: "0.85rem", height: "40px" }}
              />
            </div>

            <div style={{ flex: 1, minWidth: "150px", position: "relative" }}>
              <span style={{ position: "absolute", left: "12px", top: "12px", color: "var(--text-muted)" }}>
                <Calendar size={16} />
              </span>
              <input
                type="date"
                className="input-field"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                style={{ paddingLeft: "36px", fontSize: "0.85rem", height: "40px" }}
              />
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={fetchRides}
                className="btn-cyan"
                style={{ padding: "8px 16px", height: "40px", fontSize: "0.85rem" }}
              >
                <Search size={14} /> Search
              </button>
              {(sourceFilter || destFilter || dateFilter) && (
                <button
                  onClick={handleClearFilters}
                  className="btn-secondary"
                  style={{ padding: "8px 12px", height: "40px", fontSize: "0.85rem" }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Ride Listings Title Row */}
      <div
        style={{
          display: "flex",
          justifyContent: "between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <div>
          <h3 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff" }}>
            Available Ride Pools
          </h3>
          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
            Showing {rides.length} matching ride offers
          </span>
        </div>

        <div style={{ marginLeft: "auto", display: "flex", gap: "12px" }}>
          <button
            onClick={fetchRides}
            style={{
              background: "none",
              border: "1px solid var(--border)",
              color: "var(--text-muted)",
              padding: "10px",
              borderRadius: "10px",
              cursor: "pointer",
            }}
            title="Refresh Board"
          >
            <RefreshCw size={16} className={ridesLoading ? "animate-spin" : ""} />
          </button>

          <Link href="/rides/create" style={{ textDecoration: "none" }}>
            <button className="btn-primary" style={{ padding: "10px 20px", fontSize: "0.9rem" }}>
              <Plus size={16} /> Offer a Ride
            </button>
          </Link>
        </div>
      </div>

      {/* Rides Feed Grid */}
      {ridesLoading && rides.length === 0 ? (
        <div style={{ padding: "80px", textAlign: "center" }}>
          <span style={{ color: "var(--text-muted)" }}>Updating ride listings...</span>
        </div>
      ) : rides.length === 0 ? (
        <div
          className="glass-panel"
          style={{
            padding: "80px 40px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <Users size={40} color="var(--text-muted)" style={{ opacity: 0.5 }} />
          <h4 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#fff" }}>
            No Ride Pools Found
          </h4>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", maxWidth: "400px" }}>
            There are no active carpool matches for your search filters. Be the first to create one!
          </p>
          <Link href="/rides/create" style={{ textDecoration: "none" }}>
            <button className="btn-primary" style={{ marginTop: "8px" }}>
              <Plus size={16} /> Offer a Ride
            </button>
          </Link>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
            gap: "24px",
          }}
        >
          {rides.map((ride) => {
            const isCreator = ride.creatorId === user.id;
            const isParticipant = ride.participants.some((p) => p.userId === user.id);
            const spotsCount = ride.participants.length;
            const spotsPercentage = (spotsCount / ride.maxPoolSize) * 100;
            const splitFare = ride.estimatedFare > 0 
              ? Math.round(ride.estimatedFare / spotsCount) 
              : null;

            return (
              <div
                key={ride.id}
                className="glass-panel glass-card-purple"
                style={{
                  padding: "24px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  background: isParticipant 
                    ? "rgba(139, 92, 246, 0.04)" 
                    : "rgba(255, 255, 255, 0.03)",
                  border: isParticipant 
                    ? "1px solid rgba(139, 92, 246, 0.2)" 
                    : "1px solid var(--border)",
                }}
              >
                <div>
                  {/* Host info row */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "between",
                      alignItems: "center",
                      marginBottom: "16px",
                      borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                      paddingBottom: "12px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "50%",
                          background: "var(--border)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--accent-purple)" }}>
                          {ride.creatorName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#fff", display: "block" }}>
                          {ride.creatorName} {isCreator && "(Host)"}
                        </span>
                        <span
                          className={`badge ${
                            ride.creatorTrustScore >= 90 
                              ? "badge-emerald" 
                              : ride.creatorTrustScore >= 75 
                              ? "badge-cyan" 
                              : "badge-rose"
                          }`}
                          style={{ fontSize: "0.6rem", padding: "0 6px" }}
                        >
                          Trust: {ride.creatorTrustScore}%
                        </span>
                      </div>
                    </div>
                    {/* Status badges */}
                    <div style={{ marginLeft: "auto" }}>
                      {isParticipant ? (
                        <span className="badge badge-purple" style={{ fontSize: "0.65rem" }}>
                          Joined
                        </span>
                      ) : ride.availableSpots === 0 ? (
                        <span className="badge badge-rose" style={{ fontSize: "0.65rem" }}>
                          Full
                        </span>
                      ) : (
                        <span className="badge badge-cyan" style={{ fontSize: "0.65rem" }}>
                          Active
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Route points */}
                  <div style={{ marginBottom: "16px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "8px" }}>
                      <MapPin size={16} color="var(--accent-purple)" style={{ marginTop: "3px", flexShrink: 0 }} />
                      <div>
                        <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block" }}>FROM</span>
                        <span style={{ fontSize: "0.92rem", fontWeight: 600, color: "#fff" }}>{ride.source}</span>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                      <MapPinCheck size={16} color="var(--accent-cyan)" style={{ marginTop: "3px", flexShrink: 0 }} />
                      <div>
                        <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block" }}>TO</span>
                        <span style={{ fontSize: "0.92rem", fontWeight: 600, color: "#fff" }}>{ride.destination}</span>
                      </div>
                    </div>
                  </div>

                  {/* Ride Description */}
                  {ride.description && (
                    <p
                      style={{
                        fontSize: "0.85rem",
                        color: "var(--text-muted)",
                        background: "rgba(0, 0, 0, 0.15)",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        marginBottom: "16px",
                        fontStyle: "italic",
                      }}
                    >
                      "{ride.description}"
                    </p>
                  )}

                  {/* Date/Time and Fare row */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "12px",
                      marginBottom: "20px",
                    }}
                  >
                    <div style={{ background: "rgba(255, 255, 255, 0.02)", padding: "10px", borderRadius: "10px", border: "1px solid var(--border)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", marginBottom: "4px" }}>
                        <Clock size={12} />
                        <span style={{ fontSize: "0.7rem", fontWeight: 600 }}>DEPARTURE</span>
                      </div>
                      <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#fff" }}>
                        {formatDateTime(ride.departureTime)}
                      </span>
                    </div>

                    <div style={{ background: "rgba(255, 255, 255, 0.02)", padding: "10px", borderRadius: "10px", border: "1px solid var(--border)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", marginBottom: "4px" }}>
                        <CreditCard size={12} />
                        <span style={{ fontSize: "0.7rem", fontWeight: 600 }}>ESTIMATED FARE</span>
                      </div>
                      <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#fff" }}>
                        {ride.estimatedFare > 0 ? `₹${ride.estimatedFare}` : "TBD"}
                        {splitFare && (
                          <span style={{ fontSize: "0.7rem", color: "var(--accent-cyan)", display: "block" }}>
                            ₹{splitFare} / person split
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress bar of seats filled */}
                <div style={{ marginBottom: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "0.75rem" }}>
                    <span style={{ color: "var(--text-muted)" }}>Spots Filled</span>
                    <span style={{ color: "#fff", fontWeight: 700 }}>
                      {spotsCount} of {ride.maxPoolSize}
                    </span>
                  </div>
                  <div style={{ width: "100%", height: "6px", background: "rgba(255, 255, 255, 0.05)", borderRadius: "3px", overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${spotsPercentage}%`,
                        height: "100%",
                        background: spotsPercentage === 100 
                          ? "var(--accent-rose)" 
                          : "linear-gradient(to right, var(--accent-purple), var(--accent-cyan))",
                        borderRadius: "3px",
                        transition: "width 0.4s",
                      }}
                    />
                  </div>
                </div>

                {/* Manage or View details button */}
                <Link href={`/rides/${ride.id}`} style={{ textDecoration: "none" }}>
                  <button
                    className={isParticipant ? "btn-secondary" : "btn-primary"}
                    style={{
                      width: "100%",
                      justifyContent: "center",
                      padding: "10px",
                      fontSize: "0.85rem",
                    }}
                  >
                    {isParticipant ? "Manage Ride Pool" : "View & Join Pool"}
                    <ArrowRight size={14} />
                  </button>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
