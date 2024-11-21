// controllers/todoController.js
const TodoList = require('../models/TodoList');
const mongoose = require('mongoose');


exports.addTaskToList = async (req, res) => {
  const { listId } = req.params; // Extract the list ID from the request parameters
  const { taskName, duration, reminder } = req.body; // Extract task details from the request body
  const userId = req.userId; // Get the user ID from the middleware

  try {
    // Find the todo list by its unique ID and user ID
    const todoList = await TodoList.findOne({ _id: listId, userId: userId });
    if (!todoList) {
      return res.status(404).json({ message: 'Todo list not found for the user' });
    }

    // Create a new task
    const newTask = {
      taskName,
      duration: duration, // Add duration to the current time
      reminder: reminder || null, // Optional reminder, can be null
      completed: false // Default to not completed
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


exports.addNewList = async (req, res) => {
  const { listName } = req.body; // Extract the list name from the request body
  const userId = req.userId; // Get the user ID from the middleware

  if (!listName) {
    return res.status(400).json({ message: 'List name is required' });
  }

  try {
    const existingList = await TodoList.findOne({ userId, listName });

    if (existingList) {
      return res.status(409).json({
        message: 'Todo list already exists for this user with the name: ' + listName
      });
    }

    // Create a new todo list
    const newList = new TodoList({
      userId,
      listName,
      tasks: [] // Initialize with an empty tasks array
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
        message: 'Todo list already exists for this user with the name: ' + listName
      });
    }

    console.error('Error adding todo list:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all todo lists for the authenticated user
exports.getAllLists = async (req, res) => {
  const userId = req.userId; // Get the user ID from the middleware

  try {
    // Find all todo lists for the user
    const todoLists = await TodoList.find({ userId });

    if (!todoLists || todoLists.length === 0) {
      return res.status(404).json({ message: 'No todo lists found for the user' });
    }

    let responseList = todoLists.map(todoList => ({
      listName: todoList.listName,
      _id: todoList._id
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
exports.updateListName = async (req, res) => {
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
exports.deleteList = async (req, res) => {
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





exports.getAllTasksFromList = async (req, res) => {
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
      tasks: todoList.tasks
    });
  } catch (error) {
    console.error('Error retrieving tasks:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getTaskById = async (req, res) => {
  const { listId, taskId } = req.params;
  console.log(listId, taskId);

  try {
    const todoList = await TodoList.findById(listId);
    if (!todoList) {
      return res.status(404).json({ message: 'Todo list not found' });
    }

    const task = todoList.tasks.id(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found in the todo list' });
    }

    res.status(200).json({ task });
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a task by ID in a specific todo list
exports.updateTaskById = async (req, res) => {
  const { listId, taskId } = req.params;
  const { taskName, completed } = req.body;

  try {
    const todoList = await TodoList.findById(listId);
    if (!todoList) {
      return res.status(404).json({ message: 'Todo list not found' });
    }

    const task = todoList.tasks.id(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found in the todo list' });
    }

    // Update the task fields
    if (taskName !== undefined) task.taskName = taskName;
    if (completed !== undefined) task.completed = completed;

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
exports.deleteTaskById = async (req, res) => {
  const { listId, taskId } = req.params;

  try {
    const todoList = await TodoList.findById(listId);
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


exports.getTodoDetails = async (req, res) => {
  try {
    const userId = req.userId;
    const todos = await TodoList.find({ userId }).select('tasks');

    const pendingTasks = todos
      .flatMap(list => list.tasks)
      .filter(task => !task.completed)
      .slice(0, 5);

    const doneTasks = todos
      .flatMap(list => list.tasks)
      .filter(task => task.completed)
      .slice(0, 5);

    res.json({ pending: pendingTasks, done: doneTasks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
