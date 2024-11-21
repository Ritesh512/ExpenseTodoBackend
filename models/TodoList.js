const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  taskName: {
    type: String,
    required: true,
    trim: true
  },
  duration: {
    type: Date, // Duration in minutes (for example)
    required: true
  },
  reminder: {
    type: Date, // Optional
    default: null
  },
  completed: {
    type: Boolean,
    default: false
  }
},{ timestamps: true });

// Todo List Schema
const todoListSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  listName: {
    type: String,
    required: true,
    trim: true
  },
  tasks: [taskSchema], // Array of tasks
}, {
  timestamps: true // Automatically adds `createdAt` and `updatedAt` fields
});

// Compound index to make listName unique per user
todoListSchema.index({ userId: 1, listName: 1 }, { unique: true });

module.exports = mongoose.model('TodoList', todoListSchema);
