# Supabase Edge Functions para Processamento de Pagamentos PIX

Este diretório contém Edge Functions do Supabase para processar pagamentos PIX.

## Funções Disponíveis

### 1. pix-payment-status

Esta função verifica e atualiza o status de pagamentos PIX.

**Endpoints:**

- `GET /functions/v1/pix-payment-status?transactionId={ID}&action=check` - Verifica o status de um pagamento PIX
- `POST /functions/v1/pix-payment-status` - Atualiza o status de um pagamento PIX

**Parâmetros:**

- `transactionId` (obrigatório) - ID da transação PIX
- `action` (opcional) - Ação a ser executada: `check` (padrão) ou `update`
- `status` (obrigatório para `action=update`) - Novo status do pagamento: `PENDING`, `PAID`, `EXPIRED`, etc.

### 2. pix-webhook

Esta função recebe webhooks de provedores de pagamento PIX.

**Endpoint:**

- `POST /functions/v1/pix-webhook` - Recebe webhooks de pagamento

**Headers:**

- `X-Webhook-Secret` - Secret para autenticação do webhook

**Payload:**

```json
{
  "event": "payment.updated",
  "data": {
    "id": "transaction_id",
    "status": "paid"
  }
}
```

## Implantação

Para implantar as Edge Functions, siga os passos abaixo:

1. Instale a CLI do Supabase:

```bash
npm install -g supabase
```

2. Faça login na sua conta do Supabase:

```bash
supabase login
```

3. Vincule o projeto local ao projeto do Supabase:

```bash
supabase link --project-ref <project-id>
```

4. Implante as funções:

```bash
supabase functions deploy pix-payment-status
supabase functions deploy pix-webhook
```

5. Configure as variáveis de ambiente:

```bash
supabase secrets set WEBHOOK_SECRET=seu_secret_aqui
```

## Variáveis de Ambiente

As seguintes variáveis de ambiente são necessárias:

- `SUPABASE_URL` - URL do projeto Supabase (definido automaticamente)
- `SUPABASE_SERVICE_ROLE_KEY` - Chave de serviço do Supabase (definido automaticamente)
- `WEBHOOK_SECRET` - Secret para autenticação de webhooks (apenas para pix-webhook)

## Testando Localmente

Para testar as funções localmente:

```bash
supabase functions serve --env-file .env.local
```

Acesse as funções em:

- http://localhost:54321/functions/v1/pix-payment-status
- http://localhost:54321/functions/v1/pix-webhook

## Logs e Monitoramento

Para visualizar os logs das funções:

```bash
supabase functions logs pix-payment-status
supabase functions logs pix-webhook
```

## Tabelas do Banco de Dados

As funções interagem com as seguintes tabelas:

- `orders` - Pedidos dos clientes
- `pending_checkouts` - Checkouts pendentes com pagamento PIX
- `webhook_logs` - Logs de webhooks recebidos

## Fluxo de Pagamento PIX

1. Cliente inicia o pagamento PIX no checkout
2. O sistema gera um código PIX e salva o pedido como pendente
3. A Edge Function `pix-payment-status` verifica periodicamente o status do pagamento
4. Quando o pagamento é confirmado, a função atualiza o status do pedido
5. O cliente é notificado sobre a confirmação do pagamento
6. O sistema processa o pedido
