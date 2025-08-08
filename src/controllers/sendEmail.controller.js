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

const generateOrderStatusChangeEmail = ( comment,customer, order) => {
  const commentUrl = `https://elipsestudio.com/CustomerChecker/customercheckpage.html`;

  return {
   subject: `New Comment Added to Your Order`,
html: `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
    <h2>New Comment on Your Order</h2>
    <p>Dear ${customer.name},</p>
    <p>A new comment has been added to your order <strong>${order.orderNumber}</strong>.</p>
    <ul>
      <li><strong>Comment:</strong> ${comment.text}</li>
      <li><strong>Added At:</strong> ${new Date(comment.createdAt).toLocaleString()}</li>
    </ul>
    <p>You can use this token to view and respond to the comment:</p>
    <p style="font-weight: bold; font-size: 16px; color: #007cba;">${order.token}</p>
    <p>Click the link below to view your order and reply to the comment:</p>
    <a href="${commentUrl}" style="display:inline-block;padding:10px 20px;background:#007cba;color:#fff;text-decoration:none;border-radius:5px;">View Comment</a>
    <p>If you have any questions, feel free to contact us.</p>
    <p>Best regards,<br>Your Company Team</p>
  </div>
`,
text: `New Comment on Your Order - ${order.orderNumber}

Dear ${customer.name},

A new comment has been added to your order:
- Comment: ${comment.commentText}
- Added At: ${new Date(comment.createdAt).toLocaleString()}

You can use this token to view and respond: ${order.token}

View it here: ${commentUrl}

Best regards,
Your Company Team`

  };
};
const generateWorkFlowChangeEmail = ( comment,customer, order) => {
  const commentUrl = `https://elipsestudio.com/CustomerChecker/customercheckpage.html`;

  return {
   subject: `New Comment Added to Your Order`,
html: `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
    <h2>New Comment on Your Order</h2>
    <p>Dear ${customer.name},</p>
    <p>A new comment has been added to your order <strong>${order.orderNumber}</strong>.</p>
    <ul>
      <li><strong>Comment:</strong> ${comment.text}</li>
      <li><strong>Added At:</strong> ${new Date(comment.createdAt).toLocaleString()}</li>
    </ul>
    <p>You can use this token to view and respond to the comment:</p>
    <p style="font-weight: bold; font-size: 16px; color: #007cba;">${order.token}</p>
    <p>Click the link below to view your order and reply to the comment:</p>
    <a href="${commentUrl}" style="display:inline-block;padding:10px 20px;background:#007cba;color:#fff;text-decoration:none;border-radius:5px;">View Comment</a>
    <p>If you have any questions, feel free to contact us.</p>
    <p>Best regards,<br>Your Company Team</p>
  </div>
`,
text: `New Comment on Your Order - ${order.orderNumber}

Dear ${customer.name},

A new comment has been added to your order:
- Comment: ${comment.commentText}
- Added At: ${new Date(comment.createdAt).toLocaleString()}

You can use this token to view and respond: ${order.token}

View it here: ${commentUrl}

Best regards,
Your Company Team`

  };
};


