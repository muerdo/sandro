import { createClient } from 'jsr:@supabase/supabase-js@2';

// This function will be triggered by a cron job
Deno.serve(async (req) => {
  try {
    const supabaseClient = createClient(
      process.env.SUPABASE_URL ?? '',
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
    );

    // Call the sync function
    const { data, error } = await supabaseClient.functions.invoke('sync-stripe-products');
    
    if (error) throw error;

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Scheduled sync completed successfully',
        details: data
      }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Scheduled sync failed:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
