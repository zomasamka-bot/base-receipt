import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/payments
 *
 * Pi Platform server-to-server callback for payment creation validation.
 * Pi calls this endpoint to verify the app is ready to accept a payment.
 * Must return 200 quickly or Pi will timeout and show "app wallet not set up".
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    console.log('[payments] Payment validation request received:', body);

    return NextResponse.json({
      success: true,
      message: 'Payment accepted',
    });
  } catch (error) {
    console.error('[payments] Error:', error);
    return NextResponse.json({ success: true }); // Always return 200 to Pi
  }
}

export async function GET() {
  return NextResponse.json({
    status:    'ok',
    endpoint:  '/api/payments',
    timestamp: new Date().toISOString(),
  });
}
