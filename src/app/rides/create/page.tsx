"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, MapPin, MapPinCheck, 
  Calendar, Users, CreditCard, 
  FileText, CheckCircle, AlertTriangle 
} from "lucide-react";

export default function CreateRide() {
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [maxPoolSize, setMaxPoolSize] = useState("4");
  const [estimatedFare, setEstimatedFare] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [authenticating, setAuthenticating] = useState(true);
  const router = useRouter();

  // Authentication check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/me");
        if (!res.ok) {
          router.push("/login");
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        router.push("/login");
      } finally {
        setAuthenticating(false);
      }
    };
    checkAuth();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!source || !destination || !departureTime || !maxPoolSize) {
      setError("Please fill in all required fields.");
      return;
    }

    const departureDate = new Date(departureTime);
    if (departureDate.getTime() < Date.now()) {
      setError("Departure time must be a date in the future.");
      return;
    }

    const poolSize = parseInt(maxPoolSize);
    if (isNaN(poolSize) || poolSize < 2 || poolSize > 6) {
      setError("Max pool size must be a number between 2 and 6.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/rides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source,
          destination,
          departureTime: departureDate.toISOString(),
          maxPoolSize: poolSize,
          estimatedFare: parseFloat(estimatedFare) || 0,
          description,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create ride pool");
      } else {
        setSuccess("Ride pool created successfully! Redirecting...");
        setTimeout(() => {
          router.push(`/rides/${data.ride.id}`);
          router.refresh();
        }, 1200);
      }
    } catch (err) {
      setError("An error occurred. Please check your connection.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (authenticating) {
    return (
      <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", minHeight: "80vh" }}>
        <span style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>Verifying session credentials...</span>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ maxWidth: "600px", padding: "40px 24px" }}>
      {/* Back button */}
      <Link href="/dashboard" style={{ textDecoration: "none", display: "inline-flex", alignSelf: "flex-start", marginBottom: "24px" }}>
        <button className="btn-secondary" style={{ padding: "8px 16px", fontSize: "0.85rem" }}>
          <ArrowLeft size={16} /> Back to Listings
        </button>
      </Link>

      {/* Main glass card */}
      <div className="glass-panel" style={{ padding: "40px", background: "rgba(12, 8, 34, 0.4)" }}>
        <div style={{ marginBottom: "32px" }}>
          <span className="badge badge-purple" style={{ marginBottom: "12px" }}>
            Ride Offer Creator
          </span>
          <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#fff", marginBottom: "8px" }}>
            Offer a Ride Pool
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            List your destination and timing details. Other students will find your listing and request to join.
          </p>
        </div>

        {/* Error Feedback */}
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

        {/* Success Feedback */}
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
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Source Location */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)" }}>
              Starting Point (Source) *
            </label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "14px", top: "14px", color: "var(--text-muted)" }}>
                <MapPin size={16} />
              </span>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. KIIT Campus 3 Hostel"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                style={{ paddingLeft: "42px" }}
                required
              />
            </div>
          </div>

          {/* Destination Location */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)" }}>
              Destination Point *
            </label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "14px", top: "14px", color: "var(--text-muted)" }}>
                <MapPinCheck size={16} />
              </span>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Biju Patnaik Airport (BBI)"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                style={{ paddingLeft: "42px" }}
                required
              />
            </div>
          </div>

          {/* Departure Date & Time */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)" }}>
              Departure Date & Time *
            </label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "14px", top: "14px", color: "var(--text-muted)" }}>
                <Calendar size={16} />
              </span>
              <input
                type="datetime-local"
                className="input-field"
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                style={{ paddingLeft: "42px" }}
                required
              />
            </div>
          </div>

          {/* Grid for Pool Size and Estimated Fare */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            {/* Max Pool Size */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)" }}>
                Max Pool Size *
              </label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "14px", top: "14px", color: "var(--text-muted)" }}>
                  <Users size={16} />
                </span>
                <select
                  className="input-field"
                  value={maxPoolSize}
                  onChange={(e) => setMaxPoolSize(e.target.value)}
                  style={{ paddingLeft: "42px", appearance: "none", cursor: "pointer" }}
                  required
                >
                  <option value="2" style={{ background: "var(--bg-secondary)" }}>2 People</option>
                  <option value="3" style={{ background: "var(--bg-secondary)" }}>3 People</option>
                  <option value="4" style={{ background: "var(--bg-secondary)" }}>4 People</option>
                  <option value="5" style={{ background: "var(--bg-secondary)" }}>5 People</option>
                  <option value="6" style={{ background: "var(--bg-secondary)" }}>6 People</option>
                </select>
              </div>
            </div>

            {/* Estimated Total Fare */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)" }}>
                Estimated Total Fare (₹)
              </label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "14px", top: "14px", color: "var(--text-muted)" }}>
                  <CreditCard size={16} />
                </span>
                <input
                  type="number"
                  className="input-field"
                  placeholder="e.g. 500 (optional)"
                  value={estimatedFare}
                  onChange={(e) => setEstimatedFare(e.target.value)}
                  style={{ paddingLeft: "42px" }}
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Description / Extra coordinates notes */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)" }}>
              Description & Notes
            </label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "14px", top: "14px", color: "var(--text-muted)" }}>
                <FileText size={16} />
              </span>
              <textarea
                className="input-field"
                placeholder="e.g. Uber Sedan is already booked. Meet at main gate. Flight is at 1 PM."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ paddingLeft: "42px", minHeight: "80px", resize: "none" }}
              />
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{
              marginTop: "8px",
              justifyContent: "center",
              fontSize: "1rem",
              padding: "14px",
            }}
          >
            {loading ? "Creating Pool Listing..." : "Create Ride Pool Offer"}
          </button>
        </form>
      </div>
    </div>
  );
}
