import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formata um valor numérico para o formato de moeda brasileira (R$)
 * @param value - O valor a ser formatado
 * @returns String formatada no padrão de moeda brasileira
 */
export function formatCurrency(value: number | string): string {
  // Converte para número se for string
  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  // Verifica se é um número válido
  if (isNaN(numValue)) return 'R$ 0,00';

  // Formata o número usando o Intl.NumberFormat
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numValue);
}
