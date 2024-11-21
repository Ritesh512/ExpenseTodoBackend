const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  expenseName: {
    type: String,
    required: true,
    trim: true,
  },
  expenseType: {
    type: String,
    enum: ['Custom', 'Retail', 'Electronic', 'Food', 'Travel', 'Utilities', 'Other'], // Add more as needed
    required: true,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  issuedTo: {
    type: String,
    required: true,
    trim: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
},{ timestamps: true });

const Expense = mongoose.model('Expense', expenseSchema);

module.exports = Expense;
