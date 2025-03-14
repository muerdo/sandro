-- Create products table
create table if not exists public.products (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  price decimal(10,2) not null,
  category text,
  images text[] default array[]::text[],
  features text[] default array[]::text[],
  customization jsonb default '{}'::jsonb,
  stock integer default 0,
  status text default 'active',
  low_stock_threshold integer default 10,
  stripe_id text unique,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create orders table
create table if not exists public.orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  status text not null default 'pending',
  payment_status text not null default 'pending',
  payment_method text not null,
  total_amount decimal(10,2) not null,
  items jsonb not null,
  shipping_address jsonb,
  tracking_info jsonb default '{}'::jsonb,
  estimated_delivery timestamp with time zone,
  stripe_payment_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create profiles table
create table if not exists public.profiles (
  id uuid references auth.users(id) primary key,
  username text unique,
  avatar_url text,
  role text default 'customer',
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create shipping_addresses table
create table if not exists public.shipping_addresses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  full_name text not null,
  email text not null,
  phone text not null,
  address text not null,
  city text not null,
  state text not null,
  postal_code text not null,
  is_default boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create inventory_history table
create table if not exists public.inventory_history (
  id uuid default gen_random_uuid() primary key,
  product_id uuid references public.products(id) not null,
  previous_stock integer not null,
  new_stock integer not null,
  change_amount integer not null,
  change_type text not null,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create categories table
create table if not exists public.categories (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create RLS policies
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.profiles enable row level security;
alter table public.shipping_addresses enable row level security;
alter table public.inventory_history enable row level security;
alter table public.categories enable row level security;

-- Products policies
create policy "Public read access" on public.products
  for select using (true);

create policy "Admin full access" on public.products
  for all using (
    auth.uid() in (
      select id from public.profiles
      where role = 'admin'
    )
  );

-- Orders policies
create policy "Users can view own orders" on public.orders
  for select using (auth.uid() = user_id);

create policy "Admin can view all orders" on public.orders
  for select using (
    auth.uid() in (
      select id from public.profiles
      where role = 'admin'
    )
  );

create policy "Admin can update orders" on public.orders
  for update using (
    auth.uid() in (
      select id from public.profiles
      where role = 'admin'
    )
  );

-- Profiles policies
create policy "Public read access" on public.profiles
  for select using (true);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Shipping addresses policies
create policy "Users can manage own addresses" on public.shipping_addresses
  for all using (auth.uid() = user_id);

create policy "Admin can view all addresses" on public.shipping_addresses
  for select using (
    auth.uid() in (
      select id from public.profiles
      where role = 'admin'
    )
  );

-- Inventory history policies
create policy "Admin only access" on public.inventory_history
  for all using (
    auth.uid() in (
      select id from public.profiles
      where role = 'admin'
    )
  );

-- Categories policies
create policy "Public read access" on public.categories
  for select using (true);

create policy "Admin full access" on public.categories
  for all using (
    auth.uid() in (
      select id from public.profiles
      where role = 'admin'
    )
  );

-- Create functions
create or replace function public.get_table_info()
returns table (
  name text,
  schema text,
  columns jsonb,
  row_count bigint
)
language plpgsql
security definer
as $$
begin
  return query
  select
    tables.table_name::text as name,
    tables.table_schema::text as schema,
    jsonb_agg(
      jsonb_build_object(
        'name', columns.column_name,
        'type', columns.data_type,
        'is_nullable', columns.is_nullable = 'YES',
        'is_identity', columns.is_identity = 'YES'
      )
    ) as columns,
    (select count(*) from information_schema.tables t2 where t2.table_name = tables.table_name)::bigint as row_count
  from information_schema.tables
  join information_schema.columns on
    columns.table_name = tables.table_name and
    columns.table_schema = tables.table_schema
  where tables.table_schema = 'public'
  group by tables.table_name, tables.table_schema;
end;
$$;

-- Create triggers
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

create trigger set_updated_at
  before update on public.products
  for each row
  execute function public.handle_updated_at();

create trigger set_updated_at
  before update on public.orders
  for each row
  execute function public.handle_updated_at();

create trigger set_updated_at
  before update on public.profiles
  for each row
  execute function public.handle_updated_at();

create trigger set_updated_at
  before update on public.shipping_addresses
  for each row
  execute function public.handle_updated_at();

create trigger set_updated_at
  before update on public.categories
  for each row
  execute function public.handle_updated_at();
