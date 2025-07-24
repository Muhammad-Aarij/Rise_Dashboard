import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';


const NewsletterSender = () => {
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('');
  const queryClient = useQueryClient();
  const BASE_URL = 'https://rise-backend-xwmx.onrender.com';

  const handleSendNewsletter = () => {
    if (!subject || !content) {
      setStatus('Please fill in both the subject and content.');
      return;
    }

    console.log('Sending newsletter:', { subject, content });
    setStatus('✅ Newsletter sent successfully!');
    setSubject('');
    setContent('');
  };

  const fetchSubscribers = async () => {
    const res = await fetch(`${BASE_URL}/api/subscribed`);
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
  };

  const {
    data: subscribers = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['subscribers'],
    queryFn: fetchSubscribers,
  });

  const deleteSubscriber = async (id) => {
    const res = await fetch(`${BASE_URL}/api/subscribed/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete subscriber');
    return res.json();
  };


  const deleteMutation = useMutation({
    mutationFn: deleteSubscriber,
    onSuccess: () => {
      queryClient.invalidateQueries(['subscribers']);
    },
  });




  return (
    <div className="min-h-screen bg-gray-900 text-white px-4 py-10 flex flex-col items-center gap-10">
      {/* Newsletter Form */}
      <div className="rounded-2xl p-8 pl-0 w-full ">
        <h2 className="text-2xl font-bold mb-6 ">Send Newsletter</h2>

        <div className="mb-4">
          <label className="block text-sm mb-2">Subject</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Enter subject"
            className="w-full px-4 py-2 rounded-md bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm mb-2">Newsletter Content</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your newsletter here..."
            rows={6}
            className="w-full px-4 py-2 rounded-md bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <button
          onClick={handleSendNewsletter}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg font-semibold transition"
        >
          Send Newsletter
        </button>

        {status && <p className="mt-4 text-center text-sm text-green-400">{status}</p>}
      </div>

      {/* Subscriber Table */}
      <div className="w-full  bg-gray-800 rounded-xl p-6 shadow-lg">
        <h3 className="text-xl font-semibold mb-4">Subscribers</h3>

        {isLoading ? (
          <p className="text-gray-400">Loading...</p>
        ) : error ? (
          <p className="text-red-500">Failed to load subscribers.</p>
        ) : subscribers.length === 0 ? (
          <p className="text-gray-400">No subscribers yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto text-sm">
              <thead>
                <tr className="border-b border-gray-700 text-left">
                  <th className="pb-2 pr-4">Email</th>
                  <th className="pb-2 pr-4">Subscribed At</th>
                  <th className="pb-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((sub) => (
                  <tr key={sub._id} className="border-b border-gray-700">
                    <td className="py-2 pr-4">{sub.email}</td>
                    <td className="py-2 pr-4">
                      {(() => {
                        const date = new Date(sub.createdAt);
                        const day = String(date.getDate()).padStart(2, '0');
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const year = date.getFullYear();
                        return `${day} / ${month} / ${year}`;
                      })()}
                    </td>                    <td className="py-2">
                      <button
                        onClick={() => deleteMutation.mutate(sub._id)}
                        className="text-red-400 hover:text-red-600 transition"
                      >
                        Delete
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
};

export default NewsletterSender;
