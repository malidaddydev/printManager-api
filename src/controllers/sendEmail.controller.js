const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const nodemailer = require('nodemailer');

const createEmailTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};


const generateWorkFlowChangeEmail = (orderItem, customer, order,currentStage) => {
  const orderItemUrl = `https://elipsestudio.com/CustomerChecker/customercheckpage.html`;

  return {
    subject: `Workflow Update for Your Order Item`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
        <h2>Workflow Stage Changed</h2>
        <p>Dear ${customer.firstName} ${customer.lastName},</p>
        <p>The workflow stage for one of your items in order <strong>${order.orderNumber}</strong> has been updated.</p>
        <ul>
          <li><strong>Product:</strong> ${orderItem.product?.title || "N/A"}</li>
          <li><strong>Color:</strong> ${orderItem.color || "N/A"}</li>
          <li><strong>New Stage:</strong> ${currentStage || "N/A"}</li>
          
        </ul>
        <p>You can use this token to view the order details:</p>
        <p style="font-weight: bold; font-size: 16px; color: #007cba;">${order.token}</p>
        <p>Click the link below to view your order and track the progress:</p>
        <a href="${orderItemUrl}" style="display:inline-block;padding:10px 20px;background:#007cba;color:#fff;text-decoration:none;border-radius:5px;">View Order</a>
        <p>If you have any questions, feel free to contact us.</p>
        <p>Best regards,<br>Your Company Team</p>
      </div>
    `,
    text: `Workflow Stage Changed - Order ${order.orderNumber}

Dear ${customer.firstName} ${customer.lastName},

The workflow stage for one of your items in order ${order.orderNumber} has been updated.

Product: ${orderItem.product?.name || "N/A"}
Color: ${orderItem.color || "N/A"}
Quantity: ${orderItem.quantity}
New Stage: ${orderItem.currentStage || "N/A"}
Updated At: ${new Date().toLocaleString()}
Updated By: ${orderItem.updatedBy || "Our Team"}

You can use this token to view the details: ${order.token}

View your order here: ${orderItemUrl}

Best regards,
Your Company Team`
  };
};



const workflowStatusChange=async(req,res)=>{

     try {
    const { id } = req.params;
    const {
      
      currentStage,
     
      updatedBy,
      // Optional: new list of sizes to replace
    } = req.body;

    const existingOrderItem = await prisma.orderItem.findUnique({
      where: { id: parseInt(id) },
      include: { order:{
        include:{
            customer:true
        }
      },
    product:true },
    });

    if (!existingOrderItem) {
      return res.status(404).json({ message: 'OrderItem not found' });
    }

    // Update main order item fields
    const updatedOrderItem = await prisma.orderItem.update({
      where: { id: parseInt(id) },
      data: {
        
        currentStage,
        
        updatedBy,
      },
    });

    const transporter = createEmailTransporter();
    const emailContent = generateWorkFlowChangeEmail(existingOrderItem, existingOrderItem.order.customer, existingOrderItem.order,currentStage);

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: existingOrderItem.order.customer.email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text
    };

    const resultDeEmail = await transporter.sendMail(mailOptions);
    
    const result = await prisma.orderItem.findUnique({
      where: { id: parseInt(id) },
      
    });

    res.status(200).json(result);
  } catch (error) {
    console.error('Update OrderItem Error:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
    

}







const orderStatusChange=(req,res)=>{

    

}









module.exports = {
    workflowStatusChange,orderStatusChange                                                  
};
