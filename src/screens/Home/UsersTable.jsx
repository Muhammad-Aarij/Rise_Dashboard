import React, { useState, useEffect, useMemo } from "react";

const UsersTable = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const BASE_URL = 'https://rise-backend-xwmx.onrender.com';

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setLoading(true);
                setError(null);
                const apiKey = ""; // API key placeholder
                const apiUrl = `${BASE_URL}/api/auth`; // Replace with actual URL

                const response = await fetch(apiUrl, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                setUsers(data.users || []);
            } catch (err) {
                console.error("Failed to fetch users:", err);
                setError("Failed to load users. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    const filteredUsers = useMemo(() => {
        if (!searchTerm) return users;
        const lowercasedSearchTerm = searchTerm.toLowerCase();
        return users.filter(
            (user) =>
                user.name.toLowerCase().includes(lowercasedSearchTerm) ||
                user.email.toLowerCase().includes(lowercasedSearchTerm)
        );
    }, [users, searchTerm]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-900">
                <p className="text-xl text-white">Loading users...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-900">
                <p className="text-xl text-white">{error}</p>
            </div>
        );
    }

    return (
        <section className="min-h-screen bg-gray-900 py-12 px-4 font-sans">
            <div className="container mx-auto">
                <div className="flex items-center gap-x-3 mb-8">
                    <h2 className="text-3xl font-medium text-white">Users</h2>
                    <span className="px-3 py-1 text-xs text-white bg-blue-100 rounded-full dark:bg-gray-600     ">
                        {filteredUsers.length} users
                    </span>
                </div>

                <div className="mb-8">
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        className="w-2/6 p-3 border bg-gray-200 border-gray-300 rounded-lg shadow-sm focus:ring-pink-500 focus:border-pink-500 text-gray-900"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex flex-col">
                    <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                        <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                            <div className="overflow-hidden border border-gray-200 rounded-lg shadow-md">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-blue-50">
                                        <tr>
                                            <th className="py-3.5 px-4 text-sm font-normal text-left text-gray-600">
                                                <div className="flex items-center gap-x-3">
                                                    <span>Name</span>
                                                </div>
                                            </th>
                                            <th className="px-12 py-3.5 text-sm font-normal text-left text-gray-600">
                                                <button className="flex items-center gap-x-2">
                                                    <span>Status</span>
                                                </button>
                                            </th>
                                            <th className="px-4 py-3.5 text-sm font-normal text-left text-gray-600">Email address</th>
                                            <th className="px-4 py-3.5 text-sm font-normal text-left text-gray-600">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-blue-100 divide-y divide-gray-200">
                                        {filteredUsers.length > 0 ? (
                                            filteredUsers.map((user) => (
                                                <tr key={user._id}>
                                                    <td className="px-4 py-4 text-sm font-medium text-gray-700 whitespace-nowrap">
                                                        <div className="inline-flex items-center gap-x-3">
                                                            <img
                                                                src={user.avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                                                                alt={`${user.name}'s avatar`}
                                                                className="w-8 h-8 rounded-full object-cover"
                                                            />
                                                            <h2 className="font-medium text-gray-800">{user.name}</h2>
                                                        </div>
                                                    </td>
                                                    <td className="px-12 py-4 text-sm font-medium whitespace-nowrap">
                                                        <div
                                                            className={`inline-flex items-center px-3 py-1 rounded-full gap-x-2 ${user.type === "premium"
                                                                    ? "bg-yellow-100/60 text-yellow-600"
                                                                    : "bg-blue-100/60 text-blue-600"
                                                                }`}
                                                        >
                                                            <span
                                                                className={`h-1.5 w-1.5 rounded-full ${user.type === "premium" ? "bg-yellow-500" : "bg-blue-500"
                                                                    }`}
                                                            ></span>
                                                            <h2 className="text-sm font-normal">
                                                                {user.type.charAt(0).toUpperCase() + user.type.slice(1)}
                                                            </h2>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 text-sm text-gray-600 whitespace-nowrap">
                                                        {user.email}
                                                    </td>
                                                    <td className="px-4 py-4 text-sm whitespace-nowrap">
                                                        <div className="flex items-center gap-x-6">
                                                            <button
                                                                title="Delete"
                                                                className="text-gray-500 transition-colors duration-200 hover:text-red-500"
                                                            >
                                                                <svg
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                    className="w-5 h-5"
                                                                    fill="none"
                                                                    viewBox="0 0 24 24"
                                                                    stroke="currentColor"
                                                                    strokeWidth={1.5}
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        d="M6 18L18 6M6 6l12 12"
                                                                    />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={4} className="px-4 py-4 text-sm text-center text-gray-500">
                                                    No users found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Dummy Pagination */}
                <div className="flex items-center justify-between mt-6">
                    <a href="#" className="flex items-center px-5 py-2 text-sm text-gray-700 capitalize transition-colors duration-200 bg-white border rounded-md gap-x-2 hover:bg-gray-100">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 rtl:-scale-x-100">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 15.75L3 12m0 0l3.75-3.75M3 12h18" />
                        </svg>
                        <span>Previous</span>
                    </a>

                    <div className="items-center hidden lg:flex gap-x-3">
                        <a href="#" className="px-2 py-1 text-sm text-blue-500 rounded-md bg-blue-100/60">1</a>
                        <a href="#" className="px-2 py-1 text-sm text-gray-500 rounded-md hover:bg-gray-100">2</a>
                        <a href="#" className="px-2 py-1 text-sm text-gray-500 rounded-md hover:bg-gray-100">3</a>
                        <a href="#" className="px-2 py-1 text-sm text-gray-500 rounded-md">...</a>
                        <a href="#" className="px-2 py-1 text-sm text-gray-500 rounded-md hover:bg-gray-100">12</a>
                        <a href="#" className="px-2 py-1 text-sm text-gray-500 rounded-md hover:bg-gray-100">13</a>
                        <a href="#" className="px-2 py-1 text-sm text-gray-500 rounded-md hover:bg-gray-100">14</a>
                    </div>

                    <a href="#" className="flex items-center px-5 py-2 text-sm text-gray-700 capitalize transition-colors duration-200 bg-white border rounded-md gap-x-2 hover:bg-gray-100">
                        <span>Next</span>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 rtl:-scale-x-100">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                        </svg>
                    </a>
                </div>
            </div>
        </section>
    );
};

export default UsersTable;
