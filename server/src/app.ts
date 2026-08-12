import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';

import authRouter     from './routes/auth';
import userRouter     from './routes/user';
import habitsRouter   from './routes/habits';
import progressRouter from './routes/progress';

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL ?? 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

app.use('/api/auth',     authRouter);
app.use('/api/user',     userRouter);
app.use('/api/habits',   habitsRouter);
app.use('/api/progress', progressRouter);

app.get('/',           (_req, res) => res.json({ name: 'Warrior Habits API', version: '1.0.0' }));
app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
