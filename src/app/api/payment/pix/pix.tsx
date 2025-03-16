/**
 * PIX QR Code generator according to Brazilian Central Bank guidelines
 * Based on Manual de Padrões para Iniciação do PIX
 * https://www.bcb.gov.br/estabilidadefinanceira/pix
 */

/**
 * PIX Data structure according to BR Central Bank standards
 */
interface PixData {
  merchantName: string; // Nome do beneficiário (até 25 caracteres)
  merchantCity: string; // Cidade do beneficiário (até 15 caracteres)
  amount?: number; // Valor da transação (opcional)
  pixKey: string; // Chave PIX (email, CPF, telefone, etc.)
  description?: string; // Descrição da transação (opcional, até 25 caracteres)
  txid?: string; // Identificador da transação (opcional, até 25 caracteres)
  postalCode?: string; // Código postal (opcional, até 8 caracteres)
}

/**
 * Generates a PIX code for QR Code based on Brazilian Central Bank guidelines
 */
export function generatePixCode(data: PixData): string {
  // Cria o mapa TLV (Tag-Length-Value)
  const tlvMap = new Map<string, string>();

  // Campos obrigatórios
  tlvMap.set("00", "01"); // Payload Format Indicator (fixo: 01)
  tlvMap.set("26", encodeTLV(new Map<string, string>([
    ["00", "BR.GOV.BCB.PIX"], // GUI do PIX
    ["01", data.pixKey], // Chave PIX
  ])));

  // Informações do beneficiário
  tlvMap.set("52", "0000"); // Merchant Category Code (fixo: 0000)
  tlvMap.set("53", "986"); // Moeda (BRL)
  if (data.amount) {
    tlvMap.set("54", data.amount.toFixed(2)); // Valor da transação (se fornecido)
  }
  tlvMap.set("58", "BR"); // Código do país (BR)
  tlvMap.set("59", data.merchantName.slice(0, 25)); // Nome do beneficiário (até 25 caracteres)
  tlvMap.set("60", data.merchantCity.slice(0, 15)); // Cidade do beneficiário (até 15 caracteres)

  // Código postal (opcional)
  if (data.postalCode) {
    tlvMap.set("61", data.postalCode.slice(0, 8)); // Código postal (até 8 caracteres)
  }

  // Campo adicional (opcional)
  if (data.description || data.txid) {
    const additionalData = new Map<string, string>();
    if (data.txid) {
      additionalData.set("05", data.txid.slice(0, 25)); // Identificador da transação (até 25 caracteres)
    }
    if (data.description) {
      additionalData.set("02", data.description.slice(0, 25)); // Descrição da transação (até 25 caracteres)
    }
    tlvMap.set("62", encodeTLV(additionalData));
  }

  // Codifica o mapa TLV em uma string
  let pixCode = encodeTLV(tlvMap);

  // Calcula o CRC-16 e adiciona ao final
  const crc = calculateCRC16(pixCode + "6304");
  pixCode += "6304" + crc;

  return pixCode;
}

/**
 * Encodes a Map in TLV (Tag-Length-Value) format
 */
function encodeTLV(tlvMap: Map<string, string>): string {
  let result = "";

  for (const [tag, value] of tlvMap.entries()) {
    const length = value.length.toString().padStart(2, "0"); // Tamanho do valor com 2 dígitos
    result += tag + length + value;
  }

  return result;
}

/**
 * Calculates CRC-16/CCITT-FALSE for PIX code
 */
function calculateCRC16(str: string): string {
  let crc = 0xFFFF; // Valor inicial
  const polynomial = 0x1021; // Polinômio para CRC-16/CCITT-FALSE

  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8; // XOR com o byte atual

    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ polynomial;
      } else {
        crc = crc << 1;
      }
      crc &= 0xFFFF; // Mantém o CRC em 16 bits
    }
  }

  // Converte para hexadecimal e garante 4 dígitos
  return crc.toString(16).toUpperCase().padStart(4, "0");
}