import { NextRequest, NextResponse } from 'next/server';
import redis, { keys, TTL } from '@/lib/redis';

/**
 * POST /api/complete
 *
 * Pi SDK calls onReadyForServerCompletion(paymentId, txid) after the
 * blockchain confirms the Testnet transaction.
 *
 * We update the payment record and write the final receipt to Redis.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentId, txid, metadata } = body;

    if (!paymentId) {
      return NextResponse.json({ error: 'Missing paymentId' }, { status: 400 });
    }

    console.log('[complete] paymentId:', paymentId, '| txid:', txid);

    // ── Fetch existing approval record ────────────────────────────────────────
    const existing = await redis.get<Record<string, unknown>>(keys.payment(paymentId));

    // ── Write completed payment record ────────────────────────────────────────
    const completedRecord = {
      ...(existing ?? {}),
      paymentId,
      txid:        txid ?? 'testnet-no-txid',
      metadata:    metadata ?? existing?.metadata ?? {},
      status:      'completed',
      completedAt: new Date().toISOString(),
    };

    await redis.set(keys.payment(paymentId), completedRecord, { ex: TTL.payment });
    console.log('[complete] Payment record updated in Redis:', paymentId);

    // ── Write receipt record keyed by receiptId ───────────────────────────────
    const receiptId = (metadata?.receiptId ?? existing?.receiptId) as string | undefined;
    if (receiptId) {
      const receiptRecord = {
        receiptId,
        referenceId: metadata?.referenceId ?? existing?.referenceId,
        paymentId,
        txid:        txid ?? 'testnet-no-txid',
        status:      'submitted',
        submittedAt: new Date().toISOString(),
        metadata:    metadata ?? {},
      };
      await redis.set(keys.receipt(receiptId), receiptRecord, { ex: TTL.receipt });
      console.log('[complete] Receipt record saved to Redis:', receiptId);
    }

    return NextResponse.json({ success: true, completed: true, paymentId, txid });
  } catch (error) {
    console.error('[complete] Error:', error);
    return NextResponse.json(
      { error: 'Completion failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok', endpoint: '/api/complete', timestamp: new Date().toISOString() });
}
