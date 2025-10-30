import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

const BASE_URL = "https://api.riseselfesteem.com";
const REQUESTS_PER_PAGE = 15;

const StatusBadge = ({ status }) => {
  const s = (status || "Unread").toLowerCase();
  const map = {
    unread:    { wrap: "bg-yellow-100/20 text-yellow-300 border-yellow-400/40" },
    completed: { wrap: "bg-emerald-100/20 text-emerald-300 border-emerald-400/40" },
    cancelled: { wrap: "bg-rose-100/20 text-rose-300 border-rose-400/40" },
    default:   { wrap: "bg-gray-100/10 text-gray-300 border-gray-400/30" },
  };
  const c = map[s] || map.default;
  const label = s.charAt(0).toUpperCase() + s.slice(1);
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs border ${c.wrap}`}>
      {label}
    </span>
  );
};

const SkeletonTable = ({ rows = 8 }) => (
  <div className="overflow-hidden rounded-lg border border-gray-700">
    <div className="min-w-full bg-gray-700">
      <div className="bg-gray-600 px-4 py-3 text-gray-200 text-sm font-semibold">Loading…</div>
      <ul className="divide-y divide-gray-700">
        {Array.from({ length: rows }).map((_, i) => (
          <li key={i} className="grid grid-cols-5 gap-4 px-4 py-3 bg-gray-800/40">
            <div className="h-4 bg-gray-700/70 rounded animate-pulse" />
            <div className="h-4 bg-gray-700/70 rounded animate-pulse" />
            <div className="h-4 bg-gray-700/70 rounded animate-pulse" />
            <div className="h-4 bg-gray-700/70 rounded animate-pulse" />
            <div className="h-8 bg-gray-700/70 rounded animate-pulse" />
          </li>
        ))}
      </ul>
    </div>
  </div>
);

const formatDate = (d) => {
  try {
    const dd = new Date(d);
    if (isNaN(dd.getTime())) return "—";
    const day = String(dd.getDate()).padStart(2, "0");
    const month = String(dd.getMonth() + 1).padStart(2, "0");
    const year = dd.getFullYear();
    return `${day} / ${month} / ${year}`;
  } catch {
    return "—";
  }
};

const formatTime = (d) => {
  try {
    const dd = new Date(d);
    if (isNaN(dd.getTime())) return "—";
    return dd.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  } catch {
    return "—";
  }
};

const pickDate = (appointment) => appointment?.date || appointment?.createdAt || null;

const AppointmentRequests = () => {
  const queryClient = useQueryClient();

  // Filters
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch
  const fetchAppointmentRequests = async () => {
    const res = await axios.get(`${BASE_URL}/api/appointment`);
    // Expecting an array; if API returns {data: [...]}, adapt here:
    return Array.isArray(res.data) ? res.data : res.data?.data || [];
  };

  const {
    data: appointments = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["appointmentRequests"],
    queryFn: fetchAppointmentRequests,
    staleTime: 30_000,
  });

  // Update mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const res = await axios.put(`${BASE_URL}/api/appointment/status/${id}`, { status });
      return res.data;
    },
    onMutate: async ({ id, status }) => {
      // optimistic update
      await queryClient.cancelQueries({ queryKey: ["appointmentRequests"] });
      const snapshot = queryClient.getQueryData(["appointmentRequests"]);
      queryClient.setQueryData(["appointmentRequests"], (old = []) =>
        old.map((a) => (a._id === id ? { ...a, status } : a))
      );
      return { snapshot };
    },
    onError: (_err, _vars, context) => {
      if (context?.snapshot) queryClient.setQueryData(["appointmentRequests"], context.snapshot);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["appointmentRequests"] });
    },
  });

  const handleStatusChange = (appointmentId, newStatus) => {
    updateStatusMutation.mutate({ id: appointmentId, status: newStatus });
  };

  // Filter, sort, paginate
  const filteredSorted = useMemo(() => {
    return appointments
      .slice()
      .sort((a, b) => {
        const ad = new Date(pickDate(a) || 0).getTime();
        const bd = new Date(pickDate(b) || 0).getTime();
        return bd - ad; // newest first
      })
      .filter((appointment) => {
        if (filterDate) {
          const selected = new Date(filterDate);
          const ad = new Date(pickDate(appointment));
          if (
            ad.getFullYear() !== selected.getFullYear() ||
            ad.getMonth() !== selected.getMonth() ||
            ad.getDate() !== selected.getDate()
          ) {
            return false;
          }
        }
        if (filterStatus !== "All" && (appointment.status || "Unread") !== filterStatus) {
          return false;
        }
        return true;
      });
  }, [appointments, filterDate, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / REQUESTS_PER_PAGE));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const start = (currentPageSafe - 1) * REQUESTS_PER_PAGE;
  const currentRequests = filteredSorted.slice(start, start + REQUESTS_PER_PAGE);

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filterDate, filterStatus]);

  return (
    <div className="min-h-screen bg-gray-900 text-white px-4 py-10 flex flex-col items-center gap-10 font-sans">
      <div className="w-full bg-gray-800 rounded-xl p-8 shadow-lg">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <h2 className="text-3xl font-bold">Appointment Requests</h2>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs bg-gray-700 border border-gray-600">
              {filteredSorted.length} results
            </span>
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 border border-gray-600 text-sm disabled:opacity-60"
              title="Refresh"
            >
              {isFetching ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label htmlFor="dateFilter" className="text-gray-300 text-sm mb-1">
              Filter by Date:
            </label>
            <input
              type="date"
              id="dateFilter"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="bg-gray-700 text-white rounded-md p-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor="statusFilter" className="text-gray-300 text-sm mb-1">
              Filter by Status:
            </label>
            <select
              id="statusFilter"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-gray-700 text-white rounded-md p-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none pr-8 cursor-pointer"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor'%3E%3Cpath fill-rule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z' clip-rule='evenodd'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 0.5rem center",
                backgroundSize: "1.5em 1.5em",
              }}
            >
              <option value="All">All</option>
              <option value="Unread">Unread</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* States */}
        {isLoading ? (
          <SkeletonTable />
        ) : isError ? (
          <div className="bg-rose-900/20 border border-rose-700/40 text-rose-200 p-6 rounded-lg">
            <div className="text-lg font-semibold mb-2">Failed to load appointment requests</div>
            <div className="text-sm opacity-80 mb-4">
              {error?.message || "Please try again later."}
            </div>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 rounded-md bg-rose-700 hover:bg-rose-600"
            >
              Retry
            </button>
          </div>
        ) : filteredSorted.length === 0 ? (
          <div className="text-center py-14 bg-gray-800/50 border border-gray-700 rounded-lg">
            <div className="text-2xl mb-2">No appointment requests</div>
            <div className="text-gray-400">
              Try clearing filters or refreshing.
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-700">
            <table className="min-w-full table-auto text-sm bg-gray-800">
              <thead>
                <tr className="bg-gray-700 text-left text-gray-200">
                  <th className="py-3 px-4 border-b border-gray-700 rounded-tl-lg">User Name</th>
                  <th className="py-3 px-4 border-b border-gray-700">Email</th>
                  <th className="py-3 px-4 border-b border-gray-700">Date</th>
                  <th className="py-3 px-4 border-b border-gray-700">Time</th>
                  <th className="py-3 px-4 border-b border-gray-700">Status</th>
                  <th className="py-3 px-4 border-b border-gray-700 rounded-tr-lg">Update</th>
                </tr>
              </thead>
              <tbody>
                {currentRequests.map((appointment) => {
                  const when = pickDate(appointment);
                  return (
                    <tr
                      key={appointment._id}
                      className="border-b border-gray-700 hover:bg-gray-700/50 transition-colors duration-200"
                    >
                      <td className="py-3 px-4 text-gray-300">
                        {appointment.userId?.name || "N/A"}
                      </td>
                      <td className="py-3 px-4 text-gray-300">
                        {appointment.userId?.email || "N/A"}
                      </td>
                      <td className="py-3 px-4 text-gray-300">{formatDate(when)}</td>
                      <td className="py-3 px-4 text-gray-300">{formatTime(when)}</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={appointment.status} />
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={appointment.status}
                          onChange={(e) =>
                            handleStatusChange(appointment._id, e.target.value)
                          }
                          className="bg-gray-700 text-white rounded-md p-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none pr-8"
                          style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor'%3E%3Cpath fill-rule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z' clip-rule='evenodd'/%3E%3C/svg%3E")`,
                            backgroundRepeat: "no-repeat",
                            backgroundPosition: "right 0.5rem center",
                            backgroundSize: "1.5em 1.5em",
                          }}
                        >
                          <option value="Unread">Unread</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 p-4 bg-gray-800">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPageSafe === 1}
                  className="bg-purple-700 hover:bg-purple-600 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .slice(Math.max(0, currentPageSafe - 3), Math.max(0, currentPageSafe - 3) + 5)
                  .map((n) => (
                    <button
                      key={n}
                      onClick={() => setCurrentPage(n)}
                      className={`py-2 px-4 rounded-md font-medium ${
                        currentPageSafe === n
                          ? "bg-purple-900 text-white"
                          : "bg-gray-700 hover:bg-gray-600 text-gray-200"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPageSafe === totalPages}
                  className="bg-purple-700 hover:bg-purple-600 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentRequests;
