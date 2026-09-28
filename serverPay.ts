import { createClient } from '@supabase/supabase-js';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

export const adminDb = () => createClient(URL, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

export async function userFromRequest(req: Request) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;
  const { data } = await createClient(URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!).auth.getUser(token);
  return data.user;
}

export const paystackHeaders = () => ({ Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, 'Content-Type': 'application/json' });

// Starts the boost only if the amount paid equals the plan price (checked in SQL).
export async function applyPayment(reference: string, kobo: number) {
  const { data, error } = await adminDb().rpc('apply_paid_boost', { p_reference: reference, p_paid_kobo: kobo });
  if (error) throw new Error(error.message);
  return data as string;
}
