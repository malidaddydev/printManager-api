const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// CREATE Order
const createOrder = async (req, res) => {
  try {
    const {
      customerId,
      orderNumber,
      title,
      status = 'Draft',
      startDate,
      dueDate,
      notes,
      items, // Array of order items
    } = req.body;

    // Basic validation
    if (!customerId || !orderNumber || !title || !dueDate) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const newOrder = await prisma.order.create({
      data: {
        customerId,
        orderNumber,
        title,
        status,
        startDate: startDate ? new Date(startDate) : null,
        dueDate: new Date(dueDate),
        notes,
        items: {
          create: items?.map(item => ({
            productId: item.productId,
            color: item.color,
            quantity: item.quantity,
            price: item.price,
            sizeQuantities: {
              
              create: item.sizeQuantities?.map(sq => ({
                  Size: sq.Size,
                  Price: sq.Price,
                  Quantity: sq.Quantity

              })) || [],
            },
          })) || [],
        },
      },
      include: {
        items: {
          include: { sizeQuantities: true, product: true },
        },
        customer: true,
      },
    });

    res.status(201).json(newOrder);
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};



const getProductColors = async (req, res) => {
  const productId  = req.params.id;

  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId) },
      select: {
        id: true,
        title: true,
        colorOptions: true,
      },
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({
      productId: product.id,
      title: product.title,
      colors: product.colorOptions || [],
    });
  } catch (err) {
    console.error('Error fetching product colors:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  createOrder,getProductColors                                                                                   
};






