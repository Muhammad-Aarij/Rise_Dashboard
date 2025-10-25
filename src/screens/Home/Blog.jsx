import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BASE_URL = 'https://api.riseselfesteem.com';

const createBlog = async (blogData, userId) => {
    try {
        const response = await fetch(`${BASE_URL}/api/blog/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: userId, // Assuming userId is required by your API
                mainImage: blogData.imageUrl, // Map imageUrl from frontend to mainImage for API
                title: blogData.title,
                content: blogData.content,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to create blog post');
        }
        return await response.json(); // Return the created blog data from the API
    } catch (error) {
        console.error('Error in createBlog:', error);
        throw error; // Re-throw to be handled by the calling component
    }
};

// Function to update an existing blog post
const updateBlog = async (blogId, blogData, userId) => {
    try {
        const response = await fetch(`${BASE_URL}/api/blog/${blogId}`, {
            method: 'PUT', // or 'PATCH' if your API supports partial updates
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: userId, // Assuming userId is required for update as well
                mainImage: blogData.imageUrl,
                title: blogData.title,
                content: blogData.content,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to update blog post');
        }
        return await response.json(); // Return the updated blog data from the API
    } catch (error) {
        console.error('Error in updateBlog:', error);
        throw error;
    }
};

// Function to get all blog posts
const getAllBlogs = async () => {
    try {
        const response = await fetch(`${BASE_URL}/api/blog`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch blog posts');
        }
        return await response.json(); // Return an array of blog posts
    } catch (error) {
        console.error('Error in getAllBlogs:', error);
        throw error;
    }
};

// Function to delete a blog post
const deleteBlog = async (blogId) => {
    try {
        const response = await fetch(`${BASE_URL}/api/blog/${blogId}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to delete blog post');
        }
        return { success: true, message: 'Blog post deleted successfully' }; // Indicate success
    } catch (error) {
        console.error('Error in deleteBlog:', error);
        throw error;
    }
};


const BlogForm = ({ onSubmit, onCancel, initialData = null }) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async () => {
    if (!imageFile) return null;

    setUploading(true);
    const data = new FormData();
    data.append('file', imageFile);
    data.append('upload_preset', 'Rise_assets'); // <- Cloudinary preset
    data.append('cloud_name', 'dqzkekpjn');

    try {
      const res = await axios.post('https://api.cloudinary.com/v1_1/dqzkekpjn/image/upload', data);
      setImageUrl(res.data.secure_url);
      return res.data.secure_url;
    } catch (err) {
      console.error('Upload failed:', err);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || !content || (!imageUrl && !imageFile)) {
      alert('Please fill in all fields, including uploading an image.');
      return;
    }

    let url = imageUrl;

    if (imageFile && !imageUrl) {
      url = await handleImageUpload();
      if (!url) {
        alert('Image upload failed. Please try again.');
        return;
      }
    }

    onSubmit({ title, imageUrl: url, content });

    if (!initialData) {
      setTitle('');
      setContent('');
      setImageFile(null);
      setImageUrl('');
    }
  };

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-white mb-4">{initialData ? 'Edit Blog Post' : 'Add New Blog Post'}</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="blogImage" className="block text-white text-sm font-bold mb-2">
            Upload Image
          </label>
          <input
            type="file"
            id="blogImage"
            accept="image/*"
            className="bg-white text-blue-800  py-3 text-center font-semibold cursor-pointer text-sm px-4 rounded-md    "
            onChange={(e) => setImageFile(e.target.files[0])}
          />
          {uploading && <p className="text-sm text-yellow-400 mt-1">Uploading...</p>}
          {imageUrl && (
            <p className="text-sm text-green-400 mt-1">
              ✅ Image uploaded <a href={imageUrl} target="_blank" rel="noreferrer" className="underline">View</a>
            </p>
          )}
        </div>

        <div className="mb-4">
          <label htmlFor="blogTitle" className="block text-white text-sm font-bold mb-2">
            Title:
          </label>
          <input
            type="text"
            id="blogTitle"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-white bg-gray-800 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Enter blog title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="mb-6">
          <label htmlFor="blogContent" className="block text-white text-sm font-bold mb-2">
            Content:
          </label>
          <textarea
            id="blogContent"
            rows="5"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-white bg-gray-800 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Write your blog content here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          ></textarea>
        </div>

        <div className="flex items-center justify-end space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-200"
          >
            {initialData ? 'Update Blog' : 'Add Blog'}
          </button>
        </div>
      </form>
    </div>
  );
};



// --- BlogItem Component ---
const BlogItem = ({ blog, onEdit, onDelete, onView }) => {
    return (
        <div className="bg-[#f7f7f7ee] rounded-lg shadow-md flex flex-col items-center md:items-start mb-6 overflow-hidden">
            <img
                src={blog.imageUrl}
                alt={blog.title}
                className="w-full h-32 md:h-48 object-cover rounded-t-lg shadow-sm flex-shrink-0"
                onError={(e) => { 
                    e.target.src = 'https://placehold.co/400x225/E0E0E0/333333?text=Image+Error'; 
                }}
            />
            <div className="p-3 w-full">
                <h3 className="text-xl font-bold text-gray-800 mb-2">{blog.title}</h3>
                
                {/* Content */}
                <p className="text-gray-600 text-sm mb-3 line-clamp-3 break-words">
                    {blog.content}
                </p>

                {/* Buttons */}
                <div className="flex space-x-3">
                    <button
                        onClick={() => onView(blog)}
                        className="border-2 flex-1 border-blue-500 hover:bg-blue-200 text-blue-500 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-200"
                    >
                        View
                    </button>
                    <button
                        onClick={() => onEdit(blog)}
                        className="border-blue-500 flex-1 border-2 hover:bg-blue-200 text-blue-500 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-200"
                    >
                        Edit
                    </button>
                    <button
                        onClick={() => onDelete(blog.id)}
                        className="bg-red-500 flex-1 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-200"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- BlogDetailPage Component ---
const BlogDetailPage = ({ blog, onBack }) => {
    if (!blog) {
        return (
            <div className="min-h-screen bg-gray-900 text-white font-sans antialiased p-8 flex items-center justify-center">
                <p>Blog post not found.</p>
                <button
                    onClick={onBack}
                    className="ml-4 bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-200"
                >
                    Back to Blogs
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white font-sans antialiased p-8">
            <button
                onClick={onBack}
                className="mb-6 bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-200"
            >
                &larr; Back to Blogs
            </button>

            <div className="bg-white text p-6 rounded-lg shadow-lg text-gray-800">
                <h1 className="text-4xl font-bold mb-4">{blog.title}</h1> 
                <img
                    src={blog.imageUrl}
                    alt={blog.title}
                    className="w-auto h-[400px] object-cover rounded-lg mb-6 shadow-md mx-auto"
                    onError={(e) => { e.target.src = 'https://placehold.co/800x450/E0E0E0/333333?text=Image+Error'; }} // Fallback
                />
                <div className="text-lg leading-relaxed whitespace-pre-wrap">
                    {blog.content}
                </div>
            </div>
        </div>
    );
};


// --- BlogPage Component (Main component) ---
export default function BlogPage() {
    const [blogs, setBlogs] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingBlog, setEditingBlog] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showBlogDetail, setShowBlogDetail] = useState(false); // New state for showing detail page
    const [selectedBlogForDetail, setSelectedBlogForDetail] = useState(null); // New state for selected blog


    // Dummy userId as there's no actual authentication in this context
    // In a real app, this would come from your authentication system
    const DUMMY_USER_ID = "6854f3663e37aad6eff91113";

    // Function to fetch all blogs from the API
    const fetchBlogs = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getAllBlogs();
            // Assuming your API returns an array of blog objects
            // Each blog object should ideally have an 'id', 'title', 'mainImage', 'content'
            // You might need to map 'mainImage' from API to 'imageUrl' for BlogItem
            const formattedBlogs = data.map(blog => ({
                id: blog._id, // Assuming your API uses _id for document ID
                title: blog.title,
                imageUrl: blog.mainImage,
                content: blog.content,
                // Add other fields if necessary
            })).reverse(); // Reverse to show latest first if API doesn't order

            setBlogs(formattedBlogs);
        } catch (e) {
            console.error("Error fetching blogs:", e);
            setError("Failed to load blog posts. Please check the API URL and network connection.");
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch blogs on component mount
    useEffect(() => {
        fetchBlogs();
    }, []); // Empty dependency array means this runs once on mount

    const handleAddBlog = async (blogData) => {
        setIsLoading(true);
        setError(null);
        try {
            await createBlog(blogData, DUMMY_USER_ID);
            setShowForm(false);
            setEditingBlog(null);
            await fetchBlogs(); // Re-fetch blogs to update the list
        } catch (e) {
            console.error("Error adding blog:", e);
            setError("Failed to add blog post. " + e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditBlog = (blog) => {
        setEditingBlog(blog);
        setShowForm(true);
        setShowBlogDetail(false); // Hide detail page if editing from there
    };

    const handleUpdateBlog = async (updatedData) => {
        if (!editingBlog) return;
        setIsLoading(true);
        setError(null);
        try {
            await updateBlog(editingBlog.id, updatedData, DUMMY_USER_ID);
            setShowForm(false);
            setEditingBlog(null);
            await fetchBlogs(); // Re-fetch blogs to update the list
        } catch (e) {
            console.error("Error updating blog:", e);
            setError("Failed to update blog post. " + e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteBlog = async (blogId) => {
        const isConfirmed = window.confirm("Are you sure you want to delete this blog post?");
        if (!isConfirmed) {
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            await deleteBlog(blogId);
            await fetchBlogs(); // Re-fetch blogs to update the list
        } catch (e) {
            console.error("Error deleting blog:", e);
            setError("Failed to delete blog post. " + e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancelForm = () => {
        setShowForm(false);
        setEditingBlog(null);
    };

    // New function to handle viewing a blog in detail
    const handleViewBlog = (blog) => {
        setSelectedBlogForDetail(blog);
        setShowBlogDetail(true);
        setShowForm(false); // Ensure form is hidden when viewing detail
    };

    // New function to go back from the blog detail page
    const handleBackToBlogList = () => {
        setShowBlogDetail(false);
        setSelectedBlogForDetail(null);
    };

    // Render the BlogDetailPage if showBlogDetail is true
    if (showBlogDetail) {
        return <BlogDetailPage blog={selectedBlogForDetail} onBack={handleBackToBlogList} />;
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white font-sans antialiased p-8">
            <h1 className="text-4xl font-bold text-center mb-8">Our Blog</h1>

            {/* Add Blog Button */}
            {!showForm && (
                <div className="flex justify-center mb-8">
                    <button
                        onClick={() => { setShowForm(true); setEditingBlog(null); }}
                        className="bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition duration-200"
                    >
                        Add New Blog Post
                    </button>
                </div>
            )}

            {/* Blog Form (shown when adding or editing) */}
            {showForm && (
                <BlogForm
                    onSubmit={editingBlog ? handleUpdateBlog : handleAddBlog}
                    onCancel={handleCancelForm}
                    initialData={editingBlog}
                />
            )}

            {/* Loading and Error Messages */}
            {isLoading && <p className="text-center text-blue-400 mb-4">Loading blog posts...</p>}
            {error && <p className="text-center text-red-500 mb-4">{error}</p>}

            {/* Blogs List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {blogs.length === 0 && !isLoading && !error && (
                    <p className="text-center text-gray-400 col-span-full">No blog posts found. Add one to get started!</p>
                )}
                {blogs.map((blog) => (
                    <BlogItem
                        key={blog.id}
                        blog={blog}
                        onEdit={handleEditBlog}
                        onDelete={handleDeleteBlog}
                        onView={handleViewBlog}
                    />
                ))}
            </div>
        </div>
    );
}
