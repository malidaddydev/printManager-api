require('dotenv').config();
const express = require('express');
const productRoutes = require('./routes/product.routes');
const usersRoutes = require('./routes/users.routes');
const authRoutes = require('./routes/auth.routes');
const customerRoutes = require('./routes/customer.routes');
const orderRoutes = require('./routes/order.routes');
const {authenticate} = require('./middlewares/auth.middleware');
const cors = require('cors');

const path = require('path');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

// Routes
// app.use('/api/products', productRoutes);
// app.use('/api/users', authenticate, usersRoutes);

app.use('/api/users', usersRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/orders', orderRoutes);




// Redirect root to index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});