import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const BASE_URL = 'https://rise-backend-nine.vercel.app';
const STATUS_OPTIONS = ['Unread', 'In-Progress', 'Resolved', 'Cancelled'];

function pickDate(obj) {
  const raw = obj?.createdAt || obj?.date || obj?.timestamp || Date.now();
  return new Date(raw);
}
function formatDate(d) {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day} / ${month} / ${year}`;
}
function formatTime(d) {
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

const SupportRequests = () => {
  const queryClient = useQueryClient();

  // Filters
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [search, setSearch] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 15;

  // View modal
  const [activeItem, setActiveItem] = useState(null);

  // ---- Queries ----
  const fetchSupport = async () => {
    const res = await axios.get(`${BASE_URL}/api/support`);
    return res.data || [];
  };

  const {
    data: tickets = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['supportRequests'],
    queryFn: fetchSupport,
  });

  // ---- Mutations (PUT expects full document fields) ----
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, body }) => {
      // body should contain: { email, message, status } at minimum
      const res = await axios.put(`${BASE_URL}/api/support/${id}`, body, {
        headers: { 'Content-Type': 'application/json' },
      });
      return res.data;
    },
    onMutate: async (vars) => {
      const { id, body } = vars;
      await queryClient.cancelQueries({ queryKey: ['supportRequests'] });
      const previous = queryClient.getQueryData(['supportRequests']);
      // optimistic patch
      queryClient.setQueryData(['supportRequests'], (old = []) =>
        old.map((t) =>
          t._id === id
            ? { ...t, ...body, __updating: true } // update status (and email/message if changed)
            : t
        )
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(['supportRequests'], ctx.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['supportRequests'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await axios.delete(`${BASE_URL}/api/support/${id}`);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries(['supportRequests']),
    onError: (err) => console.error('Error deleting ticket:', err),
  });

  // Build the exact body your API accepts, using current row values
  const buildPutBody = (row, nextStatus) => ({
    email: row?.email ?? '',
    message: row?.message ?? '',
    status: nextStatus ?? row?.status ?? 'Unread',
  });

  const handleStatusChange = (row, nextStatus) => {
    updateStatusMutation.mutate({
      id: row._id,
      body: buildPutBody(row, nextStatus),
    });
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this support request? This cannot be undone.')) {
      deleteMutation.mutate(id);
    }
  };

  // Filter + sort
  const filtered = useMemo(() => {
    return tickets
      .slice()
      .sort((a, b) => pickDate(b) - pickDate(a))
      .filter((t) => {
        if (filterDate) {
          const selected = new Date(filterDate);
          const d = pickDate(t);
          if (
            d.getFullYear() !== selected.getFullYear() ||
            d.getMonth() !== selected.getMonth() ||
            d.getDate() !== selected.getDate()
          ) {
            return false;
          }
        }
        if (filterStatus !== 'All' && (t.status || 'Unread') !== filterStatus) return false;

        if (search.trim()) {
          const q = search.trim().toLowerCase();
          const hay = `${t.email || ''} ${t.message || ''} ${t.name || ''}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }

        return true;
      });
  }, [tickets, filterDate, filterStatus, search]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const current = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  useEffect(() => setCurrentPage(1), [filterDate, filterStatus, search]);

  return (
    <div className="min-h-screen bg-gray-900 text-white px-4 py-10 flex flex-col items-center gap-10 font-sans">
      <div className="w-full bg-gray-800 rounded-xl p-8 shadow-lg">
        <h2 className="text-3xl font-bold mb-6">Support / Contact Requests</h2>

        {/* Controls */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col">
            <label className="text-gray-300 text-sm mb-1">Filter by Date</label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="bg-gray-700 text-white rounded-md p-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-gray-300 text-sm mb-1">Filter by Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-gray-700 text-white rounded-md p-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none pr-8 cursor-pointer"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor'%3E%3Cpath fill-rule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z' clip-rule='evenodd'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.5rem center',
                backgroundSize: '1.5em 1.5em',
              }}
            >
              <option value="All">All</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-gray-300 text-sm mb-1">Search (email, name, message)</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Type to search..."
              className="bg-gray-700 text-white rounded-md p-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {isLoading ? (
          <p className="text-gray-400 text-center text-lg py-10">Loading support requests...</p>
        ) : error ? (
          <p className="text-red-500 text-center text-lg py-10">
            Error: {error.message}. Failed to load support requests.
          </p>
        ) : filtered.length === 0 ? (
          <p className="text-gray-400 text-center text-lg py-10">
            No support requests found matching your filters.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg">
            <table className="min-w-full table-auto text-sm bg-gray-700 rounded-lg">
              <thead>
                <tr className="bg-gray-600 text-left text-gray-200">
                  <th className="py-3 px-4 border-b border-gray-500">Email</th>
                  <th className="py-3 px-4 border-b border-gray-500">Message</th>
                  <th className="py-3 px-4 border-b border-gray-500">Date</th>
                  <th className="py-3 px-4 border-b border-gray-500">Time</th>
                  <th className="py-3 px-4 border-b border-gray-500">Status</th>
                  <th className="py-3 px-4 border-b border-gray-500 rounded-tr-lg">Actions</th>
                </tr>
              </thead>
              <tbody>
                {current.map((t) => {
                  const d = pickDate(t);
                  const preview =
                    (t.message || '').length > 80 ? `${t.message.slice(0, 80)}…` : (t.message || '');
                  const status = t.status || 'Unread';
                  const isRowUpdating = !!t.__updating;

                  return (
                    <tr key={t._id} className="border-b border-gray-600 hover:bg-gray-700 transition-colors duration-200">
                      <td className="py-3 px-4 text-gray-300">{t.email || '—'}</td>
                      <td className="py-3 px-4 text-gray-300">{preview}</td>
                      <td className="py-3 px-4 text-gray-300">{formatDate(d)}</td>
                      <td className="py-3 px-4 text-gray-300">{formatTime(d)}</td>
                      <td className="py-3 px-4">
                        <select
                          value={status}
                          onChange={(e) => handleStatusChange(t, e.target.value)}
                          disabled={isRowUpdating}
                          className="bg-gray-600 text-white rounded-md p-1 border border-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none pr-8 disabled:opacity-60"
                          style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor'%3E%3Cpath fill-rule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z' clip-rule='evenodd'/%3E%3C/svg%3E")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 0.5rem center',
                            backgroundSize: '1.5em 1.5em',
                          }}
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-4 flex gap-2">
                        <button
                          onClick={() => setActiveItem(t)}
                          className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded-md text-xs"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDelete(t._id)}
                          className="bg-red-600 hover:bg-red-700 text-white py-1 px-3 rounded-md text-xs"
                          disabled={deleteMutation.isPending && deleteMutation.variables === t._id}
                        >
                          {deleteMutation.isPending && deleteMutation.variables === t._id ? 'Deleting…' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-6 space-x-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`py-2 px-4 rounded-md font-bold transition-colors ${
                      currentPage === i + 1
                        ? 'bg-purple-800 text-white'
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* View Modal */}
      {activeItem && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 text-white rounded-xl max-w-xl w-full p-6 shadow-xl">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-bold">Support Request</h3>
              <button
                onClick={() => setActiveItem(null)}
                className="text-gray-300 hover:text-white"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <div><span className="text-gray-400">Name:</span> {activeItem.name || '—'}</div>
              <div><span className="text-gray-400">Email:</span> {activeItem.email || '—'}</div>
              <div><span className="text-gray-400">Status:</span> {activeItem.status || 'Unread'}</div>
              <div><span className="text-gray-400">Date:</span> {formatDate(pickDate(activeItem))} {formatTime(pickDate(activeItem))}</div>
              <div className="pt-2">
                <div className="text-gray-400 mb-1">Message:</div>
                <div className="bg-gray-700 rounded-md p-3 whitespace-pre-wrap">
                  {activeItem.message || '—'}
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => {
                  updateStatusMutation.mutate(
                    { id: activeItem._id, body: buildPutBody(activeItem, 'In-Progress') },
                    { onSuccess: () => setActiveItem(null) }
                  );
                }}
                className="bg-amber-600 hover:bg-amber-700 text-white py-2 px-4 rounded-md"
              >
                Mark In-Progress
              </button>
              <button
                onClick={() => setActiveItem(null)}
                className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportRequests;
