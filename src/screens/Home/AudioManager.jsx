import React, { useState, useEffect } from 'react';

// BASE_URL and Cloudinary constants are kept as they were
const BASE_URL = 'https://rise-backend-xwmx.onrender.com';
const CLOUDINARY_CLOUD_NAME = 'dfvkeqfbf';
const CLOUDINARY_UPLOAD_PRESET = 'Rise_App';

// --- API Functions (moved outside component for clarity and reusability) ---
// Note: These functions remain as provided by you.
// The CORS/502 errors you reported earlier are backend issues and need to be resolved on your server.

const createResource = async (resourceData) => {
    try {
        console.log("Payload to createResource:", resourceData); // Detailed payload logging
        const response = await fetch(`${BASE_URL}/api/resource`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(resourceData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to create resource');
        }
        return await response.json();
    } catch (error) {
        console.error('Error in createResource:', error);
        throw error;
    }
};

const getAllResources = async () => {
    try {
        const response = await fetch(`${BASE_URL}/api/resource`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch resources');
        }
        return await response.json(); // Returns all resources, filtering happens client-side
    } catch (error) {
        console.error('Error in getAllResources:', error);
        throw error;
    }
};

const updateResource = async (resourceId, resourceData) => {
    try {
        console.log("Payload to updateResource:", resourceData); // Detailed payload logging
        const response = await fetch(`${BASE_URL}/api/resource/${resourceId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(resourceData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to update resource');
        }
        return await response.json();
    } catch (error) {
        console.error('Error in updateResource:', error);
        throw error;
    }
};

const deleteResource = async (resourceId) => {
    try {
        const response = await fetch(`${BASE_URL}/api/resource/${resourceId}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to delete resource');
        }
        return { success: true, message: 'Resource deleted successfully' };
    } catch (error) {
        console.error('Error in deleteResource:', error);
        throw error;
    }
};

const AudioManager = () => {
    const [audios, setAudios] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingAudioId, setEditingAudioId] = useState(null);

    const [audioName, setAudioName] = useState('');
    const [audioType, setAudioType] = useState('audioBook'); // Default to audiobook, consistent with backend enum
    const [audioPremium, setAudioPremium] = useState(false); // ALWAYS a boolean: false for Free, true for Paid
    const [audioLink, setAudioLink] = useState('');
    const [audioDescription, setAudioDescription] = useState('');
    const [audioFile, setAudioFile] = useState(null);

    const [isProcessing, setIsProcessing] = useState(false);
    const [uploadMessage, setUploadMessage] = useState('');
    const [error, setError] = useState(null);

    // Function to fetch all audio resources from the API
    const fetchAudios = async () => {
        setIsProcessing(true);
        setError(null);
        try {
            const data = await getAllResources();
            // Filter for resources of type "audiobook" or "audioSession"
            const filteredAudios = data.filter(resource =>
                resource.type === 'audioBook' || resource.type === 'audioSession'
            );

            const formattedAudios = filteredAudios.map(resource => ({
                id: resource._id,
                name: resource.title,
                type: resource.type,
                isPremium: resource.isPremium, // Store as boolean here
                link: resource.link,
                description: resource.description,
            }));
            setAudios(formattedAudios);
        } catch (err) {
            console.error("Failed to fetch audios:", err);
            setError(err.message || "Failed to load audio library.");
        } finally {
            setIsProcessing(false);
        }
    };

    // Fetch audios on component mount
    useEffect(() => {
        fetchAudios();
    }, []);

    const openAddModal = () => {
        setIsEditing(false);
        setEditingAudioId(null);
        setAudioName('');
        setAudioType('audioBook'); // Default for new audio
        setAudioPremium(false); // Default to Free (boolean false)
        setAudioLink('');
        setAudioDescription('');
        setAudioFile(null);
        setUploadMessage('');
        setError(null);
        setShowModal(true);
    };

    const openEditModal = (audio) => {
        setIsEditing(true);
        setEditingAudioId(audio.id);
        setAudioName(audio.name);
        setAudioType(audio.type);
        setAudioPremium(audio.isPremium); // Set boolean directly
        setAudioLink(audio.link);
        setAudioDescription(audio.description);
        setAudioFile(null); // Clear file input for edit, user can re-upload if needed
        setUploadMessage('');
        setError(null);
        setShowModal(true);
    };

    const handleAddOrUpdateAudio = async () => {
        if (!audioName || !audioDescription) {
            alert('Please fill in Audio Name and Description.');
            return;
        }

        if (!audioFile && !audioLink && !isEditing) { // For new audio, file or link is required. For edit, link might be pre-existing.
            alert('Please upload an Audio file or ensure the Audio link is set.');
            return;
        }

        setIsProcessing(true);
        setError(null);
        setUploadMessage('');

        let finalAudioLink = audioLink;

        if (audioFile) {
            setUploadMessage('Uploading Audio to Cloudinary...');
            const formData = new FormData();
            formData.append('file', audioFile);
            formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
            formData.append('cloud_name', CLOUDINARY_CLOUD_NAME);
            formData.append('resource_type', 'video'); // Cloudinary handles audio files under 'video' resource type for raw uploads

            try {
                const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`, { // Use /video/upload for audio
                    method: 'POST',
                    body: formData,
                });

                if (response.ok) {
                    const data = await response.json();
                    finalAudioLink = data.secure_url;
                    setUploadMessage('Audio uploaded successfully to Cloudinary!');
                } else {
                    const errorData = await response.json();
                    throw new Error(errorData.error ? errorData.error.message : 'Cloudinary upload failed');
                }
            } catch (err) {
                console.error('Audio upload failed:', err);
                setError(`Audio upload failed: ${err.message || 'Network error'}`);
                setIsProcessing(false);
                return;
            }
        } else if (!isEditing && !audioLink) {
            // This case should ideally be caught by the initial check, but as a safeguard
            setError('Audio file or link is required for new audio.');
            setIsProcessing(false);
            return;
        }


        const resourceData = {
            type: audioType,
            link: finalAudioLink,
            isPremium: audioPremium, // Directly use the boolean state
            title: audioName,
            description: audioDescription, // Ensure description is included if it's part of your schema
        };

        try {
            if (isEditing) {
                await updateResource(editingAudioId, resourceData);
            } else {
                await createResource(resourceData);
            }
            await fetchAudios(); // Re-fetch all audios to update the list
            setShowModal(false);
        } catch (err) {
            console.error("API operation failed:", err);
            setError(err.message || "An error occurred during save to API.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDelete = async (id) => {
        // Replace window.confirm with a custom modal for React Native/web compatibility
        if (!confirm("Are you sure you want to delete this audio file?")) { // Using `confirm` for browser dev, replace for RN
            return;
        }

        setIsProcessing(true);
        setError(null);
        try {
            await deleteResource(id);
            await fetchAudios();
        } catch (err) {
            console.error("Deletion failed:", err);
            setError(err.message || "Failed to delete audio file.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 p-6 text-white font-sans antialiased">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Uploaded Audio Files</h2>
                <button
                    className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg font-semibold transition duration-200"
                    onClick={openAddModal}
                >
                    + Add New Audio
                </button>
            </div>

            {isProcessing && <p className="text-center text-blue-400 mb-4">Processing...</p>}
            {error && <p className="text-center text-red-500 mb-4">{error}</p>}

            <table className="w-full table-auto bg-gray-800 rounded-lg overflow-hidden shadow-lg">
                <thead className="bg-gray-700 text-left">
                    <tr>
                        <th className="p-3 text-sm font-semibold uppercase tracking-wider">Audio Name</th>
                        <th className="p-3 text-sm font-semibold uppercase tracking-wider">Type</th>
                        <th className="p-3 text-sm font-semibold uppercase tracking-wider">Premium</th>
                        <th className="p-3 text-sm font-semibold uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {audios.length > 0 ? (
                        audios.map(audio => (
                            <tr key={audio.id} className="border-b border-gray-700 last:border-b-0 hover:bg-gray-700 transition duration-150">
                                <td className="p-3 text-base">{audio.name}</td>
                                <td className="p-3 text-base">{audio.type === 'audioBook' ? 'AudioBook' : 'Audio Session'}</td>
                                <td className="p-3 text-base">{audio.isPremium ? 'Paid' : 'Free'}</td> {/* Display based on boolean */}
                                <td className="p-3 flex gap-4">
                                    <button
                                        onClick={() => openEditModal(audio)}
                                        className="text-blue-400 hover:text-blue-600 font-medium transition duration-200"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(audio.id)}
                                        className="text-red-400 hover:text-red-600 font-medium transition duration-200"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="4" className="p-4 text-center text-gray-400">No audio files uploaded yet.</td>
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
                        <h3 className="text-2xl font-bold mb-5 text-center">{isEditing ? 'Edit Audio' : 'Upload New Audio'}</h3>

                        <div className="mb-4">
                            <label htmlFor="audioName" className="block text-sm mb-2 text-gray-300">Audio Name</label>
                            <input
                                id="audioName"
                                type="text"
                                value={audioName}
                                onChange={(e) => setAudioName(e.target.value)}
                                className="w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="Enter audio name"
                                required
                            />
                        </div>

                        <div className="mb-4">
                            <label htmlFor="audioFileInput" className="block text-sm mb-2 text-gray-300">Upload Audio File</label>
                            <div className="flex items-center gap-3">
                                <label className="inline-block cursor-pointer px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-gray-300 transition duration-200">
                                    Select File
                                    <input
                                        id="audioFileInput"
                                        type="file"
                                        accept=".mp3,.wav,.ogg,.aac"
                                        onChange={(e) => setAudioFile(e.target.files[0])}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                            {audioFile && (
                                <div className="text-xs mt-2 text-gray-400">Selected: {audioFile.name}</div>
                            )}
                            {uploadMessage && (
                                <div className={`text-xs mt-2 ${uploadMessage.includes('successful') ? 'text-green-400' : 'text-red-400'}`}>
                                    {uploadMessage}
                                </div>
                            )}
                        </div>

                        <div className="mb-6">
                            <label htmlFor="audioDescription" className="block text-sm mb-2 text-gray-300">Description</label>
                            <textarea
                                id="audioDescription"
                                value={audioDescription}
                                onChange={(e) => setAudioDescription(e.target.value)}
                                rows="3"
                                className="w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-y"
                                placeholder="Brief description of the audio file"
                                required
                            ></textarea>
                        </div>

                        {/* Audio Type Selection Buttons */}
                        <div className="mb-6 flex gap-4">
                            <button
                                onClick={() => setAudioType('audioBook')} // Set type as string
                                className={`flex-1 py-2 rounded font-semibold transition duration-200
                                    ${audioType === 'audioBook'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-700 hover:bg-blue-700 text-gray-300'}
                                `}
                            >
                                AudioBook
                            </button>
                            <button
                                onClick={() => setAudioType('audioSession')} // Set type as string
                                className={`flex-1 py-2 rounded font-semibold transition duration-200
                                    ${audioType === 'audioSession'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-700 hover:bg-blue-700 text-gray-300'}
                                `}
                            >
                                AudioSession
                            </button>
                        </div>

                        {/* Premium/Free Type Selection Buttons */}
                        <div className="mb-6 flex gap-4">
                            <button
                                onClick={() => setAudioPremium(false)} // Set boolean false
                                className={`flex-1 py-2 rounded font-semibold transition duration-200
                                    ${audioPremium === false // Compare with boolean false
                                        ? 'bg-green-600 text-white'
                                        : 'bg-gray-700 hover:bg-green-700 text-gray-300'}
                                `}
                            >
                                Free
                            </button>
                            <button
                                onClick={() => setAudioPremium(true)} // Set boolean true
                                className={`flex-1 py-2 rounded font-semibold transition duration-200
                                    ${audioPremium === true // Compare with boolean true
                                        ? 'bg-red-600 text-white'
                                        : 'bg-gray-700 hover:bg-red-700 text-gray-300'}
                                `}
                            >
                                Paid
                            </button>
                        </div>

                        <button
                            onClick={handleAddOrUpdateAudio}
                            disabled={isProcessing}
                            className="w-full bg-purple-600 hover:bg-purple-700 py-3 rounded font-semibold text-white text-lg transition duration-200 shadow"
                        >
                            {isProcessing ? 'Processing...' : (isEditing ? 'Update Audio' : 'Upload Audio')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AudioManager;
