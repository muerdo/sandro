import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';

/**
 * Determina se um arquivo é um vídeo com base no seu tipo MIME
 * @param file O arquivo a ser verificado
 * @returns True se o arquivo for um vídeo, false caso contrário
 */
function isVideoFile(file: File): boolean {
  return file.type.startsWith('video/');
}

/**
 * Faz upload de um arquivo de mídia para o Supabase Storage usando URLs pré-assinadas
 * @param file O arquivo a ser enviado
 * @param bucket O nome do bucket de armazenamento (padrão: 'products')
 * @returns Um objeto com a URL pública e o tipo de mídia
 */
export async function uploadMediaWithSignedUrl(file: File, bucket: string = 'products'): Promise<{ url: string, type: 'image' | 'video', thumbnail?: string }> {
  try {
    // Gerar um nome de arquivo único para evitar conflitos
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    // Usar uma pasta específica para produtos
    const filePath = `product-images/${fileName}`;

    // Obter uma URL pré-assinada para upload
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(bucket)
      .createSignedUploadUrl(filePath);

    if (signedUrlError) {
      console.error('Error creating signed URL:', signedUrlError);
      throw signedUrlError;
    }

    // Fazer upload do arquivo usando a URL pré-assinada
    const { signedUrl, token, path } = signedUrlData;

    const uploadResponse = await fetch(signedUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: file,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Error uploading with signed URL:', errorText);
      throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
    }

    // Obter a URL pública do arquivo enviado
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    // Verificar se a URL é acessível
    console.log('Uploaded file public URL:', publicUrl);

    // Testar a URL com uma solicitação HEAD para verificar se está acessível
    try {
      const testResponse = await fetch(publicUrl, { method: 'HEAD' });
      if (!testResponse.ok) {
        console.warn(`URL may not be accessible: ${publicUrl}. Status: ${testResponse.status}`);
      } else {
        console.log(`URL is accessible: ${publicUrl}`);
      }
    } catch (error) {
      console.warn(`Error testing URL accessibility: ${publicUrl}`, error);
    }

    // Determinar se é um vídeo ou imagem
    const mediaType = isVideoFile(file) ? 'video' as const : 'image' as const;

    return {
      url: publicUrl,
      type: mediaType,
      // Para vídeos, poderíamos gerar uma miniatura no futuro
      thumbnail: mediaType === 'video' ? undefined : undefined
    };
  } catch (error) {
    console.error('Error in uploadMediaWithSignedUrl:', error);
    throw error;
  }
}

/**
 * Faz upload de vários arquivos de mídia para o Supabase Storage
 * @param files Array de arquivos para upload
 * @param bucket O nome do bucket de armazenamento (padrão: 'products')
 * @returns Array de objetos com URLs públicas e tipos de mídia
 */
export async function uploadMultipleMediaWithSignedUrl(files: File[], bucket: string = 'products'): Promise<Array<{ url: string, type: 'image' | 'video', thumbnail?: string }>> {
  try {
    const uploadPromises = files.map(file => uploadMediaWithSignedUrl(file, bucket));
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Error in uploadMultipleMediaWithSignedUrl:', error);
    throw error;
  }
}

/**
 * Faz upload de uma imagem para o Supabase Storage (função legada para compatibilidade)
 * @param file O arquivo a ser enviado
 * @param bucket O nome do bucket de armazenamento (padrão: 'products')
 * @returns A URL pública da imagem enviada
 */
export async function uploadImageWithSignedUrl(file: File, bucket: string = 'products'): Promise<string> {
  try {
    const { url } = await uploadMediaWithSignedUrl(file, bucket);
    return url;
  } catch (error) {
    console.error('Error in uploadImageWithSignedUrl:', error);
    throw error;
  }
}

/**
 * Faz upload de várias imagens para o Supabase Storage (função legada para compatibilidade)
 * @param files Array de arquivos para upload
 * @param bucket O nome do bucket de armazenamento (padrão: 'products')
 * @returns Array de URLs públicas das imagens enviadas
 */
export async function uploadMultipleImagesWithSignedUrl(files: File[], bucket: string = 'products'): Promise<string[]> {
  try {
    const mediaResults = await uploadMultipleMediaWithSignedUrl(files, bucket);
    return mediaResults.map(result => result.url);
  } catch (error) {
    console.error('Error in uploadMultipleImagesWithSignedUrl:', error);
    throw error;
  }
}

/**
 * Exclui uma imagem do Supabase Storage
 * @param url A URL pública da imagem a ser excluída
 * @param bucket O nome do bucket de armazenamento (padrão: 'products')
 */
export async function deleteImageWithSignedUrl(url: string, bucket: string = 'products'): Promise<void> {
  try {
    // Extrair o caminho do arquivo da URL
    const urlObj = new URL(url);
    const pathSegments = urlObj.pathname.split('/');
    const fileName = pathSegments[pathSegments.length - 1];
    const filePath = `product-images/${fileName}`;

    // Excluir o arquivo do Supabase Storage
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in deleteImageWithSignedUrl:', error);
    throw error;
  }
}
