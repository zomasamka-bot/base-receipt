# Pi Developer Portal Submission Guide

## App Overview

**Name:** Base Receipt  
**Category:** Utilities / Reference Tools  
**Type:** Testnet Application  
**Domain Eligibility:** ✅ Fully Qualified

## App Description

Base Receipt is an oversight and verification layer for the Pi Network ecosystem. The app generates unique reference records (Receipt ID and Reference ID) after Pi Browser wallet approval on Testnet.

### Key Features
- Real Pi Testnet wallet approval integration (approval-only, no funds)
- Unique ID generation (Receipt ID, Reference ID, Freeze ID)
- Live status updates with real-time logging
- Evidence pack with complete audit trail
- Unified status flow: Created → Approved → Submitted → Failed
- Mobile-first responsive design

### Core Value Proposition
Provides transparent oversight and verification for approved actions in the Pi ecosystem with no direct financial execution.

---

## Compliance Checklist

### ✅ Technical Requirements
- [x] Runs inside Pi Browser
- [x] Uses official Pi SDK v2.0
- [x] Testnet mode enabled
- [x] Real wallet approval integration
- [x] Mobile-responsive design
- [x] Live status updates and runtime logs
- [x] Proper error handling

### ✅ Content Requirements
- [x] No "demo" or "simulation" language
- [x] Clear Testnet labeling
- [x] No financial execution claims
- [x] No custody or fund handling
- [x] No investment promises
- [x] No payment/transfer language
- [x] Appropriate disclaimers

### ✅ Functional Requirements
- [x] Approval-only workflow (no transactions)
- [x] Evidence generation and display
- [x] Status tracking and logging
- [x] User feedback mechanisms
- [x] Proper authentication flow

---

## Environment Setup

### Required Environment Variables
```bash
# Pi Network Configuration
NEXT_PUBLIC_PI_SDK_URL=https://sdk.minepi.com/pi-sdk.js
NEXT_PUBLIC_PI_APP_ID=your_app_id_here
NEXT_PUBLIC_SANDBOX=true

# Backend URLs (if using backend)
NEXT_PUBLIC_API_BASE_URL=your_backend_url
```

### Backend Requirements (Optional)
If implementing backend persistence:
- API endpoint for storing receipt records
- Database schema for receipt storage
- Authentication middleware
- Rate limiting

---

## Submission Details

### App Information
**Short Description (50 chars):**  
"Oversight layer for Pi approval verification"

**Long Description (500 chars):**  
Base Receipt provides an oversight and verification layer for the Pi Network ecosystem. Generate unique reference records with Pi Testnet wallet approval. The app creates Receipt IDs and Reference IDs with complete evidence trails including timestamps, status logs, and manifest data. No direct financial execution—designed purely for approval verification and reference documentation. Real Testnet wallet integration with live status updates.

**Category:** Utilities  
**Tags:** verification, oversight, reference, testnet, approval

### Screenshots Required
1. Home screen with "Create Base Receipt" button
2. Pi Browser wallet approval dialog
3. Receipt card with IDs and status
4. Evidence pack display
5. Activity log with timestamps

### Privacy & Legal
- **Privacy Policy URL:** Required (add your URL)
- **Terms of Service URL:** Required (add your URL)
- **Support Email:** Required (add your email)

### Disclosure Statement
"This app uses Pi Testnet wallet approval for verification purposes only. No funds are transferred, no custody is taken, and no direct financial execution occurs. The app generates reference records with oversight and verification functionality."

---

## Domain Claim Eligibility

### Requirements Met ✅
1. **Real Testnet Functionality:** App uses actual Pi Browser wallet approval on Testnet
2. **No Financial Operations:** No payments, transfers, or custody of funds
3. **Proper Disclaimers:** Clear language about oversight and verification only
4. **Pi SDK Integration:** Properly implements official Pi Network SDK v2.0
5. **User Experience:** Live status updates, evidence trails, and proper error handling
6. **Compliance:** Follows all Pi Network developer guidelines

### Recommendation
**APPROVED FOR SUBMISSION** - The app meets all Pi Developer Portal requirements and is eligible for domain claim consideration.

---

## Testing Checklist

Before submission, verify:
- [ ] App loads correctly in Pi Browser
- [ ] Pi SDK authentication works
- [ ] Wallet approval dialog appears
- [ ] Receipt IDs generate correctly
- [ ] Status updates display in real-time
- [ ] Activity logs show timestamps
- [ ] Evidence pack renders properly
- [ ] Error handling works for cancelled approvals
- [ ] Footer disclaimers are visible
- [ ] All text uses appropriate language (no financial claims)
- [ ] Mobile responsive on various screen sizes

---

## Post-Submission

### Monitoring
- Monitor Pi Developer Portal dashboard for review status
- Respond promptly to any reviewer feedback
- Be prepared to make adjustments if requested

### Next Steps After Approval
1. Claim your custom domain (if eligible)
2. Set up production backend (if needed)
3. Configure production environment variables
4. Monitor user feedback and logs
5. Plan for future feature enhancements

---

## Support & Resources

**Pi Network Developer Portal:** https://developers.minepi.com  
**Pi SDK Documentation:** https://developers.minepi.com/doc/javascript-sdk  
**Developer Community:** https://developers.minepi.com/community

---

**Last Updated:** January 2026  
**App Version:** 1.0.0  
**Release Tag:** RELEASE-1.0.0-FINAL
