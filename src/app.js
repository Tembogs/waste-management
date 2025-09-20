import express from 'express';
import dotenv from 'dotenv';
import setUpMiddlewares from './middlerware/index.js';
import userRoutes from './routes/user.routes.js';

const app = express();
dotenv.config();
setUpMiddlewares(app);

app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
  res.json({
    message: 'API is running...',
    timestemp: new Date().toString()
  })

});

export default app;