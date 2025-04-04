import { NextResponse } from 'next/server';
import { sendTestMessage, configureWhatsApp, getWhatsAppStatus, sendOrderNotification } from '@/lib/whatsapp-notification';

// Versão para App Router
export async function GET() {
  const status = await getWhatsAppStatus();
  return NextResponse.json(status);
}

export async function POST(request: Request) {
  const data = await request.json();
  
  // Determine qual operação realizar com base no path
  const url = new URL(request.url);
  const path = url.pathname.split('/').pop();
  
  if (path === 'configure') {
    const { phoneNumber } = data;
    const result = await configureWhatsApp(phoneNumber);
    return NextResponse.json(result);
  } 
  
  if (path === 'test') {
    const result = await sendTestMessage();
    return NextResponse.json(result);
  }
  
  if (path === 'notify-order') {
    const { orderId } = data;
    const result = await sendOrderNotification(orderId);
    return NextResponse.json(result);
  }
  
  return NextResponse.json({ error: 'Invalid operation' }, { status: 400 });
}