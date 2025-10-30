import React, { useState, useEffect, useRef, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

const BASE_URL = "https://api.riseselfesteem.com";
const CURRENT_USER_ID = "6854f3663e37aad6eff91113";

/* -------------------------------- Time helpers -------------------------------- */
const formatTimeAgo = (isoDateString) => {
  if (!isoDateString) return "";
  const date = new Date(isoDateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

/* -------------- Cache helpers: keep room list “last activity” fresh -------------- */
const getCachedNewestMessage = (qc, roomId) => {
  const cached = qc.getQueryData(["messages", roomId]);
  if (!Array.isArray(cached) || cached.length === 0) return null;
  return [...cached].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
};

const getRoomLastActivityISO = (room, qc) => {
  const fromRoom =
    room?.lastMessage?.createdAt ||
    room?.lastMessageAt ||
    room?.latestMessage?.createdAt ||
    null;

  const cachedNewest = getCachedNewestMessage(qc, room?._id);
  const fromCache = cachedNewest?.createdAt || null;

  return fromRoom || fromCache || room?.updatedAt || room?.createdAt || null;
};

/* -------------------------------- Small UI bits -------------------------------- */
const NoScrollbarStyle = () => (
  <style>{`
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .soft-shadow { box-shadow: 0 6px 24px rgba(0,0,0,.18); }
    .ring-focus:focus { outline: none; box-shadow: 0 0 0 2px rgba(59,130,246,.4); }
  `}</style>
);

const RoomSkeleton = () => (
  <div className="animate-pulse space-y-3">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-slate-600/40" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-2/3 bg-slate-600/40 rounded" />
          <div className="h-3 w-1/2 bg-slate-600/30 rounded" />
        </div>
      </div>
    ))}
  </div>
);

const MessageSkeleton = () => (
  <div className="animate-pulse space-y-3">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className={`flex ${i % 2 ? "justify-end" : ""}`}>
        <div className="bg-slate-700/50 h-5 rounded-xl w-56" />
      </div>
    ))}
  </div>
);

/* ---------------------------------- MAIN ---------------------------------- */
export default function ChatScreen() {
  const queryClient = useQueryClient();
  const messagesTopRef = useRef(null); // anchor at top (newest-first)

  const [selectedChatRoom, setSelectedChatRoom] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [roomSearch, setRoomSearch] = useState("");

  /* ------------------------------- Chat rooms ------------------------------- */
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

  /* ------------------------------- Messages ------------------------------- */
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
                lastMessage: {
                  ...(r.lastMessage || {}),
                  message: newest.message,
                  createdAt: newest.createdAt,
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

  /* ------------------------------ Send message ------------------------------ */
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
                lastMessage: {
                  ...(r.lastMessage || {}),
                  message: created?.message || "",
                  createdAt: created?.createdAt || new Date().toISOString(),
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
    onError: (err) => console.error("Error sending message:", err),
  });

  /* ------------------------------ Scroll behavior ------------------------------ */
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

  /* ------------------------------ Header info ------------------------------ */
  const getChatHeaderInfo = () => {
    if (!selectedChatRoom) return { name: "Select a Chat", avatar: "", online: false };
    const otherParticipant = selectedChatRoom.participants?.find((p) => p._id !== CURRENT_USER_ID);
    return {
      name: otherParticipant?.name || "Unknown User",
      avatar:
        otherParticipant?.avatar ||
        "https://cdn-icons-png.flaticon.com/512/149/149071.png",
      online: otherParticipant?.status === "active",
    };
  };
  const { name: headerName, avatar: headerAvatar, online: headerOnline } = getChatHeaderInfo();

  /* ---------------------- Rooms sorted + client-side search ---------------------- */
  const roomsSortedByActivity = useMemo(() => {
    const arr = [...chatRooms].sort((a, b) => {
      const aISO = getRoomLastActivityISO(a, queryClient);
      const bISO = getRoomLastActivityISO(b, queryClient);
      return (bISO ? +new Date(bISO) : 0) - (aISO ? +new Date(aISO) : 0);
    });
    if (!roomSearch.trim()) return arr;
    const q = roomSearch.toLowerCase();
    return arr.filter((room) => {
      const other = room.participants?.find((p) => p._id !== CURRENT_USER_ID);
      return (
        other?.name?.toLowerCase().includes(q) ||
        other?.email?.toLowerCase().includes(q) ||
        room?.lastMessage?.message?.toLowerCase().includes(q)
      );
    });
  }, [chatRooms, roomSearch, queryClient]);

  return (
    <div className="flex h-screen bg-[#0B1022] text-white font-inter rounded-lg overflow-hidden soft-shadow">
      <NoScrollbarStyle />

      {/* ------------------------------ Sidebar ------------------------------ */}
      <aside className="w-80 bg-[#111734] border-r border-[#1f2a4a] flex flex-col">
        <div className="px-5 pt-5 pb-4 border-b border-[#1f2a4a]">
          <h2 className="text-xl font-bold tracking-tight">
            Conversations
          </h2>
          <div className="mt-4 flex items-center gap-2 bg-[#0B1022] border border-[#1f2a4a] rounded-xl px-3">
            <svg
              className="w-4 h-4 text-slate-400"
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
              placeholder="Search users or messages"
              className="flex-1 bg-transparent py-2 text-sm placeholder:text-slate-400 ring-focus"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar px-3 py-3">
          {isLoadingChatRooms ? (
            <RoomSkeleton />
          ) : chatRoomsError ? (
            <div className="text-center text-rose-300 text-sm">
              Failed to load chats: {chatRoomsError.message}
            </div>
          ) : roomsSortedByActivity.length === 0 ? (
            <div className="text-center text-slate-400 text-sm">No chat rooms.</div>
          ) : (
            <ul className="space-y-1">
              {roomsSortedByActivity.map((room) => {
                const other = room.participants?.find((p) => p._id !== CURRENT_USER_ID);
                if (!other) return null;

                const isActive = selectedChatRoom?._id === room._id;
                const online = other.status === "active";
                const lastISO = getRoomLastActivityISO(room, queryClient);
                const lastMessageTime = formatTimeAgo(lastISO);

                const previewText =
                  room?.lastMessage?.message ||
                  getCachedNewestMessage(queryClient, room._id)?.message ||
                  "";

                return (
                  <li key={room._id}>
                    <button
                      onClick={() => setSelectedChatRoom(room)}
                      className={[
                        "w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg transition",
                        isActive
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600"
                          : "hover:bg-[#1a2243]",
                      ].join(" ")}
                    >
                      <div className="relative">
                        <img
                          src={
                            other.avatar ||
                            "https://placehold.co/40x40/5A67D8/FFFFFF?text=P"
                          }
                          alt={other.name}
                          className="w-10 h-10 rounded-full object-cover border-2 border-[#111734]"
                          onError={(e) => {
                            e.currentTarget.src =
                              "https://placehold.co/40x40/5A67D8/FFFFFF?text=P";
                          }}
                        />
                        <span
                          className={[
                            "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#111734]",
                            online ? "bg-emerald-400" : "bg-slate-500",
                          ].join(" ")}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-medium truncate">{other.name}</div>
                          <div className="text-[11px] text-slate-300 ml-auto whitespace-nowrap">
                            {lastMessageTime}
                          </div>
                        </div>
                        <div className="text-xs text-slate-300/80 truncate mt-0.5">
                          {previewText || <span className="opacity-60">No messages yet</span>}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      {/* ------------------------------ Chat area ------------------------------ */}
      <main className="flex-1 flex flex-col bg-[#0B1022]">
        {/* Header */}
        <header className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-[#1f2a4a] bg-[#0F1430]">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={
                  headerAvatar ||
                  "https://placehold.co/40x40/EC4899/FFFFFF?text=P"
                }
                alt={headerName}
                className="w-10 h-10 rounded-full object-cover border-2 border-[#0B1022]"
                onError={(e) => {
                  e.currentTarget.src =
                    "https://placehold.co/40x40/EC4899/FFFFFF?text=P";
                }}
              />
              <span
                className={[
                  "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0B1022]",
                  headerOnline ? "bg-emerald-400" : "bg-slate-500",
                ].join(" ")}
              />
            </div>
            <div>
              <div className="font-semibold text-lg">{headerName}</div>
              <div className="text-xs text-slate-300">
                {selectedChatRoom ? (headerOnline ? "Online" : "Offline") : ""}
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <IconButton label="Call">
              <PhoneIcon />
            </IconButton>
            <IconButton label="Video">
              <VideoIcon />
            </IconButton>
          </div>
        </header>

        {/* Messages */}
        <section className="flex-1 p-4 space-y-4 overflow-y-auto no-scrollbar">
          <div ref={messagesTopRef} />
          {isLoadingMessages ? (
            <MessageSkeleton />
          ) : messagesError ? (
            <div className="text-center text-rose-300 text-sm">
              Failed to load messages: {messagesError.message}
            </div>
          ) : sortedMessages.length === 0 ? (
            <div className="text-center text-slate-300/80 text-sm">
              No messages yet — say hi!
            </div>
          ) : (
            sortedMessages.map((m) => {
              const mine = m.sender._id === CURRENT_USER_ID;
              return (
                <div
                  key={m._id}
                  className={`flex items-start gap-2 ${mine ? "justify-end" : ""}`}
                >
                  {!mine && (
                    <img
                      src={
                        m.sender.avatar ||
                        "https://placehold.co/32x32/5A67D8/FFFFFF?text=P"
                      }
                      alt={m.sender.name}
                      className="w-8 h-8 rounded-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src =
                          "https://placehold.co/32x32/5A67D8/FFFFFF?text=P";
                      }}
                    />
                  )}
                  <div>
                    <div
                      className={[
                        "px-4 py-2 rounded-2xl max-w-xs sm:max-w-md break-words soft-shadow",
                        mine
                          ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-br-none"
                          : "bg-[#1a2243] text-white rounded-bl-none",
                      ].join(" ")}
                    >
                      {m.message}
                    </div>
                    <div
                      className={[
                        "text-[11px] text-slate-300 mt-1",
                        mine ? "text-right" : "",
                      ].join(" ")}
                    >
                      {formatTimeAgo(m.createdAt)}
                    </div>
                  </div>
                  {mine && (
                    <img
                      src={
                        m.sender.avatar ||
                        "https://placehold.co/32x32/EC4899/FFFFFF?text=P"
                      }
                      alt="You"
                      className="w-8 h-8 rounded-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src =
                          "https://placehold.co/32x32/EC4899/FFFFFF?text=P";
                      }}
                    />
                  )}
                </div>
              );
            })
          )}
        </section>

        {/* Composer */}
        <footer className="sticky bottom-0 z-10 p-4 border-t border-[#1f2a4a] bg-[#0F1430]">
          <div className="flex items-center gap-3">
            <AttachButton />
            <input
              type="text"
              placeholder={
                selectedChatRoom ? "Type a message…" : "Select a chat to begin"
              }
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSendMessage();
              }}
              disabled={!selectedChatRoom || sendMessageMutation.isLoading}
              className="flex-1 px-4 py-3 rounded-xl bg-[#0B1022] text-white border border-[#1f2a4a] ring-focus placeholder:text-slate-400"
            />
            <button
              onClick={handleSendMessage}
              disabled={
                !selectedChatRoom || newMessage.trim() === "" || sendMessageMutation.isLoading
              }
              className={[
                "ml-1 px-4 py-3 rounded-xl font-medium transition",
                !selectedChatRoom || newMessage.trim() === "" || sendMessageMutation.isLoading
                  ? "bg-slate-700/50 text-slate-300 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white",
              ].join(" ")}
              aria-label="Send"
            >
              {sendMessageMutation.isLoading ? (
                <span className="animate-spin inline-block">⏳</span>
              ) : (
                <SendIcon />
              )}
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
}

/* ----------------------------- Tiny icon buttons ----------------------------- */
const IconButton = ({ label, children }) => (
  <button
    title={label}
    aria-label={label}
    className="p-2 rounded-lg bg-[#131a3a] hover:bg-[#1a2243] text-slate-200 transition"
  >
    {children}
  </button>
);

const PhoneIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const VideoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 -rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const AttachButton = () => (
  <button
    title="Attach"
    aria-label="Attach"
    className="p-3 rounded-xl bg-[#131a3a] hover:bg-[#1a2243] text-slate-200 transition"
  >
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79V7a2 2 0 00-2-2h-5.79M7 21h5.79A2 2 0 0014 19.21V7a2 2 0 00-2-2H7a4 4 0 00-4 4v8a4 4 0 004 4z" />
    </svg>
  </button>
);
