require('dotenv').config();
const express = require('express');
const productRoutes = require('./routes/product.routes');
const workflowRoutes = require('./routes/workflow.routes');
const serviceRoutes = require('./routes/service.routes');
const stageRoutes = require('./routes/stage.routes');
const usersRoutes = require('./routes/users.routes');
const authRoutes = require('./routes/auth.routes');
const customerRoutes = require('./routes/customer.routes');
const orderRoutes = require('./routes/order.routes');
const {authenticate} = require('./middlewares/auth.middleware');
const uploadRoutes = require('./routes/upload.routes');
const orderFileRoutes = require('./routes/orderFile.routes');
const orderItemRoutes = require('./routes/orderItems.routes');
const sizeQuantitiesRoutes = require('./routes/sizequantities.routes');
const activityLogRoutes = require('./routes/activitylog.routes');
const orderCommentRoutes = require('./routes/orderComment.routes');
const customerApprovalRoutes = require('./routes/customerApproval.routes');
const notificationRoutes=require('./routes/notification.routes')
const orgRoutes = require('./routes/orgSettings.routes');
const customerOrderRoutes = require('./routes/customerOrder.routes');
const sendEmailRoutes = require('./routes/sendEmail.routes');

const cors = require('cors');


const path = require('path');

const app = express();



// Middleware
app.use(express.json());
app.use(cors());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads'))); // serve files

// Routes
// app.use('/api/users', authenticate, usersRoutes);
// app.use('/api/users', authenticate, usersRoutes);
app.use('/api/products', productRoutes);
app.use('/api/workflows', authenticate,workflowRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/stages', authenticate,stageRoutes);
app.use('/api/users', authenticate,usersRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/customers', authenticate,customerRoutes);
app.use('/api/orders', authenticate,orderRoutes);
app.use('/api/orderFiles', authenticate,orderFileRoutes);
app.use('/api/orderItems', authenticate,orderItemRoutes);
app.use('/api/sizeQuantities', authenticate,sizeQuantitiesRoutes);
app.use('/api/comments', authenticate,orderCommentRoutes);
app.use('/api', uploadRoutes);
app.use('/api/activitylogs', authenticate,activityLogRoutes);
app.use('/api/customerApprovals',authenticate,customerApprovalRoutes );
app.use('/api/notifications',authenticate,notificationRoutes );
app.use('/api/organization-settings',orgRoutes);
app.use('/api/customer-order',customerOrderRoutes);
app.use('/api/sendEmail', authenticate,sendEmailRoutes);





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