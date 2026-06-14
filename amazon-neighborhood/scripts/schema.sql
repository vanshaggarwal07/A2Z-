-- Amazon Neighborhood — Full Supabase Schema
-- Run in: Supabase Dashboard → SQL Editor
-- This creates all tables, indexes, RLS policies, and triggers

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. PROFILES (linked to auth.users via trigger)
-- ═══════════════════════════════════════════════════════════════════════════════

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  gender text,
  avatar_url text,
  location_lat float,
  location_lng float,
  location_area text,
  green_credits int default 0,
  is_prime_member boolean default false,
  amazon_member_since int default 2024,
  sustainability_score int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    new.email,
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', '')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. ADDRESSES
-- ═══════════════════════════════════════════════════════════════════════════════

create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  full_name text not null,
  phone text,
  address_line1 text not null,
  address_line2 text,
  city text not null,
  state text not null,
  pincode text not null,
  country text default 'India',
  is_default boolean default false,
  address_type text default 'home', -- home, work, other
  created_at timestamptz default now()
);

create index if not exists idx_addresses_user on public.addresses(user_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. PAYMENT METHODS
-- ═══════════════════════════════════════════════════════════════════════════════

create table if not exists public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  method_type text not null, -- card, upi, netbanking, cod
  card_last4 text,
  card_brand text, -- visa, mastercard, rupay
  card_expiry text,
  upi_id text,
  holder_name text,
  is_default boolean default false,
  created_at timestamptz default now()
);

create index if not exists idx_payments_user on public.payment_methods(user_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. LISTINGS
-- ═══════════════════════════════════════════════════════════════════════════════

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  category text not null,
  original_price numeric not null,
  asking_price numeric not null,
  purchase_date text,
  condition_grade text not null, -- Like New, Good, Fair, For Parts
  condition_summary text,
  defects text[] default '{}',
  listing_type text default 'resell', -- resell, exchange, donate, refurbish
  exchange_want text,
  images text[] default '{}',
  location_lat float,
  location_lng float,
  location_area text,
  status text default 'active', -- active, sold, expired, removed
  is_local_artisan boolean default false,
  serial_number text,
  resale_value_1yr numeric,
  green_credits int default 30,
  seller_name text,
  seller_rating numeric default 4.5,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_listings_seller on public.listings(seller_id);
create index if not exists idx_listings_category on public.listings(category);
create index if not exists idx_listings_status on public.listings(status);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. PRODUCT PASSPORT (ownership chain - append only)
-- ═══════════════════════════════════════════════════════════════════════════════

create table if not exists public.product_passport (
  id uuid primary key default gen_random_uuid(),
  serial_number text not null,
  listing_id uuid references public.listings(id),
  owner_alias text,
  owned_from text,
  owned_until text,
  condition_at_transfer text,
  grade_at_transfer text,
  reason_for_transfer text,
  is_original_purchase boolean default false,
  ai_narrative text,
  created_at timestamptz default now()
);

create index if not exists idx_passport_serial on public.product_passport(serial_number);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 6. ORDERS
-- ═══════════════════════════════════════════════════════════════════════════════

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  buyer_id uuid references public.profiles(id) on delete cascade not null,
  seller_id uuid references public.profiles(id),
  listing_id uuid references public.listings(id),
  product_title text not null,
  product_image text,
  quantity int default 1,
  unit_price numeric not null,
  delivery_charge numeric default 0,
  tax numeric default 0,
  discount numeric default 0,
  total_amount numeric not null,
  status text default 'confirmed', -- confirmed, shipped, out_for_delivery, delivered, returned, cancelled
  payment_method text,
  delivery_address_id uuid references public.addresses(id),
  estimated_delivery date,
  delivered_at timestamptz,
  tracking_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_orders_buyer on public.orders(buyer_id);
create index if not exists idx_orders_seller on public.orders(seller_id);
create index if not exists idx_orders_status on public.orders(status);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 7. GREEN CREDITS LOG
-- ═══════════════════════════════════════════════════════════════════════════════

create table if not exists public.green_credits_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  action text not null,
  credits int not null,
  listing_id uuid references public.listings(id),
  order_id uuid references public.orders(id),
  co2_saved_kg float default 0,
  listing_title text,
  created_at timestamptz default now()
);

create index if not exists idx_credits_user on public.green_credits_log(user_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 8. CART
-- ═══════════════════════════════════════════════════════════════════════════════

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  listing_id uuid references public.listings(id) on delete cascade not null,
  quantity int default 1,
  created_at timestamptz default now(),
  unique(user_id, listing_id)
);

create index if not exists idx_cart_user on public.cart_items(user_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 9. WISHLIST
-- ═══════════════════════════════════════════════════════════════════════════════

create table if not exists public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  listing_id uuid references public.listings(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(user_id, listing_id)
);

create index if not exists idx_wishlist_user on public.wishlist_items(user_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 10. MESSAGES (buyer-seller chat)
-- ═══════════════════════════════════════════════════════════════════════════════

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings(id),
  sender_id uuid references public.profiles(id) on delete cascade not null,
  receiver_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  read boolean default false,
  created_at timestamptz default now()
);

create index if not exists idx_messages_listing on public.messages(listing_id);
create index if not exists idx_messages_receiver on public.messages(receiver_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 11. REVIEWS & RATINGS
-- ═══════════════════════════════════════════════════════════════════════════════

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade not null,
  reviewer_id uuid references public.profiles(id) on delete cascade not null,
  seller_id uuid references public.profiles(id),
  listing_id uuid references public.listings(id),
  rating int not null check (rating >= 1 and rating <= 5),
  title text,
  body text,
  images text[] default '{}',
  created_at timestamptz default now()
);

create index if not exists idx_reviews_seller on public.reviews(seller_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 12. ROW LEVEL SECURITY POLICIES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.addresses enable row level security;
alter table public.payment_methods enable row level security;
alter table public.listings enable row level security;
alter table public.orders enable row level security;
alter table public.green_credits_log enable row level security;
alter table public.cart_items enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.messages enable row level security;
alter table public.reviews enable row level security;
alter table public.product_passport enable row level security;

-- Profiles: users can read all, update own
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Addresses: own only
create policy "Users can view own addresses" on public.addresses for select using (auth.uid() = user_id);
create policy "Users can insert own addresses" on public.addresses for insert with check (auth.uid() = user_id);
create policy "Users can update own addresses" on public.addresses for update using (auth.uid() = user_id);
create policy "Users can delete own addresses" on public.addresses for delete using (auth.uid() = user_id);

-- Payment methods: own only
create policy "Users can view own payments" on public.payment_methods for select using (auth.uid() = user_id);
create policy "Users can insert own payments" on public.payment_methods for insert with check (auth.uid() = user_id);
create policy "Users can update own payments" on public.payment_methods for update using (auth.uid() = user_id);
create policy "Users can delete own payments" on public.payment_methods for delete using (auth.uid() = user_id);

-- Listings: everyone can read active, sellers can manage own
create policy "Active listings are viewable by everyone" on public.listings for select using (true);
create policy "Users can create listings" on public.listings for insert with check (true);
create policy "Users can update own listings" on public.listings for update using (auth.uid() = seller_id);

-- Orders: buyer and seller can view
create policy "Users can view own orders" on public.orders for select using (auth.uid() = buyer_id or auth.uid() = seller_id);
create policy "Users can create orders" on public.orders for insert with check (auth.uid() = buyer_id);

-- Green credits: own only
create policy "Users can view own credits" on public.green_credits_log for select using (auth.uid() = user_id);
create policy "Users can add credits" on public.green_credits_log for insert with check (auth.uid() = user_id);

-- Cart: own only
create policy "Users can view own cart" on public.cart_items for select using (auth.uid() = user_id);
create policy "Users can manage cart" on public.cart_items for insert with check (auth.uid() = user_id);
create policy "Users can update cart" on public.cart_items for update using (auth.uid() = user_id);
create policy "Users can delete cart items" on public.cart_items for delete using (auth.uid() = user_id);

-- Wishlist: own only
create policy "Users can view own wishlist" on public.wishlist_items for select using (auth.uid() = user_id);
create policy "Users can manage wishlist" on public.wishlist_items for insert with check (auth.uid() = user_id);
create policy "Users can delete wishlist items" on public.wishlist_items for delete using (auth.uid() = user_id);

-- Messages: sender or receiver can read
create policy "Users can view own messages" on public.messages for select using (auth.uid() = sender_id or auth.uid() = receiver_id);
create policy "Users can send messages" on public.messages for insert with check (auth.uid() = sender_id);

-- Reviews: everyone can read, own can create
create policy "Reviews are public" on public.reviews for select using (true);
create policy "Users can create reviews" on public.reviews for insert with check (auth.uid() = reviewer_id);

-- Product passport: public read
create policy "Passports are public" on public.product_passport for select using (true);
create policy "Sellers can add passport entries" on public.product_passport for insert with check (true);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 13. HELPER FUNCTIONS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Function to generate order number
create or replace function public.generate_order_number()
returns trigger as $$
begin
  new.order_number := 'ORD-' || to_char(now(), 'YYYY') || '-' || lpad(floor(random() * 100000)::text, 5, '0');
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_order_number on public.orders;
create trigger set_order_number
  before insert on public.orders
  for each row
  when (new.order_number is null)
  execute function public.generate_order_number();

-- Function to update green_credits on profiles when credits_log changes
create or replace function public.sync_green_credits()
returns trigger as $$
begin
  update public.profiles
  set green_credits = greatest(0, (
    select coalesce(sum(credits), 0) from public.green_credits_log where user_id = new.user_id
  ))
  where id = new.user_id;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_credits_change on public.green_credits_log;
create trigger on_credits_change
  after insert on public.green_credits_log
  for each row execute function public.sync_green_credits();

-- Updated_at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger set_listings_updated_at before update on public.listings for each row execute function public.set_updated_at();
create trigger set_orders_updated_at before update on public.orders for each row execute function public.set_updated_at();
