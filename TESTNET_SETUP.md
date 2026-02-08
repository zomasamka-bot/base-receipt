# Base Receipt - Pi Testnet Setup Guide

## Overview

Base Receipt is a **Testnet application** running on Pi Network that generates unique reference records through wallet approval. This app operates on **Pi Testnet** with **approval-only** functionality—no payments, no custody, no financial execution.

## Testnet Configuration

### Current Setup
- **Environment**: Pi Testnet
- **SDK**: Pi Network SDK v2.0
- **Sandbox Mode**: Disabled (live Testnet)
- **Approval Type**: Wallet signature only (0 Pi amount)
- **Financial Operations**: None (approval records only)

### Pi Browser Requirements
This app **must be opened in Pi Browser** to access wallet approval functionality:
1. Open Pi Browser on your mobile device
2. Navigate to your deployed app URL
3. Authenticate with your Pi account
4. Use the app to create approval-based receipts

## Features

### ✅ Live Testnet Features
- **Real Pi SDK Integration**: Uses official Pi Network SDK
- **Wallet Approval Flow**: Requests approval via Pi Browser wallet
- **Instant ID Generation**: Receipt ID and Reference ID created immediately
- **Live Status Updates**: Real-time status tracking (Created → Approved → Submitted)
- **Evidence Pack**: Full audit trail with timestamps and logs
- **Freeze ID**: Generated upon successful submission

### 🚫 Explicitly Forbidden
- ❌ No payments or Pi transfers
- ❌ No custody of funds or assets
- ❌ No financial transactions
- ❌ No investment opportunities
- ❌ No promise of financial returns

## Developer Portal Eligibility

### ✅ Portal Review Ready
- Complies with Pi Network approval-only guidelines
- Clear disclaimers about Testnet operations
- No misleading financial language
- Proper evidence and audit trail
- Mobile-first responsive design

### Domain Claim Requirements
1. Deploy to a custom domain
2. Complete Pi Developer Portal submission
3. Pass Pi Network review process
4. Enable domain claim eligibility

## Technical Architecture

### Core Components
- **Receipt Engine**: Unified core for all receipt operations
- **Pi Approval Module**: Testnet wallet approval integration
- **Evidence System**: Automatic logging and documentation
- **Status Flow**: Created → Approved → Submitted → Failed

### Backend Integration
While the frontend is Testnet-ready, production deployment requires:
- Backend API for receipt persistence
- Database for storing approval records
- Security measures (rate limiting, validation)
- Monitoring and analytics

## Testing in Pi Browser

### How to Test
1. **Open in Pi Browser**: Navigate to your deployed URL
2. **Authenticate**: Log in with your Pi account
3. **Create Receipt**: Click "Create Base Receipt"
4. **Approve in Wallet**: Confirm the approval (0 Pi, no payment)
5. **View Evidence**: Receipt ID, Reference ID, and Freeze ID displayed
6. **Check Logs**: Review the activity log for full audit trail

### Expected Behavior
- Status updates in real-time
- Pi Browser wallet prompt appears
- Approval requires user confirmation
- No Pi balance changes (0 amount approval)
- Evidence pack shows complete record

## Launch Checklist

- [x] Real Pi SDK integration (not simulated)
- [x] Testnet-appropriate language (no "demo" wording)
- [x] Wallet approval flow functional
- [x] Live status and logs displayed
- [x] No financial operation language
- [x] Mobile-first responsive design
- [x] Pi Browser compatibility
- [ ] Backend API integration (production requirement)
- [ ] Custom domain deployment
- [ ] Developer Portal submission
- [ ] Pi Network review approval

## Support

For issues or questions about this Testnet application:
- Review Pi Network Developer Documentation
- Check Pi Developer Portal guidelines
- Test thoroughly in Pi Browser before submission

## Disclaimer

This is a **Pi Testnet application** for approval record generation. It operates with **approval-only** functionality and **no financial execution**. No payments, custody, or financial transactions are performed. All operations are recorded for transparency and audit purposes only.
