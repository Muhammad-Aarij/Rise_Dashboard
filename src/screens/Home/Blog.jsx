import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

// ================== CONFIG ==================
const BASE_URL = 'https://api.riseselfesteem.com';
const CLOUDINARY_CLOUD = 'dqzkekpjn';
const CLOUDINARY_PRESET = 'Rise_assets';
const PAGE_SIZE_DEFAULT = 9;

// ================== API ==================
const createBlog = async (blogData, userId) => {
  const res = await fetch(`${BASE_URL}/api/blog/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      mainImage: blogData.imageUrl,
      title: blogData.title,
      content: blogData.content,
    }),
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to create blog post');
  return res.json();
};

const updateBlog = async (blogId, blogData, userId) => {
  const res = await fetch(`${BASE_URL}/api/blog/${blogId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      mainImage: blogData.imageUrl,
      title: blogData.title,
      content: blogData.content,
    }),
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to update blog post');
  return res.json();
};

const getAllBlogs = async () => {
  const res = await fetch(`${BASE_URL}/api/blog`);
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to fetch blog posts');
  return res.json();
};

const deleteBlog = async (blogId) => {
  const res = await fetch(`${BASE_URL}/api/blog/${blogId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to delete blog post');
  return { success: true };
};

// ================== SMALL UTILS ==================
const clsx = (...xs) => xs.filter(Boolean).join(' ');
const truncate = (s = '', n = 140) => (s.length > n ? s.slice(0, n - 1) + '…' : s);

// ================== SKELETONS & MODALS ==================
const SkeletonCard = () => (
  <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden animate-pulse">
    <div className="h-40 bg-gray-700" />
    <div className="p-4 space-y-3">
      <div className="h-5 bg-gray-700 rounded" />
      <div className="h-4 bg-gray-700 rounded w-5/6" />
      <div className="h-9 bg-gray-700 rounded" />
    </div>
  </div>
);

const ConfirmModal = ({ open, title, message, busy, onCancel, onConfirm }) => {
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
};

// ================== FORM ==================
const BlogForm = ({ onSubmit, onCancel, initialData = null }) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(initialData?.imageUrl || '');

  useEffect(() => {
    if (!imageFile) return;
    const obj = URL.createObjectURL(imageFile);
    setPreview(obj);
    return () => URL.revokeObjectURL(obj);
  }, [imageFile]);

  const handleImageUpload = async () => {
    if (!imageFile) return null;
    setUploading(true);
    try {
      const data = new FormData();
      data.append('file', imageFile);
      data.append('upload_preset', CLOUDINARY_PRESET);
      data.append('cloud_name', CLOUDINARY_CLOUD);
      const res = await axios.post(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, data);
      setImageUrl(res.data.secure_url);
      return res.data.secure_url;
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Image upload failed. Try again.');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || (!imageUrl && !imageFile)) {
      alert('Please complete Title, Content and an Image.');
      return;
    }
    let url = imageUrl;
    if (imageFile && !imageUrl) {
      url = await handleImageUpload();
      if (!url) return;
    }
    onSubmit({ title: title.trim(), imageUrl: url, content: content.trim() });
  };

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-white mb-4">{initialData ? 'Edit Blog Post' : 'Add New Blog Post'}</h2>
      <form onSubmit={handleSubmit} className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Image picker + preview */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Cover Image</label>
            <div className="flex items-center gap-4">
              <label className="inline-flex items-center gap-2 cursor-pointer px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                />
                <span>Choose Image</span>
              </label>
              {uploading && <span className="text-xs text-yellow-400">Uploading…</span>}
              {imageUrl && !imageFile && (
                <a className="text-sm text-blue-400 underline" href={imageUrl} target="_blank" rel="noreferrer">
                  Current Image
                </a>
              )}
            </div>
            {preview && (
              <div className="mt-3">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-60 object-contain rounded-lg border border-gray-700"
                  onError={(e) => { e.currentTarget.src = 'https://placehold.co/600x300/1f2937/9ca3af?text=Preview+Unavailable'; }}
                />
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label htmlFor="blogTitle" className="block text-sm font-medium text-gray-400 mb-2">Title</label>
            <input
              id="blogTitle"
              type="text"
              className="w-full px-3 py-2 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter blog title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            {/* Content */}
            <label htmlFor="blogContent" className="block text-sm font-medium text-gray-400 mt-4 mb-2">Content</label>
            <textarea
              id="blogContent"
              rows={7}
              className="w-full px-3 py-2 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Write your blog content here…"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={uploading}
            className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-60"
          >
            {initialData ? 'Update Blog' : 'Add Blog'}
          </button>
        </div>
      </form>
    </div>
  );
};

// ================== ITEM CARD ==================
const BlogItem = ({ blog, onEdit, onDelete, onView }) => {
  const created = blog.createdAt ? new Date(blog.createdAt) : null;
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden hover:border-gray-700 transition-colors">
      <div className="relative">
        <img
          src={blog.imageUrl}
          alt={blog.title}
          className="w-full h-40 md:h-48 object-cover"
          onError={(e) => { e.currentTarget.src = 'https://placehold.co/800x450/111827/6b7280?text=Image'; }}
        />
        {created && (
          <span className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded">
            {created.toLocaleDateString()}
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-white line-clamp-2">{blog.title}</h3>
        <p className="mt-2 text-sm text-gray-300">{truncate(blog.content, 160)}</p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <button
            onClick={() => onView(blog)}
            className="px-3 py-2 rounded bg-gray-800 hover:bg-gray-700 text-sm"
          >
            View
          </button>
          <button
            onClick={() => onEdit(blog)}
            className="px-3 py-2 rounded bg-blue-600 hover:bg-blue-700 text-sm"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(blog.id)}
            className="px-3 py-2 rounded bg-rose-600 hover:bg-rose-700 text-sm"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// ================== DETAIL PAGE ==================
const BlogDetailPage = ({ blog, onBack }) => {
  if (!blog) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8 flex items-center justify-center">
        <div className="text-center">
          <p>Blog post not found.</p>
          <button
            onClick={onBack}
            className="mt-4 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded"
          >
            Back to Blogs
          </button>
        </div>
      </div>
    );
  }
  const created = blog.createdAt ? new Date(blog.createdAt).toLocaleString() : null;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <button
        onClick={onBack}
        className="mb-6 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded"
      >
        ← Back to Blogs
      </button>

      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <div className="relative">
          <img
            src={blog.imageUrl}
            alt={blog.title}
            className="w-full max-h-[520px] object-cover"
            onError={(e) => { e.currentTarget.src = 'https://placehold.co/1200x520/111827/6b7280?text=Image'; }}
          />
          {created && (
            <span className="absolute top-4 right-4 bg-black/60 text-white text-xs px-2 py-1 rounded">
              {created}
            </span>
          )}
        </div>
        <div className="p-6">
          <h1 className="text-3xl md:text-4xl font-bold">{blog.title}</h1>
          <div className="mt-6 text-gray-200 leading-relaxed whitespace-pre-wrap">
            {blog.content}
          </div>
        </div>
      </div>
    </div>
  );
};

// ================== MAIN PAGE ==================
export default function BlogPage() {
  const [blogs, setBlogs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [err, setErr] = useState('');
  const [showBlogDetail, setShowBlogDetail] = useState(false);
  const [selectedBlogForDetail, setSelectedBlogForDetail] = useState(null);

  // UI controls
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('newest'); // 'newest' | 'oldest' | 'az'
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_DEFAULT);
  const [confirm, setConfirm] = useState({ open: false, id: null, busy: false });

  const DUMMY_USER_ID = '6854f3663e37aad6eff91113';

  const fetchBlogs = async () => {
    setIsLoading(true);
    setErr('');
    try {
      const data = await getAllBlogs();
      const formatted = data.map((b) => ({
        id: b._id,
        title: b.title,
        imageUrl: b.mainImage,
        content: b.content,
        createdAt: b.createdAt || b.updatedAt || null,
      }));
      setBlogs(formatted);
    } catch (e) {
      console.error(e);
      setErr('Failed to load blog posts. Please check the API.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const handleAddBlog = async (blogData) => {
    setIsLoading(true);
    setErr('');
    try {
      await createBlog(blogData, DUMMY_USER_ID);
      setShowForm(false);
      setEditingBlog(null);
      await fetchBlogs();
    } catch (e) {
      console.error(e);
      setErr('Failed to add blog post. ' + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditBlog = (blog) => {
    setEditingBlog(blog);
    setShowForm(true);
    setShowBlogDetail(false);
  };

  const handleUpdateBlog = async (updatedData) => {
    if (!editingBlog) return;
    setIsLoading(true);
    setErr('');
    try {
      await updateBlog(editingBlog.id, updatedData, DUMMY_USER_ID);
      setShowForm(false);
      setEditingBlog(null);
      await fetchBlogs();
    } catch (e) {
      console.error(e);
      setErr('Failed to update blog post. ' + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const requestDelete = (blogId) => setConfirm({ open: true, id: blogId, busy: false });
  const cancelDelete = () => setConfirm({ open: false, id: null, busy: false });

  const doDelete = async () => {
    if (!confirm.id) return;
    setConfirm((c) => ({ ...c, busy: true }));
    try {
      await deleteBlog(confirm.id);
      await fetchBlogs();
    } catch (e) {
      console.error(e);
      setErr('Failed to delete blog post. ' + e.message);
    } finally {
      cancelDelete();
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingBlog(null);
  };

  const handleViewBlog = (blog) => {
    setSelectedBlogForDetail(blog);
    setShowBlogDetail(true);
    setShowForm(false);
  };

  const handleBackToBlogList = () => {
    setShowBlogDetail(false);
    setSelectedBlogForDetail(null);
  };

  // Derived: filtered + sorted
  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    const list = query
      ? blogs.filter((b) => b.title?.toLowerCase().includes(query) || b.content?.toLowerCase().includes(query))
      : blogs.slice();

    list.sort((a, b) => {
      if (sort === 'az') return (a.title || '').localeCompare(b.title || '');
      const da = new Date(a.createdAt || 0).getTime();
      const db = new Date(b.createdAt || 0).getTime();
      return sort === 'oldest' ? da - db : db - da; // newest default
    });

    return list;
  }, [blogs, q, sort]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageSlice = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Detail page
  if (showBlogDetail) {
    return <BlogDetailPage blog={selectedBlogForDetail} onBack={handleBackToBlogList} />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold text-center mb-8">Our Blog</h1>

      {/* Toolbar */}
      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
              placeholder="Search posts…"
              className="pl-10 pr-3 py-2 rounded-lg bg-gray-800 border border-gray-700"
            />
            <span className="absolute left-3 top-2.5 text-gray-400">🔎</span>
          </div>
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="az">Title A–Z</option>
          </select>
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
            className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700"
          >
            {[6, 9, 12, 18].map((n) => <option key={n} value={n}>{n}/page</option>)}
          </select>
        </div>

        {!showForm && (
          <button
            onClick={() => { setShowForm(true); setEditingBlog(null); }}
            className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg"
          >
            + Add New Blog Post
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <BlogForm
          onSubmit={editingBlog ? handleUpdateBlog : handleAddBlog}
          onCancel={handleCancelForm}
          initialData={editingBlog}
        />
      )}

      {/* Status */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}
      {!!err && <p className="text-center text-rose-400 mb-4">{err}</p>}

      {/* Grid */}
      {!isLoading && !err && (
        <>
          {filtered.length === 0 ? (
            <p className="text-center text-gray-400">No blog posts found.</p>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pageSlice.map((blog) => (
                  <BlogItem
                    key={blog.id}
                    blog={blog}
                    onEdit={handleEditBlog}
                    onDelete={(id) => requestDelete(id)}
                    onView={handleViewBlog}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-8">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 hover:bg-gray-700"
                  >
                    Prev
                  </button>
                  <div className="text-sm text-gray-300">Page {currentPage} / {totalPages}</div>
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
        </>
      )}

      {/* Delete confirm */}
      <ConfirmModal
        open={confirm.open}
        busy={confirm.busy}
        onCancel={cancelDelete}
        onConfirm={doDelete}
        title="Delete this post?"
        message="This will permanently remove the blog post."
      />
    </div>
  );
}
