import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Trash2, Send } from "lucide-react";

const BASE_URL = "https://rise-backend-xwmx.onrender.com";

export default function NotificationsManager() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sendAll, setSendAll] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const queryClient = useQueryClient();

  /** Fetch all users */
  const fetchUsers = async () => {
    const res = await fetch(`${BASE_URL}/api/auth`);
    if (!res.ok) throw new Error("Failed to fetch users");
    return res.json();
  };
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });

  /** Fetch notifications */
  const fetchNotifications = async () => {
    const res = await fetch(`${BASE_URL}/api/notifications`);
    if (!res.ok) throw new Error("Failed to fetch notifications");
    return res.json();
  };
  const {
    data: notifications = [],
    isLoading: notifLoading,
    error: notifError,
  } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
  });

  /** Send notification */
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
      // Optimistic update: add new notification to table immediately
      await queryClient.cancelQueries(["notifications"]);
      const prevData = queryClient.getQueryData(["notifications"]);
      const optimisticNotif = {
        _id: "temp-" + Date.now(),
        title: payload.title,
        message: payload.message,
        type: payload.type,
        createdAt: new Date().toISOString(),
      };
      queryClient.setQueryData(["notifications"], (old = []) => [
        optimisticNotif,
        ...old,
      ]);
      return { prevData };
    },
    onError: (_err, _newData, context) => {
      // Rollback if error
      queryClient.setQueryData(["notifications"], context.prevData);
    },
    onSettled: () => {
      // Refetch final data from backend
      queryClient.invalidateQueries(["notifications"]);
    },
    onSuccess: () => {
      setTitle("");
      setMessage("");
      setSelectedUsers([]);
      setSendAll(true);
    },
  });

  /** Delete notification */
  const deleteNotification = async (id) => {
    const res = await fetch(`${BASE_URL}/api/notifications/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete notification");
    return res.json();
  };
  const deleteMutation = useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => queryClient.invalidateQueries(["notifications"]),
  });

  /** Handle send */
  const handleSend = () => {
    if (!title.trim() || !message.trim()) return;
    const payload = sendAll
      ? { title, message, type: "general" }
      : { title, message, type: "personal", userIds: selectedUsers };
    sendMutation.mutate(payload);
  };

  /** Toggle individual user */
  const toggleUser = (id) => {
    setSelectedUsers((prev) =>
      prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id]
    );
  };

  /** Toggle all users */
  const toggleAllUsers = () => {
    if (!usersData?.users) return;
    const onlyUsers = usersData.users.filter((u) => u.role === "user");
    if (selectedUsers.length === onlyUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(onlyUsers.map((u) => u._id));
    }
  };

  return (
    <div className="p-6 bg-gray-900 rounded-2xl shadow-2xl border border-gray-800 text-gray-200">
      <h2 className="text-2xl font-bold mb-6 text-purple-400 flex items-center gap-2">
        <Bell size={22} /> Send Notification
      </h2>

      <div className="space-y-4">
        <input
          type="text"
          placeholder="Notification Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-2 rounded-xl bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-purple-500"
        />
        <textarea
          placeholder="Notification Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          className="w-full px-4 py-2 rounded-xl bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-purple-500 resize-none"
        />

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={sendAll}
            onChange={() => setSendAll(!sendAll)}
          />
          <label className="text-sm">Send to All Users</label>
        </div>

        {/* Users list with checkboxes */}
        {!sendAll && (
          <div>
            <label className="block text-sm mb-2 text-gray-400">
              Select Users
            </label>
            {usersLoading ? (
              <p>Loading users...</p>
            ) : (
              <div className="max-h-48 overflow-y-auto border border-gray-700 rounded-lg p-2 bg-gray-800">
                {/* Select All */}
                <div className="flex items-center gap-2 px-2 py-1">
                  <input
                    type="checkbox"
                    checked={
                      selectedUsers.length ===
                        usersData?.users?.filter((u) => u.role === "user").length &&
                      usersData?.users?.filter((u) => u.role === "user").length > 0
                    }
                    onChange={toggleAllUsers}
                  />
                  <span className="text-sm font-semibold">
                    {selectedUsers.length ===
                    usersData?.users?.filter((u) => u.role === "user").length
                      ? "Deselect All"
                      : "Select All"}
                  </span>
                </div>
                <hr className="border-gray-700 my-1" />

                {/* Individual Users (only role=user) */}
                {usersData?.users
                  ?.filter((user) => user.role === "user")
                  .map((user) => (
                    <div
                      key={user._id}
                      className="flex items-center gap-2 px-2 py-1 hover:bg-gray-700 rounded-md"
                    >
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user._id)}
                        onChange={() => toggleUser(user._id)}
                      />
                      <span className="text-sm">
                        {user.name}{" "}
                        <span className="text-gray-400">({user.email})</span>
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        <button
          onClick={handleSend}
          disabled={sendMutation.isLoading}
          className="w-full bg-purple-600 hover:bg-purple-700 py-2 rounded-xl font-bold flex items-center justify-center gap-2 disabled:bg-gray-600"
        >
          {sendMutation.isLoading ? (
            "Sending..."
          ) : (
            <>
              <Send size={18} /> Send
              {!sendAll && selectedUsers.length > 0 && (
                <span>({selectedUsers.length})</span>
              )}
            </>
          )}
        </button>
      </div>

      {/* Notifications List */}
      <div className="mt-10">
        <h3 className="text-xl font-bold mb-4 text-purple-400">Notifications</h3>
        {notifLoading ? (
          <p>Loading...</p>
        ) : notifError ? (
          <p className="text-red-500">Failed to load notifications</p>
        ) : notifications.length === 0 ? (
          <p className="text-gray-400">No notifications yet</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-700">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-800">
                <tr>
                  <th className="py-3 px-4 text-left">Title</th>
                  <th className="py-3 px-4 text-left">Message</th>
                  <th className="py-3 px-4 text-left">Type</th>
                  <th className="py-3 px-4 text-left">Created</th>
                  <th className="py-3 px-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((n) => (
                  <tr
                    key={n._id}
                    className="border-b border-gray-800 hover:bg-gray-800"
                  >
                    <td className="py-2 px-4">{n.title}</td>
                    <td className="py-2 px-4">{n.message}</td>
                    <td className="py-2 px-4 capitalize">{n.type}</td>
                    <td className="py-2 px-4">
                      {new Date(n.createdAt).toLocaleString()}
                    </td>
                    <td className="py-2 px-4">
                      <button
                        onClick={() => deleteMutation.mutate(n._id)}
                        disabled={deleteMutation.isLoading}
                        className="text-red-400 hover:text-red-500 flex items-center gap-1"
                      >
                        <Trash2 size={16} />{" "}
                        {deleteMutation.isLoading ? "..." : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
