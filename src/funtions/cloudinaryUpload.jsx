import axios from 'axios';

export const uploadImageToCloudinary = async (file) => {
  const data = new FormData();
  data.append('file', file);
  data.append('upload_preset', 'YOUR_UPLOAD_PRESET'); // Set in your Cloudinary dashboard
  data.append('cloud_name', 'dqzkekpjn');

  try {
    const response = await axios.post('https://api.cloudinary.com/v1_1/dqzkekpjn/image/upload', data);
    return response.data.secure_url;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    return null;
  }
};
