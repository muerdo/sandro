

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "wrappers" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."create_profile_and_shipping_address"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  INSERT INTO profiles (id, username, avatar_url, full_name, role, email, created_at, updated_at)
  VALUES (NEW.id, NULL, '', '', 'user', NEW.email, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO shipping_addresses (
    id, user_id, full_name, email, phone, address, city, state, postal_code, is_default, created_at, updated_at
  )
  VALUES (
    gen_random_uuid(), NEW.id, '', NEW.email, '', '', '', '', '', true, NOW(), NOW()
  );

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_profile_and_shipping_address"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_profile_for_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  INSERT INTO public.profile (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_profile_for_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_user_with_dependencies"("user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $_$
BEGIN
  -- Deleta endereços primeiro
  DELETE FROM shipping_addresses WHERE user_id = $1;
  -- Depois deleta o perfil
  DELETE FROM profiles WHERE id = $1;
END;
$_$;


ALTER FUNCTION "public"."delete_user_with_dependencies"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_table_info"() RETURNS TABLE("name" "text", "schema" "text", "columns" "jsonb", "row_count" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  return query
  select
    tables.table_name as name,
    tables.table_schema as schema,
    (
      select jsonb_agg(jsonb_build_object(
        'name', columns.column_name,
        'type', columns.data_type,
        'is_nullable', columns.is_nullable = 'YES',
        'is_identity', columns.is_identity = 'YES'
      ))
      from information_schema.columns
      where columns.table_schema = tables.table_schema
      and columns.table_name = tables.table_name
    ) as columns,
    (
      select cast(reltuples as bigint)
      from pg_class
      where oid = (quote_ident(tables.table_schema) || '.' || quote_ident(tables.table_name))::regclass
    ) as row_count
  from information_schema.tables
  where table_schema = 'public'
  and table_type = 'BASE TABLE';
end;
$$;


ALTER FUNCTION "public"."get_table_info"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Insere o novo usuário na tabela public.auth_users
  INSERT INTO public.auth_users (id, email)
  VALUES (NEW.id, NEW.email);

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
    new.updated_at = now();
    return new;
end;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."admin_settings" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "key" "text" NOT NULL,
    "value" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."admin_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."auth_users" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."auth_users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contacts" (
    "id" bigint NOT NULL,
    "name" "text",
    "phone" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."contacts" OWNER TO "postgres";


ALTER TABLE "public"."contacts" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."contacts_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."data" (
    "id" bigint NOT NULL,
    "content" "text",
    "sender" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."data" OWNER TO "postgres";


ALTER TABLE "public"."data" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."data_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."inventory_history" (
    "id" integer NOT NULL,
    "product_id" "text" NOT NULL,
    "quantity" integer NOT NULL,
    "change_date" timestamp with time zone DEFAULT "now"(),
    "user_id" "uuid",
    "previous_stock" integer,
    "new_stock" integer,
    "change_amount" integer,
    "change_type" character varying(50),
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "notes" "text"
);


ALTER TABLE "public"."inventory_history" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."inventory_history_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."inventory_history_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."inventory_history_id_seq" OWNED BY "public"."inventory_history"."id";



CREATE TABLE IF NOT EXISTS "public"."messages" (
    "id" bigint NOT NULL,
    "sender" "text",
    "recipient" "text",
    "content" "text",
    "direction" "text" DEFAULT '''incoming'', ''outgoing'''::"text",
    "status" "text" DEFAULT '''pending'', ''sent'',''failed'''::"text",
    "timestamp" timestamp with time zone NOT NULL,
    "created_by" "text",
    "user_id" "text"
);


ALTER TABLE "public"."messages" OWNER TO "postgres";


ALTER TABLE "public"."messages" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."messages_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "status" "text" NOT NULL,
    "total_amount" numeric(10,2) NOT NULL,
    "items" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "shipping_address" "jsonb",
    "payment_method" "text" NOT NULL,
    "payment_status" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "estimated_delivery" timestamp with time zone,
    "tracking_info" "jsonb" DEFAULT '{}'::"jsonb",
    "transaction_id" "text",
    CONSTRAINT "orders_payment_method_check" CHECK (("payment_method" = ANY (ARRAY['credit_card'::"text", 'pix'::"text", 'boleto'::"text"]))),
    CONSTRAINT "orders_payment_status_check" CHECK (("payment_status" = ANY (ARRAY['pending'::"text", 'paid'::"text", 'failed'::"text"]))),
    CONSTRAINT "orders_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'shipped'::"text", 'delivered'::"text", 'cancelled'::"text"]))),
    CONSTRAINT "orders_total_amount_check" CHECK (("total_amount" >= (0)::numeric))
);


ALTER TABLE "public"."orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_settings" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "pix_key" "text" NOT NULL,
    "bank_name" "text" NOT NULL,
    "bank_agency" "text" NOT NULL,
    "bank_account" "text" NOT NULL,
    "beneficiary_name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "beneficiary_city" "text",
    "psp_url" "text",
    "pix_key_type" "text",
    "transaction_id" "text"
);


ALTER TABLE "public"."payment_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pending_checkouts" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "cart_items" "jsonb" NOT NULL,
    "shipping_address" "jsonb" NOT NULL,
    "payment_method" "text" NOT NULL,
    "total_amount" numeric(10,2) NOT NULL,
    "pix_transaction_id" "text",
    "pix_code" "text",
    "pix_qr_code" "text",
    "pix_expires_at" timestamp with time zone,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."pending_checkouts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pixtransactions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "transactionid" "text" NOT NULL,
    "txid" "text" NOT NULL,
    "pixcode" "text" NOT NULL,
    "qrcode" "text" NOT NULL,
    "status" "text" NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "createdat" timestamp with time zone DEFAULT "now"(),
    "updatedat" timestamp with time zone DEFAULT "now"(),
    "userid" "uuid"
);


ALTER TABLE "public"."pixtransactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "price" numeric NOT NULL,
    "category" "text",
    "stock" integer DEFAULT 0,
    "images" "text"[],
    "features" "text"[],
    "customization" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "status" "text" NOT NULL,
    "low_stock_threshold" integer DEFAULT 10,
    "stripe_id" character varying(255),
    "category_id" "text",
    "media" "jsonb",
    CONSTRAINT "products_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'draft'::"text", 'archived'::"text"])))
);


ALTER TABLE "public"."products" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profile" (
    "id" "uuid" NOT NULL,
    "delivery_address" "text",
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."profile" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "username" "text",
    "avatar_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "role" "text" DEFAULT 'user'::"text",
    "full_name" "text",
    "email" "text"
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shipping_addresses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "full_name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text" NOT NULL,
    "address" "text" NOT NULL,
    "city" "text" NOT NULL,
    "state" "text" NOT NULL,
    "postal_code" "text" NOT NULL,
    "is_default" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."shipping_addresses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."whatsapp_messages" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "phone_number" "text" NOT NULL,
    "message" "text" NOT NULL,
    "type" "text" NOT NULL,
    "order_id" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "sent_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."whatsapp_messages" OWNER TO "postgres";


ALTER TABLE ONLY "public"."inventory_history" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."inventory_history_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."admin_settings"
    ADD CONSTRAINT "admin_settings_key_key" UNIQUE ("key");



ALTER TABLE ONLY "public"."admin_settings"
    ADD CONSTRAINT "admin_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."auth_users"
    ADD CONSTRAINT "auth_users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."data"
    ADD CONSTRAINT "data_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inventory_history"
    ADD CONSTRAINT "inventory_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_settings"
    ADD CONSTRAINT "payment_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pending_checkouts"
    ADD CONSTRAINT "pending_checkouts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pixtransactions"
    ADD CONSTRAINT "pixtransactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profile"
    ADD CONSTRAINT "profile_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shipping_addresses"
    ADD CONSTRAINT "shipping_addresses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."whatsapp_messages"
    ADD CONSTRAINT "whatsapp_messages_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_orders_payment_status" ON "public"."orders" USING "btree" ("payment_status");



CREATE INDEX "idx_orders_status" ON "public"."orders" USING "btree" ("status");



CREATE INDEX "idx_orders_status_estimated_delivery" ON "public"."orders" USING "btree" ("status", "estimated_delivery");



CREATE INDEX "idx_orders_user_id" ON "public"."orders" USING "btree" ("user_id");



CREATE INDEX "idx_pending_checkouts_status" ON "public"."pending_checkouts" USING "btree" ("status");



CREATE INDEX "idx_pending_checkouts_user_id" ON "public"."pending_checkouts" USING "btree" ("user_id");



CREATE INDEX "idx_products_category" ON "public"."products" USING "btree" ("category");



CREATE INDEX "idx_products_status" ON "public"."products" USING "btree" ("status");



CREATE INDEX "idx_products_stock" ON "public"."products" USING "btree" ("stock");



CREATE INDEX "idx_shipping_addresses_city_state" ON "public"."shipping_addresses" USING "btree" ("city", "state");



CREATE INDEX "idx_shipping_addresses_user_id" ON "public"."shipping_addresses" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "handle_orders_updated_at" BEFORE UPDATE ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "handle_payment_settings_updated_at" BEFORE UPDATE ON "public"."payment_settings" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "handle_shipping_addresses_updated_at" BEFORE UPDATE ON "public"."shipping_addresses" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_create_profile" AFTER INSERT ON "public"."auth_users" FOR EACH ROW EXECUTE FUNCTION "public"."create_profile_for_new_user"();



CREATE OR REPLACE TRIGGER "trigger_update_pending_checkouts_updated_at" BEFORE UPDATE ON "public"."pending_checkouts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_pixtransactions_updated_at" BEFORE UPDATE ON "public"."pixtransactions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."auth_users"
    ADD CONSTRAINT "auth_users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inventory_history"
    ADD CONSTRAINT "fk_inventory_history_products" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "fk_products_categories" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id");



ALTER TABLE ONLY "public"."inventory_history"
    ADD CONSTRAINT "inventory_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pending_checkouts"
    ADD CONSTRAINT "pending_checkouts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pixtransactions"
    ADD CONSTRAINT "pixtransactions_userid_fkey" FOREIGN KEY ("userid") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profile"
    ADD CONSTRAINT "profile_id_fkey" FOREIGN KEY ("id") REFERENCES "public"."auth_users"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shipping_addresses"
    ADD CONSTRAINT "shipping_addresses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



CREATE POLICY "Admin can view all profiles" ON "public"."profiles" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "profiles_1"
  WHERE (("profiles_1"."id" = "auth"."uid"()) AND ("profiles_1"."role" = 'admin'::"text")))));



CREATE POLICY "Admin users can CRUD admin_settings" ON "public"."admin_settings" USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text")) WITH CHECK ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "Admins can manage payment settings" ON "public"."payment_settings" USING (("auth"."role"() = 'admin'::"text"));



CREATE POLICY "Admins can manage whatsapp_messages" ON "public"."whatsapp_messages" USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text")) WITH CHECK ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "Admins can read payment settings" ON "public"."payment_settings" FOR SELECT USING (("auth"."role"() = 'admin'::"text"));



CREATE POLICY "Admins can update payment settings" ON "public"."payment_settings" FOR UPDATE USING (("auth"."role"() = 'admin'::"text"));



CREATE POLICY "Admins can view all addresses" ON "public"."shipping_addresses" FOR SELECT TO "authenticated" USING ((("auth"."role"() = 'authenticated'::"text") AND (( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'admin'::"text")));



CREATE POLICY "Admins can view all profiles" ON "public"."profiles" FOR SELECT TO "authenticated" USING ((("auth"."role"() = 'authenticated'::"text") AND (( SELECT "profiles_1"."role"
   FROM "public"."profiles" "profiles_1"
  WHERE ("profiles_1"."id" = "auth"."uid"())) = 'admin'::"text")));



CREATE POLICY "Enable admin delete" ON "public"."profiles" FOR DELETE TO "authenticated" USING (("auth"."uid"() IN ( SELECT "profiles_1"."id"
   FROM "public"."profiles" "profiles_1"
  WHERE ("profiles_1"."role" = 'admin'::"text"))));



CREATE POLICY "Enable admin delete addresses" ON "public"."shipping_addresses" FOR DELETE TO "authenticated" USING (("auth"."uid"() IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."role" = 'admin'::"text"))));



CREATE POLICY "Enable insert for authenticated users" ON "public"."shipping_addresses" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Orders are viewable by admins" ON "public"."orders" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Orders are viewable by owner" ON "public"."orders" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Orders can be created by authenticated users" ON "public"."orders" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Orders can be updated by admins" ON "public"."orders" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Payment settings are viewable by everyone" ON "public"."payment_settings" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Payment settings can be managed by admins" ON "public"."payment_settings" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Public profiles are viewable by everyone" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "User can view own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can delete their own shipping addresses" ON "public"."shipping_addresses" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own addresses" ON "public"."shipping_addresses" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can insert their own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can insert their own shipping addresses" ON "public"."shipping_addresses" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own addresses" ON "public"."shipping_addresses" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update their own shipping addresses" ON "public"."shipping_addresses" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own addresses" ON "public"."shipping_addresses" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own profile" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view their own shipping addresses" ON "public"."shipping_addresses" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."admin_settings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "allow_users_to_access_own_data" ON "public"."auth_users" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "id"));



CREATE POLICY "allow_users_to_update_own_profile" ON "public"."profile" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "id"));



ALTER TABLE "public"."contacts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."data" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "delete_policy" ON "public"."shipping_addresses" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "enable acces to own shipping" ON "public"."shipping_addresses" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "enable insert for auth user" ON "public"."orders" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "insert_policy" ON "public"."shipping_addresses" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() = "user_id") AND ("length"("regexp_replace"("postal_code", '[^0-9]'::"text", ''::"text", 'g'::"text")) = 8)));



ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payment_settings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "select_policy" ON "public"."shipping_addresses" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."shipping_addresses" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "update_policy" ON "public"."shipping_addresses" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK ((("auth"."uid"() = "user_id") AND ("length"("regexp_replace"("postal_code", '[^0-9]'::"text", ''::"text", 'g'::"text")) = 8)));



ALTER TABLE "public"."whatsapp_messages" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";









































































































































































































































































































GRANT ALL ON FUNCTION "public"."create_profile_and_shipping_address"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_profile_and_shipping_address"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_profile_and_shipping_address"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_profile_for_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_profile_for_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_profile_for_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_user_with_dependencies"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."delete_user_with_dependencies"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_user_with_dependencies"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_table_info"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_table_info"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_table_info"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."handle_new_user"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "supabase_auth_admin";



GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";





















GRANT ALL ON TABLE "public"."admin_settings" TO "anon";
GRANT ALL ON TABLE "public"."admin_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_settings" TO "service_role";



GRANT ALL ON TABLE "public"."auth_users" TO "anon";
GRANT ALL ON TABLE "public"."auth_users" TO "authenticated";
GRANT ALL ON TABLE "public"."auth_users" TO "service_role";



GRANT ALL ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";



GRANT ALL ON TABLE "public"."contacts" TO "anon";
GRANT ALL ON TABLE "public"."contacts" TO "authenticated";
GRANT ALL ON TABLE "public"."contacts" TO "service_role";



GRANT ALL ON SEQUENCE "public"."contacts_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."contacts_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."contacts_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."data" TO "anon";
GRANT ALL ON TABLE "public"."data" TO "authenticated";
GRANT ALL ON TABLE "public"."data" TO "service_role";



GRANT ALL ON SEQUENCE "public"."data_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."data_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."data_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."inventory_history" TO "anon";
GRANT ALL ON TABLE "public"."inventory_history" TO "authenticated";
GRANT ALL ON TABLE "public"."inventory_history" TO "service_role";



GRANT ALL ON SEQUENCE "public"."inventory_history_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."inventory_history_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."inventory_history_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."messages" TO "anon";
GRANT ALL ON TABLE "public"."messages" TO "authenticated";
GRANT ALL ON TABLE "public"."messages" TO "service_role";



GRANT ALL ON SEQUENCE "public"."messages_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."messages_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."messages_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."orders" TO "anon";
GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";



GRANT ALL ON TABLE "public"."payment_settings" TO "anon";
GRANT ALL ON TABLE "public"."payment_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_settings" TO "service_role";



GRANT ALL ON TABLE "public"."pending_checkouts" TO "anon";
GRANT ALL ON TABLE "public"."pending_checkouts" TO "authenticated";
GRANT ALL ON TABLE "public"."pending_checkouts" TO "service_role";



GRANT ALL ON TABLE "public"."pixtransactions" TO "anon";
GRANT ALL ON TABLE "public"."pixtransactions" TO "authenticated";
GRANT ALL ON TABLE "public"."pixtransactions" TO "service_role";



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



GRANT ALL ON TABLE "public"."profile" TO "anon";
GRANT ALL ON TABLE "public"."profile" TO "authenticated";
GRANT ALL ON TABLE "public"."profile" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."shipping_addresses" TO "anon";
GRANT ALL ON TABLE "public"."shipping_addresses" TO "authenticated";
GRANT ALL ON TABLE "public"."shipping_addresses" TO "service_role";



GRANT ALL ON TABLE "public"."whatsapp_messages" TO "anon";
GRANT ALL ON TABLE "public"."whatsapp_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."whatsapp_messages" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
