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

const generateFileApprovalEmail = (file, customer, order) => {
  const approvalUrl = `https://elipsestudio.com/CustomerChecker/customercheckpage.html`;

  return {
    subject: `Approval Needed: File - ${file.fileName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
        <h2>File Approval Request</h2>
        <p>Dear ${customer.name},</p>
        <p>Please review and approve the file listed below associated with your order <strong>${order.orderNumber}</strong>.</p>
        <ul>
          <li><strong>File:</strong> ${file.fileName}</li>
          <li><strong>Uploaded At:</strong> ${new Date(file.uploadedAt).toLocaleString()}</li>
        </ul>
        <p>You can view and approve it by clicking the link below:</p>
        <a href="${approvalUrl}" style="display:inline-block;padding:10px 20px;background:#007cba;color:#fff;text-decoration:none;border-radius:5px;">Review & Approve</a>
        <p>If you have any questions, feel free to contact us.</p>
        <p>Best regards,<br>Your Company Team</p>
      </div>
    `,
    text: `File Approval Request - ${file.fileName}

Dear ${customer.name},

Please review and approve the file for your order ${order.orderNumber}:
- File: ${file.fileName}
- Uploaded At: ${new Date(file.uploadedAt).toLocaleString()}

Review it here: ${approvalUrl}

Best regards,
Your Company Team`
  };
};

const sendFileApprovalEmail = async (fileId) => {
  try {
    const file = await prisma.orderFile.findUnique({
      where: { id: fileId },
      include: {
        order: {
          include: {
            customer: true
          }
        }
      }
    });

    if (!file || !file.order || !file.order.customer) {
      throw new Error("File, order, or customer not found");
    }

    const transporter = createEmailTransporter();
    const emailContent = generateFileApprovalEmail(file, file.order.customer, file.order);

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: file.order.customer.email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Approval request email sent:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending approval request email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = { sendFileApprovalEmail };
