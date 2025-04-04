import { NextResponse } from 'next/server';
import whatsappService from '@/lib/whatsapp-service';

export async function GET() {
  try {
    console.log("API: Solicitação de status do WhatsApp recebida");
    
    // Inicializar o serviço se ainda não estiver inicializado
    if (!whatsappService.getStatus().initialized) {
      console.log("API: Inicializando serviço de WhatsApp...");
      await whatsappService.initialize();
    }

    // Obter status atualizado
    const status = whatsappService.getStatus();
    console.log("API: Status do WhatsApp:", status);

    return NextResponse.json({
      connected: status.authenticated,
      phoneNumber: status.phoneNumber || '',
      initialized: status.initialized,
      qrCodeAvailable: status.qrCodeAvailable,
      qrCodeUrl: status.qrCodeAvailable ? '/whatsapp-qrcode.png' : null,
      lastActivity: status.lastActivity,
      lastUpdated: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("API: Erro ao buscar status do WhatsApp:", error);
    
    return NextResponse.json(
      { 
        error: 'Erro ao buscar status do WhatsApp',
        message: error.message || "Erro desconhecido"
      },
      { status: 500 }
    );
  }
}