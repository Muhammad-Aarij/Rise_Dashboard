import React, { useState, useEffect, useRef, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import prof from "../../assets/prof.png";

const BASE_URL = "https://api.riseselfesteem.com";
const CURRENT_USER_ID = "6854f3663e37aad6eff91113";

/* -------------------- Time helpers -------------------- */
const formatTimeAgo = (isoDateString) => {
  if (!isoDateString) return "";
  const date = new Date(isoDateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

/* -------------------- Initials helper -------------------- */
const getInitials = (user = {}) => {
  if (!user) return "U";
  const name = (user.name || "").trim();
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }
  const email = (user.email || "").trim();
  if (email) return email.charAt(0).toUpperCase();
  return "U";
};

/* -------------------- Cache helpers -------------------- */
const getCachedNewestMessage = (qc, roomId) => {
  const cached = qc.getQueryData(["messages", roomId]);
  if (!Array.isArray(cached) || cached.length === 0) return null;
  return [...cached].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
};

const getRoomLastActivityISO = (room, qc) => {
  const fromLatest = room?.latestMessage?.createdAt || null;
  const fromRoom = room?.lastMessage?.createdAt || room?.lastMessageAt || null;
  const cachedNewest = getCachedNewestMessage(qc, room?._id);
  const fromCache = cachedNewest?.createdAt || null;

  return (
    fromLatest ||
    fromRoom ||
    fromCache ||
    room?.updatedAt ||
    room?.createdAt ||
    null
  );
};

/* -------------------- Small UI styles -------------------- */
const NoScrollbarStyle = () => (
  <style>{`
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    .no-scrollbar::-webkit-scrollbar { display: none; }
  `}</style>
);

/* -------------------- Skeletons -------------------- */
const RoomSkeleton = () => (
  <div className="animate-pulse space-y-3">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-slate-600/20" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-2/3 bg-slate-600/20 rounded" />
          <div className="h-3 w-1/2 bg-slate-600/10 rounded" />
        </div>
      </div>
    ))}
  </div>
);

const MessageSkeleton = () => (
  <div className="animate-pulse space-y-3">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className={`flex ${i % 2 ? "justify-end" : ""}`}>
        <div className="bg-slate-700/20 h-6 rounded-2xl w-56" />
      </div>
    ))}
  </div>
);

export default function ChatScreen() {
  const queryClient = useQueryClient();
  const messagesTopRef = useRef(null);

  const [selectedChatRoom, setSelectedChatRoom] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [roomSearch, setRoomSearch] = useState("");

  /* -------------------- Fetch chat rooms -------------------- */
  const {
    data: chatRooms = [],
    isLoading: isLoadingChatRooms,
    error: chatRoomsError,
  } = useQuery({
    queryKey: ["chatRooms"],
    queryFn: async () => {
      const res = await axios.get(`${BASE_URL}/api/chat`);
      return res.data;
    },
    staleTime: 10_000,
  });

  /* -------------------- Fetch messages -------------------- */
  const {
    data: messages = [],
    isLoading: isLoadingMessages,
    error: messagesError,
  } = useQuery({
    queryKey: ["messages", selectedChatRoom?._id],
    queryFn: async () => {
      if (!selectedChatRoom?._id) return [];
      const res = await axios.get(`${BASE_URL}/api/chat/${selectedChatRoom._id}`);
      return res.data;
    },
    enabled: !!selectedChatRoom?._id,
    onSuccess: (msgs) => {
      if (!selectedChatRoom?._id || !Array.isArray(msgs) || msgs.length === 0) return;
      const newest = [...msgs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
      if (!newest) return;
      queryClient.setQueryData(["chatRooms"], (old = []) =>
        old.map((r) =>
          r._id === selectedChatRoom._id
            ? {
                ...r,
                latestMessage: {
                  ...(r.latestMessage || {}),
                  message: newest.message,
                  createdAt: newest.createdAt,
                  sender: newest.sender,
                },
                lastMessage: {
                  ...(r.lastMessage || {}),
                  message: newest.message,
                  createdAt: newest.createdAt,
                  sender: newest.sender,
                },
                updatedAt: newest.createdAt,
              }
            : r
        )
      );
    },
  });

  const sortedMessages = useMemo(
    () =>
      Array.isArray(messages)
        ? [...messages].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        : [],
    [messages]
  );

  /* -------------------- Send message -------------------- */
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData) => {
      const res = await axios.post(`${BASE_URL}/api/chat`, messageData);
      return res.data;
    },
    onSuccess: (created) => {
      if (selectedChatRoom?._id) {
        queryClient.invalidateQueries(["messages", selectedChatRoom._id]);
      }
      setNewMessage("");

      queryClient.setQueryData(["chatRooms"], (old = []) =>
        old.map((r) =>
          r._id === selectedChatRoom?._id
            ? {
                ...r,
                latestMessage: {
                  ...(r.latestMessage || {}),
                  message: created?.message || "",
                  createdAt: created?.createdAt || new Date().toISOString(),
                  sender: created?.sender,
                },
                updatedAt: created?.createdAt || new Date().toISOString(),
              }
            : r
        )
      );

      setTimeout(() => {
        messagesTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 0);
    },
  });

  useEffect(() => {
    messagesTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [selectedChatRoom?._id]);

  const handleSendMessage = () => {
    if (newMessage.trim() === "" || !selectedChatRoom) return;
    sendMessageMutation.mutate({
      chatRoom: selectedChatRoom._id,
      sender: CURRENT_USER_ID,
      message: newMessage,
    });
  };

  /* -------------------- Header info -------------------- */
  const getChatHeaderInfo = () => {
    if (!selectedChatRoom) return { name: "Select a chat", avatar: "", online: false, email: "" };
    const otherParticipant =
      selectedChatRoom.participants?.find((p) => p._id !== CURRENT_USER_ID) ||
      selectedChatRoom.latestMessage?.sender ||
      null;
    return {
      name: otherParticipant?.name || "Unknown User",
      email: otherParticipant?.email || "",
      avatar: otherParticipant?.avatar || "",
      online: otherParticipant?.status === "active",
    };
  };
  const { name: headerName, avatar: headerAvatar, online: headerOnline, email: headerEmail } =
    getChatHeaderInfo();

  /* -------------------- rooms sorted + search -------------------- */
  const roomsSortedByActivity = useMemo(() => {
    const arr = [...chatRooms].sort((a, b) => {
      const aISO = getRoomLastActivityISO(a, queryClient);
      const bISO = getRoomLastActivityISO(b, queryClient);
      return (bISO ? +new Date(bISO) : 0) - (aISO ? +new Date(aISO) : 0);
    });

    if (!roomSearch.trim()) return arr;
    const q = roomSearch.toLowerCase();
    return arr.filter((room) => {
      const other =
        room.participants?.find((p) => p._id !== CURRENT_USER_ID) ||
        room.latestMessage?.sender;
      return (
        other?.name?.toLowerCase().includes(q) ||
        other?.email?.toLowerCase().includes(q) ||
        room?.latestMessage?.message?.toLowerCase().includes(q) ||
        room?.lastMessage?.message?.toLowerCase().includes(q)
      );
    });
  }, [chatRooms, roomSearch, queryClient]);

  return (
    <div className="flex h-screen bg-[#0A0D1A] text-white font-inter overflow-hidden">
      <NoScrollbarStyle />

      {/* LEFT: conversations */}
      <aside className="w-80 border-r border-white/5 bg-[radial-gradient(circle_at_top,#141B3A_0%,#080A18_50%,#050712_100%)] flex flex-col">
        <div className="px-5 pt-5 pb-4 border-b border-white/5">
          <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Inbox
          </h2>
          <p className="text-xs text-slate-300/80 mt-1">
            {roomsSortedByActivity.length} conversations
          </p>
          <div className="mt-4 flex items-center gap-2 bg-white/5 rounded-xl px-3">
            <svg
              className="w-4 h-4 text-slate-300/70"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              value={roomSearch}
              onChange={(e) => setRoomSearch(e.target.value)}
              placeholder="Search user or message"
              className="flex-1 bg-transparent py-2 text-sm placeholder:text-slate-400 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar px-3 py-3 space-y-2">
          {isLoadingChatRooms ? (
            <RoomSkeleton />
          ) : chatRoomsError ? (
            <div className="text-center text-rose-300 text-sm">
              Failed to load chats: {chatRoomsError.message}
            </div>
          ) : roomsSortedByActivity.length === 0 ? (
            <div className="text-center text-slate-300/70 text-sm py-10">
              No chat rooms yet.
            </div>
          ) : (
            roomsSortedByActivity.map((room) => {
              const other =
                room.participants?.find((p) => p._id !== CURRENT_USER_ID) ||
                room.latestMessage?.sender ||
                {};
              const isActive = selectedChatRoom?._id === room._id;
              const online = other?.status === "active";

              const lastISO = getRoomLastActivityISO(room, queryClient);
              const lastMessageTime = formatTimeAgo(lastISO);

              const previewText =
                room?.latestMessage?.message ||
                room?.lastMessage?.message ||
                getCachedNewestMessage(queryClient, room._id)?.message ||
                "";

              const initials = getInitials(other);

              return (
                <button
                  key={room._id}
                  onClick={() => setSelectedChatRoom(room)}
                  className={[
                    "w-full flex items-center gap-3 rounded-xl px-3 py-2 transition",
                    isActive
                      ? "bg-gradient-to-r from-indigo-500/80 to-sky-500/40 shadow-lg shadow-sky-900/30"
                      : "hover:bg-white/5",
                  ].join(" ")}
                >
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-sky-500/90 text-white flex items-center justify-center text-sm font-semibold border border-white/10">
                      {initials}
                    </div>
                    <span
                      className={[
                        "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0A0D1A]",
                        online ? "bg-emerald-400" : "bg-slate-500",
                      ].join(" ")}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">
                        {other.name || "Unknown"}
                      </span>
                      <span className="text-[10px] text-slate-200/60 ml-auto whitespace-nowrap">
                        {lastMessageTime}
                      </span>
                    </div>
                    <p className="text-xs text-left text-slate-200/70 truncate mt-0.5">
                      {previewText || <span className="opacity-30">No messages</span>}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* RIGHT: chat */}
      <main className="flex-1 flex flex-col bg-[radial-gradient(circle_at_10%_10%,#151A32_0%,#090B16_50%,#060712_100%)]">
        <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-black/10 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center font-semibold">
                {getInitials({ name: headerName, email: headerEmail })}
              </div>
            </div>
            <div>
              <div className="font-semibold">{headerName}</div>
              <div className="text-xs text-slate-300/70">
                {selectedChatRoom ? (headerOnline ? "Online" : "Offline") : ""}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <HeaderIcon label="Call">
              <PhoneIcon />
            </HeaderIcon>
            <HeaderIcon label="Video">
              <VideoIcon />
            </HeaderIcon>
          </div>
        </header>

        <section className="flex-1 p-5 overflow-y-auto no-scrollbar space-y-4">
          <div ref={messagesTopRef} />
          {isLoadingMessages ? (
            <MessageSkeleton />
          ) : messagesError ? (
            <div className="text-center text-rose-300 text-sm mt-10">
              Failed to load messages: {messagesError.message}
            </div>
          ) : sortedMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center mt-16 text-slate-200/70 text-sm">
              <div className="w-10 h-10 rounded-full bg-slate-800/40 flex items-center justify-center mb-3">
                💬
              </div>
              No messages yet — say hi!
            </div>
          ) : (
            sortedMessages.map((m) => {
              // 👇 NOW: sender is null → RIGHT (admin)
              if (!m.sender) {
                return (
                  <div key={m._id} className="flex items-start gap-3 justify-end">
                    <div className="max-w-[65%] sm:max-w-[55%] lg:max-w-[45%]">
                      <div className="px-4 py-2 rounded-2xl text-sm leading-relaxed bg-white/5 text-white/90 rounded-br-sm">
                        {m.message}
                      </div>
                      <div className="text-[10px] text-slate-300/60 mt-1 text-right">
                        {formatTimeAgo(m.createdAt)}
                      </div>
                    </div>

                    <div className="flex-shrink-0 bg-white rounded-full">
                    <img
                      src={prof}
                      alt="Admin"
                      className="w-10 h-10 rounded-full object-cover mt-1"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                  </div>
                );
              }

              // 👇 sender exists → LEFT (user)
              const senderObj =
                typeof m.sender === "string"
                  ? { _id: m.sender }
                  : m.sender;

              const initials = getInitials(senderObj);

              return (
                <div key={m._id} className="flex items-start gap-2">
                  <div className="w-10 h-10 rounded-full bg-sky-500/90 flex items-center justify-center text-xs font-semibold mt-1">
                    {initials}
                  </div>
                  <div className="max-w-[65%] sm:max-w-[55%] lg-max-w-[45%]">
                    <div className="px-4 py-2 rounded-2xl text-sm leading-relaxed bg-gradient-to-br from-indigo-500 to-sky-500 text-white rounded-bl-sm">
                      {m.message}
                    </div>
                    <div className="text-[10px] text-slate-300/60 mt-1">
                      {formatTimeAgo(m.createdAt)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </section>

        <footer className="p-4 border-t border-white/5 bg-black/10 backdrop-blur">
          <div className="flex gap-3 items-center">
            <AttachButton />
            <input
              type="text"
              placeholder={selectedChatRoom ? "Type a message…" : "Select a chat to begin"}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSendMessage();
              }}
              disabled={!selectedChatRoom || sendMessageMutation.isLoading}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/70"
            />
            <button
              onClick={handleSendMessage}
              disabled={
                !selectedChatRoom || newMessage.trim() === "" || sendMessageMutation.isLoading
              }
              className={[
                "px-4 py-3 rounded-xl transition flex items-center gap-2",
                !selectedChatRoom || newMessage.trim() === "" || sendMessageMutation.isLoading
                  ? "bg-slate-600/40 text-slate-200/40 cursor-not-allowed"
                  : "bg-sky-500 hover:bg-sky-600 text-white shadow-lg shadow-sky-600/20",
              ].join(" ")}
            >
              {sendMessageMutation.isLoading ? (
                <span className="animate-spin text-sm">⏳</span>
              ) : (
                <>
                  <SendIcon />
                  <span className="hidden sm:inline text-sm">Send</span>
                </>
              )}
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
}

/* -------------------- Tiny UI helpers -------------------- */
const HeaderIcon = ({ label, children }) => (
  <button
    title={label}
    aria-label={label}
    className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-100 transition"
  >
    {children}
  </button>
);

const PhoneIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h2.8c.4 0 .7.2.8.5l1.3 3.9a1 1 0 01-.3 1.1l-1.7.9a10.3 10.3 0 005 5l.9-1.7a1 1 0 011.1-.3l3.9 1.3c.3.1.5.4.5.8V19a2 2 0 01-2 2h-.8C9.6 21 3 14.4 3 6.8V6z" />
  </svg>
);

const VideoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5l4.5-2.5a.5.5 0 01.7.4v7.2a.5.5 0 01-.7.4L15 13.5M5 18h7a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 -rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const AttachButton = () => (
  <button
    title="Attach"
    aria-label="Attach"
    className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition"
  >
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79V7a2 2 0 00-2-2h-5.8M7 21h5.8A2 2 0 0014 19.2V7a2 2 0 00-2-2H7a4 4 0 00-4 4v8a4 4 0 004 4z" />
    </svg>
  </button>
);
