const Expense = require('../models/Expense');
const mongoose = require('mongoose');

// Add Expense
exports.addExpense = async (req, res) => {
  try {
    req.body.userId = req.userId;
    const expense = new Expense(req.body);
    const savedExpense = await expense.save();
    res.status(201).json(savedExpense);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get All Expenses
exports.getAllExpenses = async (req, res) => {
  try {
    const userId = req.userId; 
    const expenses = await Expense.find({userId: userId});
    res.status(200).json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Expense By ID
exports.getExpenseById = async (req, res) => {
  const { expenseId } = req.params;
  const userId = req.userId; // Get the user ID from the middleware
  try {
    const expense = await Expense.findOne({_id:expenseId,userId:userId});
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    res.status(200).json(expense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Expenses By Date Range
exports.getExpensesByDate = async (req, res) => {
  const { startDate, endDate } = req.query;
  const userId = req.userId;
  try {
    const expenses = await Expense.find({ userId:userId,
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

// Delete Expense
exports.deleteExpense = async (req, res) => {
  const { expenseId } = req.params;
  const userId = req.userId; // Get the user ID from the middleware
  try {
    const expense = await Expense.findByIdAndDelete({_id:expenseId,userId:userId});
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    res.status(200).json({ message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Expense
exports.updateExpense = async (req, res) => {
  const { expenseId } = req.params;
  const userId = req.userId; // Get the user ID from the middleware
  try {
    const expense = await Expense.findByIdAndUpdate({_id:expenseId,userId:userId}, req.body, {
      new: true,
      runValidators: true,
    });
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    res.status(200).json(expense);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


exports.getExpensesForTwoMonths = async (req, res) => {
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
    const expensesMonth1 = await Expense.find({ userId:userId,
      date: { $gte: startOfMonth1, $lte: endOfMonth1 },
    });

    const expensesMonth2 = await Expense.find({ userId:userId,
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
exports.getExpensesByMonth = async (req, res) => {
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
exports.getCategoryBreakdown = async (req, res) => {
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






//Spending Trends
exports.getSpendingTrends = async (req, res) => {
  const { startDate, endDate, interval = "monthly" } = req.query;
  const userId = req.userId;

  try {
    const filter = { userId:new mongoose.Types.ObjectId(userId) };
    if (startDate) filter.date = { $gte: new Date(startDate) };
    if (endDate) filter.date = { ...filter.date, $lte: new Date(endDate) };

    const groupFormat =
      interval === "daily"
        ? { year: { $year: "$date" }, month: { $month: "$date" }, day: { $dayOfMonth: "$date" } }
        : interval === "weekly"
        ? { year: { $year: "$date" }, week: { $week: "$date" } }
        : { year: { $year: "$date" }, month: { $month: "$date" } };

    const trends = await Expense.aggregate([
      { $match: filter },
      { $group: { _id: groupFormat, totalAmount: { $sum: "$amount" } } },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
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
exports.getTopExpenses = async (req, res) => {
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
exports.getLowestExpenses = async (req, res) => {
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


exports.getExpenseReport = async (req, res) => {
  try {
    const userId = req.userId;

    // Fetch all expenses for the user
    const expenses = await Expense.find({ userId });

    // Bar chart data: Top expenses by category
    const categoryTotals = expenses.reduce((acc, expense) => {
      acc[expense.expenseType] = (acc[expense.expenseType] || 0) + expense.amount;
      return acc;
    }, {});

    // Convert the category totals into an array of objects
    const barChartData = Object.entries(categoryTotals)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)  // Sort by amount in descending order
      .slice(0, 5);  // Limit to top 5 categories

    // Pie chart data: Category percentages
    const totalExpense = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const pieChartData = Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        category,
        percentage: ((amount / totalExpense) * 100).toFixed(2),
      }))
      .sort((a, b) => b.percentage - a.percentage)  // Sort by percentage in descending order
      .slice(0, 5);  // Limit to top 5 categories

    // Return the data
    res.json({ barChartData, pieChartData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

