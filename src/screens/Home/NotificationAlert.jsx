import React, { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Trash2, Send, Users, CheckCircle2, AlertCircle, Loader2, Search } from "lucide-react";

const BASE_URL = "https://api.riseselfesteem.com";

const clsx = (...xs) => xs.filter(Boolean).join(" ");
const AUDIENCES = ["All", "Selected", "Free", "Premium"];
const TITLE_MAX = 80;
const MSG_MAX = 500;
const PAGE_SIZE = 12;

function formatWhen(d) {
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleString();
}

function Badge({ tone = "slate", children, className = "" }) {
  const map = {
    slate: "bg-slate-500/20 text-slate-200 border-slate-500/30",
    purple: "bg-purple-500/20 text-purple-200 border-purple-500/30",
    green: "bg-emerald-500/20 text-emerald-200 border-emerald-500/30",
    red: "bg-rose-500/20 text-rose-200 border-rose-500/30",
    blue: "bg-blue-500/20 text-blue-200 border-blue-500/30",
    amber: "bg-amber-500/20 text-amber-200 border-amber-500/30",
  };
  return (
    <span className={clsx("inline-flex items-center px-2.5 py-1 rounded-full text-xs border", map[tone], className)}>
      {children}
    </span>
  );
}

function CardSkeleton({ rows = 6 }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900">
      <div className="p-4 border-b border-gray-800 text-gray-300">Loading…</div>
      <ul className="divide-y divide-gray-800">
        {Array.from({ length: rows }).map((_, i) => (
          <li key={i} className="p-4 grid grid-cols-4 gap-4">
            <div className="h-4 bg-gray-800 rounded animate-pulse" />
            <div className="h-4 bg-gray-800 rounded animate-pulse" />
            <div className="h-4 bg-gray-800 rounded animate-pulse" />
            <div className="h-6 bg-gray-800 rounded animate-pulse" />
          </li>
        ))}
      </ul>
    </div>
  );
}

function Confirm({ open, onCancel, onConfirm, title = "Are you sure?", message = "This action cannot be undone.", busy }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-gray-900 shadow-2xl">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h4 className="text-white font-semibold">{title}</h4>
          <button onClick={onCancel} className="text-white/70 hover:text-white">✕</button>
        </div>
        <div className="p-5 text-gray-200 text-sm">{message}</div>
        <div className="p-4 border-t border-white/10 flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 rounded bg-gray-800 text-white hover:bg-gray-700">Cancel</button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="px-4 py-2 rounded bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60"
          >
            {busy ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function NotificationsManager() {
  const queryClient = useQueryClient();

  // form state
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState("All"); // All | Selected | Free | Premium
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [confirm, setConfirm] = useState({ open: false, id: null });

  // pagination for notifications
  const [page, setPage] = useState(1);

  // users
  const fetchUsers = async () => {
    const res = await fetch(`${BASE_URL}/api/auth`);
    if (!res.ok) throw new Error("Failed to fetch users");
    return res.json();
  };
  const { data: usersData, isLoading: usersLoading, isError: usersErr } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
    staleTime: 60_000,
  });

 

  const appUsers = useMemo(() => {
    const list = usersData?.users || [];
    // Only end users (role === "user")
    return list.filter((u) => u.role === "user");
  }, [usersData]);

  // derived segments (based on prior code where user.type exists: "premium" or other)
  const freeUsers = useMemo(() => appUsers.filter((u) => String(u.type).toLowerCase() !== "premium"), [appUsers]);
  const premiumUsers = useMemo(() => appUsers.filter((u) => String(u.type).toLowerCase() === "premium"), [appUsers]);

  const searchedUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return appUsers;
    return appUsers.filter((u) => (u.name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q));
  }, [appUsers, userSearch]);

  // notifications
  const fetchNotifications = async () => {
    const res = await fetch(`${BASE_URL}/api/notifications`);
    if (!res.ok) throw new Error("Failed to fetch notifications");
    const j = await res.json();
    return Array.isArray(j) ? j : j?.data || [];
  };
  const {
    data: notifications = [],
    isLoading: notifLoading,
    isError: notifErr,
    error: notifError,
  } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
    staleTime: 15_000,
  });

  // send
  const sendNotification = async (payload) => {
    const res = await fetch(`${BASE_URL}/api/notifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to send notification");
    return res.json();
  };
  const sendMutation = useMutation({
    mutationFn: sendNotification,
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      const prev = queryClient.getQueryData(["notifications"]);
      const optimistic = {
        _id: "tmp-" + Date.now(),
        title: payload.title,
        message: payload.message,
        type: payload.type,
        createdAt: new Date().toISOString(),
        __optimistic: true,
      };
      queryClient.setQueryData(["notifications"], (old = []) => [optimistic, ...old]);
      return { prev };
    },
    onError: (_e, _p, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["notifications"], ctx.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
    onSuccess: () => {
      setTitle("");
      setMessage("");
      setSelectedUsers([]);
      setAudience("All");
    },
  });

  // delete
  const deleteNotification = async (id) => {
    const res = await fetch(`${BASE_URL}/api/notifications/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete notification");
    return res.json();
  };
  const deleteMutation = useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  // audience quick actions
  useEffect(() => {
    if (audience === "Selected") return; // manual
    if (audience === "All") setSelectedUsers(appUsers.map((u) => u._id));
    if (audience === "Free") setSelectedUsers(freeUsers.map((u) => u._id));
    if (audience === "Premium") setSelectedUsers(premiumUsers.map((u) => u._id));
  }, [audience, appUsers, freeUsers, premiumUsers]);

  const toggleOne = (id) =>
    setSelectedUsers((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const toggleAllVisible = () => {
    const ids = searchedUsers.map((u) => u._id);
    const allSelected = ids.every((id) => selectedUsers.includes(id)) && ids.length > 0;
    if (allSelected) {
      setSelectedUsers((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      const merged = new Set([...selectedUsers, ...ids]);
      setSelectedUsers([...merged]);
    }
  };

  const valid = title.trim().length > 0 && title.trim().length <= TITLE_MAX && message.trim().length > 0 && message.trim().length <= MSG_MAX;
  const willSendTo = audience === "Selected" ? selectedUsers.length : (audience === "All" ? appUsers.length : audience === "Free" ? freeUsers.length : premiumUsers.length);

// Sort notifications by createdAt DESC (newest first)
const sortedNotifications = useMemo(() => {
  return [...notifications].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
}, [notifications]);

// Pagination over the sorted list
const totalPages = Math.max(1, Math.ceil(sortedNotifications.length / PAGE_SIZE));
const pageSafe = Math.min(page, totalPages);
const pageSlice = sortedNotifications.slice(
  (pageSafe - 1) * PAGE_SIZE,
  pageSafe * PAGE_SIZE
);

  const handleSend = () => {
    if (!valid) return;
    const payload =
      audience === "All"
        ? { title: title.trim(), message: message.trim(), type: "general" }
        : { title: title.trim(), message: message.trim(), type: "personal", userIds: selectedUsers };
    sendMutation.mutate(payload);
  };

  return (
    <div className="p-6 bg-gray-900 rounded-2xl shadow-2xl border border-gray-800 text-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-purple-400 flex items-center gap-2">
          <Bell size={22} /> Notifications
        </h2>
        <Badge tone="purple" className="hidden sm:inline-flex"><Users className="w-3.5 h-3.5 mr-1" /> {appUsers.length} users</Badge>
      </div>

      {/* Composer */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4 md:p-5 mb-8">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-400">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={TITLE_MAX}
              placeholder="Weekly update…"
              className="mt-1 w-full px-4 py-2 rounded-xl bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-purple-500"
            />
            <div className={clsx("text-right text-[11px] mt-1", title.length > TITLE_MAX ? "text-rose-400" : "text-gray-400")}>
              {title.length}/{TITLE_MAX}
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400">Message</label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={MSG_MAX}
              placeholder="Short, clear message to your users…"
              className="mt-1 w-full px-4 py-2 rounded-xl bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-purple-500"
            />
            <div className={clsx("text-right text-[11px] mt-1", message.length > MSG_MAX ? "text-rose-400" : "text-gray-400")}>
              {message.length}/{MSG_MAX}
            </div>
          </div>
        </div>

        {/* Audience */}
        <div className="mt-4">
          <label className="text-xs text-gray-400">Send to</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {AUDIENCES.map((a) => (
              <button
                key={a}
                onClick={() => setAudience(a)}
                className={clsx(
                  "px-3 py-1.5 rounded-lg border text-sm",
                  audience === a
                    ? "bg-purple-600 border-purple-500 text-white"
                    : "bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700"
                )}
              >
                {a}
              </button>
            ))}
            <Badge tone="amber" className="ml-auto">{willSendTo} recipient{willSendTo === 1 ? "" : "s"}</Badge>
          </div>
        </div>

        {/* User picker (only for Selected) */}
        {audience === "Selected" && (
          <div className="mt-4 rounded-xl border border-gray-800 bg-gray-900/50 p-3">
            {usersLoading ? (
              <div className="flex items-center gap-2 text-gray-300"><Loader2 className="animate-spin" size={16} /> Loading users…</div>
            ) : usersErr ? (
              <div className="flex items-center gap-2 text-rose-400"><AlertCircle size={16} /> Failed to load users</div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 text-gray-400" size={16} />
                    <input
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="Search users by name or email"
                      className="w-full pl-8 pr-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm"
                    />
                  </div>
                  <button
                    onClick={toggleAllVisible}
                    className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm hover:bg-gray-700"
                  >
                    {searchedUsers.every((u) => selectedUsers.includes(u._id)) && searchedUsers.length > 0
                      ? "Deselect All (visible)"
                      : "Select All (visible)"}
                  </button>
                </div>

                <div className="max-h-56 overflow-y-auto rounded-lg border border-gray-800">
                  {searchedUsers.length === 0 ? (
                    <div className="p-3 text-gray-400 text-sm">No users match your search.</div>
                  ) : (
                    <ul className="divide-y divide-gray-800">
                      {searchedUsers.map((u) => (
                        <li key={u._id} className="flex items-center gap-2 p-2 hover:bg-gray-800">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(u._id)}
                            onChange={() => toggleOne(u._id)}
                          />
                          <span className="text-sm">
                            {u.name || "Unnamed"} <span className="text-gray-400">({u.email})</span>
                          </span>
                          {String(u.type).toLowerCase() === "premium" ? (
                            <Badge tone="green" className="ml-auto">Premium</Badge>
                          ) : (
                            <Badge tone="slate" className="ml-auto">Free</Badge>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="text-right text-xs text-gray-400 mt-2">{selectedUsers.length} selected</div>
              </>
            )}
          </div>
        )}

        <button
          onClick={handleSend}
          disabled={!valid || (audience === "Selected" && selectedUsers.length === 0) || sendMutation.isLoading}
          className={clsx(
            "w-full mt-4 py-2 rounded-xl font-bold flex items-center justify-center gap-2",
            valid && !(audience === "Selected" && selectedUsers.length === 0) && !sendMutation.isLoading
              ? "bg-purple-600 hover:bg-purple-700"
              : "bg-gray-700 cursor-not-allowed"
          )}
        >
          {sendMutation.isLoading ? (
            <>
              <Loader2 className="animate-spin" size={18} /> Sending…
            </>
          ) : (
            <>
              <Send size={18} /> Send
              <span className="opacity-80">({willSendTo})</span>
            </>
          )}
        </button>

        {/* Tiny guidance */}
        <div className="mt-3 text-xs text-gray-400 flex items-center gap-1">
          <CheckCircle2 size={14} className="text-emerald-400" />
          Title & message are required. Keep it concise for better delivery.
        </div>
      </div>

      {/* Notifications table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl font-bold text-purple-400">Notifications</h3>
          <div className="flex items-center gap-2">
            <Badge tone="slate">{notifications.length} total</Badge>
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-2 py-1 rounded bg-gray-800 border border-gray-700 hover:bg-gray-700"
                >
                  Prev
                </button>
                <span className="text-sm text-gray-300 px-1">
                  {pageSafe}/{totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-2 py-1 rounded bg-gray-800 border border-gray-700 hover:bg-gray-700"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>

        {notifLoading ? (
          <CardSkeleton rows={6} />
        ) : notifErr ? (
          <div className="p-4 rounded-xl border border-rose-700/40 bg-rose-900/20 text-rose-200 flex items-center gap-2">
            <AlertCircle size={18} /> {notifError?.message || "Failed to load notifications"}
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-6 text-center rounded-xl border border-gray-800 bg-gray-900/60 text-gray-400">
            No notifications yet
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-800">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-800">
                <tr className="text-left">
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Message</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Created</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {pageSlice.map((n) => (
                  <tr
                    key={n._id}
                    className={clsx(
                      "border-b border-gray-800",
                      n.__optimistic ? "bg-amber-900/10" : "hover:bg-gray-800"
                    )}
                  >
                    <td className="py-2 px-4">{n.title}</td>
                    <td className="py-2 px-4">{n.message}</td>
                    <td className="py-2 px-4 capitalize">
                      {n.type === "personal" ? <Badge tone="blue">Personal</Badge> : <Badge tone="green">General</Badge>}
                    </td>
                    <td className="py-2 px-4">{formatWhen(n.createdAt)}</td>
                    <td className="py-2 px-4 text-center">
                      <button
                        onClick={() => setConfirm({ open: true, id: n._id })}
                        disabled={deleteMutation.isLoading || n.__optimistic}
                        className="text-red-400 hover:text-red-500 inline-flex items-center gap-1 disabled:opacity-50"
                        title={n.__optimistic ? "Pending…" : "Delete"}
                      >
                        <Trash2 size={16} />
                        {deleteMutation.isLoading && confirm.id === n._id ? "…" : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete confirm */}
      <Confirm
        open={confirm.open}
        busy={deleteMutation.isLoading}
        onCancel={() => setConfirm({ open: false, id: null })}
        onConfirm={() => {
          if (!confirm.id) return;
          deleteMutation.mutate(confirm.id, {
            onSettled: () => setConfirm({ open: false, id: null }),
          });
        }}
        title="Delete notification?"
        message="This will permanently remove the notification."
      />
    </div>
  );
}
