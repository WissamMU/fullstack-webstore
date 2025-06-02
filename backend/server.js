import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/auth.route.js';
import productRoutes from './routes/product.route.js';

import { connectDB } from './lib/db.js';

const app = express();
dotenv.config();

const PORT = process.env.PORT || 1313;

// this middleware is used to parse the incoming request body as JSON
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser()); // this middleware is used to parse cookies from the request

// route
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes)


app.listen(PORT, () => {
  console.log('Server is running on port : ' + PORT);

  connectDB();
});
