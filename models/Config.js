const dotenv = require("dotenv");
dotenv.config();

const mongoose = require("mongoose");
mongoose.connect(process.env.DATABASE).then(() => {
  console.log("Database connected successfully");
});