'use client';

import { Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function SuccessContent() {
  const search = useSearchParams();
  const router = useRouter();

  const { status, reference, trxref } = useMemo(() => {
    const statusParam = search?.get('status') ?? '';
    return {
      status: statusParam.toLowerCase(),
      reference: search?.get('reference') ?? search?.get('ref') ?? '',
      trxref: search?.get('trxref') ?? '',
    };
  }, [search]);

  const isSuccess = status === 'success';
  const isFailed = status === 'failed' || status === 'failure';
  const isCancelled = status === 'cancelled' || status === 'canceled';

  const title = isSuccess
    ? 'Payment received'
    : isFailed
      ? 'Payment failed'
      : isCancelled
        ? 'Payment cancelled'
        : 'Payment status unknown';

  const subtitle = isSuccess
    ? 'Your purchase is being confirmed. You can go to My Movies to watch your title.'
    : isFailed
      ? 'Your payment was not completed. Please try again.'
      : isCancelled
        ? 'You cancelled the payment. You can try again whenever you are ready.'
        : 'We could not confirm the payment status from Paystack.';

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="max-w-md w-full space-y-4 text-center">
        <div className="text-2xl font-semibold">{title}</div>
        <div className="text-sm text-white/70">{subtitle}</div>
        {(reference || trxref) && (
          <div className="text-xs text-white/50">
            Ref: {reference || trxref}
          </div>
        )}
        <div className="flex gap-3 justify-center pt-4">
          <button
            className="px-4 py-2 rounded-lg bg-[#fd7e14] hover:bg-[#e86f0f] text-white"
            onClick={() => router.push('/mymovies')}
          >
            Go to My Movies
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"
            onClick={() => router.push('/')}
          >
            Home
          </button>
        </div>
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
