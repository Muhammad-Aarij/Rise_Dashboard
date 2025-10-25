import React, { useState } from 'react'; // Import useState for local state management
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios'; // Import axios

// Base URL for the API
const BASE_URL = 'https://api.riseselfesteem.com';

/**
 * AppointmentRequests Component
 * Displays a table of user appointment requests, allows updating their status,
 * and provides filtering options for date and status.
 */
const AppointmentRequests = () => {
  const queryClient = useQueryClient();

  // State for filtering
  const [filterDate, setFilterDate] = useState(''); // Stores the selected date for filtering
  const [filterStatus, setFilterStatus] = useState('All'); // Stores the selected status for filtering ('All', 'Unread', 'Completed', 'Cancelled')

  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const requestsPerPage = 15; // Number of requests to display per page

  // Function to fetch all appointment requests from the API using axios
  const fetchAppointmentRequests = async () => {
    const res = await axios.get(`${BASE_URL}/api/appointment`);
    return res.data; // Axios automatically parses JSON, so we return res.data
  };

  // Use useQuery hook to fetch and manage appointment requests data
  const {
    data: appointments = [], // Default to an empty array if data is not yet available
    isLoading,
    error,
  } = useQuery({
    queryKey: ['appointmentRequests'], // Unique key for this query
    queryFn: fetchAppointmentRequests, // Function to call for data fetching
  });

  // Function to update the status of an appointment request using axios
  const updateAppointmentStatus = async ({ id, status }) => {
    const res = await axios.put(`${BASE_URL}/api/appointment/status/${id}`, { status });
    return res.data; // Axios automatically parses JSON, so we return res.data
  };

  // Use useMutation hook for updating appointment status
  const updateStatusMutation = useMutation({
    mutationFn: updateAppointmentStatus, // Function to call for the mutation
    onSuccess: () => {
      // Invalidate the 'appointmentRequests' query cache on successful update
      // This will trigger a refetch of the appointment data to reflect the changes
      queryClient.invalidateQueries(['appointmentRequests']);
    },
    onError: (err) => {
      console.error("Error updating status:", err);
      // Optionally, set a status message for the user here
    }
  });

  // Handler for when the status dropdown changes for an individual appointment
  const handleStatusChange = (appointmentId, newStatus) => {
    // Call the mutation to update the status
    updateStatusMutation.mutate({ id: appointmentId, status: newStatus });
  };

  // Filter and sort the appointments based on state
  const sortedAndFilteredAppointments = appointments
    .slice() // Create a shallow copy to avoid mutating the original array from react-query cache
    .sort((a, b) => new Date(b.date) - new Date(a.date)) // Sort by date in descending order (newest first)
    .filter(appointment => {
      // Apply date filter
      if (filterDate) {
        // Create a Date object for the filter date (e.g., '2025-06-28')
        const selectedDate = new Date(filterDate);

        // Get the year, month, and day of the appointment date in local time
        const appointmentDateObj = new Date(appointment.date);
        const appYear = appointmentDateObj.getFullYear();
        const appMonth = appointmentDateObj.getMonth();
        const appDay = appointmentDateObj.getDate();

        // Get the year, month, and day of the filter date
        const filterYear = selectedDate.getFullYear();
        const filterMonth = selectedDate.getMonth();
        const filterDay = selectedDate.getDate();

        // Compare year, month, and day directly
        if (appYear !== filterYear || appMonth !== filterMonth || appDay !== filterDay) {
          return false;
        }
      }
      // Apply status filter
      if (filterStatus !== 'All' && appointment.status !== filterStatus) {
        return false;
      }
      return true; // Include appointment if it passes all filters
    });

  // Pagination logic
  const indexOfLastRequest = currentPage * requestsPerPage;
  const indexOfFirstRequest = indexOfLastRequest - requestsPerPage;
  const currentRequests = sortedAndFilteredAppointments.slice(indexOfFirstRequest, indexOfLastRequest);

  const totalPages = Math.ceil(sortedAndFilteredAppointments.length / requestsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filterDate, filterStatus]);


  return (
    <div className="min-h-screen bg-gray-900 text-white px-4 py-10 flex flex-col items-center gap-10 font-sans">
      <div className="w-full  bg-gray-800 rounded-xl p-8 shadow-lg">
        <h2 className="text-3xl font-bold mb-6  text-white">Appointment Requests</h2>

        {/* Filter Controls */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-center items-center">
          {/* Date Filter */}
          <div className="flex flex-col">
            <label htmlFor="dateFilter" className="text-gray-300 text-sm mb-1">Filter by Date:</label>
            <input
              type="date"
              id="dateFilter"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="bg-gray-700 text-white rounded-md p-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
            />
          </div>

          {/* Status Filter */}
          <div className="flex flex-col">
            <label htmlFor="statusFilter" className="text-gray-300 text-sm mb-1">Filter by Status:</label>
            <select
              id="statusFilter"
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
              <option value="Unread">Unread</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>


        {isLoading ? (
          // Loading state
          <p className="text-gray-400 text-center text-lg py-10">Loading appointment requests...</p>
        ) : error ? (
          // Error state
          <p className="text-red-500 text-center text-lg py-10">Error: {error.message}. Failed to load appointment requests.</p>
        ) : sortedAndFilteredAppointments.length === 0 ? (
          // No appointments state after filtering
          <p className="text-gray-400 text-center text-lg py-10">No appointment requests found matching your filters.</p>
        ) : (
          // Display table if data is available
          <div className="overflow-x-auto rounded-lg">
            <table className="min-w-full table-auto text-sm bg-gray-700 rounded-lg">
              <thead>
                <tr className="bg-gray-600 text-left text-gray-200">
                  <th className="py-3 px-4 border-b border-gray-500 rounded-tl-lg">User Name</th>
                  <th className="py-3 px-4 border-b border-gray-500">Email</th>
                  <th className="py-3 px-4 border-b border-gray-500">Date</th>
                  <th className="py-3 px-4 border-b border-gray-500">Time</th>
                  <th className="py-3 px-4 border-b border-gray-500 rounded-tr-lg">Status</th>
                </tr>
              </thead>
              <tbody>
                {/* Render only current requests for the active page */}
                {currentRequests.map((appointment) => (
                  <tr key={appointment._id} className="border-b border-gray-600 hover:bg-gray-700 transition-colors duration-200">
                    <td className="py-3 px-4 text-gray-300">{appointment.userId?.name || 'N/A'}</td>
                    <td className="py-3 px-4 text-gray-300">{appointment.userId?.email || 'N/A'}</td>
                    <td className="py-3 px-4 text-gray-300">
                      {/* Format date: DD / MM /YYYY using appointment.date */}
                      {(() => {
                        const date = new Date(appointment.date);
                        const day = String(date.getDate()).padStart(2, '0');
                        const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
                        const year = date.getFullYear();
                        return `${day} / ${month} / ${year}`;
                      })()}
                    </td>
                    <td className="py-3 px-4 text-gray-300">
                      {/* Format time: HH:MM AM/PM using appointment.date for reliable parsing */}
                      {(() => {
                        const time = new Date(appointment.date); // Use appointment.date for reliable time parsing
                        return time.toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true, // Use 12-hour format with AM/PM
                        });
                      })()}
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={appointment.status}
                        onChange={(e) => handleStatusChange(appointment._id, e.target.value)}
                        className="bg-gray-600 text-white rounded-md p-1 border border-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none pr-8"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor'%3E%3Cpath fill-rule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z' clip-rule='evenodd'/%3E%3C/svg%3E")`,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 0.5rem center',
                          backgroundSize: '1.5em 1.5em',
                        }}
                      >
                        <option value="Unread">Unread</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-6 space-x-2">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => paginate(i + 1)}
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
                  onClick={() => paginate(currentPage + 1)}
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
    </div>
  );
};

export default AppointmentRequests;
