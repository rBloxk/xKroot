# xkroot Website

A modern, minimal website for xkroot built with Next.js, Express, and Tailwind CSS featuring a glass-morphism design.

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **Express** - Backend server
- **Supabase** - PostgreSQL database for blog posts
- **JWT** - Authentication
- **Glass-morphism Design** - Modern UI with glass effects

## Getting Started

### Prerequisites

- Node.js 18+ 
- Supabase account (free tier available)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up Supabase:
   - Create a project at [supabase.com](https://supabase.com)
   - Get your project URL and API keys from Settings → API
   - Run the SQL schema from `supabase/schema.sql` in the Supabase SQL Editor

3. Set up environment variables:
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
JWT_SECRET=your-secret-key-change-this-in-production
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

4. Initialize admin user:
```bash
# Make a POST request to /api/admin/init with:
# {
#   "username": "admin",
#   "email": "admin@xkroot.com",
#   "password": "your-secure-password"
# }
```

### Development

Run the Next.js development server:

```bash
npm run dev
```

Or run with Express server:

```bash
npm run server
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
npm start
```

## Project Structure

```
xkroot/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── blog/          # Blog CRUD endpoints
│   │   └── admin/         # Admin authentication
│   ├── admin/             # Admin dashboard
│   ├── blog/              # Blog pages
│   ├── projects/          # Projects page
│   ├── whitepaper/        # White Paper page
│   ├── jobs/              # Jobs page
│   ├── about/             # About page
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── Navigation.tsx     # Navigation bar
│   ├── Footer.tsx         # Footer component
│   └── icons/             # Icon components
├── lib/                   # Utilities
│   ├── supabase.ts        # Supabase client
│   └── auth.ts            # Authentication utilities
├── supabase/              # Database schema
│   └── schema.sql         # SQL schema for Supabase
└── server/                # Express server
    └── index.js           # Server entry point
```

## Features

### Blog System
- Full CRUD operations for blog posts
- Admin dashboard for content management
- Published/Draft status
- Categories and tags
- Featured images
- SEO-friendly URLs (slugs)

### Admin Dashboard
- Secure authentication with JWT
- Create, edit, delete blog posts
- Toggle publish status
- Real-time updates

### Pages
- **Home** - Hero section with products and features
- **Projects** - Showcase of 6 products
- **White Paper** - Company documentation and tokenomics
- **Blog** - Blog listing and individual posts
- **Jobs** - Career opportunities
- **About** - Company information

## Design System

### Colors
- **Light Beige** - Primary background (#F5F5DC)
- **Black** - Primary text (#000000)
- **Dark Gray** - Secondary text (#696969)
- **Light Gray** - Accent (#C0C0C0)

### Glass Effect
The glass-morphism effect is achieved using:
- Semi-transparent backgrounds
- Backdrop blur
- Subtle borders

## API Endpoints

### Blog
- `GET /api/blog` - Get all blog posts
- `GET /api/blog?published=true` - Get published posts only
- `POST /api/blog` - Create new post (admin only)
- `GET /api/blog/[slug]` - Get single post
- `PUT /api/blog/[slug]` - Update post (admin only)
- `DELETE /api/blog/[slug]` - Delete post (admin only)

### Admin
- `POST /api/admin/login` - Admin login
- `GET /api/admin/verify` - Verify admin token
- `POST /api/admin/init` - Initialize admin user (one-time)

## Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous/public key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (keep secret!)
- `JWT_SECRET` - Secret key for JWT tokens
- `NEXT_PUBLIC_BASE_URL` - Base URL for the application

## Supabase Setup

For detailed Supabase setup instructions, see [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)

## License

Private - xkroot
