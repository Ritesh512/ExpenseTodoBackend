// controllers/userController.js
const User = require('../models/User'); // Import the User model
const TodoList = require('../models/TodoList');
const Expense = require('../models/Expense');

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto'); // For generating password reset tokens


// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET; // Replace with a secure secret key

// User Sign Up
exports.signup = async (req, res) => {
  const { username, email, password, role } = req.body;

  try {
    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    const userRole = role || 'user';

    // Create a new user
    const newUser = new User({ username, email, password, role: userRole });

    // Save the user to the database
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Error during signup:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// User Login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email' });
    }

    // Check if the password is correct
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid  password' });
    }

    const loginUser = {
        userId: user._id,
        role: user.role,
        username: user.username,
        email: user.email
    }
    

    // Generate a JWT token
    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, {
      expiresIn: '1h' // Token expiration time
    });

    res.status(200).json({ message: 'Login successful', token, loginUser });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Forgot Password
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate a password reset token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Set token and expiration on the user model (you may also use a separate password reset model)
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour expiration

    // Save the user
    await user.save();

    // Send the reset token to the user (via email in a real application)
    res.status(200).json({ message: 'Password reset link sent', resetToken });
  } catch (error) {
    console.error('Error during password reset:', error);
    res.status(500).json({ message: 'Server error' });
  }
};




exports.getUserDashboard = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Fetch user data
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Fetch to-do statistics
    const todos = await TodoList.find({ userId });
    const todoPendingCount = todos.reduce(
      (count, list) => count + list.tasks.filter(task => !task.completed).length,
      0
    );
    const todoDoneCount = todos.reduce(
      (count, list) => count + list.tasks.filter(task => task.completed).length,
      0
    );

    // Fetch expense statistics
    const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const currentMonthExpenses = await Expense.find({
      userId,
      date: { $gte: currentMonthStart }
    });
    const lastMonthStart = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
    const lastMonthEnd = currentMonthStart;
    const lastMonthExpenses = await Expense.find({
      userId,
      date: { $gte: lastMonthStart, $lt: lastMonthEnd }
    });

    const currentMonthExpense = currentMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const lastMonthExpense = lastMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const topExpense = currentMonthExpenses.reduce((top, exp) =>
      exp.amount > (top?.amount || 0) ? exp : top, null
    );

    res.json({
      username: user.username,
      email: user.email,
      todo_pending_count: todoPendingCount,
      todo_done_count: todoDoneCount,
      current_month_expense: currentMonthExpense,
      last_month_expense: lastMonthExpense,
      top_expense: topExpense || null,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


exports.changePassword = async (req, res) => {
  const { password, newPassword } = req.body;
  const userId = req.userId; // Assuming userId is coming from a token

  if (!password || !newPassword || !userId) {
    return res.status(400).json({ message: 'Please provide all required fields' });
  }

  try {
    const user = await User.findOne({ _id: userId });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect current password' });
    }

    if (newPassword === password) {
      return res.status(400).json({ message: 'New password must be different from current password' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();

    // Regenerate JWT token
    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });

    return res.status(200).json({ message: 'Password updated successfully', token });
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};




