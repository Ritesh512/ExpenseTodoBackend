const Expense = require('../models/Expense'); // Assuming your Expense model is here
const TodoList = require('../models/TodoList');
const mongoose = require('mongoose'); // Assuming your Todo model is here

exports.getDashboardData = async (req, res) => {
  try {
    // Fetch total spending
    const totalSpending = await Expense.aggregate([
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
        },
      },
    ]);

    // Fetch pending tasks
    const pendingTasks = await TodoList.countDocuments({ status: "pending" });

    // Fetch spending trends (last 30 days for example)
    const spendingTrends = await Expense.aggregate([
      {
        $match: {
          date: { $gte: new Date(new Date().setDate(new Date().getDate() - 30)) },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$date" } },
          totalAmount: { $sum: "$amount" },
        },
      },
      {
        $sort: { "_id": 1 },
      },
    ]);

    // Prepare data for the chart
    const xData = spendingTrends.map((trend) => trend._id);
    const yData = spendingTrends.map((trend) => trend.totalAmount);

    // Sending the response
    res.status(200).json({
      totalSpending: totalSpending[0]?.totalAmount || 0,
      pendingTasks,
      spendingTrends: {
        xData,
        yData,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
