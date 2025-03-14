-- Create products table if it doesn't exist
create table if not exists public.products (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  price numeric(10,2) not null,
  category text,
  stock integer default 0,
  images text[] default array[]::text[],
  features text[] default array[]::text[],
  customization jsonb,
  status text default 'active',
  stripe_id text unique,
  low_stock_threshold integer default 10,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Insert initial products
insert into public.products (
  name, description, price, category, stock, 
  images, features, customization, status
) values
(
  'Camiseta Personalizada',
  'Camisetas 100% algodão com impressão DTF de alta qualidade',
  49.90,
  'Vestuário',
  100,
  array[
    'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9',
    'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c'
  ],
  array[
    'Impressão DTF de alta durabilidade',
    '100% Algodão',
    'Disponível em várias cores',
    'Tamanhos P ao GG',
    'Personalização total',
    'Acabamento profissional'
  ],
  '{"sizes": ["P", "M", "G", "GG"], "colors": ["Branco", "Preto", "Cinza", "Azul Marinho"]}'::jsonb,
  'active'
),
(
  'Adesivo Personalizado',
  'Adesivos de alta qualidade com impressão digital em vinil',
  29.90,
  'Adesivos',
  200,
  array[
    'https://images.unsplash.com/photo-1626785774573-4b799315345d',
    'https://images.unsplash.com/photo-1600725935160-f67ee4f6084a'
  ],
  array[
    'Vinil de alta durabilidade',
    'Impressão digital HD',
    'Resistente à água',
    'Aplicação profissional',
    'Recorte eletrônico',
    'Garantia de 2 anos'
  ],
  '{"types": ["Brilhante", "Fosco", "Transparente"], "sizes": ["Pequeno", "Médio", "Grande", "Personalizado"]}'::jsonb,
  'active'
),
(
  'Banner Grande Formato',
  'Banners em lona com acabamento profissional',
  149.90,
  'Impressão',
  50,
  array[
    'https://images.unsplash.com/photo-1588412079929-790b9f593d8e',
    'https://images.unsplash.com/photo-1531403009284-440f080d1e12'
  ],
  array[
    'Lona 440g',
    'Impressão digital de alta resolução',
    'Acabamento reforçado',
    'Ilhós metálico',
    'Resistente a intempéries',
    'Instalação opcional'
  ],
  '{"finishings": ["Ilhós", "Bastão", "Corda"], "sizes": ["1x1m", "2x1m", "3x1m", "Personalizado"]}'::jsonb,
  'active'
),
(
  'Caneca Personalizada',
  'Canecas de cerâmica com impressão sublimática',
  39.90,
  'Presentes',
  150,
  array[
    'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d',
    'https://images.unsplash.com/photo-1481277542470-605612bd2d61'
  ],
  array[
    'Cerâmica premium',
    'Impressão sublimática',
    'Cores vibrantes',
    'Resistente à máquina de lavar',
    'Capacidade 325ml',
    'Embalagem presente'
  ],
  '{"colors": ["Branco", "Preto", "Mágica"], "designs": ["Foto", "Arte", "Texto"]}'::jsonb,
  'active'
);

-- Create RLS policies
alter table public.products enable row level security;

create policy "Products are viewable by everyone"
  on products for select
  to authenticated, anon
  using (true);

create policy "Products are editable by admins"
  on products for all
  to authenticated
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );
