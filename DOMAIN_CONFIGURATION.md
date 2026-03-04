# Domain Configuration

## Approved URLs for Base Receipt

The application is configured to work correctly on both approved domains:

### 1. PiNet Internal Domain (Testnet)
**URL:** `https://basereceipt9395.pinet.com`

- **Purpose:** Official Pi Network internal identity
- **Environment:** Pi Testnet
- **Usage:** Primary domain for Pi Browser and Pi Developer Portal
- **Status:** Active and configured

### 2. Vercel Application URL (Hosting)
**URL:** `https://base-receipt-vb-ch-f-g6-nqs-qc-d.vercel.app`

- **Purpose:** Live application hosting
- **Environment:** Vercel serverless deployment
- **Usage:** Development, testing, and backup access
- **Status:** Active and configured

---

## Technical Implementation

### Same-Origin Architecture
All backend API endpoints are deployed within the same Next.js application, ensuring same-origin compatibility:

```
Frontend: [domain]/
Backend:  [domain]/api/auth
Backend:  [domain]/api/approve
Backend:  [domain]/api/complete
```

This works identically on both domains since all code is deployed together.

### Domain Detection
The app automatically detects which domain it's running on:

```typescript
// lib/domain-utils.ts
- getCurrentDomain() - Returns current domain info
- verifyApprovedDomain() - Validates domain is approved
- logDomainInfo() - Logs domain details for debugging
```

### State Management
Domain information is persisted in state management:

```typescript
// lib/state-manager.ts
DOMAIN_CONFIG = {
  pinetDomain: 'basereceipt9395.pinet.com',
  vercelDomain: 'base-receipt-vb-ch-f-g6-nqs-qc-d.vercel.app',
  fullDomain: 'basereceipt9395.pinet.com', // PiNet as primary
}
```

### API Route Configuration
All API routes log domain information for debugging:

```typescript
// app/api/*/route.ts
const hostname = request.headers.get('host');
const origin = request.headers.get('origin');
console.log('[v0] Domain:', hostname);
console.log('[v0] Origin:', origin);
```

### Next.js Configuration
CORS headers configured in `next.config.mjs` to support cross-origin scenarios while maintaining security.

---

## Verification Steps

### On PiNet Domain
1. Open `https://basereceipt9395.pinet.com` in Pi Browser
2. Check browser console for domain verification logs
3. Expected output:
   ```
   [v0] Current Domain: basereceipt9395.pinet.com
   [v0] Is PiNet Domain: true
   [v0] Domain Approved: true
   ```

### On Vercel Domain
1. Open `https://base-receipt-vb-ch-f-g6-nqs-qc-d.vercel.app`
2. Check browser console for domain verification logs
3. Expected output:
   ```
   [v0] Current Domain: base-receipt-vb-ch-f-g6-nqs-qc-d.vercel.app
   [v0] Is Vercel Domain: true
   [v0] Domain Approved: true
   ```

### Backend API Verification
When clicking "Create Base Receipt" and approving in wallet:

**Expected Vercel Logs:**
```
[v0] POST /api/approve - Approval callback received
[v0] Domain: [current-domain]
[v0] Origin: https://[current-domain]
[v0] Payment ID: [payment-id]
[v0] Approval processing complete - Success
```

---

## Pi Developer Portal Configuration

### App Settings Required:
1. **App Domain:** `basereceipt9395.pinet.com` (primary)
2. **Approved Domains:** 
   - `basereceipt9395.pinet.com`
   - `base-receipt-vb-ch-f-g6-nqs-qc-d.vercel.app`

### API Callback URLs:
- Approve: `https://[domain]/api/approve`
- Complete: `https://[domain]/api/complete`

Both domains will work because the same codebase is deployed to both locations.

---

## Testing Recommendations

### 1. PiNet Domain Testing (Primary)
- Open app in Pi Browser using PiNet URL
- Complete full approval flow
- Verify Vercel logs show correct domain
- Confirm receipt generation works

### 2. Vercel Domain Testing (Secondary)
- Open app directly via Vercel URL
- Test authentication flow
- Verify domain detection is correct
- Confirm API routes are accessible

### 3. Cross-Domain Verification
- Test that localStorage state works on both domains
- Verify no domain mismatch errors
- Confirm API calls use relative paths
- Check CORS headers are correct

---

## Troubleshooting

### Issue: "Domain not approved" warning
**Solution:** Ensure both domains are added to Pi Developer Portal approved domains list

### Issue: API calls fail with CORS error
**Solution:** Verify same-origin architecture - all API routes should be `/api/*` relative paths

### Issue: Domain mismatch in logs
**Solution:** Check that both PiNet and Vercel are pointing to the same deployed codebase

### Issue: Wallet approval fails
**Solution:** Ensure callback URLs in Pi Developer Portal match actual domain being used

---

## Status: ✅ Configured and Ready

Both domains are properly configured with:
- ✅ Same-origin API architecture
- ✅ Domain detection and verification
- ✅ CORS headers configured
- ✅ Comprehensive logging
- ✅ State management integration
- ✅ API route domain awareness

The application will work correctly on both `basereceipt9395.pinet.com` (PiNet) and `base-receipt-vb-ch-f-g6-nqs-qc-d.vercel.app` (Vercel).
