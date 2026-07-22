const express = require('express');
const cors = require('cors');

const app = express();

// Standard Middleware
app.use(express.json());
app.use(cors()); // Basic CORS all routes allow වෙන ලෙස

// Sample/Basic Route Check
app.get('/', (req, res) => {
  res.send('Server is running smoothly!');
});

// Import and use Auth Routes here
// const authRoutes = require('./routes/auth');
// app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});