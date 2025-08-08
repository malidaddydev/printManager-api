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

const generateFileApprovalEmail = ( customer, order) => {
  const approvalUrl = `https://elipsestudio.com/CustomerChecker/customercheckpage.html`;

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
- Comment: ${comment.text}
- Added At: ${new Date(comment.createdAt).toLocaleString()}

You can use this token to view and respond: ${order.token}

View it here: ${commentUrl}

Best regards,
Your Company Team`

  };
};


// CREATE
exports.createComment = async (req, res) => {
  try {
    const {
      orderId,
      orderItemId,
      commentText,
      commentBy,
      parentCommentId,
      is_internal,
    } = req.body;

    if (!commentText) {
      return res.status(400).json({ message: "Comment text is required." });
    }

    const newComment = await prisma.orderComment.create({
      data: {
        orderId,
        orderItemId,
        commentText,
        commentBy,
        parentCommentId,
        is_internal,
      },
    });

    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId) },
      include: {
        
            customer: true
          
        }
      
    });

    if (!is_internal) {
      const transporter = createEmailTransporter();
    const emailContent = generateFileApprovalEmail( order.customer, order);

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: file.order.customer.email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Approval request email sent:', result.messageId);
    }

    res.status(201).json(newComment);
  } catch (error) {
    console.error("Create Comment Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }


};

// GET ALL
exports.getAllComments = async (req, res) => {
  try {
    const comments = await prisma.orderComment.findMany({
      include: {
        replies: true,
        parentComment: true,
      },
    });

    res.json(comments);
  } catch (error) {
    console.error("Fetch Comments Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET SINGLE
exports.getCommentById = async (req, res) => {
  try {
    const { id } = req.params;

    const comment = await prisma.orderComment.findUnique({
      where: { id: parseInt(id) },
      include: {
        replies: true,
        parentComment: true,
      },
    });

    if (!comment) return res.status(404).json({ message: "Comment not found" });

    res.json(comment);
  } catch (error) {
    console.error("Fetch Single Comment Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// UPDATE
exports.updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      commentText,
      is_internal,
    } = req.body;

    const updatedComment = await prisma.orderComment.update({
      where: { id: parseInt(id) },
      data: {
        commentText,
        is_internal,
        updatedAt: new Date(),
      },
    });

    res.json(updatedComment);
  } catch (error) {
    console.error("Update Comment Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// DELETE
exports.deleteComment = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.orderComment.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: "Comment deleted" });
  } catch (error) {
    console.error("Delete Comment Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
