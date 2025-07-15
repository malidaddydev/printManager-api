const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

router.post('/create', async (req, res) => {
  const { customerId, serviceType, deliveryDate, specialInstructions, items } = req.body;
  // Validate customerId is 4 digits
 
  // Check if customer exists
  const customer = await prisma.customer.findUnique({ where: { id: parseInt(customerId) } });
  if (!customer) {
    return res.status(400).json({ error: 'Customer with this 4-digit ID does not exist' });
  }
  try {
    const order = await prisma.order.create({
      data: {
        customerId: parseInt(customerId),
        serviceType,
        deliveryDate: new Date(deliveryDate),
        specialInstructions,
        items: {
          create: items.map(item => ({
            product: item.product,
            quantity: item.quantity,
            size: item.size,
            color: item.color,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
          }))
        }
      },
      include: { items: true }
    });
    // Format order id and item ids in response, but not customerId
    const formattedOrder = {
      ...order,
      id: `#${order.id.toString().padStart(4, '0')}`,
      items: order.items.map(item => ({
        ...item,
        id: `#${item.id.toString().padStart(4, '0')}`
      }))
    };
    res.status(201).json(formattedOrder);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create order', details: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const orders = await prisma.order.findMany({ include: { items: true, customer: true } });
    // Format order id and item ids in each order, but not customerId
    const formattedOrders = orders.map(order => ({
      ...order,
      id: `#${order.id.toString().padStart(4, '0')}`,
      items: order.items.map(item => ({
        ...item,
        id: `#${item.id.toString().padStart(4, '0')}`
      }))
    }));
    res.json(formattedOrders);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders', details: err.message });
  }
});

module.exports = router;