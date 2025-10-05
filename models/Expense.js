import mongoose from 'mongoose';

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
    required: true,
    trim: true,
    set: (val) => {
      if (!val) return val;
      // Capitalize first letter, lowercase rest
      return val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
    }
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

export default Expense;
