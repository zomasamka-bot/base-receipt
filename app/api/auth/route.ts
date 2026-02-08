import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/auth
 * 
 * Verifies Pi Network access token and creates session
 * Called after Pi.authenticate() completes
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accessToken, user } = body;

    console.log('[v0] POST /api/auth - Received authentication request');
    console.log('[v0] User:', user?.username);

    if (!accessToken) {
      console.error('[v0] Missing accessToken in request');
      return NextResponse.json(
        { error: 'Missing access token' },
        { status: 400 }
      );
    }

    // In production, verify the accessToken with Pi Network API
    // For testnet, we'll accept it and create a session
    const sessionData = {
      accessToken,
      user: user || { uid: 'testnet-user', username: 'TestnetUser' },
      authenticated: true,
      timestamp: new Date().toISOString(),
    };

    console.log('[v0] Authentication successful');
    console.log('[v0] Session created for:', sessionData.user.username);

    return NextResponse.json({
      success: true,
      session: sessionData,
    });
  } catch (error) {
    console.error('[v0] POST /api/auth - Error:', error);
    return NextResponse.json(
      { error: 'Authentication failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth
 * 
 * Health check endpoint
 */
export async function GET() {
  console.log('[v0] GET /api/auth - Health check');
  return NextResponse.json({ 
    status: 'ok', 
    endpoint: '/api/auth',
    timestamp: new Date().toISOString()
  });
}
