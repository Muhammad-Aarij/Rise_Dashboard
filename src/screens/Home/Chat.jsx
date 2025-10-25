import React, { useState, useEffect, useRef } from "react";
// import { FaPhone, FaVideo } from "react-icons/fa"; // Removed problematic imports
// import { IoMdSend } from "react-icons/io"; // Removed problematic imports
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

// Base URL for API calls
const BASE_URL = 'https://api.riseselfesteem.com';

// Simulate the current logged-in user ID. Replace with actual user ID from authentication if available.
const CURRENT_USER_ID = "6854f3663e37aad6eff91113"; // Example: 'test1' user ID

// Helper function to format time (e.g., "15 mins ago")
const formatTimeAgo = (isoDateString) => {
  const date = new Date(isoDateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return `${seconds} secs ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} mins ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} days ago`;

  // Fallback to a more standard date format for older messages
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function ChatScreen() {
  const queryClient = useQueryClient();
  const messagesEndRef = useRef(null); // Ref for auto-scrolling to the latest message

  const [selectedChatRoom, setSelectedChatRoom] = useState(null); // Stores the currently active chat room object
  const [newMessage, setNewMessage] = useState(''); // Stores the message being typed in the input field

  // 1. Fetch all chat rooms
  const { data: chatRooms = [], isLoading: isLoadingChatRooms, error: chatRoomsError } = useQuery({
    queryKey: ['chatRooms'],
    queryFn: async () => {
      const res = await axios.get(`${BASE_URL}/api/chat`);
      return res.data;
    },
  });

  // 2. Fetch messages for the selected chat room
  const { data: messages = [], isLoading: isLoadingMessages, error: messagesError } = useQuery({
    queryKey: ['messages', selectedChatRoom?._id], // Query depends on selectedChatRoom ID
    queryFn: async () => {
      if (!selectedChatRoom?._id) return []; // Don't fetch if no chat room is selected
      const res = await axios.get(`${BASE_URL}/api/chat/${selectedChatRoom._id}`);
      return res.data;
    },
    enabled: !!selectedChatRoom?._id, // Only run this query if selectedChatRoom._id exists
  });

  // 3. Mutation for sending a new message
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData) => {
      const res = await axios.post(`${BASE_URL}/api/chat`, messageData);
      return res.data;
    },
    onSuccess: () => {
      // Invalidate the messages query for the current chat room to refetch latest messages
      queryClient.invalidateQueries(['messages', selectedChatRoom._id]);
      setNewMessage(''); // Clear the input field after sending
    },
    onError: (err) => {
      console.error("Error sending message:", err);
      // Optionally, display an error to the user
    }
  });

  // Scroll to the latest message whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle sending message
  const handleSendMessage = () => {
    if (newMessage.trim() === '' || !selectedChatRoom) return;

    sendMessageMutation.mutate({
      chatRoom: selectedChatRoom._id,
      sender: CURRENT_USER_ID, // Use the simulated current user ID
      message: newMessage,
    });
  };

  // Determine the display name and avatar for the chat header
  const getChatHeaderInfo = () => {
    if (!selectedChatRoom) return { name: "Select a Chat", avatar: "" };

    // Find the other participant in a 1-on-1 chat
    const otherParticipant = selectedChatRoom.participants.find(
      (p) => p._id !== CURRENT_USER_ID
    );

    return {
      name: otherParticipant?.name || 'Unknown User',
      avatar: otherParticipant?.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png', // Default avatar
      online: otherParticipant?.status === 'active' ? true : false // Assuming 'active' means online
    };
  };

  const { name: headerName, avatar: headerAvatar, online: headerOnline } = getChatHeaderInfo();

  return (
    <div className="flex h-screen bg-[#0F172A] text-white font-inter rounded-lg overflow-hidden shadow-lg">
      {/* Sidebar */}
      <div className="w-72 bg-[#1E293B] p-4 flex flex-col border-r border-[#334155] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4 text-purple-400">Chats</h2>
        <input
          type="text"
          placeholder="Search chats..."
          className="w-full px-3 py-2 rounded-lg bg-[#0F172A] text-white mb-4 border border-[#334155] focus:outline-none focus:ring-1 focus:ring-blue-500"
        />

        {isLoadingChatRooms ? (
          <p className="text-gray-400 text-center">Loading chats...</p>
        ) : chatRoomsError ? (
          <p className="text-red-400 text-center">Error loading chats: {chatRoomsError.message}</p>
        ) : chatRooms.length === 0 ? (
          <p className="text-gray-400 text-center">No chat rooms available.</p>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {chatRooms.map((room) => {
              // Find the other participant for display in the sidebar
              const otherParticipant = room.participants.find(p => p._id !== CURRENT_USER_ID);
              if (!otherParticipant) return null; // Skip if no other participant found (e.g., self-chat, or invalid data)

              const isActive = selectedChatRoom?._id === room._id;
              const onlineStatusColor = otherParticipant.status === 'active' ? 'bg-green-400' : 'bg-orange-400';
              const lastMessageTime = room.updatedAt ? formatTimeAgo(room.updatedAt) : ''; // Use updatedAt for last activity time

              return (
                <div
                  key={room._id}
                  className={`flex items-center gap-3 py-3 px-2 rounded-lg cursor-pointer transition-colors duration-200 ${
                    isActive ? 'bg-blue-600' : 'hover:bg-[#334155]'
                  }`}
                  onClick={() => setSelectedChatRoom(room)}
                >
                  <div className="relative">
                    <img
                      src={otherParticipant.avatar || 'https://placehold.co/40x40/5A67D8/FFFFFF?text=P'}
                      alt={otherParticipant.name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-[#1E293B]"
                      onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/40x40/5A67D8/FFFFFF?text=P'; }}
                    />
                    <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#1E293B] ${onlineStatusColor}`} />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="font-medium leading-tight truncate">{otherParticipant.name}</div>
                    <div className="text-xs text-gray-400 truncate">{otherParticipant.role || 'User'}</div>
                  </div>
                  <div className="ml-auto text-xs text-gray-400 whitespace-nowrap">{lastMessageTime}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-[#0F172A]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#334155] bg-[#1E293B]">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={headerAvatar || 'https://placehold.co/40x40/EC4899/FFFFFF?text=P'}
                alt={headerName}
                className="w-10 h-10 rounded-full object-cover border-2 border-[#0F172A]"
                onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/40x40/EC4899/FFFFFF?text=P'; }}
              />
              <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0F172A] ${headerOnline ? 'bg-green-400' : 'bg-gray-500'}`} />
            </div>
            <div>
              <div className="font-semibold text-lg">{headerName}</div>
              <div className="text-xs text-gray-400">
                {selectedChatRoom ? (headerOnline ? 'Online' : 'Offline') : ''}
              </div>
            </div>
          </div>
          <div className="flex gap-4">
            {/* Phone Icon (using SVG) */}
            <button className="text-gray-400 hover:text-blue-400 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </button>
            {/* Video Icon (using SVG) */}
            <button className="text-gray-400 hover:text-blue-400 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages Display Area */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto custom-scrollbar">
          {isLoadingMessages ? (
            <p className="text-gray-400 text-center">Loading messages...</p>
          ) : messagesError ? (
            <p className="text-red-400 text-center">Error loading messages: {messagesError.message}</p>
          ) : messages.length === 0 ? (
            <p className="text-gray-400 text-center">No messages in this chat yet. Start a conversation!</p>
          ) : (
            messages.map((message) => (
              <div
                key={message._id}
                className={`flex items-start gap-2 ${
                  message.sender._id === CURRENT_USER_ID ? 'justify-end' : ''
                }`}
              >
                {/* Display sender avatar only for received messages */}
                {message.sender._id !== CURRENT_USER_ID && (
                  <img
                    src={message.sender.avatar || 'https://placehold.co/32x32/5A67D8/FFFFFF?text=P'}
                    alt={message.sender.name}
                    className="w-8 h-8 rounded-full object-cover"
                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/32x32/5A67D8/FFFFFF?text=P'; }}
                  />
                )}
                <div>
                  <div
                    className={`px-4 py-2 rounded-xl max-w-xs sm:max-w-md break-words ${
                      message.sender._id === CURRENT_USER_ID
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-[#334155] text-white rounded-bl-none'
                    }`}
                  >
                    {message.message}
                  </div>
                  <div className={`text-xs text-gray-400 mt-1 ${message.sender._id === CURRENT_USER_ID ? 'text-right' : ''}`}>
                    {formatTimeAgo(message.createdAt)}
                  </div>
                </div>
                {/* Display sender avatar for sent messages (optional, or just for alignment) */}
                {message.sender._id === CURRENT_USER_ID && (
                   <img
                    src={message.sender.avatar || 'https://placehold.co/32x32/EC4899/FFFFFF?text=P'}
                    alt="You"
                    className="w-8 h-8 rounded-full object-cover"
                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/32x32/EC4899/FFFFFF?text=P'; }}
                  />
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} /> {/* Element to scroll into view */}
        </div>

        {/* Message Input */}
        <div className="flex items-center p-4 border-t border-[#334155] bg-[#1E293B]">
          <input
            type="text"
            placeholder={selectedChatRoom ? "Type a message..." : "Select a chat to type a message"}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSendMessage();
              }
            }}
            disabled={!selectedChatRoom || sendMessageMutation.isLoading}
            className="flex-1 px-4 py-3 rounded-xl bg-[#0F172A] text-white border border-[#334155] focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-400"
          />
          <button
            onClick={handleSendMessage}
            disabled={!selectedChatRoom || newMessage.trim() === '' || sendMessageMutation.isLoading}
            className="ml-4 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sendMessageMutation.isLoading ? (
              <span className="animate-spin text-white"></span> // Simple loading spinner
            ) : (
              // Send Icon (using SVG)
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
