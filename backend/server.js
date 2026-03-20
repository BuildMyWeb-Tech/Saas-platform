// server.js
require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');

const connectDB  = require('./config/db');
const authRoutes  = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const { verifyEmailConnection }  = require('./services/emailService');

const app  = express();
const PORT = process.env.PORT || 5000;

connectDB();

// Security
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

const allowedOrigins = [
  process.env.FRONTEND_URL  || 'http://localhost:5173',
  process.env.ADMIN_URL     || 'http://localhost:5173',
  'http://localhost:3000',
  'https://printmixbox.vercel.app',
];
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials:    true,
  methods:        ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));

app.use(rateLimit({ windowMs: 15*60*1000, max: 200, standardHeaders: true, legacyHeaders: false }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

// Health
app.get('/health', (_, res) => res.json({ success: true, message: 'PrintMixBox API running', ts: new Date() }));

// Routes
app.use('/api/auth',  authRoutes);
app.use('/api/admin', adminRoutes);

// Errors
app.use(notFound);
app.use(errorHandler);

const server = app.listen(PORT, async () => {
  console.log(`\n🖨️  PrintMixBox API  →  http://localhost:${PORT}  [${process.env.NODE_ENV || 'development'}]\n`);
  await verifyEmailConnection();
});

process.on('SIGTERM', () => server.close(() => process.exit(0)));
process.on('SIGINT',  () => server.close(() => process.exit(0)));
process.on('unhandledRejection', err => { console.error(err); server.close(() => process.exit(1)); });

module.exports = app;