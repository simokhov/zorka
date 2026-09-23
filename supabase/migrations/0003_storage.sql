-- Зорька. Миграция 0003: bucket catch-photos и storage-политики (ADR-0007)
-- Пути: {user_id}/{catch_id}/{uuid}.jpg и .../thumb_{uuid}.webp

insert into storage.buckets (id, name, public)
values ('catch-photos', 'catch-photos', false)
on conflict (id) do nothing;

-- Владелец работает с файлами внутри своей папки user_id.
create policy "own photos select" on storage.objects
  for select using (
    bucket_id = 'catch-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "own photos insert" on storage.objects
  for insert with check (
    bucket_id = 'catch-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "own photos update" on storage.objects
  for update using (
    bucket_id = 'catch-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "own photos delete" on storage.objects
  for delete using (
    bucket_id = 'catch-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
