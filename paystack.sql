
-- ============ PAYSTACK: automatic boost payments ============
-- (Already included at the end of schema.sql. If you ran an older schema.sql, run just this block.)
alter table boost_payments add column if not exists reference text unique;
alter table boost_payments add column if not exists paid_at timestamptz;
drop function if exists submit_boost_payment(uuid, int, text);   -- manual receipts are no longer used

-- Called only by the server (service role) after Paystack confirms a payment.
create or replace function apply_paid_boost(p_reference text, p_paid_kobo bigint) returns text
language plpgsql security definer set search_path = public as $$
declare pay boost_payments; v_days int;
begin
  select * into pay from boost_payments where reference = p_reference for update;
  if pay.id is null then raise exception 'Unknown reference'; end if;
  if pay.status = 'approved' then return 'already_applied'; end if;
  if pay.amount::bigint * 100 <> p_paid_kobo then raise exception 'Amount mismatch'; end if;
  select days into v_days from boost_plans where id = pay.boost_plan_id;
  update posts set is_boosted = true, boosted_until = now() + make_interval(days => v_days) where id = pay.post_id;
  update boost_payments set status = 'approved', paid_at = now() where id = pay.id;
  return 'applied';
end $$;
revoke all on function apply_paid_boost(text, bigint) from public, anon, authenticated;
grant execute on function apply_paid_boost(text, bigint) to service_role;
