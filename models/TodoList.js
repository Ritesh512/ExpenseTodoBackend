import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  taskName: {
    type: String,
    required: true,
    trim: true
  },
  duration: {
    type: Date,
    default: null
  },
  reminder: {
    type: Date, // Optional
    default: null
  },
  completed: {
    type: Boolean,
    default: false
  },
  completionPeriod: {
    type: String,
    default: null
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
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly', 'once'],
    default: 'once'
  },
  timeZone: {
    type: String,
    default: 'UTC'
  },
  reminderEnabled: {
    type: Boolean,
    default: false
  },
  reminderTime: {
    type: String,
    default: '09:00'
  },
  lastReminderKey: {
    type: String,
    default: null
  },
  tasks: [taskSchema], // Array of tasks
}, {
  timestamps: true // Automatically adds `createdAt` and `updatedAt` fields
});

// Compound index to make listName unique per user
todoListSchema.index({ userId: 1, listName: 1 }, { unique: true });

export default mongoose.model('TodoList', todoListSchema);
