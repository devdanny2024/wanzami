'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { fetchPpvAccess, verifyFlutterwavePurchase, verifyPaystackPurchase } from '@/lib/contentClient';

function SuccessContent() {
  const search = useSearchParams();
  const router = useRouter();
  const [message, setMessage] = useState('Finalizing your purchase...');
  const [subMessage, setSubMessage] = useState(
    'We are refreshing your access and will open your title automatically.'
  );

  const markOwned = (ownedTitleId: string) => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem('wanzami:ppvOwned') ?? '[]';
      const list = JSON.parse(raw) as Array<string>;
      const key = String(ownedTitleId);
      if (!list.includes(key)) {
        list.push(key);
        window.localStorage.setItem('wanzami:ppvOwned', JSON.stringify(list));
      }
    } catch {
      // Ignore storage errors.
    }
  };

  const { reference, trxref, transactionId, titleId } = useMemo(() => {
    const ref =
      search?.get('reference') ??
      search?.get('ref') ??
      search?.get('trxref') ??
      '';
    const match = ref.match(/PPV-[A-Z]+-(\d+)-/i);
    return {
      reference: search?.get('reference') ?? search?.get('ref') ?? '',
      trxref: search?.get('trxref') ?? '',
      transactionId: search?.get('transaction_id') ?? '',
      titleId: match?.[1] ?? '',
    };
  }, [search]);

  useEffect(() => {
    const run = async () => {
      const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (!accessToken) {
        setMessage('Please log in to complete this purchase.');
        setSubMessage('We could not verify without your session. Log in and check your My Movies.');
        setTimeout(() => router.replace('/mymovies'), 1200);
        return;
      }
      try {
        const ref = reference || trxref;
        const resolveTitleId = (value?: string | null) => {
          if (!value) return '';
          const match = value.match(/PPV-[A-Z]+-(\d+)-/i);
          return match?.[1] ?? '';
        };

        let resolvedTitleId = titleId;
        if (ref?.startsWith('PPV-PAY-')) {
          await verifyPaystackPurchase({ accessToken, reference: ref });
          if (!resolvedTitleId) resolvedTitleId = resolveTitleId(ref);
        } else if (ref || transactionId) {
          const verified = await verifyFlutterwavePurchase({
            accessToken,
            txRef: ref || undefined,
            transactionId: transactionId || undefined,
          });
          const verifiedRef =
            (verified as any)?.data?.data?.tx_ref ??
            (verified as any)?.data?.data?.reference ??
            ref ??
            '';
          if (!resolvedTitleId) resolvedTitleId = resolveTitleId(verifiedRef);
        }
        if (resolvedTitleId) {
          const access = await fetchPpvAccess({ titleId: resolvedTitleId, accessToken });
          if (access?.hasAccess) markOwned(resolvedTitleId);
        }
        const target = resolvedTitleId ? `/title/${resolvedTitleId}` : '/mymovies';
        router.replace(target);
      } catch (err: any) {
        setMessage('Verification failed.');
        setSubMessage(err?.message ?? 'We will open My Movies so you can check your access.');
        setTimeout(() => router.replace('/mymovies'), 1200);
      } finally {
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          url.searchParams.delete('tx_ref');
          url.searchParams.delete('trxref');
          url.searchParams.delete('reference');
          url.searchParams.delete('status');
          url.searchParams.delete('transaction_id');
          window.history.replaceState({}, '', url.toString());
        }
      }
    };
    void run();
  }, [router, titleId, reference, trxref, transactionId]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="max-w-md w-full space-y-4 text-center">
        <div className="text-2xl font-semibold">{message}</div>
        <div className="text-sm text-white/70">{subMessage}</div>
        {(reference || trxref) && (
          <div className="text-xs text-white/50">Ref: {reference || trxref}</div>
        )}
        <div className="text-xs text-white/40">If nothing happens, you can close this page.</div>
      </div>
    </div>
  );
}

export default function PpvSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">Loading...</div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
