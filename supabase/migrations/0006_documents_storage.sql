-- ==========================================================
-- 0006: Documents storage bucket and policies
-- ==========================================================

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'documents',
  'documents',
  false,
  10485760,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "documents_authenticated_upload" on storage.objects;
drop policy if exists "documents_owner_or_admin_read" on storage.objects;
drop policy if exists "documents_owner_or_admin_delete" on storage.objects;
drop policy if exists "documents_owner_or_admin_update" on storage.objects;

create policy "documents_authenticated_upload"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'documents'
  and array_length(storage.foldername(name), 1) = 2
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and exists (
    select 1
    from public.credit_requests cr
    where cr.id::text = (storage.foldername(name))[2]
      and cr.user_id = (select auth.uid())
  )
);

create policy "documents_owner_or_admin_read"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'documents'
  and (
    (
      array_length(storage.foldername(name), 1) = 2
      and (storage.foldername(name))[1] = (select auth.uid()::text)
      and exists (
        select 1
        from public.credit_requests cr
        where cr.id::text = (storage.foldername(name))[2]
          and cr.user_id = (select auth.uid())
      )
    )
    or (select public.is_admin())
  )
);

create policy "documents_owner_or_admin_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'documents'
  and (
    (
      array_length(storage.foldername(name), 1) = 2
      and (storage.foldername(name))[1] = (select auth.uid()::text)
      and exists (
        select 1
        from public.credit_requests cr
        where cr.id::text = (storage.foldername(name))[2]
          and cr.user_id = (select auth.uid())
      )
    )
    or (select public.is_admin())
  )
);

create policy "documents_owner_or_admin_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'documents'
  and (
    (
      array_length(storage.foldername(name), 1) = 2
      and (storage.foldername(name))[1] = (select auth.uid()::text)
      and exists (
        select 1
        from public.credit_requests cr
        where cr.id::text = (storage.foldername(name))[2]
          and cr.user_id = (select auth.uid())
      )
    )
    or (select public.is_admin())
  )
)
with check (
  bucket_id = 'documents'
  and (
    (
      array_length(storage.foldername(name), 1) = 2
      and (storage.foldername(name))[1] = (select auth.uid()::text)
      and exists (
        select 1
        from public.credit_requests cr
        where cr.id::text = (storage.foldername(name))[2]
          and cr.user_id = (select auth.uid())
      )
    )
    or (select public.is_admin())
  )
);

drop policy if exists documents_insert_own on public.documents;
drop policy if exists documents_delete_own on public.documents;
drop policy if exists documents_update_own on public.documents;

create policy documents_insert_own on public.documents
  for insert with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.credit_requests cr
      where cr.id = request_id
        and cr.user_id = (select auth.uid())
    )
  );

create policy documents_delete_own on public.documents
  for delete using (
    user_id = (select auth.uid())
    or (select public.is_admin())
  );

create policy documents_update_own on public.documents
  for update using (
    user_id = (select auth.uid())
    or (select public.is_admin())
  )
  with check (
    (
      user_id = (select auth.uid())
      and exists (
        select 1
        from public.credit_requests cr
        where cr.id = request_id
          and cr.user_id = (select auth.uid())
      )
    )
    or (select public.is_admin())
  );
