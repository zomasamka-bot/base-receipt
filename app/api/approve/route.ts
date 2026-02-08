import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/approve
 * 
 * Handles Pi Network payment approval callback
 * Called by Pi SDK when user approves in wallet (Step 10)
 * 
 * IMPORTANT: NO FUNDS ARE TRANSFERRED - This is approval-only
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentId, amount, metadata } = body;

    console.log('[v0] ========================================');
    console.log('[v0] POST /api/approve - Approval callback received');
    console.log('[v0] Payment ID:', paymentId);
    console.log('[v0] Amount:', amount);
    console.log('[v0] Metadata:', metadata);
    console.log('[v0] ========================================');

    if (!paymentId) {
      console.error('[v0] Missing paymentId in approval request');
      return NextResponse.json(
        { error: 'Missing payment ID' },
        { status: 400 }
      );
    }

    // Verify this is an approval-only request (amount should be 0)
    if (amount && amount !== 0) {
      console.warn('[v0] WARNING: Non-zero amount detected. This should be approval-only.');
    }

    // Store approval record (in production, save to database)
    const approvalRecord = {
      paymentId,
      amount: amount || 0,
      metadata,
      status: 'approved',
      timestamp: new Date().toISOString(),
      receiptId: metadata?.receiptId,
      referenceId: metadata?.referenceId,
    };

    console.log('[v0] Approval record created:', approvalRecord);
    console.log('[v0] Approval processing complete - Success');

    return NextResponse.json({
      success: true,
      approved: true,
      paymentId,
      approvalRecord,
    });
  } catch (error) {
    console.error('[v0] POST /api/approve - Error:', error);
    return NextResponse.json(
      { 
        error: 'Approval processing failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/approve
 * 
 * Health check endpoint
 */
export async function GET() {
  console.log('[v0] GET /api/approve - Health check');
  return NextResponse.json({ 
    status: 'ok', 
    endpoint: '/api/approve',
    timestamp: new Date().toISOString()
  });
}
