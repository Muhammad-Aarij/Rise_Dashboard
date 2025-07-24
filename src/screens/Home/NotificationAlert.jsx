import React, { useState } from 'react';

const NotificationAlert = () => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [status, setStatus] = useState('');

  const handleSend = () => {
    if (!title || !body) {
      setStatus('Please fill in all fields.');
      return;
    }

    // Simulate API call
    console.log('Sending notification:', { title, body });
    setStatus('Notification sent successfully!');
    
    // Clear input
    setTitle('');
    setBody('');
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="bg-gray-800 text-white rounded-2xl p-8 w-full max-w-md shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-center">Send Notification</h2>

        <div className="mb-4">
          <label className="block text-sm mb-2">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter title"
            className="w-full px-4 py-2 rounded-md bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm mb-2">Message Body</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Enter message"
            rows={4}
            className="w-full px-4 py-2 rounded-md bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={handleSend}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold transition"
        >
          Send Notification
        </button>

        {status && (
          <p className="mt-4 text-center text-sm text-green-400">{status}</p>
        )}
      </div>
    </div>
  );
};

export default NotificationAlert;
