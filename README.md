# RACM ITGC SaaS Platform

A complete SaaS application for ITGC (Internal Totally Good Controls) audit assessments with subscription management and template library.

## Features

✅ **User Authentication**
- Email/password signup and login
- Secure session management with Supabase Auth
- User profile management

✅ **Assessment System**
- Multi-tab assessment interface (Controls A-I)
- Real-time data saving to Supabase
- Generate audit reports
- Export in multiple formats (PDF, Excel, Word)

✅ **Subscription Management**
- Free plan: 1 assessment per user
- $15/month subscription for unlimited assessments
- Stripe integration for payments
- Customer portal for billing management

✅ **Template Library**
- Pre-built audit templates
- $10 per template download
- Multiple format support (Excel, PDF, Word)
- Filter by domain and control type

✅ **Admin Dashboard**
- User management
- Subscription monitoring
- Payment tracking
- Template administration
- Revenue analytics

## Technology Stack

- **Frontend:** Vue 3 + Vite + Tailwind CSS
- **Backend:** Supabase (Auth, Database, Real-time)
- **Payments:** Stripe (Subscriptions + One-time Purchases)
- **State Management:** Pinia
- **Hosting:** Netlify (frontend)

## Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn
- Supabase account (free tier available)
- Stripe account (free to create)

### Installation

1. **Clone or download the project**
```bash
cd racm-itgc-saas
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your Supabase and Stripe credentials
```

4. **Set up Supabase**
- Create a new Supabase project
- Run SQL migrations from `supabase/schema.sql`
- Set up RLS policies from `supabase/policies.sql`
- Copy your Project URL and Anon Key to `.env`

5. **Set up Stripe**
- Create Stripe account at https://stripe.com
- Get API keys from Developers → API Keys
- Create subscription and template products
- Copy keys to `.env`

6. **Start development server**
```bash
npm run dev
```

Open http://localhost:5173 in your browser.

## Project Structure

```
src/
├── pages/          # Page components (Login, Dashboard, etc.)
├── components/     # Reusable components
├── services/       # API services (auth, database, stripe)
├── stores/         # Pinia state management
├── router/         # Vue Router configuration
└── style.css       # Global styles
```

## Configuration

### Environment Variables

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Stripe
VITE_STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Products
VITE_STRIPE_SUBSCRIPTION_PRICE_ID=price_...
VITE_STRIPE_TEMPLATE_PRICE_ID=price_...

# App
VITE_APP_URL=http://localhost:5173
```

See `.env.example` for all available options.

## Usage

### For Users

1. **Sign up** with email and password
2. **Create assessment** - Free first assessment
3. **Complete assessment** - Answer control questions
4. **View report** - Generated audit report
5. **Download templates** - $10 per template
6. **Upgrade plan** - $15/month for unlimited assessments

### For Admins

1. Log in with admin account
2. Visit `/admin` dashboard
3. Manage users and subscriptions
4. View payment history
5. Create and manage templates
6. View revenue analytics

## Testing

### Test Stripe Payments

Use these test card numbers:
- **Success:** `4242 4242 4242 4242`
- **Decline:** `4000 0000 0000 0002`
- **Requires Auth:** `4000 0025 0000 3155`

Use any future expiry date and any CVC.

## Deployment

### Deploy to Netlify

1. Push code to GitHub
2. Connect Netlify to GitHub repository
3. Set environment variables in Netlify dashboard
4. Deploy

### Deploy Backend (Supabase)

1. Supabase handles everything automatically
2. Just ensure SQL migrations are applied
3. No additional deployment needed

### Go Live with Stripe

1. Get live API keys from Stripe
2. Update environment variables with live keys
3. Switch webhook to production URL
4. Test full payment flow with real card

## API Endpoints

All API endpoints are handled by Supabase automatically.

### Database Tables

- `users` - User profiles and subscription status
- `assessments` - User assessments and control data
- `templates` - Pre-built audit templates
- `template_purchases` - Purchase history
- `subscriptions` - Active subscriptions
- `payments` - Payment records

## Security

- ✅ Row-level security (RLS) enabled on all tables
- ✅ Authenticated routes protected by router
- ✅ Admin role verification
- ✅ Stripe PCI compliance
- ✅ Environment variables for secrets
- ⚠️ Email verification recommended for production
- ⚠️ 2FA recommended for admin accounts

## Performance

- Component code splitting via Vite
- Real-time database updates via Supabase subscriptions
- Optimized bundle size (manual chunks for large libs)
- Lazy loading for page components

## Troubleshooting

### Stripe Checkout Not Working
- Verify Stripe keys in `.env`
- Check webhook endpoint is active
- Ensure price IDs are correct

### Supabase Connection Failed
- Verify URL and Anon Key
- Check RLS policies are enabled
- Ensure user is authenticated

### Env Variables Not Loading
- Restart dev server after `.env` changes
- Verify `.env` is in root directory
- Check `VITE_` prefix for frontend vars

## Contributing

1. Create feature branch: `git checkout -b feature/name`
2. Commit changes: `git commit -am 'Add feature'`
3. Push to branch: `git push origin feature/name`
4. Submit pull request

## License

MIT

## Support

For issues and questions:
1. Check documentation in `/docs`
2. Review Stripe docs: https://stripe.com/docs
3. Review Supabase docs: https://supabase.com/docs
4. Check Vue 3 docs: https://vuejs.org/

## Roadmap

- [ ] Payment receipts via email
- [ ] Advanced reporting features
- [ ] Assessment templates/presets
- [ ] Team collaboration features
- [ ] API for integrations
- [ ] Mobile app
- [ ] Analytics dashboard
- [ ] White-label options

---

**Built with ❤️ for security professionals**
