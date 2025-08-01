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
        <p>You can use this token to track and approve file ${order.token}</p>
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

const sendFileApprovalEmail = async (req, res) => {
  const fileId = req.params.id;

  try {
    const file = await prisma.orderFile.findUnique({
      where: { id: parseInt(fileId) },
      include: {
        order: {
          include: {
            customer: true
          }
        }
      }
    });

    if (!file || !file.order || !file.order.customer) {
      return res.status(404).json({ message: "File, order, or customer not found" });
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

    return res.status(200).json({ message: 'Approval email sent', messageId: result.messageId });
  } catch (error) {
    console.error('Error sending approval request email:', error);
    return res.status(500).json({ message: error.message || 'Something went wrong' });
  }
};




const customerStatusUpdate = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      productId,
      orderId,
      status
    } = req.body;

    const existing = await prisma.orderFile.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existing) {
      return res.status(404).json({ message: 'OrderFile not found' });
    }

    let fileData = {};
    if (req.file) {
      fileData = {
        fileName: req.file.filename,
        filePath: `/uploads/orderfiles/${req.file.filename}`,
      };
    }

    const updated = await prisma.orderFile.update({
      where: { id: parseInt(id) },
      data: {
        status,
        
      },
    });

   

    res.status(200).json(updated);
  } catch (error) {
    console.error('Update OrderFile Error:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};







module.exports = { sendFileApprovalEmail,customerStatusUpdate };



