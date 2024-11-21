// routes/todoRoutes.js
const express = require('express');
const router = express.Router();
const todoController = require('../controller/todoController') // Import the controller


router.post('/lists/addTask/:listId', todoController.addTaskToList);
router.post('/lists/addList', todoController.addNewList);
router.get('/lists/getList/:listId', todoController.getAllTasksFromList);

// Route to get all todo lists for the authenticated user
router.get('/lists', todoController.getAllLists);

// Route to delete a todo list for the authenticated user
router.delete('/lists/:listId', todoController.deleteList);

// Route to update a todo list name for the authenticated user
router.put('/lists/:listName', todoController.updateListName);

// Route to get a task by ID in a specific todo list
router.get('/lists/:listId/task/:taskId', todoController.getTaskById);

// Route to update a task by ID in a specific todo list
router.put('/lists/:listId/task/:taskId', todoController.updateTaskById);

// Route to delete a task by ID in a specific todo list
router.delete('/lists/:listId/task/:taskId', todoController.deleteTaskById);

router.get('/lists/summary', todoController.getTodoDetails);

module.exports = router;
