import Expense from '../models/Expense.js';
import mongoose from 'mongoose';
import Groq from 'groq-sdk';

// Initialize Groq client
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

// Get AI-powered expense analysis
export const getAIExpenseAnalysis = async (req, res) => {
    const { startDate, endDate } = req.query;
    const userId = req.userId;

    if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start date and end date are required." });
    }

    try {
        // Fetch expenses for the given period
        const expenses = await Expense.find({
            userId: userId,
            date: { $gte: new Date(startDate), $lte: new Date(endDate) }
        });

        if (expenses.length === 0) {
            return res.status(200).json({
                message: "No expenses found for the given period.",
                analysis: null
            });
        }

        // Prepare data summary for AI
        const totalSpending = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        const categoryBreakdown = expenses.reduce((acc, exp) => {
            const existing = acc.find(item => item.category === exp.expenseType);
            if (existing) {
                existing.total += exp.amount;
                existing.count += 1;
            } else {
                acc.push({
                    category: exp.expenseType,
                    total: exp.amount,
                    count: 1
                });
            }
            return acc;
        }, []);

        const avgExpense = (totalSpending / expenses.length).toFixed(2);
        const topExpenses = expenses
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5)
            .map(exp => ({ name: exp.expenseName, amount: exp.amount, category: exp.expenseType }));

        // Prepare prompt for AI
        const analysisPrompt = `
You are a financial advisor. Analyze the following expense data and provide actionable insights and recommendations:

Expense Summary:
- Total Spending: ₹${totalSpending.toFixed(2)}
- Number of Transactions: ${expenses.length}
- Average Transaction: ₹${avgExpense}
- Period: ${startDate} to ${endDate}

Category Breakdown:
${categoryBreakdown.map(cat => `- ${cat.category}: ₹${cat.total.toFixed(2)} (${cat.count} transactions)`).join('\n')}

Top 5 Expenses:
${topExpenses.map((exp, i) => `${i + 1}. ${exp.name}: ₹${exp.amount} (${exp.category})`).join('\n')}

Based on this data, please provide:
1. A brief analysis of spending patterns
2. Key areas where spending is high
3. 3-5 actionable recommendations to optimize spending
4. Budget suggestions for each category
5. Potential savings opportunities

Keep the response concise and practical.
    `;

        // Call Groq API
        const message = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            max_tokens: 1024,
            messages: [
                {
                    role: "user",
                    content: analysisPrompt,
                }
            ],
        });

        const aiAnalysis = message.choices[0].message.content;

        res.status(200).json({
            summary: {
                totalSpending: parseFloat(totalSpending.toFixed(2)),
                transactions: expenses.length,
                avgTransaction: parseFloat(avgExpense),
                period: { startDate, endDate }
            },
            categoryBreakdown: categoryBreakdown.map(cat => ({
                category: cat.category,
                amount: parseFloat(cat.total.toFixed(2)),
                percentage: ((cat.total / totalSpending) * 100).toFixed(2),
                transactionCount: cat.count
            })),
            topExpenses,
            aiAnalysis
        });

    } catch (error) {
        console.error('AI Analysis Error:', error);

        // Handle rate limiting error
        if (error.status === 429) {
            return res.status(429).json({
                message: "Rate limit exceeded. Free tier allows 30 requests per minute. Please try again later.",
                retryAfter: error.headers?.['retry-after'] || 60
            });
        }

        // Handle authentication error
        if (error.status === 401) {
            return res.status(401).json({
                message: "Invalid GROQ API key. Please check your GROQ_API_KEY in .env file."
            });
        }

        // Handle other API errors
        if (error.status >= 400) {
            return res.status(error.status).json({
                message: `GROQ API Error: ${error.message}`,
                details: error.error?.error?.message || 'Unknown error'
            });
        }

        res.status(500).json({ message: error.message || 'Error generating AI analysis' });
    }
};

// Get AI spending recommendations
export const getAIRecommendations = async (req, res) => {
    const { month, year } = req.query;
    const userId = req.userId;

    if (!month || !year) {
        return res.status(400).json({ message: "Month and year are required." });
    }

    try {
        const startOfMonth = new Date(year, month - 1, 1);
        const endOfMonth = new Date(year, month, 0, 23, 59, 59);

        const expenses = await Expense.find({
            userId: userId,
            date: { $gte: startOfMonth, $lte: endOfMonth }
        });

        if (expenses.length === 0) {
            return res.status(200).json({
                message: "No expenses found for this month.",
                recommendations: null
            });
        }

        const categorySpending = expenses.reduce((acc, exp) => {
            const existing = acc.find(item => item.category === exp.expenseType);
            if (existing) {
                existing.total += exp.amount;
            } else {
                acc.push({ category: exp.expenseType, total: exp.amount });
            }
            return acc;
        }, []);

        const totalSpending = categorySpending.reduce((sum, cat) => sum + cat.total, 0);

        const recommendationPrompt = `
You are a personal finance expert. Based on the spending for ${month}/${year}, provide specific recommendations:

Monthly Spending: ₹${totalSpending.toFixed(2)}

Category Breakdown:
${categorySpending.map(cat => `- ${cat.category}: ₹${cat.total.toFixed(2)} (${((cat.total / totalSpending) * 100).toFixed(1)}%)`).join('\n')}

Please provide:
1. A short assessment of this month's spending
2. Which categories are over-spending (if any)
3. Specific, actionable tips to reduce spending in the next month
4. Realistic budget allocation for each category
5. Comparison insights if relevant

Be encouraging but realistic.
    `;

        const message = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            max_tokens: 1024,
            messages: [
                {
                    role: "user",
                    content: recommendationPrompt,
                }
            ],
        });

        const recommendations = message.choices[0].message.content;

        res.status(200).json({
            month,
            year,
            monthlySpending: parseFloat(totalSpending.toFixed(2)),
            categorySpending: categorySpending.map(cat => ({
                category: cat.category,
                amount: parseFloat(cat.total.toFixed(2)),
                percentage: ((cat.total / totalSpending) * 100).toFixed(2)
            })),
            aiRecommendations: recommendations
        });

    } catch (error) {
        console.error('Recommendation Error:', error);

        // Handle rate limiting error
        if (error.status === 429) {
            return res.status(429).json({
                message: "Rate limit exceeded. Free tier allows 30 requests per minute. Please try again later.",
                retryAfter: error.headers?.['retry-after'] || 60
            });
        }

        // Handle authentication error
        if (error.status === 401) {
            return res.status(401).json({
                message: "Invalid GROQ API key. Please check your GROQ_API_KEY in .env file."
            });
        }

        // Handle other API errors
        if (error.status >= 400) {
            return res.status(error.status).json({
                message: `GROQ API Error: ${error.message}`,
                details: error.error?.error?.message || 'Unknown error'
            });
        }

        res.status(500).json({ message: error.message || 'Error generating recommendations' });
    }
};

// Get AI spending forecast
export const getAISpendingForecast = async (req, res) => {
    const userId = req.userId;
    const { months = 3 } = req.query;

    try {
        // Get last 3 months of data
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 3);

        const expenses = await Expense.find({
            userId: userId,
            date: { $gte: startDate, $lte: endDate }
        });

        if (expenses.length < 10) {
            return res.status(200).json({
                message: "Insufficient data for forecast. Need at least 10 transactions.",
                forecast: null
            });
        }

        // Calculate monthly averages
        const monthlyData = [];
        for (let i = 0; i < 3; i++) {
            const monthStart = new Date();
            monthStart.setMonth(monthStart.getMonth() - i);
            monthStart.setDate(1);

            const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);

            const monthExpenses = expenses.filter(exp =>
                exp.date >= monthStart && exp.date <= monthEnd
            );

            const total = monthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
            monthlyData.unshift({
                month: monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
                total: parseFloat(total.toFixed(2))
            });
        }

        const forecastPrompt = `
You are a financial forecasting expert. Based on the last 3 months of spending data, provide a forecast:

Historical Monthly Spending:
${monthlyData.map(m => `- ${m.month}: ₹${m.total}`).join('\n')}

Please provide:
1. Trend analysis (increasing, decreasing, or stable spending)
2. Predicted spending for the next ${months} months
3. Confidence level and factors that might affect the forecast
4. Recommendations to stay on budget

Be data-driven and practical.
    `;

        const message = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            max_tokens: 1024,
            messages: [
                {
                    role: "user",
                    content: forecastPrompt,
                }
            ],
        });

        const forecast = message.choices[0].message.content;

        res.status(200).json({
            historicalData: monthlyData,
            forecastPeriod: `Next ${months} months`,
            aiForecast: forecast
        });

    } catch (error) {
        console.error('Forecast Error:', error);

        // Handle rate limiting error
        if (error.status === 429) {
            return res.status(429).json({
                message: "Rate limit exceeded. Free tier allows 30 requests per minute. Please try again later.",
                retryAfter: error.headers?.['retry-after'] || 60
            });
        }

        // Handle authentication error
        if (error.status === 401) {
            return res.status(401).json({
                message: "Invalid GROQ API key. Please check your GROQ_API_KEY in .env file."
            });
        }

        // Handle other API errors
        if (error.status >= 400) {
            return res.status(error.status).json({
                message: `GROQ API Error: ${error.message}`,
                details: error.error?.error?.message || 'Unknown error'
            });
        }

        res.status(500).json({ message: error.message || 'Error generating forecast' });
    }
};
