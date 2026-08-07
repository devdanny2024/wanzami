'use client';

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Bell } from "lucide-react";
import Link from "next/link";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type CreatorNotification,
} from "@/lib/creatorClient";
import { INK, MUTED, PAPER, RUST } from "./kit";

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<CreatorNotification[]>([]);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Just the unread count on mount, so the badge is right without opening.
    fetchNotifications()
      .then((res) => setUnreadCount(res.unreadCount))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next && !loaded) {
      try {
        const res = await fetchNotifications();
        setNotifications(res.notifications);
        setUnreadCount(res.unreadCount);
        setLoaded(true);
      } catch {
        // Bell just stays empty; not worth a hard error state for a dropdown.
      }
    }
  };

  const readAll = async () => {
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    await markAllNotificationsRead();
  };

  const readOne = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
    await markNotificationRead(id);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => void toggle()}
        className="relative inline-flex items-center hover:opacity-70"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span
            className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 font-mono text-[9px] font-bold"
            style={{ backgroundColor: RUST, color: PAPER }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-8 z-50 w-80 border-[2.5px] shadow-[5px_5px_0_#161310]"
            style={{ borderColor: INK, backgroundColor: PAPER }}
          >
            <div className="flex items-center justify-between border-b-2 px-4 py-3" style={{ borderColor: INK }}>
              <span className="font-mono text-[11px] font-bold uppercase tracking-wide">Notifications</span>
              {unreadCount > 0 && (
                <button onClick={() => void readAll()} className="font-mono text-[10px] uppercase underline" style={{ color: MUTED }}>
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm" style={{ color: MUTED }}>Nothing yet.</p>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => !n.isRead && void readOne(n.id)}
                    className="block w-full border-b px-4 py-3 text-left"
                    style={{ borderColor: "#e2d6bd", backgroundColor: n.isRead ? "transparent" : "#f7ead9" }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-mono text-[12px] font-bold">{n.title}</p>
                      {!n.isRead && <span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: RUST }} />}
                    </div>
                    <p className="mt-1 text-sm" style={{ color: "#3c342a" }}>{n.body}</p>
                    <p className="mt-1 font-mono text-[10px]" style={{ color: MUTED }}>{timeAgo(n.createdAt)}</p>
                  </button>
                ))
              )}
            </div>
            <div className="border-t-2 px-4 py-2 text-center" style={{ borderColor: INK }}>
              <Link href="/creators/dashboard" onClick={() => setOpen(false)} className="font-mono text-[10px] uppercase" style={{ color: MUTED }}>
                Close
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
