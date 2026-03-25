# 🏗️ The Builders 

A premium Pakistani marketplace connecting homeowners with trusted, skilled service professionals electricians, plumbers, carpenters, painters, and more. Browse verified pros, compare rates, negotiate pricing, book appointments, and leave reviews — all in one seamless platform.

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Database Schema](#-database-schema)
- [Routes](#-routes)
- [Author](#-author)

---

## ✨ Features

### For Clients (Homeowners)
- **Browse Professionals** — Search and filter pros by category, city, rating, and availability
- **Pro Profiles** — View detailed profiles with skills, experience, hourly rates, and reviews
- **Price Negotiation** — Real-time negotiation thread between client and professional
- **Booking System** — Book appointments with preferred date and time slot
- **Reviews & Ratings** — Leave reviews with photos after completed jobs
- **Favorites** — Save preferred professionals for quick access
- **Dashboard** — Track all bookings, negotiations, and favorite pros
- **User Profile** — Manage personal information (name, phone, city, address)

### For Professionals (Labourers)
- **Pro Panel** — Manage incoming bookings, respond to negotiations, track earnings
- **Pro Profile Editor** — Edit bio, skills, hourly rate, availability schedule, and avatar
- **Availability Toggle** — Set availability status (greyed-out hire buttons when unavailable)
- **Work Photos** — Upload photos of completed work for portfolio
- **Earnings Dashboard** — Track jobs completed, total earned, and repeat clients

### General
- **Authentication** — Email-based signup/signin with password reset flow
- **Role-Based Access** — Separate flows for clients and professionals
- **Responsive Design** — Fully responsive across desktop, tablet, and mobile
- **Dark/Light Mode** — Theme support via CSS custom properties
- **Animations** — Smooth page transitions and micro-interactions with Framer Motion

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | React 18 + TypeScript |
| **Build Tool** | Vite |
| **Styling** | Tailwind CSS + shadcn/ui |
| **Animations** | Framer Motion |
| **Routing** | React Router v6 |
| **State Management** | TanStack React Query |
| **Backend / Database** | Supabase (PostgreSQL + Auth + Storage + Edge Functions) |
| **Forms** | React Hook Form + Zod validation |

---

## 📁 Project Structure

```
src/
├── assets/              # Static assets (images, hero backgrounds)
├── components/          # Reusable UI components
│   ├── ui/              # shadcn/ui primitives (button, input, card, etc.)
│   ├── Navbar.tsx       # Navigation bar with auth state
│   ├── Footer.tsx       # Site footer
│   ├── ProCard.tsx      # Professional listing card
│   ├── ProJobCard.tsx   # Job card for pro panel
│   ├── ReviewModal.tsx  # Review submission modal
│   ├── NegotiationThread.tsx  # Price negotiation chat
│   ├── ProtectedRoute.tsx     # Role-based route guard
│   └── Skeletons.tsx    # Loading skeleton components
├── hooks/
│   ├── useAuth.tsx      # Authentication context & hooks
│   ├── use-toast.ts     # Toast notification hook
│   └── use-mobile.tsx   # Mobile detection hook
├── integrations/
│   └── supabase/        # Auto-generated Supabase client & types
├── lib/
│   ├── api.ts           # API helper functions
│   ├── proProfiles.ts   # Pro profile CRUD operations
│   ├── mockData.ts      # Categories, testimonials & type definitions
│   ├── icons.ts         # Icon mapping for categories
│   ├── stripe.ts        # Payment utilities
│   └── utils.ts         # General utility functions
├── pages/
│   ├── Index.tsx         # Landing page with hero, categories, testimonials
│   ├── BrowsePage.tsx    # Browse & filter professionals
│   ├── ProProfilePage.tsx  # Public pro profile view (for clients)
│   ├── ProProfilePage2.tsx # Pro's own profile editor
│   ├── BookingPage.tsx   # Booking form
│   ├── CheckoutPage.tsx  # Payment/checkout flow
│   ├── DashboardPage.tsx # Client dashboard
│   ├── ProPanelPage.tsx  # Professional's management panel
│   ├── ProfilePage.tsx   # Client profile settings
│   ├── SignUpPage.tsx    # Registration
│   ├── SignInPage.tsx    # Login
│   ├── ForgotPasswordPage.tsx  # Password recovery
│   ├── ResetPasswordPage.tsx   # Password reset
│   └── NotFound.tsx      # 404 page
└── index.css            # Global styles & design tokens
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ or Bun
- A Supabase project

### Installation

```bash
# Clone the repository
git clone https://github.com/iamumerjz/the-builders-app.git
cd the-builders-app

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your Supabase URL and anon key to .env:
# VITE_SUPABASE_URL=your-supabase-url
# VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key

# Run the development server
npm run dev
```

### Database Setup

Run the following SQL in your Supabase SQL editor to create the required tables:

```sql
-- Profiles (user metadata, auto-created on signup via trigger)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT,
  phone TEXT,
  city TEXT,
  address TEXT,
  is_labourer BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Pro Profiles (professional details)
CREATE TABLE public.pro_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT,
  phone TEXT,
  city TEXT,
  profession TEXT NOT NULL DEFAULT '',
  bio TEXT,
  avatar_url TEXT,
  hourly_rate NUMERIC NOT NULL DEFAULT 0,
  years_experience INT,
  response_time TEXT,
  available BOOLEAN DEFAULT true,
  skills TEXT[],
  availability_schedule TEXT[],
  portfolio TEXT[],
  jobs_completed INT DEFAULT 0,
  repeat_clients INT DEFAULT 0,
  total_earned NUMERIC DEFAULT 0,
  top_rated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- See supabase/migrations/ for complete schema
-- (bookings, reviews, negotiations, favorites, work_photos, etc.)
```

---

## 🗄️ Database Schema

| Table | Purpose |
|---|---|
| `profiles` | User metadata (name, phone, city, address, role) |
| `pro_profiles` | Professional details (skills, rate, bio, availability) |
| `bookings` | Appointment records between clients and pros |
| `reviews` | Client reviews and ratings for professionals |
| `review_photos` | Photos attached to reviews |
| `negotiations` | Price negotiation sessions |
| `negotiation_messages` | Individual messages within negotiations |
| `favorites` | Client's saved/favorite professionals |
| `work_photos` | Photos of completed work uploaded by pros |

---

## 🗺️ Routes

| Path | Access | Description |
|---|---|---|
| `/` | Public | Landing page |
| `/browse` | Public | Browse professionals |
| `/pro/:id` | Public | View professional's profile |
| `/signup` | Public | Create account |
| `/signin` | Public | Sign in |
| `/forgot-password` | Public | Request password reset |
| `/reset-password` | Public | Reset password |
| `/dashboard` | Client | Client dashboard |
| `/profile` | Client | Edit client profile |
| `/book/:id` | Client | Book a professional |
| `/checkout` | Client | Payment/checkout |
| `/pro-panel` | Pro | Professional's management panel |
| `/pro-profile` | Pro | Edit professional profile |

---

## 👤 Author

**Umer Ijaz** — [@iamumerjz](https://github.com/iamumerjz)

- 🔗 [LinkedIn](https://www.linkedin.com/in/iamumerjz)
- 🐙 [GitHub](https://github.com/iamumerjz)

---

## 📄 License

This project is proprietary. All rights reserved.
