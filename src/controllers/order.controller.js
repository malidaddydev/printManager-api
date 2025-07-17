const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const workflowTemplates = {
"Sublimation": [
{ state: "mockup", name: "Mockup Creation", team: "design", due: "3days" },
{ state: "printout", name: "Print Production", team: "sublimation", due: "6days" },
{ state: "production", name: "Final Production", team: "production", due: "2days" }
],
"Embroidery": [
{ state: "design", name: "Design Setup", team: "design", due: "2days" },
{ state: "embroidery", name: "Embroidery", team: "embroidery", due: "4days" },
{ state: "finishing", name: "Finishing", team: "production", due: "1day" }
],
"DTF": [
{ state: "design", name: "Design Prep", team: "design", due: "2days" },
{ state: "printing", name: "DTF Printing", team: "dtf", due: "3days" },
{ state: "application", name: "Heat Application", team: "production", due: "1day" }
]
};

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
        orderType: order.order_type,
        currentState: workflowTemplates[order.order_type][0].state,
        overallStatus: "Processing",
        specifications: order.specifications,
        deliveryDate: new Date(order.delivery_date),
        totalAmount: order.order_items.reduce((sum, i) => sum + i.total_price, 0),
        specialInstructions: order.special_instructions
      }
    });

    // Step 3: Create Order Items
    const items = await Promise.all(order.order_items.map(item =>
      prisma.orderItem.create({
        data: {
          orderId: orderData.id,
          productId: item.product_id,
          serviceType: order.order_type,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          totalPrice: item.total_price,
          size: item.size,
          color: item.color,
          specifications: item.specifications
        },
        include: { product: true }
      })
    ));

    // Step 4: Create Workflow States
    const createdAt = new Date(orderData.createdDate);
    const states = await Promise.all(
      workflowTemplates[order.order_type].map((step, index) => {
        // const dueDate = new Date(createdAt);
        // dueDate.setDate(dueDate.getDate() + step.dueDays);

        return prisma.workflowState.create({
          data: {
            orderId: orderData.id,
            stateName: step.state,
            name: step.name,
            assignedTeam: step.team,
            status: "Pending",
            // dueDate,
            colorCode: step.color
          }
        });
      })
    );

    // Step 5: Return formatted response
    return res.status(201).json({
      message: "Order created successfully",
      order: {
        id: orderData.id,
        customer: customerRecord,
        order_type: orderData.orderType,
        current_state: orderData.currentState,
        overall_status: orderData.overallStatus,
        specifications: orderData.specifications,
        delivery_date: orderData.deliveryDate,
        total_amount: orderData.totalAmount,
        special_instructions: orderData.specialInstructions,
        created_date: orderData.createdDate,
        order_items: items.map(i => ({
          id: i.id,
          product: i.product,
          service_type: i.serviceType,
          quantity: i.quantity,
          unit_price: i.unitPrice,
          total_price: i.totalPrice,
          size: i.size,
          color: i.color,
          specifications: i.specifications
        })),
        workflow_states: states.map(s => ({
          state_name: s.stateName,
          name: s.name,
          assigned_team: s.assignedTeam,
          status: s.status,
          due_date: s.dueDate,
          color_code: s.colorCode
        }))
      }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Order creation failed", error: error.message });
  }
};


exports.getAllOrders=async (req,res) => {
    // const orderId=parseInt(req.params.id)
    try {

        const Order=await prisma.order.findMany({
            // where:{id:orderId},
            include:{
                customer:true,
                items:{
                    include:{
                        product:true
                    }
                },
                workflowStates:true,
                files:true,
                comments:true
            }
        })

        if (!Order) {
            res.status(400).json({error:"no order found"})
        }
        res.status(200).json({
            message:"success",
            order:{
                id:Order.id,
                customer: Order.customer,
                order_type: Order.orderType,
                current_state: Order.currentState,
                overall_status: Order.overallStatus,
                specifications: Order.specifications,
                delivery_date: Order.deliveryDate,
                total_amount: Order.totalAmount,
                special_instructions: Order.specialInstructions,
                created_date: Order.createdDate,
                order_items:Order.items.map((item)=>(
                    {
                        id: item.id,
                        service_type: item.serviceType,
                        quantity: item.quantity,
                        unit_price: item.unitPrice,
                        total_price: item.totalPrice,
                        size: item.size,
                        color: item.color,
                        specifications: item.specifications,
                        product: item.product
                    }
                )
                   
                ),
                workflow_states:Order.workflowStates.map((state)=>(
                    {
                        state_name: state.stateName,
                        name: state.name,
                        assigned_team: state.assignedTeam,
                        status: state.status,
                        due_date: state.dueDate,
                        color_code: state.colorCode
                })),
                files:Order.files.map((file)=>({
                    id: file.id,
                    file_path: file.filePath,
                    file_type: file.fileType,
                    uploaded_by: file.uploadedBy,
                    upload_date: file.uploadDate,
                    is_approved: file.isApproved,
                    approval_date: file.approvalDate

                })),
                comments:Order.comments.map((comment)=>(
                    {
                        id: comment.id,
                        comment_text: comment.commentText,
                        comment_type: comment.commentType,
                        created_by: comment.createdBy,
                        created_at: comment.createdAt
                }))
            }
        })
    } catch (error) {
        res.status(400).json({error:error.message})
    }
}

exports.getOrder=async (req,res) => {
    const orderId=parseInt(req.params.id)
    try {

        const Order=await prisma.order.findUnique({
            where:{id:orderId},
            include:{
                customer:true,
                items:{
                    include:{
                        product:true
                    }
                },
                workflowStates:true,
                files:true,
                comments:true
            }
        })

        if (!Order) {
            res.status(400).json({error:"no order found"})
        }
        res.status(200).json({
            message:"success",
            order:{
                id:Order.id,
                customer: Order.customer,
                order_type: Order.orderType,
                current_state: Order.currentState,
                overall_status: Order.overallStatus,
                specifications: Order.specifications,
                delivery_date: Order.deliveryDate,
                total_amount: Order.totalAmount,
                special_instructions: Order.specialInstructions,
                created_date: Order.createdDate,
                order_items:Order.items.map((item)=>(
                    {
                        id: item.id,
                        service_type: item.serviceType,
                        quantity: item.quantity,
                        unit_price: item.unitPrice,
                        total_price: item.totalPrice,
                        size: item.size,
                        color: item.color,
                        specifications: item.specifications,
                        product: item.product
                    }
                )
                   
                ),
                workflow_states:Order.workflowStates.map((state)=>(
                    {
                        state_name: state.stateName,
                        name: state.name,
                        assigned_team: state.assignedTeam,
                        status: state.status,
                        due_date: state.dueDate,
                        color_code: state.colorCode
                })),
                files:Order.files.map((file)=>({
                    id: file.id,
                    file_path: file.filePath,
                    file_type: file.fileType,
                    uploaded_by: file.uploadedBy,
                    upload_date: file.uploadDate,
                    is_approved: file.isApproved,
                    approval_date: file.approvalDate

                })),
                comments:Order.comments.map((comment)=>(
                    {
                        id: comment.id,
                        comment_text: comment.commentText,
                        comment_type: comment.commentType,
                        created_by: comment.createdBy,
                        created_at: comment.createdAt
                }))
            }
        })
    } catch (error) {
        res.status(400).json({error:error.message})
    }
}