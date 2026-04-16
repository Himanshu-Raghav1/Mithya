/**
 * Uploads a file directly to Cloudinary from the browser.
 * Automatically uses the correct endpoint:
 *   - Images  → /image/upload
 *   - PDFs & other raw files → /raw/upload
 * This ensures the Python backend never processes heavy binary files.
 * @param file The File object from an <input type="file">
 * @returns The secure URL of the uploaded file
 */
export async function uploadToCloudinary(file: File): Promise<string> {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error("Cloudinary configuration is missing in .env");
  }

  // PDFs and non-image files must go to /raw/upload. Images go to /image/upload.
  const isImage = file.type.startsWith('image/');
  const resourceType = isImage ? 'image' : 'raw';
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Cloudinary upload failed (${response.status})`);
  }

  const data = await response.json();
  return data.secure_url;
}
