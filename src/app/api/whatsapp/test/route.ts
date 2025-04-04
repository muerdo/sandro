import { NextResponse } from 'next/server';
import whatsappService from '@/lib/whatsapp-service';
import { createClient } from '@supabase/supabase-js';

// Definir o tipo Database para Supabase
type Database = any; // Substituir pelo tipo real quando disponível

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST() {
  try {
    console.log("API: Solicitação para enviar mensagem de teste recebida");
    
    // Verificar status do serviço
    const status = whatsappService.getStatus();
    
    if (!status.initialized) {
      console.log("API: Inicializando serviço do WhatsApp...");
      await whatsappService.initialize();
    }
    
    // Verificar autenticação após inicialização
    if (!whatsappService.getStatus().authenticated) {
      console.log("API: WhatsApp não autenticado");
      return NextResponse.json(
        { 
          error: 'WhatsApp não autenticado', 
          message: 'Escaneie o QR code para autenticar o WhatsApp'
        },
        { status: 400 }
      );
    }
    
    // Buscar a configuração do WhatsApp
    console.log("API: Buscando configuração do WhatsApp...");
    const { data, error } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'whatsapp_config')
      .single();
    
    if (error) {
      console.error("API: Erro ao buscar configuração do WhatsApp:", error);
      throw new Error(`Erro ao buscar configuração: ${error.message}`);
    }
    
    const phoneNumber = data?.value?.phoneNumber;
    if (!phoneNumber) {
      console.log("API: Número de telefone não configurado");
      return NextResponse.json(
        { error: 'WhatsApp não configurado. Configure um número primeiro.' },
        { status: 400 }
      );
    }
    
    // Criar mensagem de teste
    const testMessage = 
      `🔔 *TESTE DE NOTIFICAÇÃO* 🔔\n\n` +
      `Esta é uma mensagem de teste do sistema de notificações.\n\n` +
      `A configuração está funcionando corretamente!\n` +
      `Hora do teste: ${new Date().toLocaleString('pt-BR')}`;
    
    // Enviar mensagem real usando o serviço
    console.log(`API: Enviando mensagem de teste para ${phoneNumber}...`);
    const success = await whatsappService.sendMessage(phoneNumber, testMessage);
    
    if (!success) {
      console.log("API: Falha ao enviar mensagem de teste");
      return NextResponse.json(
        { error: 'Erro ao enviar mensagem de teste' },
        { status: 500 }
      );
    }
    
    console.log("API: Mensagem de teste enviada com sucesso");
    
    return NextResponse.json({
      success: true,
      message: 'Mensagem de teste enviada com sucesso',
      phoneNumber
    });
  } catch (error: any) {
    console.error("API: Erro ao enviar mensagem de teste:", error);
    
    return NextResponse.json(
      { 
        error: 'Erro ao enviar mensagem de teste',
        message: error.message || "Erro desconhecido"
      },
      { status: 500 }
    );
  }
}