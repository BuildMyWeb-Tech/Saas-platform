# 🖨️ PrintMixBox — IoT Printing & Box Branding SaaS Platform

> **Production-ready MERN stack SaaS platform** for multi-tenant IoT printer management, box branding, and print job orchestration.

---

## Architecture Overview

```
React Frontend (Vercel)
        ↓
   REST API (HTTPS)
        ↓
Node.js + Express Backend (Render / AWS)
        ↓
   MongoDB Atlas

Future Extension:
IoT Printers → Backend API → Job Queue
```

---

## Directory Structure

```
printing-mix-box-system/
│
├── backend/
│   ├── config/
│   │   └── db.js                    # MongoDB Atlas connection
│   ├── controllers/
│   │   └── authController.js        # register · verify · login · getMe
│   ├── models/
│   │   ├── Company.js               # Company collection schema
│   │   ├── User.js                  # User collection schema
│   │   └── VerificationCode.js      # OTP code schema
│   ├── routes/
│   │   └── authRoutes.js            # Auth endpoints + validation
│   ├── middleware/
│   │   ├── authMiddleware.js        # JWT protect · authorize · requireSameCompany
│   │   └── errorMiddleware.js       # Global error handler · 404 catcher
│   ├── services/
│   │   └── emailService.js          # Nodemailer SMTP · HTML email templates
│   ├── utils/
│   │   └── generateCompanyCode.js   # Unique COMP-XXXX generator
│   ├── server.js                    # Express app entry point
│   ├── render.yaml                  # Render deployment config
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Register.jsx         # Company registration form
│   │   │   ├── Verify.jsx           # OTP verification with digit inputs
│   │   │   ├── Login.jsx            # Login with company code
│   │   │   └── Dashboard.jsx        # Post-login home
│   │   ├── components/
│   │   │   └── PrivateRoute.jsx     # Auth-guarded route wrapper
│   │   ├── services/
│   │   │   └── authService.js       # Axios instance + all auth API calls
│   │   ├── context/
│   │   │   └── AuthContext.js       # Global auth state (React Context)
│   │   ├── App.js                   # Root + React Router config
│   │   ├── index.js                 # ReactDOM entry point
│   │   └── index.css                # Full design system (CSS variables)
│   ├── vercel.json                  # Vercel deployment config
│   └── package.json
│
├── PrintMixBox.postman_collection.json
├── .gitignore
└── README.md
```

---

## Quick Start (Local Development)

### Prerequisites
- Node.js >= 18.x
- MongoDB Atlas account (free tier works)
- Gmail account (for SMTP) or SendGrid / Mailgun

### 1. Clone & Install

```bash
# Clone the repository
git clone https://github.com/yourorg/printing-mix-box-system.git
cd printing-mix-box-system

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Configure Backend Environment

```bash
cd backend
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/printmixbox
JWT_SECRET=your_very_long_random_secret_here
JWT_EXPIRES_IN=7d
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=you@gmail.com
EMAIL_PASS=your_app_password   # Use Gmail App Password, not your real password
EMAIL_FROM="PrintMixBox <noreply@printmixbox.io>"
FRONTEND_URL=http://localhost:3000
```

> **Gmail tip**: Enable 2FA → Google Account → Security → App Passwords → Generate one for "Mail"

### 3. Configure Frontend Environment

```bash
cd frontend
cp .env.example .env
```

Edit `.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

### 4. Start Development Servers

Terminal 1 (backend):
```bash
cd backend
npm run dev
# → http://localhost:5000
```

Terminal 2 (frontend):
```bash
cd frontend
npm start
# → http://localhost:3000
```

---

## API Reference

Base URL: `http://localhost:5000/api`

| Method | Endpoint                       | Auth     | Description                       |
|--------|--------------------------------|----------|-----------------------------------|
| GET    | `/health`                      | Public   | Server health check               |
| POST   | `/auth/register`               | Public   | Register company + owner user     |
| POST   | `/auth/verify`                 | Public   | Verify email with OTP             |
| POST   | `/auth/login`                  | Public   | Login → returns JWT               |
| POST   | `/auth/resend-verification`    | Public   | Resend OTP to email               |
| GET    | `/auth/me`                     | 🔒 JWT  | Get current user profile          |

### Registration
```http
POST /api/auth/register
Content-Type: application/json

{
  "companyName": "Acme Packaging Pvt Ltd",
  "gstNumber": "27AAPFU0939F1ZV",
  "email": "admin@acme.com",
  "username": "acme_admin",
  "password": "Secure@123"
}
```

**Response** `201`:
```json
{
  "success": true,
  "message": "Company registered. Check email for verification code.",
  "data": {
    "companyCode": "COMP-4829",
    "companyName": "Acme Packaging Pvt Ltd",
    "email": "admin@acme.com"
  }
}
```

### Verify
```http
POST /api/auth/verify
Content-Type: application/json

{
  "companyCode": "COMP-4829",
  "verificationCode": "847291"
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "companyCode": "COMP-4829",
  "username": "acme_admin",
  "password": "Secure@123"
}
```

**Response** `200`:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { "id": "...", "username": "acme_admin", "role": "owner" },
    "company": { "id": "...", "companyName": "Acme Packaging Pvt Ltd", "companyCode": "COMP-4829" }
  }
}
```

---

## Security Features

| Feature               | Implementation                          |
|-----------------------|-----------------------------------------|
| Password hashing      | bcrypt (12 salt rounds)                 |
| Authentication        | JWT (HS256, 7d expiry, issuer claim)    |
| Rate limiting         | express-rate-limit (per endpoint)       |
| Input validation      | express-validator on all routes         |
| Secure headers        | helmet.js                               |
| CORS                  | Allowlist-based origin checking         |
| OTP expiry            | MongoDB TTL index (30 minutes)          |
| Attempt throttling    | 5 max OTP attempts per code             |
| Company isolation     | companyId scoped on all resources       |
| Password policy       | Min 8 chars, 1 uppercase, 1 number      |

---

## Database Schema

### Company
| Field         | Type    | Notes                              |
|---------------|---------|------------------------------------|
| companyName   | String  | 2–100 chars                        |
| gstNumber     | String  | Unique, Indian GST format          |
| email         | String  | Unique, lowercase                  |
| companyCode   | String  | Unique, auto-generated (COMP-XXXX) |
| isVerified    | Boolean | Default: false                     |
| plan          | String  | free / starter / professional      |
| maxDevices    | Number  | IoT device quota                   |

### User
| Field         | Type       | Notes                              |
|---------------|------------|------------------------------------|
| companyId     | ObjectId   | Ref: Company                       |
| username      | String     | Unique per company                 |
| email         | String     | Index                              |
| passwordHash  | String     | bcrypt, never returned in queries  |
| role          | String     | owner / admin / operator / viewer  |
| lastLogin     | Date       | Updated on each login              |

### VerificationCode
| Field             | Type       | Notes                          |
|-------------------|------------|--------------------------------|
| companyId         | ObjectId   | Ref: Company                   |
| verificationCode  | String     | 6-digit numeric OTP            |
| expiresAt         | Date       | TTL index, 30 min expiry       |
| isUsed            | Boolean    | One-time use                   |
| attempts          | Number     | Max 5 failed attempts          |

---

## Deployment

### Backend → Render

1. Push code to GitHub
2. Create new **Web Service** on [render.com](https://render.com)
3. Connect repository → select `backend` folder
4. Build: `npm install`, Start: `node server.js`
5. Add all environment variables from `.env.example`
6. Deploy → get URL: `https://printmixbox-api.onrender.com`

### Frontend → Vercel

1. Create project on [vercel.com](https://vercel.com)
2. Connect repository → set **Root Directory** to `frontend`
3. Add environment variable:
   ```
   REACT_APP_API_URL = https://printmixbox-api.onrender.com/api
   ```
4. Deploy → get URL: `https://printmixbox.vercel.app`

### Database → MongoDB Atlas

1. Create free cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create database user
3. Whitelist `0.0.0.0/0` (or Render's IP range)
4. Copy connection string → set as `MONGO_URI`

---

## API Testing (Postman)

Import `PrintMixBox.postman_collection.json` into Postman.

The collection has 5 pre-built requests with auto-scripts that:
- Capture `companyCode` after registration
- Save the JWT token after login
- Use both automatically in subsequent requests

---

## Future IoT Extension

When building printer device support, add these models:

```js
// models/Device.js (future)
{
  deviceId:    String,   // Hardware serial number
  companyId:   ObjectId, // Tenant isolation
  deviceToken: String,   // Hashed IoT auth token
  location:    String,
  status:      String,   // online / offline / busy
  lastPing:    Date,
}

// models/PrintJob.js (future)
{
  jobId:      String,
  companyId:  ObjectId,
  printerId:  ObjectId,
  designId:   ObjectId,
  status:     String,    // queued / printing / done / failed
  priority:   Number,
  createdAt:  Date,
}

// models/BrandTemplate.js (future)
{
  companyId:   ObjectId,
  name:        String,
  logoUrl:     String,
  brandColor:  String,
  boxDesignUrl: String,
}
```

IoT devices authenticate via:
```http
POST /api/devices/auth
{ "companyCode": "COMP-4829", "deviceToken": "device_secret" }
```

Then poll for jobs:
```http
GET /api/jobs/next?deviceId=PRINTER-001
Authorization: Bearer <device_jwt>
```

---

## Tech Stack

| Layer      | Technology           | Version |
|------------|----------------------|---------|
| Frontend   | React                | 18.x    |
| Routing    | React Router DOM     | 6.x     |
| HTTP Client| Axios                | 1.x     |
| Backend    | Node.js + Express    | 18.x    |
| Database   | MongoDB + Mongoose   | 8.x     |
| Auth       | JWT (jsonwebtoken)   | 9.x     |
| Password   | bcryptjs             | 2.x     |
| Email      | Nodemailer           | 6.x     |
| Validation | express-validator    | 7.x     |
| Security   | helmet + cors        | Latest  |
| Rate Limit | express-rate-limit   | 7.x     |

---

## License

MIT © PrintMixBox
29ABCDE1234F1Z2
Connected to MongoDB
✅  Admin account created:
    Username : superadmin
    Password : Admin@1234


Vdart: 
COMP-3523
vdart
KCTech@123