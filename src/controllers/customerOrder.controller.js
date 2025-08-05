const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Email configuration
const createEmailTransporter = () => {
  return nodemailer.createTransport({
    // Gmail configuration (you can change this based on your email provider)
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // Your email
      pass: process.env.EMAIL_PASS  // Your app password
    }
    
    // Alternative SMTP configuration:
    /*
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
    */
  });
};

// Email template for order confirmation
const generateOrderConfirmationEmail = (order,orderNumber) => {
  const trackingUrl = `https://elipsestudio.com/CustomerChecker/customercheckpage.html`;
  
  return {
    subject: `Order Confirmation - ${orderNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f4f4f4; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .tracking-box { background-color: #e8f4f8; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .tracking-link { display: inline-block; background-color: #007cba; color: white; padding: 10px 20px; text-decoration: none; border-radius: 3px; }
          .order-details { background-color: #f9f9f9; padding: 15px; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Order Confirmation</h1>
          </div>
          
          <div class="content">
            <p>Dear ${order.customer.name},</p>
            
            <p>Thank you for your order! We've received your order and it's being processed.</p>
            
            <div class="tracking-box">
              <h3>Track Your Order</h3>
              <p><strong>Order Number:</strong> ${orderNumber}</p>
              <p><strong>Tracking Token:</strong> ${order.token}</p>
              <p>You can track your order status using the link below:</p>
              <a href="${trackingUrl}" class="tracking-link">Track Order</a>
            </div>
            
            <div class="order-details">
              <h3>Order Details</h3>
              <p><strong>Title:</strong> ${order.title}</p>
              <p><strong>Status:</strong> ${order.status}</p>
              <p><strong>Due Date:</strong> ${new Date(order.dueDate).toLocaleDateString()}</p>
              ${order.startDate ? `<p><strong>Start Date:</strong> ${new Date(order.startDate).toLocaleDateString()}</p>` : ''}
              ${order.notes ? `<p><strong>Notes:</strong> ${order.notes}</p>` : ''}
            </div>
            
            ${order.items && order.items.length > 0 ? `
            <div class="order-details">
              <h3>Order Items</h3>
              ${order.items.map(item => `
                <div style="margin-bottom: 10px; padding: 10px; border-left: 3px solid #007cba;">
                  <p><strong>${item.product ? item.product.title : 'Product'}</strong></p>
                  <p>Color: ${item.color}</p>
                  <p>Quantity: ${item.quantity}</p>
                  <p>Price: $${item.price}</p>
                </div>
              `).join('')}  
            </div>
            ` : ''}
            
            <p>If you have any questions about your order, please don't hesitate to contact us.</p>
            
            <p>Best regards,<br>Your Company Team</p>
          </div>
          
          <div class="footer">
            <p>This is an automated email. Please do not reply directly to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Order Confirmation - ${orderNumber}
      
      Dear ${order.customer.name},
      
      Thank you for your order! We've received your order and it's being processed.
      
      Order Details:
      - Order Number: ${orderNumber}
      - Tracking Token: ${order.token}
      - Title: ${order.title}
      - Status: ${order.status}
      - Due Date: ${new Date(order.dueDate).toLocaleDateString()}
      ${order.startDate ? `- Start Date: ${new Date(order.startDate).toLocaleDateString()}` : ''}
      ${order.notes ? `- Notes: ${order.notes}` : ''}
      
      Track your order: ${trackingUrl}
      
      Best regards,
      Your Company Team
    `
  };
};

// Send order confirmation email
const sendOrderConfirmationEmail = async (order,orderNumber) => {
  try {
    const transporter = createEmailTransporter();
    const emailContent = generateOrderConfirmationEmail(order,orderNumber);
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: order.customer.email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log('Order confirmation email sent:', result.messageId);
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    return { success: false, error: error.message };
  }
};

// Updated createOrder function with email functionality
const createCustomerOrder = async (req, res) => { 
  try { 
    const { 
      
      lastName,
      firstName,
      company,
      mobile,
      mobile2,
      address,
      email,
        
    customerId, 
       
      title, 
      status = 'Draft', 
      startDate, 
      dueDate, 
      notes, 
      items, 
      createdBy 
    } = req.body; 
 

const existingCustomer= await prisma.customer.findUnique({
      where: { email: email },
}
)

if (existingCustomer){



    const uploadedFiles = req.files?.map(file => ({ 
      filename: file.filename, 
      path: `/orderuploads/${file.filename}`,
      size: file.size // Add file size in bytes
    })) || []; 
 
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
    
    const enrichedItems = await Promise.all(
  parsedItems.map(async (item) => {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(item.productId) },
      include: {
        service: {
          include: {
            workflow: {
                      include: {
                        stages: {
                          include:{
                            stage:true
                          }
                        }, // Workflow stages
                      },
                    },
          }
        }
      }
    });

    


    const firstStage = product?.service?.workflow?.stages?.stage[0]?.name || 'Pending';

    return {
      productId: parseInt(item.productId),
      color: item.color,
      quantity: item.quantity,
      price: item.price,
      currentStage: firstStage,
      sizeQuantities: {
        create: item.sizeQuantities?.map(sq => ({
          Size: sq.Size,
          Price: sq.Price,
          Quantity: sq.Quantity
        })) || [],
      }
    };
  })
);
    // Generate a unique token for tracking
    const trackingToken = crypto.randomBytes(8).toString('hex').toUpperCase();
    
    const newOrder = await prisma.order.create({ 
      data: { 
        customerId: parseInt(existingCustomer.id), 
        
        title, 
        status, 
        startDate: startDate ? new Date(startDate) : null, 
        dueDate: new Date(dueDate), 
        notes, 
        files: { 
          create: uploadedFiles.map(f => ({ 
            fileName: f.filename, 
            filePath: f.path,
            size: f.size,
            uploadedBy: createdBy 
          })) 
        }, 
        items: { 
          create: enrichedItems, 
        }, 
        token: trackingToken,
        createdBy
      }, 
      include: { 
        files: true, 
        items: { 
          include: { sizeQuantities: true, product: true }, 
        }, 
        customer: true, 
      }, 
    }); 

    const newOrderNumber = `ORD-${String(newOrder.id).padStart(4, '0')}`;

await prisma.order.update({
  where: { id: newOrder.id },
  data: { orderNumber:newOrderNumber }
});


    
    
    let addOrderItemIntoActivityLog=await Promise.all(newOrder.items.map(async(item)=>{
      const activity=await prisma.activityLog.create({
  data: {
    
    orderItemId: item.id,
    action: `OrderItem Created By"`,
    performedBy: createdBy
  }
});
    }))
   
  const addOrderIntoActivityLog=await prisma.activityLog.create({
  data: {
    orderId:newOrder.id,
    
    action: `Order Created By"`,
    performedBy: createdBy
  }
});
    

await prisma.notification.create({
  data: {
    orderId:newOrder.id,
    title: 'Order Created',
    message: `New order ${newOrderNumber} created by ${createdBy} .`,
    type: 'success',
  }
});
 
    // Send confirmation email to customer
    const emailResult = await sendOrderConfirmationEmail(newOrder,newOrderNumber);
    
    if (!emailResult.success) {
      console.warn('Failed to send order confirmation email:', emailResult.error);
      // Don't fail the order creation if email fails
    }
 
    res.status(201).json({
      ...newOrder,
      emailSent: emailResult.success
    });
    
}else{

    const uploadedFiles = req.files?.map(file => ({ 
      filename: file.filename, 
      path: `/orderuploads/${file.filename}`,
      size: file.size // Add file size in bytes
    })) || []; 
 
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
    
    const enrichedItems = await Promise.all(
  parsedItems.map(async (item) => {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(item.productId) },
      include: {
        service: {
          include: {
             workflow: {
                      include: {
                        stages: {
                          include:{
                            stage:true
                          }
                        }, // Workflow stages
                      },
                    },
          }
        }
      }
    });

    


    const firstStage = product?.service?.workflow?.stages?.stage[0]?.name || 'Pending';

    return {
      productId: parseInt(item.productId),
      color: item.color,
      quantity: item.quantity,
      price: item.price,
      currentStage: firstStage,
      sizeQuantities: {
        create: item.sizeQuantities?.map(sq => ({
          Size: sq.Size,
          Price: sq.Price,
          Quantity: sq.Quantity
        })) || [],
      }
    };
  })
);
    // Generate a unique token for tracking
    const trackingToken = crypto.randomBytes(8).toString('hex').toUpperCase();
    
    const newOrder = await prisma.order.create({ 
      data: { 
        customer:{
        create: {
        lastName:lastName,
        firstName:firstName,
        company:company,
        mobile:mobile,
        mobile2:mobile,
        address:address,
        email:email
                }
        }, 
        
        title, 
        status, 
        startDate: startDate ? new Date(startDate) : null, 
        dueDate: new Date(dueDate), 
        notes, 
        files: { 
          create: uploadedFiles.map(f => ({ 
            fileName: f.filename, 
            filePath: f.path,
            size: f.size,
            uploadedBy: createdBy 
          })) 
        }, 
        items: { 
          create: enrichedItems, 
        }, 
        token: trackingToken,
        createdBy
      }, 
      include: { 
        files: true, 
        items: { 
          include: { sizeQuantities: true, product: true }, 
        }, 
        customer: true, 
      }, 
    }); 

    const newOrderNumber = `ORD-${String(newOrder.id).padStart(4, '0')}`;

await prisma.order.update({
  where: { id: newOrder.id },
  data: { orderNumber:newOrderNumber }
});


    
    
    let addOrderItemIntoActivityLog=await Promise.all(newOrder.items.map(async(item)=>{
      const activity=await prisma.activityLog.create({
  data: {
    
    orderItemId: item.id,
    action: `OrderItem Created By"`,
    performedBy: createdBy
  }
});
    }))
   
  const addOrderIntoActivityLog=await prisma.activityLog.create({
  data: {
    orderId:newOrder.id,
    
    action: `Order Created By"`,
    performedBy: createdBy
  }
});
    

await prisma.notification.create({
  data: {
    orderId:newOrder.id,
    title: 'Order Created',
    message: `New order ${newOrderNumber} created by ${createdBy} .`,
    type: 'success',
  }
});
 
    // Send confirmation email to customer
    const emailResult = await sendOrderConfirmationEmail(newOrder,newOrderNumber);
    
    if (!emailResult.success) {
      console.warn('Failed to send order confirmation email:', emailResult.error);
      // Don't fail the order creation if email fails
    }
 
    res.status(201).json({
      ...newOrder,
      emailSent: emailResult.success
    });

}
  } catch (err) { 
    console.error('Error creating order:', err); 
    res.status(500).json({ message: 'Internal server error', error: err.message }); 
  } 
};

module.exports = {
  createCustomerOrder                                                                               
};
