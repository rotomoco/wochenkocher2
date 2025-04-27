import compress from 'browser-image-compression';

export async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: file.type
  };

  try {
    return await compress(file, options);
  } catch (error) {
    console.error('Error compressing image:', error);
    return file;
  }
}

export function getImageUrl(path: string | null): string | null {
  if (!path) return null;
  
  // If the path is already a full URL, return it as is
  if (path.startsWith('http')) {
    return path;
  }
  
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  // Handle different storage buckets
  if (path.startsWith('avatars/')) {
    return `${supabaseUrl}/storage/v1/object/public/${path}`;
  } else {
    return `${supabaseUrl}/storage/v1/object/public/recipes/${path}`;
  }
}