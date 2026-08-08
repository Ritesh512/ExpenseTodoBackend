import express from 'express';
import {
  addExpense,
  getAllExpenses,
  getExpenseById,
  getExpensesByDate,
  deleteExpense,
  updateExpense,
  getExpensesForTwoMonths,
  getExpensesByMonth,
  getCategoryBreakdown,
  getSpendingTrends,
  getTopExpenses,
  getLowestExpenses,
  getExpenseReport,
  getSummaryStats,
  getExpenseCategories,
  searchExpensesByCategoryAndDateRange,
} from '../controller/expenseController.js';

const router = express.Router();


// Add Expense
router.post('/', addExpense);

// Get All Categories
router.get('/categories', getExpenseCategories);

// Search Expenses by Category and Date Range
router.get('/search', searchExpensesByCategoryAndDateRange);

// Get All Expenses
router.get('/', getAllExpenses);

// Get Expenses By Date Range
router.get('/filter/date', getExpensesByDate);

// Get Expense By ID
router.get('/:expenseId', getExpenseById);

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
router.get("/analysis/summary-stats", getSummaryStats);

router.get('/dashboard/report', getExpenseReport);

export default router;

