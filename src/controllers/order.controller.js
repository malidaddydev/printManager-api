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
      items,
      createdBy // Array of order items
    } = req.body;


    const uploadedFiles = req.files?.map(file => ({
      filename: file.filename,
      path: `/orderuploads/${file.filename}`
    })) || [];

    // Basic validation
    // if (!customerId || !orderNumber || !title || !dueDate) {
    //   return res.status(400).json({ message: 'Missing required fields' });
    // }


    let parsedItems = [];

if (typeof items === 'string') {
  try {
    parsedItems = JSON.parse(items);
  } catch (e) {
    return res.status(400).json({ message: 'Invalid JSON in items field' });
  }
} else {
  parsedItems = items;
}

    const newOrder = await prisma.order.create({
      data: {
        customerId:parseInt(customerId),
        orderNumber,
        title,
        status,
        startDate: startDate ? new Date(startDate) : null,
        dueDate: new Date(dueDate),
        notes,
        files: {
          create: uploadedFiles.map(f => ({
            fileName: f.filename,
            filePath: f.path,
            uploadedBy:createdBy
          }))
        },
        items: {
          create: parsedItems?.map(item => ({
            productId: parseInt(item.productId) ,
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
        files: true,
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



const getAllOrders = async(req,res)=>{
  try {
    const orders = await prisma.order.findMany({
      include: {
        customer: true, // Get Customer details
        items: {
          include: {
            product: {
              include: {
                service: {
                  include: {
                    workflow: {
                      include: {
                        stages: true, // Workflow stages
                      },
                    },
                  },
                },
              },
            },
            sizeQuantities: true,
            comments: true,
          },
        },
        files: true,
        comments: true,
      }
      
    });

    res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
const getSingleOrders = async(req,res)=>{
  try {
    const orderId=req.params.id
    const orders = await prisma.order.findUnique({
      where:{id:parseInt(orderId)},
      include: {
        customer: true, // Get Customer details
        items: {
          include: {
            product: {
              include: {
                service: {
                  include: {
                    workflow: {
                      include: {
                        stages: true, // Workflow stages
                      },
                    },
                  },
                },
              },
            },
            sizeQuantities: true,
            comments: true,
          },
        },
        files: true,
        comments: true,
      }
      
    });

    res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};






const updateOrder = async (req, res) => {
  try {
    const orderId = parseInt(req.params.id); // Order ID from URL param
    const {
      customerId,
      orderNumber,
      title,
      status ,
      startDate,
      dueDate,
      notes,
      updatedBy
    } = req.body;

    const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
        customerId: customerId ? parseInt(customerId) : undefined,
        orderNumber,
        title,
        status,
        startDate: startDate ? new Date(startDate) : undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        notes,
        updatedBy
        
       
      },
      include: {
        files: true,
        items: {
          include: {
            sizeQuantities: true,
            product: true
          }
        },
        customer: true
      }
    });

    res.status(200).json(updatedOrder);
  } catch (err) {
    console.error('Error updating order:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};



const deleteOrder = async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);

    // Optional: check existence
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!existingOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Delete the order (cascades all related records)
    await prisma.order.delete({
      where: { id: orderId },
    });

    res.status(200).json({ message: "Order deleted successfully" });
  } catch (err) {
    console.error("Delete Order Error:", err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
};


module.exports = {
  createOrder,getAllOrders,getProductColors,getSingleOrders,updateOrder,deleteOrder                                                                                   
};






