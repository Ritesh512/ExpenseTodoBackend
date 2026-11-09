# Daily To-Do and Expense Tracker App  

## Description  
This app is designed to help users organize their Daily Tasks and expenses efficiently. With separate functionalities for managing to-dos, tracking expenses, and a dashboard to visualize data, it serves as an all-in-one solution for personal productivity and financial management.

---

## Live Demo  
Access the app here: [Expense and To-Do Tracker](https://expense-todo-five.vercel.app/)  

---

## Features  

### 1. **To-Do List Management**  
- Create named lists with daily, weekly, monthly, yearly, or regular (one-time) cadence.
- Add and delete tasks, mark completion, and reset recurring completion by period.
- Optional local-time reminders while the app is open: daily, Sundays for weekly
  and monthly lists, and the first day of each month for yearly lists.
- Example:  
  - List: *Groceries*  
  - Task: *Buy 1kg apples*  

### 2. **Expense Tracker**  
- Add, update, and delete expenses.  
- Multiple analysis features:  
  - **Compare Monthly Data**: Compare expenses across two selected months.  
  - **Visualizations**:  
    - Donut Chart: Shows distribution of expenses over a data range.  
    - Bar Chart: Highlights top 5 and lowest 5 expenses.  
    - Line Chart: Tracks expense trends over time.  

### 3. **Dashboard**  
- Comprehensive summary of to-dos and expenses:  
  - Number of pending/completed tasks.  
  - Total and categorized expenses.  
  - Key insights from expense analysis.  

---


## Tech Stack  
- **Frontend**: React  
- **Backend**: Node.js, Express  
- **Database**: MongoDB 
- **Charts**: Chart.js, Apex Charts for visualizations  

---

## Setup Instructions  

### Prerequisites  
Ensure you have the following installed:  
- Node.js  
- npm / yarn  

### Steps to Run Locally  
1. Clone the repository:  
   ```bash  
   git clone https://github.com/Ritesh512/ExpenseTodoBackend
   cd ExpenseTodoApp

   
## Setup Instructions  

### Install Dependencies  
Run the following command to install all necessary dependencies:  
```bash
npm install  
Start the Development Server
To start the app locally, use the command:

npm start
```
### Open the App
Once the server is running, open your browser and navigate to:

```bash
http://localhost:3000
```

### Rebuild the Frontend
The backend serves the production frontend from `backendTodo/dist`. From the
repository root, build the frontend before starting or deploying the backend:

```bash
cd Frontend
npm run build
cd ../backendTodo
npm start
```

---


### Future Enhancements
- Export Data: Allow exporting expenses as CSV or Excel files.
- Mobile App: Develop a mobile version for easier access.

### Frontend Code
[Code](https://github.com/Ritesh512/ExpenseTodoApp)
