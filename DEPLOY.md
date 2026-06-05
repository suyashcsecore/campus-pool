# CampusPool — Deploy Guide

Deploy **CampusPool** with **Vercel** (hosting) + **Supabase** (PostgreSQL + realtime chat).

---

## Quick checklist

- [ ] Create Supabase project
- [ ] Run `supabase/schema.sql` in SQL Editor
- [ ] Copy `.env.example` → `.env.local` and fill keys
- [ ] Test locally with `npm run dev`
- [ ] Push to GitHub
- [ ] Deploy on Vercel with same env vars
- [ ] Smoke test production

---

## Step 1 — Supabase setup (~5 min)

1. Go to [supabase.com](https://supabase.com) → **New project**
2. Pick a region close to your users (e.g. Singapore)
3. Save your database password

### Run the schema

1. Open **SQL Editor** in Supabase
2. Paste the entire contents of `supabase/schema.sql`
3. Click **Run**

This creates tables, indexes, Realtime subscriptions, and read policies for live chat.

### Get API keys

**Project Settings → API** — copy:

| Key | Env variable |
|-----|----------------|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| anon public | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| service_role | `SUPABASE_SERVICE_ROLE_KEY` |

⚠️ **Never** expose `SUPABASE_SERVICE_ROLE_KEY` in client code or commit it to git.

---

## Step 2 — Local environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
JWT_SECRET=paste-a-long-random-string
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

Generate JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Start dev server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Demo accounts (auto-seeded on first login)

| Email | Password |
|-------|----------|
| `2005123@kiit.ac.in` | `password123` |
| `2106041@kiit.ac.in` | `password123` |

---

## Step 3 — How the app uses the database

| Mode | When | Storage |
|------|------|---------|
| **Supabase** | Env vars set | PostgreSQL + Realtime |
| **Local JSON** | No Supabase keys | `data/db.json` (dev only) |

Production **must** use Supabase. Vercel's filesystem is ephemeral — local JSON will not persist.

### Realtime features

- **Chat** — instant message delivery via Supabase Realtime (no 3s polling)
- **Ride page** — participant/status updates when Supabase is configured

All **writes** (register, join ride, send message) go through Next.js API routes using the service role key.

---

## Step 4 — Push to GitHub

```bash
git add .
git commit -m "Add Supabase deployment support with realtime chat"
git remote add origin https://github.com/YOUR_USERNAME/campus-pool.git
git push -u origin main
```

---

## Step 5 — Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repo
3. Framework: **Next.js** (auto-detected)
4. Add **Environment Variables** (same as `.env.local`):

   - `JWT_SECRET`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

5. Click **Deploy**

Your app will be live at `https://your-project.vercel.app`

### Custom domain (optional)

Vercel → **Settings → Domains** → add your domain

---

## Step 6 — Production smoke test

- [ ] Register with `@kiit.ac.in` email
- [ ] Login / logout
- [ ] Browse rides on dashboard
- [ ] Create a new ride
- [ ] Join ride from incognito window (second account)
- [ ] Send chat message — appears instantly on both browsers
- [ ] Mark arrival / complete ride
- [ ] Report no-show flow

---

## Managing data in Supabase

Use the Supabase Dashboard:

| Task | Location |
|------|----------|
| View/edit users, rides, messages | **Table Editor** |
| Run SQL | **SQL Editor** |
| Monitor realtime | **Logs → Realtime** |
| Database size | **Settings → Usage** |

---

## Troubleshooting

### "Supabase is not configured"
Copy `.env.example` to `.env.local` and add your keys. Restart dev server.

### Chat shows "Connecting…" forever
1. Confirm `supabase/schema.sql` was run (realtime + policies)
2. Check browser console for WebSocket errors
3. Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set in Vercel env vars

### Login works locally but not on Vercel
Ensure all 4 env vars are set in Vercel project settings (not just locally).

### Schema SQL errors on re-run
The schema is meant to run once on a fresh project. For updates, run individual statements manually.

---

## File reference

```
supabase/schema.sql     ← Run in Supabase SQL Editor
.env.example            ← Copy to .env.local
src/lib/db.ts           ← Auto-switches Supabase vs local JSON
src/lib/db-supabase.ts  ← Supabase queries
src/lib/db-local.ts     ← Local dev fallback
src/components/ChatBox.tsx ← Realtime chat
```

---

## Cost (free tier)

| Service | Free tier |
|---------|-----------|
| Vercel | Hobby plan — sufficient for MVP |
| Supabase | 500 MB DB, 2 GB bandwidth |

Enough for a campus beta with hundreds of users.
