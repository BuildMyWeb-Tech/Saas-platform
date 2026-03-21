# 🖨️ PrintMixBox — IoT SaaS Platform v2

**Full-stack MERN SaaS** with admin panel, credential-based onboarding, and IoT printer management.

---

## Architecture

```
Frontend (Vercel)              Admin Panel (same Vercel app)
  /register  /login              /admin  /admin/companies
       ↓                                ↓
       ──────── REST API (HTTPS) ────────
                      ↓
          Node.js + Express (Render)
                      ↓
               MongoDB Atlas
                      ↓
             Gmail SMTP (Email)
```

---

## Registration → Login Flow

```
1. Company fills /register  (Name + GST + Email only)
2. Backend saves as status="pending", sends ack email
3. Admin logs into /admin → sees pending company
4. Admin clicks "Approve & Send Credentials"
5. Backend auto-generates:
     • Company Code  (COMP-XXXX) — permanent ID
     • Username      (from company name)
     • Temp Password (secure random)
6. Credentials email sent to company's email
7. Company logs in at /login with those credentials
8. Forced to /change-password — sets their own password
9. Lands on /dashboard
```

---

## Quickstart (Local Development)

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier)
- Gmail account

### 1. Clone

```bash
git clone https://github.com/BuildMyWeb-Tech/Saas-platform.git
cd Saas-platform
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env — fill in MONGO_URI, EMAIL_USER, EMAIL_PASS, JWT secrets
npm install
npm run seed:admin        # Creates superadmin / Admin@1234
npm run dev               # → http://localhost:5000
```

### 3. Frontend

```bash
cd frontend
# No .env needed for local — Vite proxies /api to localhost:5000
npm install
npm run dev               # → http://localhost:5173
```

### URLs (local)
| Page | URL |
|---|---|
| Company Register | http://localhost:5173/register |
| Company Login    | http://localhost:5173/login |
| Admin Panel      | http://localhost:5173/admin |
| Admin Login      | http://localhost:5173/admin/login |
| API Health       | http://localhost:5000/health |

---

## Deployment

### Step 1 — Push to GitHub

```bash
# Inside Saas-platform/
git init                        # if not already a git repo
git add .
git commit -m "Initial commit — PrintMixBox v2"
git remote add origin https://github.com/BuildMyWeb-Tech/Saas-platform.git
git branch -M main
git push -u origin main
```

---

### Step 2 — MongoDB Atlas

1. Go to **atlas.mongodb.com** → Create free cluster (M0)
2. **Database Access** → Add user → username + auto-password → copy it
3. **Network Access** → Add IP → `0.0.0.0/0` (allow all for Render)
4. **Connect** → Drivers → Copy connection string
5. Replace `<password>` with your DB user password
6. Final string looks like:
   ```
   mongodb+srv://printuser:MyPass123@cluster0.ab1cd.mongodb.net/printmixbox?retryWrites=true&w=majority
   ```

---

### Step 3 — Gmail App Password (SMTP)

1. **Enable 2-Step Verification** on your Google account
   → myaccount.google.com → Security → 2-Step Verification
2. **Create App Password**
   → myaccount.google.com → Security → App passwords
   → App: "Mail" → Device: "Other" → name it "PrintMixBox"
   → Copy the **16-character code** (e.g. `abcd efgh ijkl mnop`)
3. Use it as `EMAIL_PASS` — keep the spaces or remove them, both work

> For Google Workspace (business email) the steps are identical — just use your workspace account.

---

### Step 4 — Deploy Backend to Render

1. Go to **render.com** → Sign in → **New** → **Web Service**
2. **Connect GitHub** → select `BuildMyWeb-Tech/Saas-platform`
3. Settings:
   | Field | Value |
   |---|---|
   | Name | `printmixbox-api` |
   | Root Directory | `backend` |
   | Environment | `Node` |
   | Build Command | `npm install` |
   | Start Command | `node server.js` |
   | Plan | Free (upgrade for production) |
4. **Environment Variables** — add each one:

   | Key | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `PORT` | `10000` |
   | `MONGO_URI` | your Atlas connection string |
   | `JWT_SECRET` | click "Generate" → 32+ chars |
   | `JWT_ADMIN_SECRET` | click "Generate" → different value |
   | `JWT_EXPIRES_IN` | `7d` |
   | `EMAIL_HOST` | `smtp.gmail.com` |
   | `EMAIL_PORT` | `587` |
   | `EMAIL_USER` | `you@gmail.com` |
   | `EMAIL_PASS` | `abcd efgh ijkl mnop` (App Password) |
   | `EMAIL_FROM` | `PrintMixBox <you@gmail.com>` |
   | `FRONTEND_URL` | `https://saas-platform-buildmyweb.vercel.app` *(set after Vercel deploy)* |

5. Click **Create Web Service** → wait ~3 min for first deploy
6. Note your URL: `https://printmixbox-api.onrender.com`
7. Test: visit `https://printmixbox-api.onrender.com/health`

> ⚠️ Free Render instances spin down after 15 min inactivity. Upgrade to **Starter ($7/mo)** for always-on.

---

### Step 5 — Seed Admin on Render

After backend deploys, run the seed script **once** via Render Shell:

1. Render Dashboard → your service → **Shell** tab
2. Run:
   ```bash
   node scripts/seedAdmin.js
   ```
3. Output:
   ```
   ✅ Admin account created:
       Username : superadmin
       Password : Admin@1234
   ```
4. **Change this password immediately** after first login.

---

### Step 6 — Deploy Frontend to Vercel

1. Go to **vercel.com** → New Project
2. Import from GitHub → `BuildMyWeb-Tech/Saas-platform`
3. **Root Directory** → set to `frontend`
4. Framework: **Vite** (auto-detected)
5. **Environment Variables**:

   | Key | Value |
   |---|---|
   | `VITE_API_URL` | `https://printmixbox-api.onrender.com/api` |

6. Click **Deploy** → wait ~1 min
7. Note your URL: `https://saas-platform-buildmyweb.vercel.app`

---

### Step 7 — Update Backend CORS with Vercel URL

1. Render Dashboard → `printmixbox-api` → Environment
2. Update `FRONTEND_URL` to: `https://saas-platform-buildmyweb.vercel.app`
3. **Manual Deploy** → trigger redeploy

---

### Step 8 — Verify Everything Works

```
✅ https://printmixbox-api.onrender.com/health       → JSON response
✅ https://saas-platform-buildmyweb.vercel.app        → Register page
✅ https://saas-platform-buildmyweb.vercel.app/admin  → Admin panel
```

Test the full flow:
1. Register a company at `/register`
2. Log into admin at `/admin` (superadmin / Admin@1234)
3. Approve the company → check that email arrives
4. Log in as the company at `/login`
5. Change password → see dashboard

---

## Environment Variables Reference

### Backend (Render)

| Variable | Required | Description |
|---|---|---|
| `NODE_ENV` | ✅ | `production` |
| `PORT` | ✅ | `10000` |
| `MONGO_URI` | ✅ | MongoDB Atlas connection string |
| `JWT_SECRET` | ✅ | 64+ char random string |
| `JWT_ADMIN_SECRET` | ✅ | Different 64+ char random string |
| `JWT_EXPIRES_IN` | ✅ | `7d` |
| `EMAIL_HOST` | ✅ | `smtp.gmail.com` |
| `EMAIL_PORT` | ✅ | `587` |
| `EMAIL_USER` | ✅ | Gmail address |
| `EMAIL_PASS` | ✅ | Gmail App Password |
| `EMAIL_FROM` | ✅ | Display name + email |
| `FRONTEND_URL` | ✅ | Vercel URL |
| `EXTRA_ORIGINS` | ➖ | Extra CORS origins, comma-separated |
| `ADMIN_EMAIL` | ➖ | Admin account email for seeding |

### Frontend (Vercel)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | ✅ | Render backend URL + `/api` |

---

## API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/health` | Public | Health check |
| POST | `/api/auth/register` | Public | Register company (name, GST, email) |
| POST | `/api/auth/login` | Public | Login with emailed credentials |
| POST | `/api/auth/change-password` | 🔒 JWT | Change temporary password |
| GET | `/api/auth/me` | 🔒 JWT | Get current user |
| POST | `/api/admin/auth/login` | Public | Admin login |
| GET | `/api/admin/stats` | 🔒 Admin | Dashboard stats |
| GET | `/api/admin/companies` | 🔒 Admin | List companies |
| GET | `/api/admin/companies/:id` | 🔒 Admin | Company detail |
| POST | `/api/admin/companies/:id/approve` | 🔒 Admin | Approve + email credentials |
| POST | `/api/admin/companies/:id/reject` | 🔒 Admin | Reject application |
| POST | `/api/admin/companies/:id/resend-credentials` | 🔒 Admin | Resend new credentials |

---

## Project Structure

```
Saas-platform/
├── .gitignore
├── README.md
│
├── backend/
│   ├── config/db.js
│   ├── controllers/
│   │   ├── authController.js     # register · login · changePassword
│   │   └── adminController.js    # adminLogin · approve · reject · resend
│   ├── middleware/
│   │   ├── authMiddleware.js     # protect · adminProtect · authorize
│   │   └── errorMiddleware.js
│   ├── models/
│   │   ├── Company.js            # status: pending|approved|rejected
│   │   ├── User.js               # isTemporaryPassword flag
│   │   └── AdminUser.js          # separate admin accounts
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── adminRoutes.js
│   ├── scripts/
│   │   └── seedAdmin.js          # npm run seed:admin
│   ├── services/
│   │   └── emailService.js       # credentials email HTML template
│   ├── utils/
│   │   ├── generateCompanyCode.js
│   │   └── generateCredentials.js
│   ├── server.js
│   ├── package.json
│   ├── render.yaml
│   └── .env.example
│
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── Register.jsx        # 3-field form (name, GST, email)
    │   │   ├── Login.jsx           # uses emailed credentials
    │   │   ├── Dashboard.jsx
    │   │   ├── ChangePassword.jsx  # forced on first login
    │   │   └── admin/
    │   │       ├── AdminLogin.jsx  # /admin/login
    │   │       ├── AdminLayout.jsx # sidebar layout
    │   │       ├── AdminDashboard.jsx
    │   │       ├── Companies.jsx   # list + approve/reject/resend
    │   │       └── CompanyDetail.jsx
    │   ├── context/
    │   │   ├── AuthContext.jsx
    │   │   └── AdminAuthContext.jsx
    │   ├── services/
    │   │   ├── authService.js
    │   │   └── adminService.js
    │   ├── components/
    │   │   └── RouteGuards.jsx
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── vercel.json
    └── .env.example
```

---

## Common Issues

**CORS error in production**
→ Make sure `FRONTEND_URL` on Render exactly matches your Vercel URL (no trailing slash)

**Emails not sending**
→ Check `EMAIL_PASS` is the App Password (16 chars), not your Google account password
→ Make sure 2-Step Verification is enabled on the Gmail account
→ Check Render logs: `node scripts/seedAdmin.js` → look for SMTP output

**Render free tier cold starts**
→ First request after 15 min inactivity takes ~30s. Use UptimeRobot to ping `/health` every 14 min.

**MongoDB connection refused**
→ Go to Atlas → Network Access → confirm `0.0.0.0/0` is allowed
→ Check the MONGO_URI has the correct username/password

**Admin panel shows blank**
→ Run `node scripts/seedAdmin.js` once via Render Shell
→ Default: superadmin / Admin@1234

**Vercel 404 on page refresh**
→ Ensure `vercel.json` exists in the `frontend/` folder with the rewrite rule

---

## Security Notes

- JWT secrets are different for company users and admins
- Passwords hashed with bcrypt (12 rounds)
- Company credentials never stored in plaintext after generation
- Temporary password flag forces change on first login
- Rate limiting on all auth endpoints
- Admin panel uses separate JWT with 8h expiry