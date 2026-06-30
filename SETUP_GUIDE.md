# RACM ITGC SaaS - Setup Guide

## Prerequisites
- Node.js 16+
- Supabase account (free tier works)
- Stripe account (free to create)

---

## Step 1: Supabase Setup

### 1.1 Create Supabase Project
1. Go to https://supabase.com
2. Create new project (name: racm-itgc-saas)
3. Copy your **Project URL** and **Anon Key**

### 1.2 Create Database Tables
1. In Supabase → SQL Editor
2. Copy and paste the SQL from `supabase/schema.sql`
3. Execute the SQL

### 1.3 Set Up Row-Level Security (RLS)
1. Go to Authentication → Policies
2. Enable RLS for all tables
3. Add policies from `supabase/policies.sql`

---

## Step 2: Stripe Setup

### 2.1 Create Stripe Account
1. Go to https://stripe.com
2. Sign up and verify email
3. Activate account

### 2.2 Get Stripe Keys
1. Go to Developers → API Keys (https://dashboard.stripe.com/apikeys)
2. Copy:
   - **Publishable Key** (starts with `pk_test_`)
   - **Secret Key** (starts with `sk_test_`)
3. Save these in `.env` file

### 2.3 Create Products in Stripe
**Option A: Via Dashboard**
1. Go to Products (https://dashboard.stripe.com/products)
2. Create product: "RACM ITGC Subscription"
   - Pricing: $15/month
   - Copy **Price ID** (starts with `price_`)
3. Create product: "Template Download"
   - Pricing: $10 (one-time)
   - Copy **Price ID**

**Option B: Via Stripe CLI (Recommended)**
```bash
# Install Stripe CLI first
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Create subscription product
stripe products create --name="RACM ITGC Subscription" --type=service

# Create subscription price
stripe prices create \
  --product=<PRODUCT_ID> \
  --unit_amount=1500 \
  --currency=usd \
  --recurring='{"interval":"month"}'

# Create one-time template price
stripe prices create \
  --product=<TEMPLATE_PRODUCT_ID> \
  --unit_amount=1000 \
  --currency=usd
```

### 2.4 Set Up Webhooks
1. Go to Developers → Webhooks (https://dashboard.stripe.com/webhooks)
2. Add endpoint: `https://your-domain.com/api/webhooks/stripe`
3. Events to listen for:
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `charge.succeeded`
   - `charge.failed`
4. Copy Webhook Signing Secret

---

## Step 3: Environment Setup

### 3.1 Create .env file
```bash
cp .env.example .env
```

### 3.2 Fill in values
```
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...

# Stripe (Public)
VITE_STRIPE_PUBLIC_KEY=pk_test_...

# Stripe (Secret - Backend only)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Product/Price IDs
VITE_STRIPE_SUBSCRIPTION_PRICE_ID=price_...
VITE_STRIPE_TEMPLATE_PRICE_ID=price_...

# App
VITE_APP_URL=http://localhost:5173 (dev) or https://your-domain.com (production)
```

---

## Step 4: Install & Run

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

---

## Step 5: Deploy

### Frontend (Netlify)
```bash
npm run build
# Deploy /dist folder to Netlify
```

### Backend Webhooks
Option 1: Use Supabase Edge Functions (preferred)
- Deploy webhook handler in supabase/functions/

Option 2: Use external service (Heroku, Railway, etc.)
- Deploy webhook-server.js

---

## Testing

### Test Subscription Flow
1. Sign up with test email
2. Complete assessment (should be free)
3. Click "Upgrade" button
4. Use Stripe test card: `4242 4242 4242 4242`
5. Expiry: any future date
6. CVC: any 3 digits

### Test Template Download
1. Go to Template Library
2. Click "Download Template" ($10)
3. Use test Stripe card

---

## Stripe Test Cards
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Requires Auth: 4000 0025 0000 3155
```

---

## Troubleshooting

### Stripe Payment Fails
- Check Stripe keys are correct
- Verify webhook endpoint is active
- Check Stripe logs for errors

### Supabase Connection Issues
- Verify URL and Anon Key
- Check RLS policies are enabled
- Verify user is authenticated

### Environment Variables Not Loading
- Restart dev server after .env changes
- Prefix with `VITE_` for frontend access
- Check .env is in root directory

---

## Next Steps
1. Customize branding (logo, colors)
2. Add email templates (signup, payment confirmation)
3. Create admin user in Supabase
4. Set up email verification
5. Add analytics (Mixpanel, Plausible, etc.)
