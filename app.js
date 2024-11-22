import express from 'express';
import cors from 'cors';
import path from 'path';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import './models/Config.js';
import userRoutes from './routes/userRoutes.js';
import todoRoutes from './routes/todoRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import auth from './middleware/auth.js';

const app = express();

app.use(express.json());
app.use(express.static(path.resolve('dist')));
app.use(cors());

// User routes
app.use('/api/users', userRoutes); 

// Todo list routes
app.use('/api/users/todo', auth, todoRoutes);

// Expense routes
app.use('/api/expenses', auth, expenseRoutes);

app.get('/api/health', (req, res) => {
  res.json({ message: 'Server is running' });
});

app.get('*', (req, res) =>
  res.sendFile(path.resolve('dist', 'index.html'))
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
