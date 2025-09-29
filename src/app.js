import express from 'express';
import dotenv from 'dotenv';
import setUpMiddlewares from './middlerware/index.js';
import userRoutes from './routes/user.routes.js';
import wasteRoutes from './routes/waste.routes.js';
import authRouter from './routes/auth.routes.js';
import recycleRoutes from './routes/recycle.routes.js';
import illegalDumpRoutes from './routes/illegalDump.routes.js';

const app = express();
dotenv.config();
setUpMiddlewares(app);

app.use('/api/users', userRoutes);
app.use('/api/waste', wasteRoutes);
app.use('/api/auth', authRouter);
app.use('/api/recycle', recycleRoutes);
app.use('/api/dump', illegalDumpRoutes);

app.get('/', (req, res) => {
  res.json({
    message: 'API is running...',
    timestemp: new Date().toString()
  })

});

export default app;