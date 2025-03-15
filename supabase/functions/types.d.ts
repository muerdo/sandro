/// <reference types="deno" />

declare module "https://deno.land/std@0.168.0/http/server.ts" {
  export function serve(handler: (req: Request) => Promise<Response>): void;
}

declare module "@supabase/supabase-js" {
  export function createClient(url: string, key: string, options?: any): any;
}

declare module "https://esm.sh/stripe@13.10.0?target=deno" {
  const Stripe: any;
  export default Stripe;
}

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  serve(handler: (req: Request) => Promise<Response>): void;
};
