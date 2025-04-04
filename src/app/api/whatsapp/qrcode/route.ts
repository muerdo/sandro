import { NextResponse } from 'next/server';
import whatsappService from '@/lib/whatsapp-service';

export async function GET() {
  try {
    console.log("API: Solicitação para gerar QR code recebida");
    
    // Verificar status do serviço
    if (!whatsappService.getStatus().initialized) {
      console.log("API: Inicializando serviço do WhatsApp...");
      await whatsappService.initialize();
    }
    
    // Verificar autenticação
    if (whatsappService.getStatus().authenticated) {
      console.log("API: WhatsApp já está autenticado");
      return NextResponse.json({
        authenticated: true,
        message: 'WhatsApp já está autenticado'
      });
    }
    
    // Gerar QR code
    console.log("API: Gerando QR code...");
    const qrCodeData = await whatsappService.getQRCode();
    
    if (!qrCodeData) {
      console.log("API: Não foi possível gerar o QR code");
      return NextResponse.json(
        { error: 'Não foi possível gerar o QR code. Tente novamente.' },
        { status: 500 }
      );
    }
    
    console.log("API: QR code gerado com sucesso");
    
    return NextResponse.json({
      authenticated: false,
      message: 'QR code gerado com sucesso',
      qrCodeUrl: '/whatsapp-qrcode.png',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("API: Erro ao gerar QR code:", error);
    
    return NextResponse.json(
      { 
        error: 'Erro ao gerar QR code',
        message: error.message || "Erro desconhecido"
      },
      { status: 500 }
    );
  }
}