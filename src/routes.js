import express from 'express';
import sampleRoutes from './routes/sample.js';
import userRoutes from './routes/user.js';

export default express
  .Router()
  .use('/sample', sampleRoutes)
  .use('/example', sampleRoutes)
  .use('/user', userRoutes);
