import { NextResponse } from 'next/server';
import whatsappService from '@/lib/whatsapp-service';
import { createClient } from '@supabase/supabase-js';

// Definir o tipo Database para Supabase
type Database = any; // Substituir pelo tipo real quando disponível

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    console.log("API: Solicitação para configurar WhatsApp recebida");
    
    // Parse da requisição
    const body = await request.json();
    console.log("API: Corpo da requisição:", body);
    
    const { phoneNumber } = body;
    
    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Número de telefone não fornecido' },
        { status: 400 }
      );
    }
    
    // Salvar configuração no Supabase
    console.log(`API: Salvando configuração para o número: ${phoneNumber}`);
    
    const { error } = await supabase
      .from('admin_settings')
      .upsert({
        key: 'whatsapp_config',
        value: {
          phoneNumber,
          configured: true,
          lastUpdated: new Date().toISOString()
        }
      }, {
        onConflict: 'key'
      });
    
    if (error) {
      console.error("API: Erro ao salvar configuração no Supabase:", error);
      throw new Error(`Erro ao salvar configuração: ${error.message}`);
    }
    
    // Reiniciar o serviço para aplicar as novas configurações
    console.log("API: Reiniciando serviço do WhatsApp...");
    await whatsappService.restart();
    
    // Obter o status atualizado
    const status = whatsappService.getStatus();
    
    return NextResponse.json({
      success: true,
      message: 'Número WhatsApp configurado com sucesso',
      phoneNumber,
      status: {
        connected: status.authenticated,
        initialized: status.initialized
      }
    });
  } catch (error: any) {
    console.error("API: Erro ao configurar WhatsApp:", error);
    
    return NextResponse.json(
      { 
        error: 'Erro ao configurar WhatsApp',
        message: error.message || "Erro desconhecido"
      },
      { status: 500 }
    );
  }
}