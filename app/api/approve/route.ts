import { NextRequest, NextResponse } from 'next/server';
import redis, { keys, TTL } from '@/lib/redis';

/**
 * POST /api/approve
 *
 * Pi SDK calls onReadyForServerApproval(paymentId) — this is Step 10.
 * We record the payment in Upstash Redis and return { approved: true }.
 *
 * NO FUNDS — amount is 0. This is a Testnet approval-only flow.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentId, amount, metadata } = body;

    if (!paymentId) {
      return NextResponse.json({ error: 'Missing paymentId' }, { status: 400 });
    }

    console.log('[approve] paymentId:', paymentId, '| amount:', amount);

    // ── Persist payment record to Upstash Redis ───────────────────────────────
    const paymentRecord = {
      paymentId,
      amount:     amount ?? 0,
      metadata:   metadata ?? {},
      status:     'approved',
      approvedAt: new Date().toISOString(),
    };

    await redis.set(keys.payment(paymentId), paymentRecord, { ex: TTL.payment });
    console.log('[approve] Payment record saved to Redis:', paymentId);

    return NextResponse.json({ success: true, approved: true, paymentId });
  } catch (error) {
    console.error('[approve] Error:', error);
    return NextResponse.json(
      { error: 'Approval failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok', endpoint: '/api/approve', timestamp: new Date().toISOString() });
}
