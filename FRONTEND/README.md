# Thekedaar — Frontend

Landing page with a public jobs feed and sign-in CTA (no login flow yet).

## Setup

```bash
cd FRONTEND
npm install
cp .env.example .env   # if you don't already have .env
```

Ensure `.env` includes:

```
BE_API_BASE_URL=http://localhost:5000
```

Optional — point the Sign in button to WhatsApp:

```
NEXT_PUBLIC_WHATSAPP_URL=https://wa.me/91XXXXXXXXXX
```

Optional WhatsApp link on the login page for new users.

## Run

Start the backend (`BE`) on port 5000, then:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## What’s included

- **Hero** — platform intro + CTAs
- **How it works** — 3-step overview
- **Open jobs** — browsable feed via `GET /api/feed` → backend `GET /api/jobs/feed` (no login)
- **Sign in** — `/login` (phone → WhatsApp magic link)
- **Job cards** — “Sign in to apply or hire” → `/login` with job context
