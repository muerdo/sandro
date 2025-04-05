/**
 * Gera um slug a partir de uma string
 * @param text Texto para gerar o slug
 * @returns Slug gerado
 */
export function generateSlug(text: string): string {
  return text
    .toString()
    .normalize('NFD') // Normaliza caracteres acentuados
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Substitui espaços por hífens
    .replace(/[^\w-]+/g, '') // Remove caracteres não alfanuméricos
    .replace(/--+/g, '-') // Substitui múltiplos hífens por um único hífen
    .replace(/^-+/, '') // Remove hífens do início
    .replace(/-+$/, ''); // Remove hífens do final
}

/**
 * Gera um ID padronizado para um produto baseado na categoria
 * @param category Categoria do produto
 * @param name Nome do produto (opcional)
 * @returns ID padronizado
 */
export function generateProductId(category: string, name?: string): string {
  // Obter o prefixo da categoria
  let prefix = '';
  let categorySlug = '';

  // Converter a categoria para minúsculas e remover acentos
  const normalizedCategory = category.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  // Definir prefixos e slugs com base na categoria
  if (normalizedCategory.includes('adesivo')) {
    prefix = 'ad';
    categorySlug = 'adesivos';
  } else if (normalizedCategory.includes('camiseta')) {
    prefix = 'cm';
    categorySlug = 'camisetas';
  } else if (normalizedCategory.includes('caneca')) {
    prefix = 'cn';
    categorySlug = 'canecas';
  } else if (normalizedCategory.includes('bone')) {
    prefix = 'bn';
    categorySlug = 'bones';
  } else if (normalizedCategory.includes('quadro')) {
    prefix = 'qd';
    categorySlug = 'quadros';
  } else {
    // Se não for uma categoria conhecida, usar as duas primeiras letras
    // e gerar um slug a partir da categoria
    prefix = normalizedCategory.substring(0, 2);
    categorySlug = generateSlug(normalizedCategory);
  }

  // Gerar um número sequencial (timestamp para garantir unicidade)
  const timestamp = Date.now().toString().slice(-6);

  // Se o nome for fornecido, adicionar parte do nome ao ID
  if (name) {
    const nameSlug = generateSlug(name).substring(0, 15);
    return `${prefix}-${categorySlug}-${nameSlug}-${timestamp}`;
  }

  return `${prefix}-${categorySlug}-${timestamp}`;
}

/**
 * Gera um slug para um produto
 * @param name Nome do produto
 * @param id ID do produto (opcional)
 * @returns Slug gerado
 */
export function generateProductSlug(name: string, id?: string): string {
  const nameSlug = generateSlug(name);

  // Se o ID for fornecido, adiciona ao slug para garantir unicidade
  if (id) {
    // Se o ID já estiver no formato padronizado (ex: ad-123456)
    if (id.match(/^[a-z]{2}-[a-z0-9-]+$/)) {
      return `${nameSlug}-${id}`;
    }
    // Se o ID for um UUID (formato: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
    else if (id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      // Extrair apenas os primeiros 8 caracteres do UUID
      const shortId = id.substring(0, 8);
      return `${nameSlug}-${shortId}`;
    } else {
      // Para outros formatos de ID, usar como está
      return `${nameSlug}-${id}`;
    }
  }

  return nameSlug;
}

/**
 * Extrai o ID do produto de um slug
 * @param slug Slug do produto
 * @returns ID do produto ou o próprio slug se não for possível extrair
 */
export function extractIdFromSlug(slug: string): string {
  // Verificar se o slug é exatamente igual a um ID padronizado (ex: ad-adesivos-nome-123456)
  if (slug.match(/^[a-z]{2}-[a-z0-9-]+$/)) {
    console.log('O slug já é um ID padronizado:', slug);
    return slug;
  }

  // Primeiro, tenta encontrar um ID no formato padronizado com categoria (ex: ad-adesivos-nome-123456)
  const newPatternedIdMatch = slug.match(/([a-z]{2}-[a-z]+-[a-z0-9-]+-[0-9]{6})(?:-|$)/);
  if (newPatternedIdMatch && newPatternedIdMatch[1]) {
    console.log('ID padronizado com categoria encontrado no slug:', newPatternedIdMatch[1]);
    return newPatternedIdMatch[1];
  }

  // Segundo, tenta encontrar um ID no formato padronizado antigo (ex: ad-nome-123456)
  const patternedIdMatch = slug.match(/([a-z]{2}-[a-z0-9-]+)(?:-|$)/);
  if (patternedIdMatch && patternedIdMatch[1]) {
    console.log('ID padronizado antigo encontrado no slug:', patternedIdMatch[1]);
    return patternedIdMatch[1];
  }

  // Terceiro, tenta encontrar um UUID completo no slug (formato: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
  const uuidMatch = slug.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
  if (uuidMatch && uuidMatch[1]) {
    console.log('UUID encontrado no slug:', uuidMatch[1]);
    return uuidMatch[1];
  }

  // Quarto, tenta encontrar um ID parcial (8 caracteres alfanuméricos após um hífen)
  const partialIdMatch = slug.match(/-([a-zA-Z0-9]{8})(?:-|$)/);
  if (partialIdMatch && partialIdMatch[1]) {
    console.log('ID parcial encontrado no slug:', partialIdMatch[1]);
    return partialIdMatch[1];
  }

  // Se não encontrar nenhum padrão de ID, retorna o slug completo
  // Isso permite que a busca por nome funcione corretamente
  console.log('Nenhum ID encontrado no slug, usando o slug completo:', slug);
  return slug;
}
