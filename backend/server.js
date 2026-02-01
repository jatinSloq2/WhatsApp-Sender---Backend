import dotenv from 'dotenv';
dotenv.config();

import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import { connectDB } from './config/mongoDb.js';
import { errorHandler } from './middleware/errorhandler.js';

import authRoutes from './routes/auth.routes.js';
import creditRoutes from './routes/credits.routes.js';
import planRoutes from './routes/plans.routes.js';
import userRoutes from './routes/user.routes.js';

const app = express();

// ─── Core Middleware ─────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// ✅ MORGAN LOGGER (log every request)
app.use(
    morgan(':date[iso] :method :url → :status (:response-time ms)')
);

// ─── Routes ──────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/credits', creditRoutes);

// ─── Error Handler ───────────────────────────────────
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB().then(() =>
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
);

export default app;
