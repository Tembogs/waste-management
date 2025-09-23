import express from 'express';
import dotenv from 'dotenv';
import setUpMiddlewares from './middlerware/index.js';
import userRoutes from './routes/user.routes.js';

import wasteRoutes from './routes/waste.routes.js';

const app = express();
dotenv.config();
setUpMiddlewares(app);

app.use('/api/users', userRoutes);
app.use('/api/waste', wasteRoutes);

app.get('/', (req, res) => {
  res.json({
    message: 'API is running...',
    timestemp: new Date().toString()
  })

});

export default app;