import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Mail, Trash2, Image as ImageIcon, Loader2, AlertCircle, CheckCircle2, Search } from 'lucide-react';


const clsx = (...xs) => xs.filter(Boolean).join(' ');
const SUBJECT_MAX = 120;
const BODY_MAX = 5000;
const PAGE_SIZE = 10;

function Confirm({ open, title, message, busy, onCancel, onConfirm }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-gray-900 shadow-2xl">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h4 className="text-white font-semibold">{title || 'Are you sure?'}</h4>
          <button onClick={onCancel} className="text-white/70 hover:text-white">✕</button>
        </div>
        <div className="p-5 text-gray-200 text-sm">{message || 'This action cannot be undone.'}</div>
        <div className="p-4 border-t border-white/10 flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 rounded bg-gray-800 text-white hover:bg-gray-700">Cancel</button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="px-4 py-2 rounded bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60"
          >
            {busy ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
export default function App() {
  return <NewsletterSender />;
}

const NewsletterSender = () => {
  const [subject, setSubject] = useState('');
  const [recipientName, setRecipientName] = useState('User');
  const [emailBodyText, setEmailBodyText] = useState('');
  const [receiver, setReceiver] = useState('subscriber'); 

  const [status, setStatus] = useState('');
  const [isSending, setIsSending] = useState(false);

  const [imageFile, setImageFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [logoUrl, setLogoUrl] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showPreview, setShowPreview] = useState(true);

  const [confirm, setConfirm] = useState({ open: false, id: null });

  const [subSearch, setSubSearch] = useState('');
  const [page, setPage] = useState(1);

  const queryClient = useQueryClient();
  const BASE_URL = 'https://api.riseselfesteem.com';

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const uploadImage = async () => {
    if (!imageFile) return null;


    const allowed = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (!allowed.includes(imageFile.type)) {
      setStatus('❌ Invalid logo type. Use PNG/JPG/WEBP/SVG/GIF.');
      return null;
    }
    const maxBytes = 5 * 1024 * 1024; // 5MB
    if (imageFile.size > maxBytes) {
      setStatus('❌ Logo too large. Max 5MB.');
      return null;
    }

    setIsUploading(true);
    setStatus('Uploading logo…');

    const data = new FormData();
    data.append('file', imageFile);
    data.append('upload_preset', 'Rise_assets');
    data.append('cloud_name', 'dqzkekpjn');

    try {
      const res = await fetch('https://api.cloudinary.com/v1_1/dqzkekpjn/image/upload', {
        method: 'POST',
        body: data,
      });
      if (!res.ok) throw new Error('Logo upload failed.');

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

  // File choose handler
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setImageFile(null);
      setPreviewUrl(null);
      return;
    }
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  // Email HTML
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

  
  const sendNewsletter = async () => {
    if (!subject.trim() || !emailBodyText.trim()) {
      setStatus('❌ Please fill in the subject and email body.');
      return;
    }
    if (subject.length > SUBJECT_MAX) {
      setStatus(`❌ Subject too long (>${SUBJECT_MAX} chars).`);
      return;
    }
    if (emailBodyText.length > BODY_MAX) {
      setStatus(`❌ Email body too long (>${BODY_MAX} chars).`);
      return;
    }

    setIsSending(true);
    setStatus('Sending newsletter…');

    try {
      let finalLogoUrl = logoUrl;
      if (imageFile) {
        const uploadedUrl = await uploadImage();
        if (!uploadedUrl) {
          setIsSending(false);
          return;
        }
        finalLogoUrl = uploadedUrl;
      }

      const emailContent = generateEmailHtml(recipientName, emailBodyText, finalLogoUrl);

      const response = await fetch(`${BASE_URL}/api/email/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, content: emailContent, receiver }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error Response:', errorData);
        throw new Error(errorData.message || 'Failed to send newsletter.');
      }

      await response.json().catch(() => ({})); 
      setStatus('✅ Newsletter sent successfully!');

      setSubject('');
      setEmailBodyText('');
      setRecipientName('User');
      setReceiver('subscriber');
      setImageFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
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

  // ===== Subscribers (Query) =====
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
    staleTime: 60_000,
  });

  // Sort newest → oldest
  const sortedSubscribers = useMemo(() => {
    return [...subscribers].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  }, [subscribers]);

  // Search filter
  const filteredSubscribers = useMemo(() => {
    const q = subSearch.trim().toLowerCase();
    if (!q) return sortedSubscribers;
    return sortedSubscribers.filter((s) => (s.email || '').toLowerCase().includes(q));
  }, [sortedSubscribers, subSearch]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredSubscribers.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const pageSlice = filteredSubscribers.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);

  // ===== Delete subscriber (Mutation) =====
  const deleteSubscriber = async (id) => {
    const res = await fetch(`${BASE_URL}/api/subscribed/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete subscriber');
    return res.json();
  };
  const deleteMutation = useMutation({
    mutationFn: deleteSubscriber,
    onSuccess: () => {
      queryClient.invalidateQueries(['subscribers']);
      setStatus('✅ Subscriber deleted successfully!');
    },
    onError: (err) => setStatus(`❌ Failed to delete subscriber: ${err.message}`),
  });

  // ===== UI =====
  return (
    <div className="p-4 sm:p-8 font-sans bg-gray-950 min-h-screen text-gray-200">
      <style>{`
        .image-upload-wrapper { display:flex; align-items:center; flex-wrap:wrap; gap:1rem; }
        .image-upload-wrapper input[type="file"] { display:none; }
        .image-upload-label { background-color:#4f46e5; color:#fff; padding:0.75rem 1.25rem; border-radius:0.75rem; font-weight:600; cursor:pointer; transition:.2s; white-space:nowrap; display:inline-flex; align-items:center; gap:.5rem }
        .image-upload-label:hover { background-color:#4338ca; }
        .image-preview { width:80px; height:80px; object-fit:cover; border-radius:.5rem; border:1px solid #4b5563; }
      `}</style>

      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
        {/* Left: Form + Preview */}
        <div className="flex-1 flex flex-col gap-8">
          {/* Form */}
          <div className="bg-gray-900 rounded-2xl p-6 sm:p-8 shadow-2xl border border-gray-800">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-center text-purple-400">Send Newsletter</h2>

            {/* Status toast */}
            {status && (
              <div
                className={clsx(
                  'mb-4 rounded-lg px-4 py-3 text-sm border',
                  status.startsWith('✅')
                    ? 'bg-emerald-900/20 border-emerald-700/40 text-emerald-200'
                    : 'bg-rose-900/20 border-rose-700/40 text-rose-200'
                )}
              >
                <div className="flex items-start gap-2">
                  {status.startsWith('✅') ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  <div>{status}</div>
                </div>
              </div>
            )}

            <div className="space-y-6">
              {/* Subject */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-400">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter newsletter subject"
                  maxLength={SUBJECT_MAX}
                  className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                />
                <div className="text-right text-[11px] text-gray-400 mt-1">{subject.length}/{SUBJECT_MAX}</div>
              </div>

              {/* Recipient name */}
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

              {/* Body */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-400">Email Body Content</label>
                <textarea
                  value={emailBodyText}
                  onChange={(e) => setEmailBodyText(e.target.value)}
                  placeholder="Enter the main body of the email here..."
                  rows={8}
                  maxLength={BODY_MAX}
                  className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors resize-y"
                />
                <div className="text-right text-[11px] text-gray-400 mt-1">{emailBodyText.length}/{BODY_MAX}</div>
              </div>

              {/* Logo upload */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-400">Change Logo</label>
                <div className="image-upload-wrapper">
                  <input id="image-upload" type="file" accept="image/*" onChange={handleImageChange} />
                  <label htmlFor="image-upload" className="image-upload-label">
                    <ImageIcon size={18} /> {imageFile ? 'Change Logo' : 'Upload Logo'}
                  </label>
                  {previewUrl && <img src={previewUrl} alt="Current Logo" className="image-preview" />}
                </div>
                {isUploading && (
                  <div className="text-xs text-gray-400 flex items-center gap-2 mt-1">
                    <Loader2 className="animate-spin" size={14} /> Uploading…
                  </div>
                )}
              </div>

              {/* Audience */}
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
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-bold text-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:bg-gray-600 disabled:cursor-not-allowed"
              >
                {isSending || isUploading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} /> Sending…
                  </>
                ) : (
                  <>
                    <Mail size={20} /> Send Newsletter
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gray-900 rounded-2xl p-6 sm:p-8 shadow-2xl border border-gray-800 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-purple-400">Email Preview</h3>
              <button
                onClick={() => setShowPreview((s) => !s)}
                className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm hover:bg-gray-700"
              >
                {showPreview ? 'Hide' : 'Show'} Preview
              </button>
            </div>
            {showPreview && (
              <div className="bg-gray-800 rounded-xl p-4 overflow-auto max-h-[500px]">
                <div dangerouslySetInnerHTML={{ __html: generateEmailHtml(recipientName, emailBodyText, previewUrl) }} />
              </div>
            )}
          </div>
        </div>

        {/* Right: Subscribers */}
        <div className="w-full lg:w-2/5 bg-gray-900 rounded-2xl p-6 sm:p-8 shadow-2xl border border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-bold text-purple-400">Subscribers ({filteredSubscribers.length})</h3>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 text-gray-400" size={16} />
              <input
                value={subSearch}
                onChange={(e) => { setSubSearch(e.target.value); setPage(1); }}
                placeholder="Search email…"
                className="pl-8 pr-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm"
              />
            </div>
          </div>

          {isLoading ? (
            <p className="text-gray-400 text-center">Loading subscribers…</p>
          ) : error ? (
            <p className="text-red-500 text-center">Failed to load subscribers.</p>
          ) : filteredSubscribers.length === 0 ? (
            <p className="text-gray-400 text-center">No subscribers found.</p>
          ) : (
            <>
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
                    {pageSlice.map((sub) => (
                      <tr key={sub._id} className="border-b border-gray-800 hover:bg-gray-800 transition-colors">
                        <td className="py-3 px-4">{sub.email}</td>
                        <td className="py-3 px-4">{new Date(sub.createdAt).toLocaleDateString()}</td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => setConfirm({ open: true, id: sub._id })}
                            className="text-red-400 hover:text-red-500 font-medium transition flex items-center gap-1"
                            disabled={deleteMutation.isLoading}
                          >
                            <Trash2 size={16} /> {deleteMutation.isLoading && confirm.id === sub._id ? 'Deleting…' : 'Delete'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 hover:bg-gray-700"
                  >
                    Prev
                  </button>
                  <div className="text-sm text-gray-300">
                    Page {pageSafe} / {totalPages}
                  </div>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 hover:bg-gray-700"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Delete confirm */}
      <Confirm
        open={confirm.open}
        busy={deleteMutation.isLoading}
        onCancel={() => setConfirm({ open: false, id: null })}
        onConfirm={() => {
          if (!confirm.id) return;
          deleteMutation.mutate(confirm.id, {
            onSettled: () => setConfirm({ open: false, id: null }),
          });
        }}
        title="Delete subscriber?"
        message="This will permanently remove the subscriber."
      />
    </div>
  );
};
