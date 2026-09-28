'use client';
import { useEffect, useState } from 'react';
import Modal from './Modal';
import { supabase } from '@/lib/supabase';

type Plan = { id: number; name: string; days: number; price: number; badge: string };

export default function BoostModal({ postId, onClose }: { postId: string; onClose: () => void }) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.from('boost_plans').select('*').eq('is_active', true).order('days').then(({ data }) => setPlans((data as Plan[]) ?? []));
  }, []);

  const pay = async () => {
    if (!plan) return;
    setBusy(true); setMsg('');
    const { data: s } = await supabase.auth.getSession();
    const r = await fetch('/api/boost/init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${s.session?.access_token}` },
      body: JSON.stringify({ postId, planId: plan.id }),
    });
    const j = await r.json();
    if (!r.ok) { setBusy(false); return setMsg(j.error || 'Could not start payment'); }
    window.location.href = j.url; // Paystack checkout: card, bank transfer or USSD
  };

  return (
    <Modal title="Boost this post" onClose={onClose}>
      {!plan ? (
        <div className="mt-3 space-y-2">
          {plans.map((p) => (
            <button key={p.id} onClick={() => setPlan(p)} className={`block w-full rounded-xl border p-3 text-left ${p.days === 3 ? 'border-2 border-brand' : ''}`}>
              <div className="text-lg font-extrabold">{p.name} · N{p.price.toLocaleString()}</div>
              <div className="text-sm text-gray-600">{p.badge}{p.days === 3 ? ' · Recommended' : ''}</div>
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-3">
          <div className="rounded-lg bg-brand-light p-3 text-sm"><b>{plan.name} · N{plan.price.toLocaleString()}</b><br />Pay with card, bank transfer or USSD. Your boost starts the moment payment goes through.</div>
          {msg && <p className="mt-2 text-sm text-orange-700">{msg}</p>}
          <button className="btn mt-4 w-full" disabled={busy} onClick={pay}>{busy ? 'Opening Paystack...' : `Pay N${plan.price.toLocaleString()}`}</button>
          <button className="mt-2 w-full text-sm underline" onClick={() => setPlan(null)}>Choose another plan</button>
        </div>
      )}
    </Modal>
  );
}
