const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const workflowTemplates = {
"Sublimation": [
{ state: "mockup", name: "Mockup Creation", team: "design", due: "3days", color:'red' },
{ state: "printout", name: "Print Production", team: "sublimation", due: "6days", color:'yellow' },
{ state: "production", name: "Final Production", team: "production", due: "2days", color:'green' }
],
"Embroidery": [
{ state: "design", name: "Design Setup", team: "design", due: "2days", color:'red' },
{ state: "embroidery", name: "Embroidery", team: "embroidery", due: "4days", color:'yellow' },
{ state: "finishing", name: "Finishing", team: "production", due: "1day", color:'green' }
],
"DTF": [
{ state: "design", name: "Design Prep", team: "design", due: "2days", color:'red' },
{ state: "printing", name: "DTF Printing", team: "dtf", due: "3days", color:'yellow' },
{ state: "application", name: "Heat Application", team: "production", due: "1day", color:'green' }
]
};








// create order









exports.createOrder = async (req, res) => {
  try {
    const { customer, order } = req.body;

    // Step 1: Create or find customer
    const existingCustomer = await prisma.customer.findFirst({
      where: { email: customer.email }
    });

    const customerRecord = existingCustomer || await prisma.customer.create({ data: customer });

    // Step 2: Create Order
    const orderData = await prisma.order.create({
      data: {
        customerId: customerRecord.id,
        orderTitle: order.order_title,
        dueDate: new Date(order.due_date),
        status: order.status || "Draft",
        notes: order.notes,
        createdBy: req.user?.id || "system",
        updatedBy: req.user?.id || "system"
      }
    });

    // Step 3: Create Order Items with Products
    const createdItems = await Promise.all(
      order.order_items.map(async (item) => {
        // First create the product for this order item
        const product = await prisma.product.create({
          data: {
            title: item.product.title,
            price: item.product.price,
            color: item.product.color,
            category: item.product.category, // "Goods with Service" or "Service"
            serviceId: item.product.service_id,
            sku: item.product.sku,
            turnaroundDays: item.product.turnaround_days,
            requiresCustomerGarment: item.product.requires_customer_garment || false,
            active: true,
            createdBy: req.user?.id || "system",
            updatedBy: req.user?.id || "system",
            stages: {
                    create: item.product.stages.map((stage, index) => ({
                      state: stage.state,
                      name: stage.name,
                      dueDays: stage.dueDays,
                      orderSequence: stage.orderSequence || index + 1,
                      createdAt: new Date(),
                      updatedAt: new Date(),
                      createdBy: req.user?.id || "system",
                      updatedBy: req.user?.id || "system"
                    }))
                  }
      },
      include: { stages: true }
    });

        


        // Then create the order item linking to the product
        const orderItem = await prisma.orderItem.create({
          data: {
            orderId: orderData.id,
            productId: product.id,
            quantity: item.quantity,
            sizeBreakdown: item.size_breakdown, // JSON string like "S:3,M:5,L:2"
            teamBuilderEnabled: item.team_builder_enabled || false,
            priceOverride: item.price_override,
            itemNotes: item.item_notes,
            createdBy: req.user?.id || "system",
            updatedBy: req.user?.id || "system"
          },
          include: { 
            product: {
              include: {
                service:true,
                        stages: {
                          orderBy: { orderSequence: 'asc' }
                        }
                      }
                    }
                  }
                

              })
                  
                
              
            
          
        

        // Update the product to reference the order item (1:1 relationship)
        await prisma.product.update({
          where: { id: product.id },
          data: { orderItemId: orderItem.id }
        });

        return orderItem;
      })
    );

    

    

   // Step 4: Calculate total amount
const totalAmount = createdItems.reduce((sum, item) => {
  const price = item.priceOverride ?? item.product?.price ?? 0;
  return sum + (item.quantity * price);
}, 0);

// Update order with total amount
await prisma.order.update({
  where: { id: orderData.id },
  data: { totalAmount }
});

    // Step 8: Return formatted response
    return res.status(201).json({
  message: "Order created successfully",
  order: {
    id: orderData.id,
    title: orderData.orderTitle,
    due_date: orderData.dueDate,
    status: orderData.status,
    notes: orderData.notes,
    total_amount: totalAmount,
    created_at: orderData.createdAt,
    created_by: orderData.createdBy,
    customer: {
      id: customerRecord.id,
      name: customerRecord.name,
      email: customerRecord.email,
      phone: customerRecord.phone,
      address: customerRecord.address
    },
    order_items: createdItems.map(item => ({
      id: item.id,
      quantity: item.quantity,
      size_breakdown: item.sizeBreakdown,
      team_builder_enabled: item.teamBuilderEnabled,
      price_override: item.priceOverride,
      item_notes: item.itemNotes,
      product: {
        id: item.product.id,
        title: item.product.title,
        price: item.product.price,
        color: item.product.color,
        category: item.product.category,
        sku: item.product.sku,
        service: item.product.service?.title || null,
        stages: item.product.stages?.map(stage => ({
            state: stage.state,
            name: stage.name,
            due_days: stage.dueDays,
            order_sequence: stage.orderSequence
          })) || []
      }
    }))
  }
});

  } catch (error) {
    console.error('Order creation error:', error);
    return res.status(500).json({ 
      message: "Order creation failed", 
      error: error.message 
    });
  }
};





// get All orders










exports.getAllOrders = async (req, res) => {
  try {
    const { status, customerId, startDate, endDate } = req.query;
    
    const where = {};
    
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const orders = await prisma.order.findMany({
      where,
      include: {  
        customer: true,
        items: {
          include: {
            product: {
              include: {
                service:true,
                stages: {
                  orderBy: { orderSequence: 'asc' }
                }
              }
            },
            comments:true
           
            
          }
        },
        comments:true
       
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate totals and format response
    const formattedOrders = orders.map(order => {
      const totalAmount = order.items.reduce((sum, item) => {
        const price = item.priceOverride || item.product.price;
        return sum + (price * item.quantity);
      }, 0);

      return {
        id: order.id,
      customer: order.customer,
      order_title: order.orderTitle,
      due_date: order.dueDate,
      status: order.status,
      notes: order.notes,
      total_amount: totalAmount,
      created_date: order.createdAt,
      created_by: order.createdBy,
      order_items: order.items.map(item => ({
        id: item.id,
        product: {
        id: item.product.id,
        title: item.product.title,
        price: item.product.price,
        color: item.product.color,
        category: item.product.category,
        sku: item.product.sku,
        service: item.product.service?.title || null,
        stages: item.product.stages?.map(stage => ({
            state: stage.state,
            name: stage.name,
            due_days: stage.dueDays,
            order_sequence: stage.orderSequence
          })) || []
      },
        quantity: item.quantity,
        size_breakdown: item.sizeBreakdown,
        team_builder_enabled: item.teamBuilderEnabled,
        price_override: item.priceOverride,
        item_notes: item.itemNotes,
        comments:item.comments
        
      })),
      comments:order.comments
      };
    });

    return res.status(200).json({
      message: "Orders retrieved successfully",
      count: formattedOrders.length,
      orders: formattedOrders
    });

  } catch (error) {
    console.error('Get orders error:', error);
    return res.status(500).json({ 
      message: "Failed to retrieve orders", 
      error: error.message 
    });
  }
};








// get a single order













exports.getOrder=async (req,res) => {
  try {
    
    const {id}=req.params

    const order = await prisma.order.findUnique({
      where: { id:parseInt(id) },
      include: {  
        customer: true,
        items: {
          include: {
            product: {
              include: {
                service:true,
                stages: {
                  orderBy: { orderSequence: 'asc' }
                }
              }
            },
            comments:true
           
            
          }
        },
        comments:true
       
      }
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Calculate total amount
    const totalAmount = order.items.reduce((sum, item) => {
      const price = item.priceOverride || item.product.price;
      return sum + (price * item.quantity);
    }, 0);

    

    // Format response
    const formattedOrder = {
      id: order.id,
      customer: order.customer,
      order_title: order.orderTitle,
      due_date: order.dueDate,
      status: order.status,
      notes: order.notes,
      total_amount: totalAmount,
      created_date: order.createdAt,
      created_by: order.createdBy,
      order_items: order.items.map(item => ({
        id: item.id,
        product: {
        id: item.product.id,
        title: item.product.title,
        price: item.product.price,
        color: item.product.color,
        category: item.product.category,
        sku: item.product.sku,
        service: item.product.service?.title || null,
        stages: item.product.stages?.map(stage => ({
            state: stage.state,
            name: stage.name,
            due_days: stage.dueDays,
            order_sequence: stage.orderSequence
          })) || []
      },
        quantity: item.quantity,
        size_breakdown: item.sizeBreakdown,
        team_builder_enabled: item.teamBuilderEnabled,
        price_override: item.priceOverride,
        item_notes: item.itemNotes,
        comments:item.comments
        
      })),
      comments:order.comments
      
    };

    return res.status(200).json({
      message: "Order retrieved successfully",
      order: formattedOrder
    });

  } catch (error) {
    console.error('Get single order error:', error);
    return res.status(500).json({ 
      message: "Failed to retrieve order", 
      error: error.message 
    });
  }
}





// delete single order 
exports.deleteOrder=async (req,res) => {
    try {
        const { id } = req.params;
        const order=await prisma.order.delete({
            where:{id:Number(id)}
        });
         res.status(200).json({ message: "User deleted successfully", order });
    } catch (error) {
         res.status(400).json({ error: error.message });
    }
}












exports.createOrderComment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { commentText, parentCommentId, orderItemId, commentBy, is_internal } = req.body;

    let publicComment={
      commentText,
      commentBy: commentBy || req.user?.username || 'Anonymous',
      orderId: parseInt(orderId),
      orderItemId: orderItemId ? parseInt(orderItemId) : null,
      parentCommentId: parentCommentId ? parseInt(parentCommentId) : null
      

    }
    // Validate required fields
    if (!commentText) {
      return res.status(400).json({ error: 'Comment text is required' });
    }
    if (is_internal) {
      publicComment.is_internal=is_internal
    }

    const comment = await prisma.orderComment.create({
      data: publicComment
        
      
      // include: {
      //   order: {
      //     select: { id: true, orderTitle: true }
      //   },
      //   orderItem: {
      //     select: { id: true, productName: true }
      //   },
      //   parentComment: {
      //     select: { id: true, commentText: true }
      //   }
      // }
    });

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      comment
    });

  } catch (error) {
    console.error('Error creating order comment:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to create comment' 
    });
  }
};