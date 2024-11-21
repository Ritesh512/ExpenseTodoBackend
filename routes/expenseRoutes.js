const express = require('express');
const router = express.Router();
const {
  addExpense,
  getAllExpenses,
  getExpenseById,
  getExpensesByDate,
  deleteExpense,
  updateExpense,
  getExpensesForTwoMonths,
  getExpensesByMonth ,
  getCategoryBreakdown,
  getSpendingTrends,
  getTopExpenses,
  getLowestExpenses,
  getExpenseReport,
} = require('../controller/expenseController');

// Add Expense
router.post('/', addExpense);

// Get All Expenses
router.get('/', getAllExpenses);

// Get Expense By ID
router.get('/:expenseId', getExpenseById);

// Get Expenses By Date Range
router.get('/filter/date', getExpensesByDate);

// Delete Expense
router.delete('/:expenseId', deleteExpense);

// Update Expense
router.put('/:expenseId', updateExpense);

router.get('/filter/two-months', getExpensesForTwoMonths);

router.get('/filter/month', getExpensesByMonth);

router.get("/analysis/category-breakdown", getCategoryBreakdown);
router.get("/analysis/spending-trends", getSpendingTrends);
router.get("/analysis/top-expenses", getTopExpenses);
router.get("/analysis/low-expenses", getLowestExpenses);

router.get('/dashboard/report', getExpenseReport);

module.exports = router;
