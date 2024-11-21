const express = require("express");
const cors = require("cors");
require("./models/Config");
const userRoutes = require('./routes/userRoutes');
const todoRoutes = require('./routes/todoRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const auth = require('./middleware/auth');

const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());
app.use(cors());

//user router
app.use('/api/users', userRoutes); 

//todo list
app.use('/api/users/todo',auth, todoRoutes)

//Expense routes
app.use('/api/expenses',auth, expenseRoutes);


// app.use("/api/dashboard",dashboardRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, function (req, res) {
  console.log(`Server listed on port ${PORT}`);
});