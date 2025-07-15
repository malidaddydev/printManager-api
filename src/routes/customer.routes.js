const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Create a customer
router.post('/create', async (req, res) => {
  const { name, email, mobile, mobile2, company, address } = req.body;
  try {
    const customer = await prisma.customer.create({
      data: { name, email, mobile, mobile2, company, address },
    });
    // Format id as 4-digit string
    const formattedCustomer = {
      ...customer,
      id: customer.id.toString().padStart(4, '0'),
    };
    res.status(201).json(formattedCustomer);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create customer', details: err.message });
  }
});

// Get all customers or a single customer by ID
router.get('/', async (req, res) => {
  const { id } = req.query;
  try {
    if (id) {
      // Convert id to number for Prisma query (assuming id is numeric in schema)
      const customer = await prisma.customer.findUnique({
        where: { id: parseInt(id) },
      });
      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }
      // Format id as 4-digit string
      const formattedCustomer = {
        ...customer,
        id: customer.id.toString().padStart(4, '0'),
      };
      return res.json(formattedCustomer);
    }
    // Get all customers
    const customers = await prisma.customer.findMany();
    // Format id as 4-digit string for all customers
    const formattedCustomers = customers.map((c) => ({
      ...c,
      id: c.id.toString().padStart(4, '0'),
    }));
    res.json(formattedCustomers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch customers', details: err.message });
  }
});

module.exports = router;