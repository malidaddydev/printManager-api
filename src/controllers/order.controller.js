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

// Helper function to validate order data
const validateOrderData = (orderData) => {
  const errors = [];
  
  if (!orderData.customer?.email) {
    errors.push("Customer email is required");
  }
  
  if (!orderData.order?.order_items || orderData.order.order_items.length === 0) {
    errors.push("At least one order item is required");
  }
  
  orderData.order?.order_items?.forEach((item, index) => {
    if (!item.product?.title) {
      errors.push(`Order item ${index + 1}: Product title is required`);
    }
    if (!item.product?.service_id) {
      errors.push(`Order item ${index + 1}: Service ID is required`);
    }
    if (!item.quantity || item.quantity <= 0) {
      errors.push(`Order item ${index + 1}: Valid quantity is required`);
    }
  });
  
  return errors;
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
        orderItems: {
          include: {
            product: {
              include: {
                service: {
                  include: {
                    workflow: {
                      include: {
                        stages: {
                          orderBy: { orderSequence: 'asc' }
                        }
                      }
                    }
                  }
                }
              }
            },
            teamBuilderDetails: true,
            workflowStates: {
              include: {
                stage: true
              }
            }
          }
        },
        activityLogs: {
          orderBy: { createdAt: 'desc' },
          take: 5 // Get only the 5 most recent logs
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate totals and format response
    const formattedOrders = orders.map(order => {
      const totalAmount = order.orderItems.reduce((sum, item) => {
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
        order_items: order.orderItems.map(item => ({
          id: item.id,
          product: {
            id: item.product.id,
            title: item.product.title,
            price: item.product.price,
            color: item.product.color,
            category: item.product.category,
            sku: item.product.sku,
            service: item.product.service?.title,
            workflow: item.product.service?.workflow?.title,
            workflowStages: item.product.service?.workflow?.stages?.map(stage => ({
              id: stage.id,
              name: stage.name,
              dueDays: stage.dueDays
            }))
          },
          quantity: item.quantity,
          size_breakdown: item.sizeBreakdown,
          team_builder_enabled: item.teamBuilderEnabled,
          price_override: item.priceOverride,
          item_notes: item.itemNotes,
          team_builder_details: item.teamBuilderDetails,
          current_workflow_state: item.workflowStates[0] // Assuming most recent is first
        })),
        recent_activity: order.activityLogs
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
    const orderId=parseInt(req.params.id)
    try {
    

    const order = await prisma.order.findUnique({
      where: { orderId },
      include: {  
        customer: true,
        orderItems: {
          include: {
            product: {
              include: {
                service: {
                  include: {
                    workflow: {
                      include: {
                        stages: {
                          orderBy: { orderSequence: 'asc' }
                        }
                      }
                    }
                  }
                }
              }
            },
            teamBuilderDetails: true,
            workflowStates: {
              include: {
                stage: true,
                assignedToUser: true
              },
              orderBy: { createdAt: 'desc' }
            }
          }
        },
        activityLogs: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Calculate total amount
    const totalAmount = order.orderItems.reduce((sum, item) => {
      const price = item.priceOverride || item.product.price;
      return sum + (price * item.quantity);
    }, 0);

    // Format workflow states with progress
    const workflowProgress = {};
    order.orderItems.forEach(item => {
      if (item.product.service?.workflow) {
        const totalStages = item.product.service.workflow.stages.length;
        const completedStages = item.workflowStates.filter(s => s.status === 'Completed').length;
        workflowProgress[item.id] = {
          completed: completedStages,
          total: totalStages,
          percentage: Math.round((completedStages / totalStages) * 100)
        };
      }
    });

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
      order_items: order.orderItems.map(item => ({
        id: item.id,
        product: {
          id: item.product.id,
          title: item.product.title,
          price: item.product.price,
          color: item.product.color,
          category: item.product.category,
          sku: item.product.sku,
          service: item.product.service?.title,
          workflow: item.product.service?.workflow?.title,
          workflowStages: item.product.service?.workflow?.stages?.map(stage => ({
            id: stage.id,
            name: stage.name,
            dueDays: stage.dueDays
          }))
        },
        quantity: item.quantity,
        size_breakdown: item.sizeBreakdown,
        team_builder_enabled: item.teamBuilderEnabled,
        price_override: item.priceOverride,
        item_notes: item.itemNotes,
        team_builder_details: item.teamBuilderDetails,
        workflow_states: item.workflowStates,
        workflow_progress: workflowProgress[item.id]
      })),
      activity_logs: order.activityLogs
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