-- Run this in Supabase SQL Editor to create the storage bucket for product media
-- Go to: https://supabase.com/dashboard/project/oagjpqchjmurbjnqqeld/sql/new

-- Create storage bucket for product images and videos (publicly readable)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,  -- publicly accessible (anyone can view)
  52428800,  -- 50MB max per file (to support videos)
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime']
)
on conflict (id) do update set
  file_size_limit = 52428800,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime'];

-- Allow anyone to read media (public bucket)
create policy "Public read access for product images"
on storage.objects for select
using (bucket_id = 'product-images');

-- Allow authenticated users to upload media
create policy "Authenticated users can upload product images"
on storage.objects for insert
with check (bucket_id = 'product-images');

-- Allow users to update their own media
create policy "Users can update own images"
on storage.objects for update
using (bucket_id = 'product-images');

-- Allow users to delete their own media
create policy "Users can delete own images"
on storage.objects for delete
using (bucket_id = 'product-images');
