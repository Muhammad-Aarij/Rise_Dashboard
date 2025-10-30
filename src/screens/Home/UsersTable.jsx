import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

const BASE_URL = "https://api.riseselfesteem.com";

// ---- Helpers ----
const statusChip = (type = "free") => {
  const t = (type || "free").toLowerCase();
  const map = {
    premium: { wrap: "bg-yellow-100 text-yellow-700", dot: "bg-yellow-500" },
    free: { wrap: "bg-blue-100 text-blue-700", dot: "bg-blue-500" },
    pro: { wrap: "bg-purple-100/60 text-purple-700", dot: "bg-purple-500" },
  };
  const c = map[t] || map.free;
  const label = t.charAt(0).toUpperCase() + t.slice(1);
  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-full gap-x-2 ${c.wrap}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`}></span>
      <span className="text-sm">{label}</span>
    </div>
  );
};

const userStateChip = (state = "active") => {
  const s = (state || "active").toLowerCase();
  const map = {
    active: { wrap: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
    suspended: { wrap: "bg-red-100/70 text-red-700", dot: "bg-red-500" },
  };
  const c = map[s] || map.active;
  const label = s.charAt(0).toUpperCase() + s.slice(1);
  return (
    <div className={`inline-flex items-center px-2.5 py-1 rounded-full gap-x-2 ${c.wrap}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`}></span>
      <span className="text-xs">{label}</span>
    </div>
  );
};

const Avatar = ({ src, name }) => {
  const initials =
    (name || "")
      .split(" ")
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "U";
  return src ? (
    <img src={src} alt={name || "User"} className="w-9 h-9 rounded-full object-cover" />
  ) : (
    <div className="w-9 h-9 rounded-full bg-gray-500 text-white grid place-items-center text-xs">
      {initials}
    </div>
  );
};

// ---- Main ----
const UsersTable = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState({ key: "name", dir: "asc" }); // asc|desc
  const [page, setPage] = useState(1);
  const perPage = 20;

  // Fetch users
  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      // NOTE: your endpoint returns the list of users; adjust if it’s different:
      const { data } = await axios.get(`${BASE_URL}/api/auth`);
      // Expecting { users: [...] }
      const list = data?.users || data || [];
      setUsers(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error(e);
      setError("Failed to load users. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Search
  const searched = useMemo(() => {
    if (!searchTerm) return users;
    const q = searchTerm.trim().toLowerCase();
    return users.filter((u) => {
      const name = (u.name || "").toLowerCase();
      const email = (u.email || "").toLowerCase();
      const type = (u.type || "").toLowerCase();
      const state = (u.state || u.status || "active").toLowerCase();
      return (
        name.includes(q) ||
        email.includes(q) ||
        type.includes(q) ||
        state.includes(q) ||
        (u._id || "").toLowerCase().includes(q)
      );
    });
  }, [users, searchTerm]);

  // Sort
  const sorted = useMemo(() => {
    const list = [...searched];
    const { key, dir } = sortBy;
    const m = dir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      const av = (a?.[key] ?? "").toString().toLowerCase();
      const bv = (b?.[key] ?? "").toString().toLowerCase();
      if (av < bv) return -1 * m;
      if (av > bv) return 1 * m;
      return 0;
    });
    return list;
  }, [searched, sortBy]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));
  const current = sorted.slice((page - 1) * perPage, page * perPage);
  useEffect(() => setPage(1), [searchTerm, sortBy]);

  const toggleSort = (key) =>
    setSortBy((s) =>
      s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }
    );

  // Suspend / Reactivate (replaces Delete)
  const toggleUserState = async (u) => {
    const currentState = (u.state || u.status || "active").toLowerCase();
    const next = currentState === "suspended" ? "active" : "suspended";
    try {
      setBusyId(u._id);
      // TODO: adjust to your backend endpoint if different:
      // Common patterns shown below; keep ONE and remove the others:
      // 1) PATCH user status
      await axios.patch(`${BASE_URL}/api/auth/users/${u._id}/status`, { status: next });
      // 2) or PUT
      // await axios.put(`${BASE_URL}/api/auth/users/${u._id}/status`, { status: next });
      // 3) or generic update
      // await axios.put(`${BASE_URL}/api/auth/users/${u._id}`, { status: next });

      // optimistic refresh
      setUsers((prev) =>
        prev.map((x) => (x._id === u._id ? { ...x, status: next, state: next } : x))
      );
    } catch (e) {
      console.error(e);
      alert("Could not update user state. Please check API route and try again.");
    } finally {
      setBusyId(null);
    }
  };

  const SortHeader = ({ label, colKey, className = "" }) => (
    <th
      className={`px-4 py-3.5 text-sm font-semibold text-left text-gray-200 cursor-pointer select-none ${className}`}
      onClick={() => toggleSort(colKey)}
      title={`Sort by ${label}`}
    >
      <span className="inline-flex items-center gap-2">
        {label}
        <svg
          className={`w-3.5 h-3.5 transition-transform ${
            sortBy.key === colKey ? (sortBy.dir === "asc" ? "" : "rotate-180") : "opacity-40"
          }`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 15l6-6 6 6" />
        </svg>
      </span>
    </th>
  );

  return (
    <section className="min-h-screen bg-gray-900 py-10 px-4 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-semibold text-white">Users</h2>
            <span className="px-2.5 py-1 text-xs text-white bg-gray-700 rounded-full">
              {searched.length} total
            </span>
          </div>

          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Search name, email, status…"
              className="w-72 max-w-full p-2.5 bg-gray-800 text-gray-100 placeholder-gray-400 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              onClick={load}
              className="px-3.5 py-2.5 rounded-lg bg-gray-800 text-gray-100 border border-gray-700 hover:bg-gray-700"
              title="Refresh"
            >
              ↻
            </button>
          </div>
        </div>

        {/* Table / Loading / Error */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden shadow-md">
          {loading ? (
            <div className="p-8 grid gap-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-9 bg-gray-700/60 rounded animate-pulse"></div>
              ))}
            </div>
          ) : error ? (
            <div className="p-8 text-red-400">{error}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-700/60">
                  <tr>
                    <SortHeader label="Name" colKey="name" className="rounded-tl-xl" />
                    <SortHeader label="Email" colKey="email" />
                    <th className="px-4 py-3.5 text-sm font-semibold text-left text-gray-200">
                      Plan
                    </th>
                    <SortHeader label="State" colKey="status" />
                    <th className="px-4 py-3.5 text-sm font-semibold text-left text-gray-200 rounded-tr-xl">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-700 bg-gray-900/30">
                  {current.length > 0 ? (
                    current.map((u) => {
                      const type = u.type || "free";
                      const state = (u.state || u.status || "active").toLowerCase();
                      return (
                        <tr key={u._id} className="hover:bg-gray-800/50 transition-colors">
                          <td className="px-4 py-3 text-gray-100 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <Avatar src={u.avatar} name={u.name} />
                              <div>
                                <div className="font-medium">{u.name || "Unnamed User"}</div>
                                <div className="text-xs text-gray-400">ID: {u._id}</div>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3 text-gray-300 whitespace-nowrap">
                            {u.email || "—"}
                          </td>

                          <td className="px-4 py-3 whitespace-nowrap">{statusChip(type)}</td>

                          <td className="px-4 py-3 whitespace-nowrap">
                            {userStateChip(state)}
                          </td>

                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  navigator.clipboard?.writeText(u.email || "");
                                }}
                                className="px-3 py-1.5 text-xs rounded-md border border-gray-700 text-gray-200 hover:bg-gray-700"
                                title="Copy email"
                              >
                                Copy Email
                              </button>

                              {/* <button
                                onClick={() => toggleUserState(u)}
                                disabled={busyId === u._id}
                                className={`px-3 py-1.5 text-xs rounded-md ${
                                  (state === "suspended"
                                    ? "bg-emerald-600 hover:bg-emerald-700"
                                    : "bg-red-600 hover:bg-red-700") + " text-white"
                                } disabled:opacity-50`}
                                title={
                                  state === "suspended" ? "Reactivate user" : "Suspend user"
                                }
                              >
                                {busyId === u._id
                                  ? "Saving…"
                                  : state === "suspended"
                                  ? "Reactivate"
                                  : "Suspend"}
                              </button> */}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-10 text-center text-gray-400"
                      >
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {!loading && !error && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6">
            <div className="text-gray-400 text-sm">
              Page <span className="text-gray-200">{page}</span> of{" "}
              <span className="text-gray-200">{totalPages}</span> •{" "}
              <span className="text-gray-200">{sorted.length}</span> results
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-2 rounded-md bg-gray-800 text-gray-100 border border-gray-700 disabled:opacity-50 hover:bg-gray-700"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .slice(
                  Math.max(0, page - 3),
                  Math.max(0, page - 3) + 5
                )
                .map((n) => (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={`px-3 py-2 rounded-md text-sm border ${
                      page === n
                        ? "bg-purple-700 text-white border-purple-700"
                        : "bg-gray-800 text-gray-200 border-gray-700 hover:bg-gray-700"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-2 rounded-md bg-gray-800 text-gray-100 border border-gray-700 disabled:opacity-50 hover:bg-gray-700"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default UsersTable;
