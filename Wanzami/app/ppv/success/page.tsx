'use client';

import { Suspense, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function SuccessContent() {
  const search = useSearchParams();
  const router = useRouter();

  const { status, reference, trxref, titleId } = useMemo(() => {
    const statusParam = (search?.get('status') ?? '').toLowerCase();
    const ref = search?.get('reference') ?? search?.get('ref') ?? search?.get('trxref') ?? '';
    const match = ref.match(/PPV-(\d+)-/);
    return {
      status: statusParam || (ref ? 'success' : ''),
      reference: search?.get('reference') ?? search?.get('ref') ?? '',
      trxref: search?.get('trxref') ?? '',
      titleId: match?.[1] ?? '',
    };
  }, [search]);

  const isSuccess = status === 'success';
  const isFailed = status === 'failed' || status === 'failure';
  const isCancelled = status === 'cancelled' || status === 'canceled';

  useEffect(() => {
    const target = titleId ? `/title/${titleId}` : '/mymovies';
    const timer = setTimeout(() => router.replace(target), 200);
    return () => clearTimeout(timer);
  }, [router, titleId]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="max-w-md w-full space-y-4 text-center">
        <div className="text-2xl font-semibold">Finalizing your purchaseƒ?İ</div>
        <div className="text-sm text-white/70">We&apos;re refreshing your access and will open your title automatically.</div>
        {(reference || trxref) && (
          <div className="text-xs text-white/50">
            Ref: {reference || trxref}
          </div>
        )}
        <div className="text-xs text-white/40">If nothing happens, you can close this page.</div>
      </div>
    </div>
  );
}

export default function PpvSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center px-6">Loading…</div>}>
      <SuccessContent />
    </Suspense>
  );
}
