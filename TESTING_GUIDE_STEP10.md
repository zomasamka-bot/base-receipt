# Testing Guide: Pi Network Step 10 - Wallet Approval Flow

## Overview

This guide explains how to test the complete Pi Network approval flow (Step 10) with the new same-origin backend API routes.

---

## Architecture

### Same-Origin Backend (Option 1)
```
Frontend:  your-app.vercel.app
Backend:   your-app.vercel.app/api/auth
           your-app.vercel.app/api/approve
           your-app.vercel.app/api/complete
```

All API calls use **relative paths** (e.g., `/api/approve`) - no external URLs.

---

## API Endpoints

### 1. POST /api/auth
**Purpose:** Verify Pi Network access token and create session  
**Called:** After `Pi.authenticate()` completes  
**Request:**
```json
{
  "accessToken": "pi_access_token_here",
  "user": {
    "uid": "user-id",
    "username": "username"
  }
}
```
**Response:**
```json
{
  "success": true,
  "session": {
    "accessToken": "...",
    "user": { ... },
    "authenticated": true,
    "timestamp": "2024-01-27T..."
  }
}
```

### 2. POST /api/approve
**Purpose:** Handle wallet approval callback (Step 10)  
**Called:** When user clicks "Allow" in Pi Wallet  
**Request:**
```json
{
  "paymentId": "payment-id-from-pi",
  "amount": 0,
  "metadata": {
    "action": "Base Receipt Creation",
    "receiptId": "BR-123...",
    "referenceId": "REF-123...",
    "timestamp": "2024-01-27T..."
  }
}
```
**Response:**
```json
{
  "success": true,
  "approved": true,
  "paymentId": "payment-id",
  "approvalRecord": { ... }
}
```

### 3. POST /api/complete
**Purpose:** Handle completion callback after blockchain confirmation  
**Called:** After Pi Network confirms the approval  
**Request:**
```json
{
  "paymentId": "payment-id",
  "txid": "transaction-id-or-null",
  "metadata": { ... }
}
```
**Response:**
```json
{
  "success": true,
  "completed": true,
  "paymentId": "payment-id",
  "txid": "txid-or-testnet-no-txid",
  "completionRecord": { ... }
}
```

---

## Testing Steps

### Prerequisites
1. Deploy app to Vercel
2. Register Vercel domain in Pi Developer Portal
3. Open app in Pi Browser (mobile app)

### Step-by-Step Testing

#### 1. Initial Authentication
- Open app in Pi Browser
- App automatically calls `Pi.authenticate()`
- **Expected in logs:** `POST /api/auth` called (if you add that integration)
- User sees authentication screen

#### 2. Create Receipt
- Click "Create Base Receipt" button
- Receipt IDs generated instantly
- Status: "Created"

#### 3. Wallet Approval (Step 10)
- Pi Wallet opens automatically
- User sees approval request with:
  - Amount: 0 Pi (approval only)
  - Memo: "Base Receipt Approval: Base Receipt Creation"
  - Metadata: Receipt details
- Click "Allow"

#### 4. Backend Callback
**CRITICAL MOMENT - This is Step 10:**
- **Expected in Vercel logs:**
```
[v0] ========================================
[v0] POST /api/approve - Approval callback received
[v0] Payment ID: pi_payment_12345...
[v0] Amount: 0
[v0] Metadata: { receiptId: "BR-...", referenceId: "REF-..." }
[v0] Approval record created: { ... }
[v0] Approval processing complete - Success
[v0] ========================================
```

#### 5. Status Update
- App updates receipt status to "Approved"
- Activity log shows: "Pi Testnet wallet approval received"

#### 6. Completion
- After ~2-5 seconds, Pi SDK calls completion callback
- **Expected in Vercel logs:**
```
[v0] ========================================
[v0] POST /api/complete - Completion callback received
[v0] Payment ID: pi_payment_12345...
[v0] Transaction ID: testnet-no-txid (or actual txid)
[v0] Completion processing complete - Success
[v0] ========================================
```

#### 7. Final Status
- Receipt status: "Submitted"
- Freeze ID generated
- Evidence pack complete with all IDs and timestamps

---

## What to Look For in Vercel Logs

### Success Indicators ✅
```
✓ POST /api/approve called
✓ Payment ID received
✓ Amount: 0 (approval-only)
✓ Metadata contains receiptId and referenceId
✓ Response: { success: true, approved: true }
✓ POST /api/complete called (few seconds later)
✓ No errors in console
```

### Failure Indicators ❌
```
✗ No POST /api/approve in logs → Pi SDK not calling backend
✗ 404 on /api/approve → Endpoint not deployed
✗ CORS error → External URL used (should be relative path)
✗ Origin mismatch → Domain not registered in Pi Portal
✗ Error: "Authentication failed" → Access token issue
```

---

## Common Issues & Solutions

### Issue: No /api/approve call in logs
**Solution:** Verify domain is registered in Pi Developer Portal

### Issue: CORS error
**Solution:** Ensure using relative paths (`/api/approve`), not full URLs

### Issue: Wallet doesn't open
**Solution:** Must test in Pi Browser mobile app, not web browser

### Issue: 404 on API routes
**Solution:** Redeploy to Vercel, verify routes are in `/app/api/` folder

### Issue: "Pi SDK not available"
**Solution:** App must be opened through Pi Browser app

---

## Expected Full Flow Timeline

```
0s    - User clicks "Create Base Receipt"
0.1s  - Receipt created (status: Created)
0.2s  - Pi Wallet opens
User interaction - Click "Allow"
2s    - POST /api/approve called ← STEP 10 SUCCESS
2.1s  - Status updates to "Approved"
4s    - POST /api/complete called
4.1s  - Status updates to "Submitted"
4.2s  - Freeze ID generated
```

---

## Verification Checklist

- [ ] App deployed to Vercel
- [ ] Domain registered in Pi Developer Portal
- [ ] Opened in Pi Browser (not web browser)
- [ ] "Create Base Receipt" button clicked
- [ ] Pi Wallet opened
- [ ] "Allow" clicked in wallet
- [ ] POST /api/approve appears in Vercel logs
- [ ] Payment ID logged
- [ ] Amount is 0
- [ ] Metadata contains receipt details
- [ ] Success response returned
- [ ] POST /api/complete appears in logs
- [ ] Receipt status updates to "Submitted"
- [ ] No errors in console

---

## Success Criteria

**Step 10 is complete when:**
1. You click "Allow" in Pi Wallet
2. Vercel logs show `POST /api/approve` with success
3. Receipt status updates to "Approved"
4. No errors in browser console
5. Evidence pack displays all IDs correctly

**This confirms:**
- Pi SDK successfully communicating with your backend
- Same-origin API routes working correctly
- Approval-only flow (no funds) functioning
- App ready for production deployment

---

## Next Steps After Step 10 Success

1. **Test multiple receipts** to verify state persistence
2. **Test cross-tab sync** by opening app in multiple tabs
3. **Verify domain binding** by checking domain indicator in UI
4. **Submit to Pi Developer Portal** for review
5. **Request domain claim** eligibility

---

## Support

If Step 10 fails after following this guide:
1. Check Vercel deployment logs
2. Verify domain registration in Pi Portal
3. Ensure testing in Pi Browser app
4. Review browser console for errors
5. Confirm API routes are deployed (test GET endpoints)
