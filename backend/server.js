import cookieParser from 'cookie-parser';
import cors from 'cors';
import { configDotenv } from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import { connectDB } from './config/mongoDb.js';
import { errorHandler } from './middleware/errorhandler.js';
import authRoutes from './routes/auth.routes.js';
import creditRoutes from './routes/credits.routes.js';
import planRoutes from './routes/plans.routes.js';
import userRoutes from './routes/user.routes.js';

const app = express();
configDotenv()
// ─── Middleware ───────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// ─── Routes ──────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/credits', creditRoutes);

// ─── Global Error Handler ────────────────────────────
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB().then(() => app.listen(PORT, () => console.log(`Server running on port ${PORT}`)));

export default app;