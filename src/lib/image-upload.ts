import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';

/**
 * Verifica se o bucket existe e está acessível
 * @param bucket O nome do bucket de armazenamento
 */
async function checkBucketAccess(bucket: string): Promise<boolean> {
  try {
    // Tenta listar arquivos no bucket para verificar acesso
    const { data, error } = await supabase.storage
      .from(bucket)
      .list();

    if (error) {
      console.error(`Error accessing bucket '${bucket}':`, error);
      return false;
    }

    console.log(`Successfully accessed bucket '${bucket}'`);
    return true;
  } catch (error) {
    console.error(`Error checking bucket '${bucket}' access:`, error);
    return false;
  }
}

/**
 * Garante que a pasta de imagens de produtos exista no bucket
 * @param bucket O nome do bucket de armazenamento
 */
async function ensureProductImagesFolder(bucket: string): Promise<boolean> {
  try {
    // Verificar se a pasta já existe
    const { data, error } = await supabase.storage
      .from(bucket)
      .list('product-images');

    if (error) {
      // Se o erro for porque a pasta não existe, vamos criar um arquivo vazio para criar a pasta
      console.log(`Creating product-images folder in bucket '${bucket}'...`);

      // Criar um arquivo vazio para criar a pasta
      const emptyFile = new Blob([''], { type: 'text/plain' });
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload('product-images/.folder', emptyFile);

      if (uploadError) {
        console.error(`Error creating product-images folder in bucket '${bucket}':`, uploadError);
        return false;
      }

      console.log(`Successfully created product-images folder in bucket '${bucket}'`);
      return true;
    }

    console.log(`product-images folder already exists in bucket '${bucket}'`);
    return true;
  } catch (error) {
    console.error(`Error ensuring product-images folder in bucket '${bucket}':`, error);
    return false;
  }
}

/**
 * Determines if a file is a video based on its MIME type
 * @param file The file to check
 * @returns True if the file is a video, false otherwise
 */
function isVideoFile(file: File): boolean {
  return file.type.startsWith('video/');
}

/**
 * Uploads a media file (image or video) to Supabase Storage
 * @param file The file to upload
 * @param bucket The storage bucket name (default: 'products')
 * @returns An object with the public URL and media type
 */
export async function uploadMedia(file: File, bucket: string = 'products'): Promise<{ url: string, type: 'image' | 'video', thumbnail?: string }> {
  try {
    // Verificar acesso ao bucket
    const hasAccess = await checkBucketAccess(bucket);
    if (!hasAccess) {
      throw new Error(`No access to bucket '${bucket}'. Please check permissions.`);
    }

    // Garantir que a pasta de imagens de produtos exista
    const folderExists = await ensureProductImagesFolder(bucket);
    if (!folderExists) {
      throw new Error(`Failed to ensure product-images folder in bucket '${bucket}'.`);
    }

    // Generate a unique file name to avoid conflicts
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    // Usar uma pasta específica para produtos
    const filePath = `product-images/${fileName}`;

    // Upload the file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true // Usar upsert para substituir arquivos existentes
      });

    if (error) {
      console.error('Error uploading media:', error);
      throw error;
    }

    // Get the public URL of the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    // Determine if it's a video or image
    const mediaType = isVideoFile(file) ? 'video' as const : 'image' as const;

    return {
      url: publicUrl,
      type: mediaType,
      // For videos, we could generate a thumbnail in the future
      thumbnail: mediaType === 'video' ? undefined : undefined
    };
  } catch (error) {
    console.error('Error in uploadMedia:', error);
    throw error;
  }
}

/**
 * Uploads an image file to Supabase Storage (legacy function for backward compatibility)
 * @param file The file to upload
 * @param bucket The storage bucket name (default: 'products')
 * @returns The public URL of the uploaded image
 */
export async function uploadImage(file: File, bucket: string = 'products'): Promise<string> {
  try {
    const { url } = await uploadMedia(file, bucket);
    return url;
  } catch (error) {
    console.error('Error in uploadImage:', error);
    throw error;
  }
}

/**
 * Uploads multiple media files to Supabase Storage
 * @param files Array of files to upload
 * @param bucket The storage bucket name (default: 'products')
 * @returns Array of objects with public URLs and media types
 */
export async function uploadMultipleMedia(files: File[], bucket: string = 'products'): Promise<Array<{ url: string, type: 'image' | 'video', thumbnail?: string }>> {
  try {
    const uploadPromises = files.map(file => uploadMedia(file, bucket));
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Error in uploadMultipleMedia:', error);
    throw error;
  }
}

/**
 * Uploads multiple image files to Supabase Storage (legacy function for backward compatibility)
 * @param files Array of files to upload
 * @param bucket The storage bucket name (default: 'products')
 * @returns Array of public URLs of the uploaded images
 */
export async function uploadMultipleImages(files: File[], bucket: string = 'products'): Promise<string[]> {
  try {
    const mediaResults = await uploadMultipleMedia(files, bucket);
    return mediaResults.map(result => result.url);
  } catch (error) {
    console.error('Error in uploadMultipleImages:', error);
    throw error;
  }
}

/**
 * Deletes an image from Supabase Storage
 * @param url The public URL of the image to delete
 * @param bucket The storage bucket name (default: 'products')
 */
export async function deleteImage(url: string, bucket: string = 'products'): Promise<void> {
  try {
    // Extract the file path from the URL
    const urlObj = new URL(url);
    const pathSegments = urlObj.pathname.split('/');
    const fileName = pathSegments[pathSegments.length - 1];
    const filePath = `product-images/${fileName}`;

    // Delete the file from Supabase Storage
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in deleteImage:', error);
    throw error;
  }
}
