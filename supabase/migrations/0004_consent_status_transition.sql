create policy "credit_requests_update_status_consent" on credit_requests
  for update using (
    user_id = auth.uid()
    and status = 'awaiting_consent'
  )
  with check (
    user_id = auth.uid()
    and status = 'collecting_data'
  );
