const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/notifications?userId=123
exports.getNotifications = async (req, res) => {
 

  try {
    const notifications = await prisma.notification.findMany({
      
      orderBy: { createdAt: 'desc' }
    });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

// PUT /api/notifications/:id/read
exports.markAsRead = async (req, res) => {
  const { id } = req.params;

  try {
    const updated = await prisma.notification.update({
      where: { id: parseInt(id) },
      data: { isRead: true }
    });
    res.json({ message: 'Notification marked as read', notification: updated });
  } catch (error) {
    res.status(404).json({ error: 'Notification not found' });
  }
};

// PUT /api/notifications/read-all/:userId
exports.markAllAsRead = async (req, res) => {
  const { userId } = req.params;

  try {
    await prisma.notification.updateMany({
      where: { userId: parseInt(userId), isRead: false },
      data: { isRead: true }
    });
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update notifications' });
  }
};
