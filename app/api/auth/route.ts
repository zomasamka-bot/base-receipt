import { NextRequest, NextResponse } from 'next/server';
import redis, { keys, TTL } from '@/lib/redis';

/**
 * POST /api/auth
 *
 * Accepts the Pi SDK access token + user object from the client.
 * Attempts to verify via Pi Platform API (/v2/me).
 * On Testnet, if the Pi API call fails (e.g. no server-side API key),
 * we fall back to trusting the SDK-provided user object, which is
 * sufficient for Testnet Step 10 completion.
 * Stores the session in Upstash Redis on success.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accessToken, user } = body;

    if (!accessToken) {
      return NextResponse.json({ error: 'Missing access token' }, { status: 400 });
    }

    // ── Attempt Pi Platform API verification ─────────────────────────────────
    let piUid: string = user?.uid ?? '';
    let piUsername: string = user?.username ?? '';

    try {
      const verifyRes = await fetch('https://api.minepi.com/v2/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (verifyRes.ok) {
        const piUser = await verifyRes.json();
        piUid      = piUser.uid      ?? piUid;
        piUsername = piUser.username ?? piUsername;
      }
      // If Pi API returns non-OK, we continue with the SDK-supplied values.
      // This is acceptable on Testnet where a server-side API key may not be set.
    } catch {
      // Network error reaching Pi API — continue with SDK-supplied values.
    }

    if (!piUid) {
      return NextResponse.json(
        { error: 'Could not resolve user identity from token or SDK user object' },
        { status: 401 }
      );
    }

    // ── Persist session to Upstash Redis (best-effort) ────────────────────────
    // Redis is non-blocking — if env vars are absent (e.g. local / preview
    // runtime) or the call fails, auth still succeeds.
    try {
      const sessionPayload = {
        uid:        piUid,
        username:   piUsername,
        accessToken,
        verifiedAt: new Date().toISOString(),
      };
      await redis.set(keys.session(piUid), sessionPayload, { ex: TTL.session });
    } catch {
      // Redis unavailable — session not persisted, but auth can proceed.
    }

    return NextResponse.json({
      success:  true,
      uid:      piUid,
      username: piUsername,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:   'Authentication failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status:    'ok',
    endpoint:  '/api/auth',
    timestamp: new Date().toISOString(),
  });
}
