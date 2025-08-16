import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Mail, Trash2 } from 'lucide-react'; // Using Lucide React for modern icons

// Main App component
export default function App() {
  return <NewsletterSender />;
}

// Newsletter Sender Component
const NewsletterSender = () => {
  const [subject, setSubject] = useState('');
  const [recipientName, setRecipientName] = useState('User'); // Default recipient name
  const [emailBodyText, setEmailBodyText] = useState(''); // Text for the email body
  const [receiver, setReceiver] = useState('subscriber'); // Default to 'subscriber'
  const [status, setStatus] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [logoUrl, setLogoUrl] = useState(null); // Default logo is now null
  const [previewUrl, setPreviewUrl] = useState(null); // State for the image preview
  const queryClient = useQueryClient();
  const BASE_URL = 'https://rise-backend-xwmx.onrender.com';

  // Clean up the temporary object URL when the component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Function to upload logo to Cloudinary
  const uploadImage = async () => {
    if (!imageFile) return null;

    setIsUploading(true);
    setStatus('Uploading logo...');

    const data = new FormData();
    data.append('file', imageFile);
    data.append('upload_preset', 'Rise_assets');
    data.append('cloud_name', 'dqzkekpjn');

    try {
      const res = await fetch('https://api.cloudinary.com/v1_1/dqzkekpjn/image/upload', {
        method: 'POST',
        body: data,
      });

      if (!res.ok) {
        throw new Error('Logo upload failed.');
      }
      
      const resData = await res.json();
      setLogoUrl(resData.secure_url);
      return resData.secure_url;
    } catch (err) {
      console.error('Upload failed:', err);
      setStatus(`❌ Logo upload failed: ${err.message}`);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  // Function to handle file selection and create a preview URL
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      // Create a temporary URL for the preview
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setImageFile(null);
      setPreviewUrl(null);
    }
  };

  // Function to generate the full HTML email content
  const generateEmailHtml = (name, bodyText, currentLogoUrl) => {
    const imageTag = currentLogoUrl
      ? `<img style="width: 100px; height: 100px; margin-top: 20px;" src="${currentLogoUrl}" alt="RISE Logo">`
      : '';

    return `
      <div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 20px;">
        <div style="background-color: #2b5e68; padding: 25px; border-radius: 10px; color: #ffffff; max-width: 600px; margin: auto;">
          <p>Dear <strong>${name}</strong>,</p>
          <p>
            ${bodyText}
          </p>
          <p style="margin-top: 30px;">
            Best regards,<br>
            <strong>The RISE Team</strong>
          </p>
          ${imageTag}
        </div>
      </div>
    `;
  };

  // Function to send the newsletter
  const sendNewsletter = async () => {
    if (!subject.trim() || !emailBodyText.trim()) {
      setStatus('Please fill in the subject and email body.');
      return;
    }

    setIsSending(true);
    setStatus('Sending newsletter...');

    try {
      let finalLogoUrl = logoUrl;
      // Upload image first if a new one is selected
      if (imageFile) {
        const uploadedUrl = await uploadImage();
        if (uploadedUrl) {
          finalLogoUrl = uploadedUrl;
        } else {
          setIsSending(false);
          return; // Stop if logo upload fails
        }
      }

      const emailContent = generateEmailHtml(recipientName, emailBodyText, finalLogoUrl);

      // Log the content before sending
      console.log('Sending email with payload:', { subject, content: emailContent, receiver });

      const response = await fetch(`${BASE_URL}/api/email/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subject, content: emailContent, receiver }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error Response:', errorData);
        throw new Error(errorData.message || 'Failed to send newsletter. Please check the console for details.');
      }

      // Log the successful JSON response
      const successData = await response.json();
      console.log('API Success Response:', successData);
      setStatus('✅ Newsletter sent successfully!');

      setSubject('');
      setEmailBodyText('');
      setRecipientName('User');
      setReceiver('subscriber');
      setImageFile(null);
      setPreviewUrl(null);
      setLogoUrl(null);
      queryClient.invalidateQueries(['subscribers']);
    } catch (error) {
      console.error('Failed to send newsletter:', error);
      setStatus(`❌ Error: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };


  // React Query to fetch subscribers
  const fetchSubscribers = async () => {
    const res = await fetch(`${BASE_URL}/api/subscribed`);
    if (!res.ok) throw new Error('Failed to fetch subscribers');
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

  // React Query to delete a subscriber
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
      setStatus('Subscriber deleted successfully!');
    },
    onError: (err) => {
      setStatus(`Failed to delete subscriber: ${err.message}`);
    },
  });

  return (
    <div className="p-4 sm:p-8 font-sans bg-gray-950 min-h-screen text-gray-200">
      <style>{`
        .image-upload-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .image-upload-wrapper input[type="file"] {
          display: none;
        }
        .image-upload-label {
          background-color: #4f46e5;
          color: white;
          padding: 0.75rem 1.25rem;
          border-radius: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.3s;
          white-space: nowrap;
        }
        .image-upload-label:hover {
          background-color: #4338ca;
        }
        .image-preview {
          width: 80px;
          height: 80px;
          object-fit: cover;
          border-radius: 0.5rem;
          border: 1px solid #4b5563;
        }
      `}</style>
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
        {/* Newsletter Form and Preview */}
        <div className="flex-1 flex flex-col gap-8">
          {/* Newsletter Form */}
          <div className="bg-gray-900 rounded-2xl p-6 sm:p-8 shadow-2xl border border-gray-800">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-center text-purple-400">Send Newsletter</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-400">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter newsletter subject"
                  className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-400">Recipient Name (for personalization)</label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Enter recipient name"
                  className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-400">Email Body Content</label>
                <textarea
                  value={emailBodyText}
                  onChange={(e) => setEmailBodyText(e.target.value)}
                  placeholder="Enter the main body of the email here..."
                  rows={6}
                  className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors resize-none"
                />
              </div>

              <div className="image-upload-wrapper">
                <label className="block text-sm font-medium text-gray-400">Change Logo</label>
                <input 
                  id="image-upload" 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageChange} 
                />
                <label htmlFor="image-upload" className="image-upload-label">
                  {imageFile ? 'Change Logo' : 'Upload Logo'}
                </label>
                {previewUrl && (
                  <img 
                    src={previewUrl} 
                    alt="Current Logo" 
                    className="image-preview"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-400">Send to</label>
                <select
                  value={receiver}
                  onChange={(e) => setReceiver(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                >
                  <option value="subscriber">Subscribers</option>
                  <option value="user">Users</option>
                </select>
              </div>

              <button
                onClick={sendNewsletter}
                disabled={isSending || isUploading || !subject.trim() || !emailBodyText.trim()}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSending || isUploading ? 'Sending...' : (
                  <>
                    <Mail size={20} /> Send Newsletter
                  </>
                )}
              </button>
            </div>

            {status && (
              <p className={`mt-6 text-center font-medium ${status.startsWith('✅') ? 'text-green-400' : 'text-red-400'}`}>
                {status}
              </p>
            )}
          </div>
          
          {/* Email Preview */}
          <div className="bg-gray-900 rounded-2xl p-6 sm:p-8 shadow-2xl border border-gray-800 overflow-hidden">
            <h3 className="text-2xl font-bold mb-6 text-purple-400">Email Preview</h3>
            <div className="bg-gray-800 rounded-xl p-4 overflow-auto max-h-[500px]">
               <div dangerouslySetInnerHTML={{ __html: generateEmailHtml(recipientName, emailBodyText, previewUrl) }} />
            </div>
          </div>
        </div>

        {/* Subscriber Table */}
        <div className="w-full lg:w-2/5 bg-gray-900 rounded-2xl p-6 sm:p-8 shadow-2xl border border-gray-800">
          <h3 className="text-2xl font-bold mb-6 text-purple-400">Subscribers ({subscribers.length})</h3>
          
          {isLoading ? (
            <p className="text-gray-400 text-center">Loading subscribers...</p>
          ) : error ? (
            <p className="text-red-500 text-center">Failed to load subscribers.</p>
          ) : subscribers.length === 0 ? (
            <p className="text-gray-400 text-center">No subscribers yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-700">
              <table className="min-w-full table-auto text-sm">
                <thead className="bg-gray-800">
                  <tr className="border-b border-gray-700">
                    <th className="py-3 px-4 text-left font-semibold text-gray-400">Email</th>
                    <th className="py-3 px-4 text-left font-semibold text-gray-400">Subscribed At</th>
                    <th className="py-3 px-4 text-left font-semibold text-gray-400">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.map((sub) => (
                    <tr key={sub._id} className="border-b border-gray-800 hover:bg-gray-800 transition-colors">
                      <td className="py-3 px-4">{sub.email}</td>
                      <td className="py-3 px-4">
                        {new Date(sub.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => deleteMutation.mutate(sub._id)}
                          className="text-red-400 hover:text-red-500 font-medium transition flex items-center gap-1"
                          disabled={deleteMutation.isLoading}
                        >
                          <Trash2 size={16} /> {deleteMutation.isLoading ? 'Deleting...' : 'Delete'}
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
    </div>
  );
};
