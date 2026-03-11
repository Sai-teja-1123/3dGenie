# Razorpay Payment Gateway – Setup Guide

This guide walks you through connecting Razorpay to your pricing page for real-time payments.

---

## What You Need to Do (Manual Steps)

### Step 1: Create a Razorpay Account

1. Go to [https://razorpay.com](https://razorpay.com)
2. Click **Sign Up**
3. Enter your email, business details, and create a password
4. Verify your email

**Cost:** Free. No upfront payment. You only pay 2% per transaction when you go live.

---

### Step 2: Get Your API Keys (Test Mode)

1. Log in to [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Toggle **Test Mode** ON (top-right) – this lets you test without real money
3. Go to **Settings** → **API Keys** (or [direct link](https://dashboard.razorpay.com/app/keys))
4. Click **Generate Test Key** if you don’t have keys yet
5. Copy:
   - **Key ID** (starts with `rzp_test_`)
   - **Key Secret** (starts with `rzp_test_`) – keep this secret

---

### Step 3: Configure Your Backend

1. In the `backend` folder, copy the example env file if you don’t have `.env`:

   ```bash
   cd backend
   copy env.example .env   # Windows
   # or: cp env.example .env   # Mac/Linux
   ```

2. Edit `backend/.env` and add:

   ```env
   RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
   RAZORPAY_KEY_SECRET=your_secret_here
   ```

3. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

---

### Step 4: Run the Application

1. Start the backend:

   ```bash
   cd backend
   python -m uvicorn app.main:app --reload
   ```

2. In another terminal, start the frontend:

   ```bash
   npm run dev
   ```

3. Open [http://localhost:5173/pricing](http://localhost:5173/pricing)

---

### Step 5: Test a Payment

1. Log in (or use your auth flow)
2. Select **Pro** or **Studio** plan
3. Click **Pay Now**
4. Use Razorpay test details:
   - **Card:** 4111 1111 1111 1111
   - **Expiry:** Any future date (e.g. 12/25)
   - **CVV:** 123
   - **UPI:** `success@razorpay` (for success) or `failure@razorpay` (for failure)

More test data: [Razorpay Test Cards](https://razorpay.com/docs/payments/payments/test-card-details/)

---

## Payment Flow Overview

```
User clicks "Pay Now"
       ↓
Frontend calls: POST /api/payments/create-order { plan: "Pro" }
       ↓
Backend creates Razorpay order, stores in DB, returns order_id + key_id
       ↓
Frontend opens Razorpay Checkout popup
       ↓
User pays (card/UPI/netbanking)
       ↓
Razorpay calls handler with payment_id, order_id, signature
       ↓
Frontend calls: POST /api/payments/verify { ... }
       ↓
Backend verifies signature, updates DB, returns success
       ↓
Frontend shows success message
```

---

## Where Payment Data Is Stored

1. **Razorpay Dashboard** – All transactions (live and test)
2. **Your database** – `backend/payments.db` (SQLite)
   - `order_id`, `payment_id`, `user_id`, `plan`, `amount`, `status`, `created_at`

To view your records:

```bash
# From project root
cd backend
python -c "
from app.services.payment_db import init_db, get_all_payments
init_db()
for p in get_all_payments():
    print(p)
"
```

Or call `GET /api/payments/records` with `Authorization: Bearer <token>`.

---

## Go Live (Production)

1. Complete Razorpay KYC (business verification)
2. In Dashboard, switch to **Live Mode**
3. Generate **Live** API keys (Settings → API Keys)
4. Update `.env` with live keys:
   ```env
   RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxx
   RAZORPAY_KEY_SECRET=your_live_secret
   ```
5. Set up webhooks (optional):
   - Dashboard → Settings → Webhooks
   - Add URL: `https://your-domain.com/api/payments/webhook`
   - Select events: `payment.captured`, `payment.failed`

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Razorpay not configured" | Add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` to `backend/.env` |
| CORS errors | Extend `CORS_ORIGINS` in `.env` to include your frontend URL |
| Payment popup doesn’t open | Check browser console; ensure Razorpay script loads from `checkout.razorpay.com` |
| Verification fails | Ensure backend and frontend use the same env (test vs live keys) |

---

## File Reference

| File | Purpose |
|------|---------|
| `backend/app/routes/payments.py` | Create order, verify, get key |
| `backend/app/services/payment_db.py` | SQLite storage for payments |
| `src/pages/pricing.tsx` | Pricing page with Razorpay Checkout |
| `src/services/api.ts` | `createPaymentOrder`, `verifyPayment` |
