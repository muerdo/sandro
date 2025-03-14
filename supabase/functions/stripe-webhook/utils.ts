import { WebhookResponse, OrderUpdate, Dependencies } from './types';

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

export const createResponse = (data: WebhookResponse, status: number = 200): Response => {
  return new Response(
    JSON.stringify(data),
    {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status
    }
  );
};

export const updateOrder = async (
  { supabaseClient }: Dependencies,
  orderId: string, 
  update: OrderUpdate
): Promise<void> => {
  const { error } = await supabaseClient
    .from('orders')
    .update(update)
    .eq('id', orderId);

  if (error) {
    console.error('Error updating order:', error);
    throw error;
  }
};

export const sendAdminNotification = async (
  { supabaseClient }: Dependencies,
  type: string,
  orderId: string,
  amount: number
): Promise<void> => {
  await supabaseClient.functions.invoke('admin-operations', {
    body: {
      action: 'sendNotification',
      type,
      orderId,
      amount
    }
  });
};
