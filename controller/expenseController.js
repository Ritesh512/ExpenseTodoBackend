import Expense from '../models/Expense.js';
import mongoose from 'mongoose';
// Add Expense
export const addExpense = async (req, res) => {
  try {
    req.body.userId = req.userId;

    // sanitize expenseType in controller too (extra safety)
    if (req.body.expenseType) {
      req.body.expenseType =
        req.body.expenseType.charAt(0).toUpperCase() +
        req.body.expenseType.slice(1).toLowerCase();
    }

    const expense = new Expense(req.body);
    const savedExpense = await expense.save();
    res.status(201).json(savedExpense);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get All Expenses
export const getAllExpenses = async (req, res) => {
  try {
    const userId = req.userId;
    const expenses = await Expense.find({ userId: userId });
    res.status(200).json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Expense By ID
export const getExpenseById = async (req, res) => {
  const { expenseId } = req.params;
  const userId = req.userId; // Get the user ID from the middleware
  try {
    const expense = await Expense.findOne({ _id: expenseId, userId: userId });
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    res.status(200).json(expense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const parseDate = (value) => {
  if (!value || typeof value !== 'string') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const endOfDay = (date) => {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
};

const normalizeCategory = (category) => {
  const trimmed = category.trim();
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
};

// Get Expenses By Date Range
export const getExpensesByDate = async (req, res) => {
  const { startDate, endDate } = req.query;
  const userId = req.userId;
  try {
    const expenses = await Expense.find({
      userId: userId,
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    });
    res.status(200).json(expenses);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all unique categories for the current user
export const getExpenseCategories = async (req, res) => {
  try {
    const userId = req.userId;
    const categories = await Expense.distinct('expenseType', {
      userId: new mongoose.Types.ObjectId(userId),
      expenseType: { $exists: true, $nin: [null, ''] },
    });

    const uniqueCategories = categories
      .filter((category) => typeof category === 'string' && category.trim() !== '')
      .map((category) => category.trim())
      .sort((a, b) => a.localeCompare(b));

    res.status(200).json({ categories: uniqueCategories });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Search expenses by category and inclusive date range
export const searchExpensesByCategoryAndDateRange = async (req, res) => {
  const { category, startDate, endDate } = req.query;
  const userId = req.userId;

  if (!category || !category.trim()) {
    return res.status(400).json({ message: 'Category is required.' });
  }
  if (!startDate) {
    return res.status(400).json({ message: 'Start date is required.' });
  }
  if (!endDate) {
    return res.status(400).json({ message: 'End date is required.' });
  }

  const parsedStartDate = parseDate(startDate);
  const parsedEndDate = parseDate(endDate);

  if (!parsedStartDate || !parsedEndDate) {
    return res.status(400).json({ message: 'Invalid date format.' });
  }

  const normalizedCategory = normalizeCategory(category);
  const start = new Date(parsedStartDate);
  start.setHours(0, 0, 0, 0);
  const end = endOfDay(parsedEndDate);

  if (start > end) {
    return res.status(400).json({ message: 'startDate must be before or equal to endDate.' });
  }

  try {
    const filter = {
      userId: new mongoose.Types.ObjectId(userId),
      expenseType: normalizedCategory,
      date: { $gte: start, $lte: end },
    };

    const aggregation = await Expense.aggregate([
      { $match: filter },
      { $sort: { date: -1 } },
      {
        $facet: {
          expenses: [
            {
              $project: {
                _id: 1,
                expenseName: 1,
                expenseType: 1,
                issuedTo: 1,
                amount: 1,
                date: 1,
              },
            },
          ],
          summary: [
            {
              $group: {
                _id: null,
                totalAmount: { $sum: '$amount' },
                expenseCount: { $sum: 1 },
                averageExpense: { $avg: '$amount' },
                highestExpense: { $max: '$amount' },
              },
            },
          ],
        },
      },
    ]);

    const expenses = aggregation[0]?.expenses || [];
    const summaryData = aggregation[0]?.summary[0] || null;
    const summary = summaryData
      ? {
        totalAmount: summaryData.totalAmount,
        expenseCount: summaryData.expenseCount,
        averageExpense: parseFloat(summaryData.averageExpense.toFixed(2)),
        highestExpense: summaryData.highestExpense,
      }
      : {
        totalAmount: 0,
        expenseCount: 0,
        averageExpense: 0,
        highestExpense: 0,
      };

    res.status(200).json({ expenses, summary });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete Expense
export const deleteExpense = async (req, res) => {
  const { expenseId } = req.params;
  const userId = req.userId; // Get the user ID from the middleware
  try {
    const expense = await Expense.findByIdAndDelete({ _id: expenseId, userId: userId });
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    res.status(200).json({ message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Expense
export const updateExpense = async (req, res) => {
  const { expenseId } = req.params;
  const userId = req.userId;

  try {
    if (req.body.expenseType) {
      req.body.expenseType =
        req.body.expenseType.charAt(0).toUpperCase() +
        req.body.expenseType.slice(1).toLowerCase();
    }

    const expense = await Expense.findOneAndUpdate(
      { _id: expenseId, userId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    res.status(200).json(expense);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


export const getExpensesForTwoMonths = async (req, res) => {
  const { month1, year1, month2, year2 } = req.query;
  const userId = req.userId;

  if (!month1 || !year1 || !month2 || !year2) {
    return res.status(400).json({ message: "Missing required query parameters" });
  }

  try {
    // Parse dates for the first month
    const startOfMonth1 = new Date(year1, month1 - 1, 1); // Start of month1
    const endOfMonth1 = new Date(year1, month1, 0, 23, 59, 59); // End of month1

    // Parse dates for the second month
    const startOfMonth2 = new Date(year2, month2 - 1, 1); // Start of month2
    const endOfMonth2 = new Date(year2, month2, 0, 23, 59, 59); // End of month2

    // Fetch expenses for both months
    const expensesMonth1 = await Expense.find({
      userId: userId,
      date: { $gte: startOfMonth1, $lte: endOfMonth1 },
    });

    const expensesMonth2 = await Expense.find({
      userId: userId,
      date: { $gte: startOfMonth2, $lte: endOfMonth2 },
    });

    // Helper function to group expenses by type and sum amounts
    const aggregateExpenses = (expenses) => {
      return expenses.reduce((acc, expense) => {
        const { expenseType, amount } = expense;
        const existing = acc.find((item) => item.expenseType === expenseType);
        if (existing) {
          existing.amount += amount;
        } else {
          acc.push({ expenseType, amount });
        }
        return acc;
      }, []);
    };

    // Aggregate data for both months
    const aggregatedMonth1 = aggregateExpenses(expensesMonth1);
    const aggregatedMonth2 = aggregateExpenses(expensesMonth2);

    // Return the aggregated data
    res.status(200).json({
      mon1: aggregatedMonth1,
      mon2: aggregatedMonth2,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// data based on the mon and year
export const getExpensesByMonth = async (req, res) => {
  const { month, year } = req.query;
  const userId = req.userId;

  if (!month || !year) {
    return res.status(400).json({ message: "Month and year are required" });
  }

  try {
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);

    const expenses = await Expense.find({
      userId: userId,
      date: { $gte: startOfMonth, $lte: endOfMonth },
    });

    res.status(200).json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Get Expense Category Breakdown
export const getCategoryBreakdown = async (req, res) => {
  const { startDate, endDate } = req.query;
  const userId = req.userId;

  if (!startDate || !endDate) {
    return res.status(400).json({ message: "Start date and end date are required." });
  }

  try {
    const expenses = await Expense.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId), // Use 'new' keyword here
          date: { $gte: new Date(startDate), $lte: new Date(endDate) },
        },
      },
      {
        $group: {
          _id: "$expenseType",
          totalAmount: { $sum: "$amount" },
        },
      },
      {
        $project: {
          category: "$_id",
          amount: "$totalAmount",
          _id: 0,
        },
      },
    ]);

    const totalSpending = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    res.status(200).json({
      totalSpending,
      categoryBreakdown: expenses,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};






// Spending Trends
export const getSpendingTrends = async (req, res) => {
  const { startDate, endDate, interval = 'monthly', category } = req.query;
  const userId = req.userId;

  try {
    const filter = { userId: new mongoose.Types.ObjectId(userId) };

    if (category) {
      if (!category.trim()) {
        return res.status(400).json({ message: 'Invalid category.' });
      }
      filter.expenseType = normalizeCategory(category);
    }

    if (startDate) {
      const parsedStartDate = parseDate(startDate);
      if (!parsedStartDate) {
        return res.status(400).json({ message: 'Invalid date format.' });
      }
      const start = new Date(parsedStartDate);
      start.setHours(0, 0, 0, 0);
      filter.date = { ...filter.date, $gte: start };
    }

    if (endDate) {
      const parsedEndDate = parseDate(endDate);
      if (!parsedEndDate) {
        return res.status(400).json({ message: 'Invalid date format.' });
      }
      const end = endOfDay(parsedEndDate);
      filter.date = { ...filter.date, $lte: end };
    }

    const groupFormat =
      interval === 'daily'
        ? { year: { $year: '$date' }, month: { $month: '$date' }, day: { $dayOfMonth: '$date' } }
        : interval === 'weekly'
          ? { year: { $year: '$date' }, week: { $week: '$date' } }
          : { year: { $year: '$date' }, month: { $month: '$date' } };

    const trends = await Expense.aggregate([
      { $match: filter },
      { $group: { _id: groupFormat, totalAmount: { $sum: '$amount' } } },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    ]);

    res.status(200).json({
      spendingTrends: trends.map((trend) => ({
        date: new Date(
          trend._id.year,
          trend._id.month ? trend._id.month - 1 : 0,
          trend._id.day || 1
        ).getTime(),
        amount: trend.totalAmount,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};




// Top Expenses Details
export const getTopExpenses = async (req, res) => {
  const { startDate, endDate, limit = 5 } = req.query;
  const userId = req.userId;

  try {
    const filter = { userId: userId };
    if (startDate) filter.date = { $gte: new Date(startDate) };
    if (endDate) filter.date = { ...filter.date, $lte: new Date(endDate) };

    const topExpenses = await Expense.find(filter)
      .sort({ amount: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      topExpenses: topExpenses.map((exp) => ({
        item: exp.expenseName,
        amount: exp.amount,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};




// Lowest Expenses Details
export const getLowestExpenses = async (req, res) => {
  const { startDate, endDate, limit = 5 } = req.query;
  const userId = req.userId;

  try {
    const filter = { userId: userId };
    if (startDate) filter.date = { $gte: new Date(startDate) };
    if (endDate) filter.date = { ...filter.date, $lte: new Date(endDate) };

    const lowestExpenses = await Expense.find(filter)
      .sort({ amount: 1 }) // Ascending order for lowest expenses
      .limit(parseInt(limit));

    res.status(200).json({
      lowestExpenses: lowestExpenses.map((exp) => ({
        item: exp.expenseName,
        amount: exp.amount,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const getExpenseReport = async (req, res) => {
  try {
    const userId = req.userId;
    const { category } = req.query; // optional filter

    // Current year range
    const startOfYear = new Date(new Date().getFullYear(), 0, 1);
    const endOfYear = new Date(new Date().getFullYear() + 1, 0, 1);

    // Match condition
    const matchStage = {
      userId: new mongoose.Types.ObjectId(userId),
      date: { $gte: startOfYear, $lt: endOfYear },
    };

    if (category) {
      matchStage.expenseType = category;
    }

    const expenses = await Expense.aggregate([
      { $match: matchStage },

      {
        $group: {
          _id: "$expenseType",
          totalAmount: { $sum: "$amount" }
        }
      },

      {
        $sort: { totalAmount: -1 }
      },

      {
        $limit: 5
      }
    ]);

    const totalExpense = expenses.reduce(
      (sum, item) => sum + item.totalAmount,
      0
    );

    // Bar chart
    const barChartData = expenses.map(item => ({
      category: item._id,
      amount: Number(item.totalAmount.toFixed(2))
    }));

    // Pie chart
    const pieChartData = expenses.map(item => ({
      category: item._id,
      percentage: ((item.totalAmount / totalExpense) * 100).toFixed(2)
    }));

    res.status(200).json({
      year: new Date().getFullYear(),
      barChartData,
      pieChartData
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get Summary Stats
export const getSummaryStats = async (req, res) => {
  const { startDate, endDate } = req.query;
  const userId = req.userId;

  if (!startDate || !endDate) {
    return res.status(400).json({ message: "Start date and end date are required." });
  }

  try {
    const matchFilter = {
      userId: new mongoose.Types.ObjectId(userId),
      date: { $gte: new Date(startDate), $lte: new Date(endDate) }
    };

    // Get total transactions and total amount
    const overallStats = await Expense.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          totalTransactions: { $sum: 1 }
        }
      }
    ]);

    // Get spending days
    const spendingDaysResult = await Expense.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }
        }
      },
      { $count: "spendingDays" }
    ]);

    // Get top spending day
    const topSpendingDayResult = await Expense.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          total: { $sum: "$amount" }
        }
      },
      { $sort: { total: -1 } },
      { $limit: 1 }
    ]);

    const totalTransactions = overallStats.length > 0 ? overallStats[0].totalTransactions : 0;
    const totalAmount = overallStats.length > 0 ? overallStats[0].totalAmount : 0;
    const averageTransactionAmount = totalTransactions > 0 ? (totalAmount / totalTransactions).toFixed(2) : 0;
    const spendingDays = spendingDaysResult.length > 0 ? spendingDaysResult[0].spendingDays : 0;
    const topSpendingDay = topSpendingDayResult.length > 0 ? topSpendingDayResult[0]._id : null;

    res.status(200).json({
      totalTransactions,
      averageTransactionAmount: parseFloat(averageTransactionAmount),
      spendingDays,
      topSpendingDay
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


