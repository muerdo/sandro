// Este script testa a integração com o AbacatePay
import { createClient } from '@supabase/supabase-js';
import abacatepay from '../hooks/abacatepay';

// Configuração do cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testAbacatePay() {
  try {
    console.log('Iniciando testes do AbacatePay...');

    // 1. Criar cliente
    console.log('\n1. Testando criação de cliente...');
    const customer = await abacatepay.createCustomer({
      name: 'Cliente Teste',
      email: 'cliente@teste.com',
      tax_id: '12345678900',
      phone: '11999999999',
      address: {
        street: 'Rua Teste, 123',
        city: 'São Paulo',
        state: 'SP',
        postal_code: '01234567',
        country: 'BR'
      }
    });
    console.log('Cliente criado com sucesso:', customer);

    // 2. Criar QR Code PIX
    console.log('\n2. Testando criação de QR Code PIX...');
    const pixData = await abacatepay.createPixQRCode({
      amount: 100.50,
      description: 'Teste de pagamento PIX',
      expiresIn: 30
    });
    console.log('QR Code PIX criado com sucesso:', pixData);

    // 3. Verificar status do PIX
    console.log('\n3. Testando verificação de status do PIX...');
    const pixStatus = await abacatepay.checkPixStatus(pixData.transactionId);
    console.log('Status do PIX verificado com sucesso:', pixStatus);

    // 4. Criar cobrança de cartão
    console.log('\n4. Testando criação de cobrança de cartão...');
    const cardBilling = await abacatepay.createBilling({
      amount: 150.75,
      payment_method: 'card',
      customer_id: customer.id,
      description: 'Teste de cobrança de cartão',
      card_details: {
        card_number: '4111111111111111',
        cardholder_name: 'Cliente Teste',
        expiry_month: '12',
        expiry_year: '2030',
        cvv: '123'
      }
    });
    console.log('Cobrança de cartão criada com sucesso:', cardBilling);

    // 5. Criar cobrança de boleto
    console.log('\n5. Testando criação de cobrança de boleto...');
    const boletoBilling = await abacatepay.createBilling({
      amount: 200.25,
      payment_method: 'boleto',
      customer_id: customer.id,
      description: 'Teste de cobrança de boleto',
      due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
    console.log('Cobrança de boleto criada com sucesso:', boletoBilling);

    // 6. Verificar status da cobrança
    console.log('\n6. Testando verificação de status da cobrança...');
    const billingStatus = await abacatepay.checkBillingStatus(boletoBilling.id);
    console.log('Status da cobrança verificado com sucesso:', billingStatus);

    // 7. Gerar boleto
    console.log('\n7. Testando geração de boleto...');
    const boleto = await abacatepay.generateBoleto(boletoBilling.id);
    console.log('Boleto gerado com sucesso:', boleto);

    console.log('\nTodos os testes concluídos com sucesso!');
  } catch (error) {
    console.error('Erro durante os testes:', error);
  }
}

// Executar os testes
testAbacatePay();
