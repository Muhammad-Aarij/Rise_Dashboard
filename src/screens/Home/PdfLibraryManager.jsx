import React, { useState, useEffect } from 'react';


const BASE_URL = 'https://api.riseselfesteem.com';
const CLOUDINARY_CLOUD_NAME = 'dqzkekpjn'; // As provided in your example
const CLOUDINARY_UPLOAD_PRESET = 'Rise_assets'; // As provided in your example

// --- API Functions (Consolidated from resourceApi.js) ---
// Function to create a new resource (PDF book in this context)
const createResource = async (resourceData) => {
  try {
    const response = await fetch(`${BASE_URL}/api/resource`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: resourceData.type, // e.g., "pdf"
        link: resourceData.link,
        isPremium: resourceData.isPremium,
        title: resourceData.title,
        description: resourceData.description,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create resource');
    }
    return await response.json(); // Return the created resource data from the API
  } catch (error) {
    console.error('Error in createResource:', error);
    throw error; // Re-throw to be handled by the calling component
  }
};

// Function to get all resources (and filter for PDFs)
const getAllResources = async () => {
  try {
    const response = await fetch(`${BASE_URL}/api/resource`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch resources');
    }
    const data = await response.json();
    // Filter for resources of type "pdf" as per the component's purpose
    return data.filter(resource => resource.type === 'pdf');
  } catch (error) {
    console.error('Error in getAllResources:', error);
    throw error;
  }
};

// Function to update an existing resource
const updateResource = async (resourceId, resourceData) => {
  try {
    const response = await fetch(`${BASE_URL}/api/resource/${resourceId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: resourceData.title,
        description: resourceData.description,
        type: resourceData.type, // e.g., "pdf"
        link: resourceData.link,
        isPremium: resourceData.isPremium,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update resource');
    }
    return await response.json(); // Return the updated resource data from the API
  } catch (error) {
    console.error('Error in updateResource:', error);
    throw error;
  }
};

// Function to delete a resource
const deleteResource = async (resourceId) => {
  try {
    const response = await fetch(`${BASE_URL}/api/resource/${resourceId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete resource');
    }
    return { success: true, message: 'Resource deleted successfully' }; // Indicate success
  } catch (error) {
    console.error('Error in deleteResource:', error);
    throw error;
  }
};
// --- End API Functions ---

const PdfLibraryManager = () => {
  const [books, setBooks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingBookId, setEditingBookId] = useState(null);

  const [bookName, setBookName] = useState('');
  const [bookType, setBookType] = useState('Free'); // Maps to isPremium: false
  const [bookLink, setBookLink] = useState(''); // Stores the PDF URL from Cloudinary or manual input
  const [bookDescription, setBookDescription] = useState(''); 
  const [bookFile, setBookFile] = useState(null); // New: to store the selected PDF file object
  
  const [isProcessing, setIsProcessing] = useState(false); // Combined loading state for upload + API call
  const [uploadMessage, setUploadMessage] = useState(''); // Message specific to file upload
  const [error, setError] = useState(null); // For overall errors (API or upload)

  // Function to fetch all PDF resources from the API
  const fetchBooks = async () => {
    setIsProcessing(true); // Use combined loading state
    setError(null);
    try {
      const data = await getAllResources(); // This function already filters for type 'pdf'
      const formattedBooks = data.map(resource => ({
        id: resource._id,
        name: resource.title,
        type: resource.isPremium ? 'Paid' : 'Free',
        link: resource.link,
        description: resource.description,
      }));
      setBooks(formattedBooks);
    } catch (err) {
      console.error("Failed to fetch books:", err);
      setError(err.message || "Failed to load PDF library.");
    } finally {
      setIsProcessing(false); // Use combined loading state
    }
  };

  // Fetch books on component mount
  useEffect(() => {
    fetchBooks();
  }, []);

  const openAddModal = () => {
    setIsEditing(false);
    setEditingBookId(null);
    setBookName('');
    setBookType('Free');
    setBookLink(''); // Reset book link
    setBookDescription(''); 
    setBookFile(null); // Reset selected file
    setUploadMessage(''); // Reset upload message
    setError(null); // Clear errors
    setShowModal(true);
  };

  const openEditModal = (book) => {
    setIsEditing(true);
    setEditingBookId(book.id);
    setBookName(book.name);
    setBookType(book.type);
    setBookLink(book.link); // Set existing link for editing
    setBookDescription(book.description); 
    setBookFile(null); // Clear selected file when opening edit modal
    setUploadMessage(''); // Reset upload message
    setError(null); // Clear errors
    setShowModal(true);
  };

  const handleAddOrUpdateBook = async () => {
    if (!bookName || !bookDescription) {
      alert('Please fill in Book Name and Description.');
      return;
    }

    // If editing and no new file selected, or if adding and no file selected, and no existing link
    if (!bookFile && !bookLink) {
        alert('Please upload a PDF or ensure the PDF link is set.');
        return;
    }

    setIsProcessing(true); // Start processing for both upload and API call
    setError(null); // Clear previous errors
    setUploadMessage(''); // Clear previous upload messages

    let finalBookLink = bookLink; // Start with current bookLink (for edits or manual entry)

    if (bookFile) { // If a new file is selected, upload it to Cloudinary first
      setUploadMessage('Uploading PDF to Cloudinary...');
      const formData = new FormData();
      formData.append('file', bookFile);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      formData.append('cloud_name', CLOUDINARY_CLOUD_NAME);
      formData.append('resource_type', 'raw'); // Specify 'raw' for PDFs and other files

      try {
        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/raw/upload`, {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          finalBookLink = data.secure_url; // Use the new Cloudinary URL
          setUploadMessage('PDF uploaded successfully to Cloudinary!');
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error ? errorData.error.message : 'Cloudinary upload failed');
        }
      } catch (err) {
        console.error('PDF upload failed:', err);
        setError(`PDF upload failed: ${err.message || 'Network error'}`);
        setIsProcessing(false); // Stop processing on upload failure
        return; // Stop function execution
      }
    }

    // Proceed with API call using finalBookLink
    const resourceData = {
      type: 'pdf',
      link: finalBookLink,
      isPremium: bookType === 'Paid',
      title: bookName,
      description: bookDescription,
    };

    try {
      if (isEditing) {
        await updateResource(editingBookId, resourceData);
      } else {
        await createResource(resourceData);
      }
      await fetchBooks(); // Re-fetch all books to update the list
      setShowModal(false);
    } catch (err) {
      console.error("API operation failed:", err);
      setError(err.message || "An error occurred during save to API.");
    } finally {
      setIsProcessing(false); // End processing after API call
    }
  };

  const handleDelete = async (id) => {
    // Custom confirmation modal implementation is preferred over window.confirm in production iframes
    if (!window.confirm("Are you sure you want to delete this book?")) {
      return;
    }

    setIsProcessing(true); // Use combined loading state
    setError(null);
    try {
      await deleteResource(id);
      await fetchBooks(); // Re-fetch all books to update the list
    } catch (err) {
      console.error("Deletion failed:", err);
      setError(err.message || "Failed to delete book.");
    } finally {
      setIsProcessing(false); // Use combined loading state
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6 text-white font-sans antialiased">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Uploaded Books</h2>
        <button
          className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg font-semibold transition duration-200"
          onClick={openAddModal}
        >
          + Add New
        </button>
      </div>

      {isProcessing && <p className="text-center text-blue-400 mb-4">Processing...</p>}
      {error && <p className="text-center text-red-500 mb-4">{error}</p>}

      <table className="w-full table-auto bg-gray-800 rounded-lg overflow-hidden shadow-lg">
        <thead className="bg-gray-700 text-left">
          <tr>
            <th className="p-3 text-sm font-semibold uppercase tracking-wider">Book Name</th>
            <th className="p-3 text-sm font-semibold uppercase tracking-wider">Type</th>
            <th className="p-3 text-sm font-semibold uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody>
          {books.length > 0 ? (
            books.map(book => (
              <tr key={book.id} className="border-b border-gray-700 last:border-b-0 hover:bg-gray-700 transition duration-150">
                <td className="p-3 text-base">{book.name}</td>
                <td className="p-3 text-base">{book.type}</td>
                <td className="p-3 flex gap-4">
                  <button
                    onClick={() => openEditModal(book)}
                    className="text-blue-400 hover:text-blue-600 font-medium transition duration-200"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(book.id)}
                    className="text-red-400 hover:text-red-600 font-medium transition duration-200"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="3" className="p-4 text-center text-gray-400">No books uploaded yet.</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
          <div className="bg-gray-800 p-6 rounded-xl w-full max-w-md relative shadow-2xl">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 text-white text-3xl leading-none font-light hover:text-gray-400 transition duration-200"
              aria-label="Close modal"
            >
              &times;
            </button>
            <h3 className="text-2xl font-bold mb-5 text-center">{isEditing ? 'Edit Book' : 'Upload New Book'}</h3>

            <div className="mb-4">
              <label htmlFor="bookName" className="block text-sm mb-2 text-gray-300">Book Name</label>
              <input
                id="bookName"
                type="text"
                value={bookName}
                onChange={(e) => setBookName(e.target.value)}
                className="w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter book name"
                required
              />
            </div>

            <div className="mb-4">
              <label htmlFor="pdfFileInput" className="block text-sm mb-2 text-gray-300">Upload PDF File</label>
              <div className="flex items-center gap-3">
                <label className="inline-block cursor-pointer px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-gray-300 transition duration-200">
                  Select File
                  <input
                    id="pdfFileInput"
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setBookFile(e.target.files[0])}
                    className="hidden"
                  />
                </label>
              </div>
              {bookFile && (
                <div className="text-xs mt-2 text-gray-400">Selected: {bookFile.name}</div>
              )}
              {uploadMessage && (
                <div className={`text-xs mt-2 ${uploadMessage.includes('successful') ? 'text-green-400' : 'text-red-400'}`}>
                  {uploadMessage}
                </div>
              )}
            </div>

            {/* Display the uploaded PDF link (can be made read-only or hidden if preferred) */}
            {/* <div className="mb-4">
              <label htmlFor="bookLink" className="block text-sm mb-2 text-gray-300">PDF Link (from Cloudinary)</label>
              <input
                id="bookLink"
                type="url"
                value={bookLink}
                onChange={(e) => setBookLink(e.target.value)} // Allow manual override if needed
                className="w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Auto-filled after upload or enter manually"
                disabled={isProcessing} // Disable while processing
              />
            </div> */}

            <div className="mb-6">
              <label htmlFor="bookDescription" className="block text-sm mb-2 text-gray-300">Description</label>
              <textarea
                id="bookDescription"
                value={bookDescription}
                onChange={(e) => setBookDescription(e.target.value)}
                rows="3"
                className="w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-y"
                placeholder="Brief description of the book"
                required
              ></textarea>
            </div>

            <div className="mb-6 flex gap-4">
              <button
                onClick={() => setBookType('Free')}
                className={`flex-1 py-2 rounded font-semibold transition duration-200
                  ${bookType === 'Free'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-700 hover:bg-green-700 text-gray-300'}
                `}
              >
                Free
              </button>
              <button
                onClick={() => setBookType('Paid')}
                className={`flex-1 py-2 rounded font-semibold transition duration-200
                  ${bookType === 'Paid'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-700 hover:bg-red-700 text-gray-300'}
                `}
              >
                Paid
              </button>
            </div>

            <button
              onClick={handleAddOrUpdateBook}
              disabled={isProcessing} // Disable if any processing is happening
              className="w-full bg-purple-600 hover:bg-purple-700 py-3 rounded font-semibold text-white text-lg transition duration-200 shadow"
            >
              {isProcessing ? 'Processing...' : (isEditing ? 'Update Book' : 'Upload Book')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PdfLibraryManager;
