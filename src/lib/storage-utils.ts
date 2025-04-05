import { supabase } from './supabase';

/**
 * Verifica as permissões do usuário no Supabase Storage
 */
export async function checkStoragePermissions() {
  try {
    // Verificar se o usuário está autenticado
    const { data: { session } } = await supabase.auth.getSession();
    const isAuthenticated = !!session;

    console.log('User authentication status:', isAuthenticated ? 'Authenticated' : 'Not authenticated');

    // Listar buckets disponíveis
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
      return {
        success: false,
        error: bucketsError,
        message: 'Failed to list buckets',
        isAuthenticated,
        buckets: []
      };
    }

    console.log('Available buckets:', buckets);

    // Tentar acessar cada bucket
    const bucketsAccess = await Promise.all(
      buckets.map(async (bucket) => {
        try {
          const { data, error } = await supabase.storage.from(bucket.name).list();
          return {
            name: bucket.name,
            accessible: !error,
            error: error || null
          };
        } catch (err) {
          return {
            name: bucket.name,
            accessible: false,
            error: err
          };
        }
      })
    );

    return {
      success: true,
      isAuthenticated,
      buckets: bucketsAccess
    };
  } catch (error) {
    console.error('Error checking storage permissions:', error);
    return {
      success: false,
      error,
      message: 'Failed to check storage permissions',
      isAuthenticated: false,
      buckets: []
    };
  }
}

/**
 * Tenta fazer upload de um arquivo de teste para um bucket específico
 */
export async function testBucketUpload(bucketName: string) {
  try {
    // Criar um arquivo de teste
    const testFile = new File(['test'], 'test.txt', { type: 'text/plain' });

    // Tentar fazer upload
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(`test-${Date.now()}.txt`, testFile, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error(`Error uploading test file to bucket '${bucketName}':`, error);
      return {
        success: false,
        error,
        message: `Failed to upload test file to bucket '${bucketName}'`
      };
    }

    console.log(`Successfully uploaded test file to bucket '${bucketName}':`, data);
    return {
      success: true,
      data
    };
  } catch (error) {
    console.error(`Error testing upload to bucket '${bucketName}':`, error);
    return {
      success: false,
      error,
      message: `Failed to test upload to bucket '${bucketName}'`
    };
  }
}

/**
 * Lista todos os arquivos em um bucket do Supabase Storage
 * @param bucket Nome do bucket (padrão: 'products')
 * @param path Caminho dentro do bucket (opcional)
 * @returns Lista de arquivos com URLs públicas
 */
export async function listStorageFiles(bucket: string = 'products', path?: string): Promise<Array<{name: string, url: string, type: string}>> {
  try {
    // Listar arquivos no bucket/pasta
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(path || '');

    if (error) {
      console.error('Error listing files:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Filtrar apenas arquivos (não pastas)
    const files = data.filter(item => !item.id.endsWith('/'));

    // Obter URLs públicas para cada arquivo
    const filesWithUrls = files.map(file => {
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(path ? `${path}/${file.name}` : file.name);

      // Determinar o tipo de arquivo com base na extensão
      const extension = file.name.split('.').pop()?.toLowerCase() || '';
      const isVideo = ['mp4', 'webm', 'mov', 'avi'].includes(extension);

      return {
        name: file.name,
        url: publicUrl,
        type: isVideo ? 'video' : 'image'
      };
    });

    return filesWithUrls;
  } catch (error) {
    console.error('Error in listStorageFiles:', error);
    throw error;
  }
}

/**
 * Lista todos os arquivos na pasta de imagens de produtos
 * @returns Lista de arquivos com URLs públicas
 */
export async function listProductImages(): Promise<Array<{name: string, url: string, type: string}>> {
  return listStorageFiles('products', 'product-images');
}

/**
 * Obtém a URL pública de um arquivo no Supabase Storage
 * @param bucket Nome do bucket
 * @param path Caminho do arquivo
 * @returns URL pública do arquivo
 */
export function getPublicUrl(bucket: string, path: string): string {
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return publicUrl;
}

/**
 * Verifica se uma URL é uma URL do Supabase Storage
 * @param url URL para verificar
 * @returns Verdadeiro se for uma URL do Supabase Storage
 */
export function isSupabaseStorageUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.includes('supabase.co') && urlObj.pathname.includes('/storage/v1/');
  } catch (error) {
    return false;
  }
}

/**
 * Verifica e corrige uma URL do Supabase Storage
 * @param url URL para verificar e corrigir
 * @returns URL corrigida ou a URL original se não for possível corrigir
 */
export function fixSupabaseStorageUrl(url: string): string {
  try {
    // Se a URL não for do Supabase Storage, retorna a URL original
    if (!isSupabaseStorageUrl(url)) {
      return url;
    }

    // Verifica se a URL contém o caminho correto para o bucket 'products'
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');

    // Formato esperado: /storage/v1/object/public/products/path/to/file
    const publicIndex = pathParts.indexOf('public');

    if (publicIndex > 0) {
      const bucketIndex = publicIndex + 1;

      // Verifica se o bucket é 'products'
      if (bucketIndex < pathParts.length && pathParts[bucketIndex] === 'products') {
        // Verifica se o caminho contém 'product-images'
        const hasProductImages = pathParts.some(part => part === 'product-images');

        // Se não tiver 'product-images', adiciona ao caminho
        if (!hasProductImages && bucketIndex + 1 < pathParts.length) {
          const fileName = pathParts[pathParts.length - 1];

          // Reconstrói a URL com o caminho correto
          const newPathParts = [...pathParts.slice(0, bucketIndex + 1), 'product-images', fileName];
          urlObj.pathname = newPathParts.join('/');
          return urlObj.toString();
        }
      }
    }

    return url;
  } catch (error) {
    console.error('Error fixing Supabase Storage URL:', error);
    return url;
  }
}

/**
 * Obtém o caminho de um arquivo a partir de sua URL pública
 * @param url URL pública do arquivo
 * @returns Objeto com bucket e path
 */
export function getPathFromUrl(url: string): { bucket: string, path: string } | null {
  try {
    if (!isSupabaseStorageUrl(url)) {
      return null;
    }

    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');

    // Formato típico: /storage/v1/object/public/bucket/path/to/file
    const bucketIndex = pathParts.indexOf('public') + 1;

    if (bucketIndex > 0 && bucketIndex < pathParts.length) {
      const bucket = pathParts[bucketIndex];
      const path = pathParts.slice(bucketIndex + 1).join('/');
      return { bucket, path };
    }

    return null;
  } catch (error) {
    console.error('Error parsing URL:', error);
    return null;
  }
}
