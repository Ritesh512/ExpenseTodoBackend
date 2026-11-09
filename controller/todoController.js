import TodoList from '../models/TodoList.js';
import mongoose from 'mongoose';
import { getDueReminder, getTodoPeriodKey, isTodoTaskComplete } from '../utils/todoSchedule.js';



export const addTaskToList = async (req, res) => {
  const { listId } = req.params; // Extract the list ID from the request parameters
  const { taskName, duration, reminder } = req.body;
  const userId = req.userId; // Get the user ID from the middleware

  if (typeof taskName !== 'string' || !taskName.trim()) {
    return res.status(400).json({ message: 'Task name is required' });
  }

  if (duration && Number.isNaN(new Date(duration).getTime())) {
    return res.status(400).json({ message: 'Task date is invalid' });
  }
  if (reminder && Number.isNaN(new Date(reminder).getTime())) {
    return res.status(400).json({ message: 'Task reminder is invalid' });
  }

  try {
    // Find the todo list by its unique ID and user ID
    const todoList = await TodoList.findOne({ _id: listId, userId: userId });
    if (!todoList) {
      return res.status(404).json({ message: 'Todo list not found for the user' });
    }

    // Create a new task
    const newTask = {
      taskName: taskName.trim(),
      duration: duration || null,
      reminder: reminder || null,
      completed: false,
      completionPeriod: null
    };

    // Add the new task to the tasks array in the list
    todoList.tasks.push(newTask);

    // Save the updated todo list
    await todoList.save();

    const addedTask = todoList.tasks[todoList.tasks.length - 1];

    // Return the added task, including the generated _id
    res.status(201).json({
      message: 'Task added successfully',
      task: addedTask
    });
  } catch (error) {
    console.error('Error adding task:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


export const addNewList = async (req, res) => {
  const {
    listName,
    frequency = 'daily',
    timeZone = 'UTC',
    reminderEnabled = false,
    reminderTime = '09:00'
  } = req.body;
  const userId = req.userId; // Get the user ID from the middleware

  if (typeof listName !== 'string' || !listName.trim()) {
    return res.status(400).json({ message: 'List name is required' });
  }

  if (!['daily', 'weekly', 'monthly', 'yearly', 'once'].includes(frequency)) {
    return res.status(400).json({ message: 'Invalid list frequency' });
  }

  if (typeof reminderEnabled !== 'boolean') {
    return res.status(400).json({ message: 'Reminder setting must be a boolean' });
  }

  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(reminderTime)) {
    return res.status(400).json({ message: 'Reminder time must use HH:mm format' });
  }

  try {
    new Intl.DateTimeFormat('en-US', { timeZone }).format();
  } catch {
    return res.status(400).json({ message: 'Invalid time zone' });
  }

  try {
    const normalizedName = listName.trim();
    const existingList = await TodoList.findOne({ userId, listName: normalizedName });

    if (existingList) {
      return res.status(409).json({
        message: 'Todo list already exists for this user with the name: ' + normalizedName
      });
    }

    // Create a new todo list
    const newList = new TodoList({
      userId,
      listName: normalizedName,
      frequency,
      timeZone,
      reminderEnabled,
      reminderTime,
      tasks: []
    });

    // Save the new list to the database
    await newList.save();

    res.status(201).json({
      message: 'Todo list created successfully',
      list: newList
    });
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({ message: 'Validation error: ' + error.message });
    }

    if (error.code === 11000) { // Duplicate key error code
      return res.status(409).json({
        message: 'Todo list already exists for this user with the name: ' + listName.trim()
      });
    }

    console.error('Error adding todo list:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all todo lists for the authenticated user
export const getAllLists = async (req, res) => {
  const userId = req.userId; // Get the user ID from the middleware

  try {
    // Find all todo lists for the user
    const todoLists = await TodoList.find({ userId });

    let responseList = todoLists.map(todoList => ({
      listName: todoList.listName,
      _id: todoList._id,
      frequency: todoList.frequency || 'once',
      reminderEnabled: todoList.reminderEnabled,
      reminderTime: todoList.reminderTime,
      timeZone: todoList.timeZone
    }));


    res.status(200).json({
      message: 'Todo lists retrieved successfully',
      lists: responseList
    });
  } catch (error) {
    console.error('Error retrieving todo lists:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update the name of a specific todo list for the authenticated user
export const updateListName = async (req, res) => {
  const { listName } = req.params; // Get the current list name from the URL parameters
  const { newListName } = req.body; // Get the new list name from the request body
  const userId = req.userId; // Get the user ID from the middleware

  if (!newListName) {
    return res.status(400).json({ message: 'New list name is required' });
  }

  try {
    // Find the todo list by its current name and user ID, and update its name
    const updatedList = await TodoList.findOneAndUpdate(
      { listName, userId },
      { listName: newListName },
      { new: true }
    );

    if (!updatedList) {
      return res.status(404).json({ message: 'Todo list not found for the user' });
    }

    res.status(200).json({
      message: 'Todo list name updated successfully',
      updatedList
    });
  } catch (error) {
    console.error('Error updating todo list name:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


// Delete a specific todo list and its associated tasks for the authenticated user
export const deleteList = async (req, res) => {
  const { listId } = req.params; // Get the list name from the URL parameters
  const userId = req.userId; // Get the user ID from the middleware
  

  try {
    // Find and delete the todo list by its name and user ID
    const deletedList = await TodoList.findOneAndDelete({ _id: listId, userId: userId });

    if (!deletedList) {
      return res.status(404).json({ message: 'Todo list not found for the user' });
    }

    res.status(200).json({
      message: 'Todo list deleted successfully',
      deletedList
    });
  } catch (error) {
    console.error('Error deleting todo list:', error);
    res.status(500).json({ message: 'Server error' });
  }
};





export const getAllTasksFromList = async (req, res) => {
  const { listId } = req.params; // Retrieve listId from query parameters
  const userId = req.userId; // Get the user ID from the middleware

  if (!listId) {
    return res.status(400).json({ message: 'List Id is required' });
  }

  try {
    // Find the todo list by its name and user ID
    // console.log(userId,listName)
    const todoList = await TodoList.findOne({ _id: listId, userId: userId });
    if (!todoList) {
      return res.status(404).json({ message: 'Todo list not found for the user' });
    }

    // Return the tasks from the todo list

    res.status(200).json({
      message: 'Tasks retrieved successfully',
      tasks: todoList.tasks.map(task => ({
        ...task.toObject(),
        completed: isTodoTaskComplete(task, todoList)
      })),
      frequency: todoList.frequency || 'once',
      timeZone: todoList.timeZone || 'UTC'
    });
  } catch (error) {
    console.error('Error retrieving tasks:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getTaskById = async (req, res) => {
  const { listId, taskId } = req.params;

  try {
    const todoList = await TodoList.findOne({ _id: listId, userId: req.userId });
    if (!todoList) {
      return res.status(404).json({ message: 'Todo list not found' });
    }

    const task = todoList.tasks.id(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found in the todo list' });
    }

    res.status(200).json({
      task: {
        ...task.toObject(),
        completed: isTodoTaskComplete(task, todoList)
      }
    });
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a task by ID in a specific todo list
export const updateTaskById = async (req, res) => {
  const { listId, taskId } = req.params;
  const { taskName, completed } = req.body;

  try {
    const todoList = await TodoList.findOne({ _id: listId, userId: req.userId });
    if (!todoList) {
      return res.status(404).json({ message: 'Todo list not found' });
    }

    const task = todoList.tasks.id(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found in the todo list' });
    }

    // Update the task fields
    if (taskName !== undefined) {
      if (typeof taskName !== 'string' || !taskName.trim()) {
        return res.status(400).json({ message: 'Task name is required' });
      }
      task.taskName = taskName.trim();
    }
    if (completed !== undefined) {
      if (typeof completed !== 'boolean') {
        return res.status(400).json({ message: 'Completed must be a boolean' });
      }
      task.completed = completed;
      task.completionPeriod = completed && (todoList.frequency || 'once') !== 'once'
        ? getTodoPeriodKey(todoList.frequency, new Date(), todoList.timeZone || 'UTC')
        : null;
    }

    // Save the updated list
    await todoList.save();

    res.status(200).json({
      message: 'Task updated successfully',
      task
    });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a task by ID in a specific todo list
export const deleteTaskById = async (req, res) => {
  const { listId, taskId } = req.params;

  try {
    const todoList = await TodoList.findOne({ _id: listId, userId: req.userId });
    if (!todoList) {
      return res.status(404).json({ message: 'Todo list not found' });
    }

    const task = todoList.tasks.id(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found in the todo list' });
    }

    // Remove the task from the tasks array
    todoList.tasks.pull(taskId);
    // Save the updated list
    await todoList.save();

    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


export const getTodoDetails = async (req, res) => {
  try {
    const userId = req.userId;
    const todos = await TodoList.find({ userId });
    const now = new Date();

    const pendingTasks = todos
      .flatMap(list => list.tasks.map(task => ({
        ...task.toObject(),
        completed: isTodoTaskComplete(task, list, now)
      })))
      .filter(task => !task.completed)
      .slice(0, 5);

    const doneTasks = todos
      .flatMap(list => list.tasks.map(task => ({
        ...task.toObject(),
        completed: isTodoTaskComplete(task, list, now)
      })))
      .filter(task => task.completed)
      .slice(0, 5);

    res.json({ pending: pendingTasks, done: doneTasks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const claimDueReminders = async (req, res) => {
  try {
    const lists = await TodoList.find({ userId: req.userId, reminderEnabled: true });
    const now = new Date();
    const reminders = [];

    for (const list of lists) {
      const dueReminder = getDueReminder(list, now);
      if (!dueReminder) continue;

      const pendingCount = list.tasks.filter(
        task => !isTodoTaskComplete(task, list, now)
      ).length;
      if (pendingCount === 0) continue;

      const claimed = await TodoList.findOneAndUpdate(
        {
          _id: list._id,
          userId: req.userId,
          reminderEnabled: true,
          lastReminderKey: { $ne: dueReminder.reminderKey }
        },
        { $set: { lastReminderKey: dueReminder.reminderKey } },
        { new: false }
      );

      if (claimed) {
        reminders.push({
          listId: list._id,
          listName: list.listName,
          frequency: list.frequency || 'once',
          pendingCount
        });
      }
    }

    res.status(200).json({ reminders });
  } catch (error) {
    console.error('Error claiming todo reminders:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
