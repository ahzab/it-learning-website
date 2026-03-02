# سيرتي.ai — Arabic CV Builder

The first Arabic-first CV builder for the MENA market.

## 🚀 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: NextAuth.js (email + Google)
- **Payments**: Stripe
- **State**: Zustand
- **PDF Export**: html2pdf.js
- **Hosting**: Vercel + Supabase

---

## 📁 Project Structure

```
seerti/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── layout.tsx                  # Root layout (Cairo font, RTL)
│   ├── globals.css                 # Global styles
│   ├── providers.tsx               # Session provider
│   ├── auth/
│   │   ├── login/page.tsx          # Login page
│   │   └── register/page.tsx       # Register page
│   ├── builder/
│   │   └── page.tsx                # CV Builder page
│   ├── dashboard/
│   │   └── page.tsx                # User dashboard (CVs list)
│   └── api/
│       ├── auth/
│       │   ├── route.ts            # NextAuth handler
│       │   └── register/route.ts   # Registration endpoint
│       ├── cv/
│       │   ├── route.ts            # List + Create CVs
│       │   └── [id]/route.ts       # Get + Update + Delete CV
│       └── payment/
│           ├── checkout/route.ts   # Stripe checkout
│           └── webhook/route.ts    # Stripe webhook
│
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   ├── HeroSection.tsx
│   │   ├── FeaturesSection.tsx
│   │   ├── CountriesSection.tsx
│   │   ├── PricingSection.tsx
│   │   ├── CTASection.tsx
│   │   └── Footer.tsx
│   ├── builder/
│   │   ├── BuilderClient.tsx       # Main builder layout
│   │   ├── TemplateSelector.tsx
│   │   ├── DownloadButton.tsx
│   │   └── forms/
│   │       ├── PersonalForm.tsx
│   │       ├── ExperienceForm.tsx
│   │       ├── EducationForm.tsx
│   │       └── SkillsForm.tsx
│   └── cv/
│       └── CVPreview.tsx           # Live CV preview
│
├── lib/
│   ├── auth.ts                     # NextAuth config
│   ├── prisma.ts                   # Prisma client singleton
│   ├── stripe.ts                   # Stripe helper + plans
│   ├── store.ts                    # Zustand CV state store
│   └── utils.ts                    # cn(), formatDate(), etc.
│
├── types/
│   └── cv.ts                       # All CV TypeScript types
│
├── prisma/
│   └── schema.prisma               # DB schema (User, CV, Payment)
│
└── .env.example                    # All required env variables
```

---

## ⚡ Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/you/seerti
cd seerti
npm install
```

### 2. Setup Environment
```bash
cp .env.example .env.local
# Fill in your values
```

### 3. Setup Database (Supabase)
1. Create project at supabase.com
2. Copy the connection string to `DATABASE_URL`
3. Run: `npm run db:push`

### 4. Setup Stripe
1. Create account at stripe.com
2. Create two products:
   - Basic: $7 one-time payment
   - Pro: $15/month subscription
3. Copy price IDs to `.env.local`
4. Setup webhook: `stripe listen --forward-to localhost:3000/api/payment/webhook`

### 5. Run Dev Server
```bash
npm run dev
# Open http://localhost:3000
```

---

## 💰 Business Model

| Plan | Price | Description |
|------|-------|-------------|
| Free | $0 | Preview only, PNG download |
| Basic | $7 one-time | PDF download, all templates |
| Pro | $15/month | Unlimited CVs + AI assistant |

---

## 🌍 Target Markets

1. **Phase 1**: Morocco (MA) — Arabic + French CVs
2. **Phase 2**: Gulf (UAE, Saudi, Qatar) — English + Gulf formats
3. **Phase 3**: All MENA — Arabic-first

---

## 🗺️ Roadmap

- [x] Landing page
- [x] Auth (email + Google)
- [x] CV Builder (Personal, Experience, Education, Skills)
- [x] Live preview
- [x] PDF export
- [x] Stripe payments
- [x] User dashboard
- [ ] AI writing assistant
- [ ] More templates (Gulf-specific)
- [ ] Mobile app (React Native)
- [ ] Arabic job board integration
- [ ] Cover letter builder

---

## 📞 Deploy to Vercel

```bash
npm install -g vercel
vercel
# Add env variables in Vercel dashboard
```
