"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Send, MessageSquare } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { mapMessageFromRealtime } from "@/lib/mappers";

interface Message {
  id: string;
  rideId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
}

interface ChatBoxProps {
  rideId: string;
  currentUserId: string;
}

const useRealtime = typeof window !== "undefined" && !!process.env.NEXT_PUBLIC_SUPABASE_URL;

export default function ChatBox({ rideId, currentUserId }: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const messageIdsRef = useRef<Set<string>>(new Set());

  const addMessage = useCallback((message: Message) => {
    if (messageIdsRef.current.has(message.id)) return;
    messageIdsRef.current.add(message.id);
    setMessages((prev) => [...prev, message]);
  }, []);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/rides/${rideId}/chat`);
      if (res.ok) {
        const data = await res.json();
        messageIdsRef.current = new Set(data.messages.map((m: Message) => m.id));
        setMessages(data.messages);
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    } finally {
      setLoading(false);
    }
  }, [rideId]);

  useEffect(() => {
    fetchMessages();

    if (!useRealtime) {
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }

    let supabase;
    try {
      supabase = createSupabaseBrowserClient();
    } catch {
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }

    const channel = supabase
      .channel(`ride-chat-${rideId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `ride_id=eq.${rideId}`,
        },
        (payload) => {
          addMessage(mapMessageFromRealtime(payload.new as Record<string, unknown>));
        }
      )
      .subscribe((status) => {
        setRealtimeConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [rideId, fetchMessages, addMessage]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const res = await fetch(`/api/rides/${rideId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage }),
      });

      if (res.ok) {
        const data = await res.json();
        if (!useRealtime) {
          addMessage(data.message);
        }
        setNewMessage("");
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  return (
    <div
      className="glass-panel"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "450px",
        background: "rgba(0, 0, 0, 0.2)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "16px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: "rgba(255, 255, 255, 0.01)",
        }}
      >
        <MessageSquare size={18} color="var(--accent-cyan)" />
        <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "#fff" }}>
          Ride Coordinates Chat
        </span>
        <div
          style={{
            marginLeft: "auto",
            width: "8px",
            height: "8px",
            background: realtimeConnected || !useRealtime ? "var(--accent-emerald)" : "var(--text-muted)",
            borderRadius: "50%",
            boxShadow: realtimeConnected || !useRealtime ? "0 0 8px var(--accent-emerald)" : "none",
          }}
        />
        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
          {useRealtime ? (realtimeConnected ? "Live" : "Connecting…") : "Polling"}
        </span>
      </div>

      <div
        style={{
          flex: 1,
          padding: "16px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        {loading && messages.length === 0 ? (
          <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Loading messages...</span>
          </div>
        ) : messages.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "24px",
              textAlign: "center",
            }}
          >
            <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
              No messages yet.
            </span>
            <span style={{ color: "rgba(255, 255, 255, 0.3)", fontSize: "0.75rem" }}>
              Coordinate where to meet, cab color, license plate, or split options here.
            </span>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.userId === currentUserId;
            return (
              <div
                key={msg.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: isMe ? "flex-end" : "flex-start",
                  maxWidth: "75%",
                  alignSelf: isMe ? "flex-end" : "flex-start",
                }}
              >
                {!isMe && (
                  <span
                    style={{
                      fontSize: "0.7rem",
                      color: "var(--text-muted)",
                      marginBottom: "2px",
                      marginLeft: "4px",
                      fontWeight: 600,
                    }}
                  >
                    {msg.userName}
                  </span>
                )}
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: isMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                    background: isMe
                      ? "linear-gradient(135deg, var(--accent-purple) 0%, #7c3aed 100%)"
                      : "rgba(255, 255, 255, 0.05)",
                    border: isMe ? "none" : "1px solid var(--border)",
                    color: "#fff",
                    fontSize: "0.88rem",
                    wordBreak: "break-word",
                    boxShadow: isMe ? "0 4px 10px rgba(139, 92, 246, 0.2)" : "none",
                  }}
                >
                  {msg.content}
                </div>
                <span
                  style={{
                    fontSize: "0.65rem",
                    color: "var(--text-muted)",
                    marginTop: "3px",
                    marginRight: isMe ? "4px" : "0",
                    marginLeft: isMe ? "0" : "4px",
                  }}
                >
                  {formatTime(msg.createdAt)}
                </span>
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      <form
        onSubmit={handleSend}
        style={{
          padding: "12px 16px",
          borderTop: "1px solid var(--border)",
          background: "rgba(0, 0, 0, 0.15)",
          display: "flex",
          gap: "8px",
        }}
      >
        <input
          type="text"
          className="input-field"
          placeholder="Send coordinates or cab details..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          disabled={sending}
          style={{
            borderRadius: "20px",
            padding: "8px 16px",
            fontSize: "0.85rem",
            flex: 1,
            background: "rgba(0, 0, 0, 0.3)",
          }}
        />
        <button
          type="submit"
          disabled={sending || !newMessage.trim()}
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: newMessage.trim()
              ? "linear-gradient(135deg, var(--accent-cyan) 0%, #0891b2 100%)"
              : "rgba(255, 255, 255, 0.05)",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: newMessage.trim() ? "pointer" : "default",
            color: "#fff",
            boxShadow: newMessage.trim() ? "0 2px 8px rgba(6, 182, 212, 0.3)" : "none",
            transition: "all 0.2s",
          }}
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}
