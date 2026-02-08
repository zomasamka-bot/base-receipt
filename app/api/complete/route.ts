import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/complete
 * 
 * Handles Pi Network payment completion callback
 * Called by Pi SDK after blockchain confirmation
 * 
 * IMPORTANT: NO FUNDS ARE TRANSFERRED - This is verification-only
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentId, txid, metadata } = body;

    console.log('[v0] ========================================');
    console.log('[v0] POST /api/complete - Completion callback received');
    console.log('[v0] Payment ID:', paymentId);
    console.log('[v0] Transaction ID:', txid);
    console.log('[v0] Metadata:', metadata);
    console.log('[v0] ========================================');

    if (!paymentId) {
      console.error('[v0] Missing paymentId in completion request');
      return NextResponse.json(
        { error: 'Missing payment ID' },
        { status: 400 }
      );
    }

    // Store completion record (in production, save to database)
    const completionRecord = {
      paymentId,
      txid: txid || 'testnet-no-txid',
      metadata,
      status: 'completed',
      timestamp: new Date().toISOString(),
      receiptId: metadata?.receiptId,
      referenceId: metadata?.referenceId,
    };

    console.log('[v0] Completion record created:', completionRecord);
    console.log('[v0] Completion processing complete - Success');

    return NextResponse.json({
      success: true,
      completed: true,
      paymentId,
      txid,
      completionRecord,
    });
  } catch (error) {
    console.error('[v0] POST /api/complete - Error:', error);
    return NextResponse.json(
      { 
        error: 'Completion processing failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/complete
 * 
 * Health check endpoint
 */
export async function GET() {
  console.log('[v0] GET /api/complete - Health check');
  return NextResponse.json({ 
    status: 'ok', 
    endpoint: '/api/complete',
    timestamp: new Date().toISOString()
  });
}
