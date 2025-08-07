const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');
const nodemailer = require('nodemailer');



exports.getSettings = async (req, res) => {
  const setting = await prisma.organizationSetting.findUnique({ where: { id: 1 } });
  res.json(setting);
};

exports.updateSettings = async (req, res) => {
  const { name, address, email, contactNumber } = req.body;
  let logo;

 
  
  if (req.file) {
    logo = req.file.path;
  }

  try {
    const updated = await prisma.organizationSetting.update({
      where: { id: 1 },
      data: {
        name,
        address,
        email,
        contactNumber,
        ...(logo && { logo })
      }
    });
    res.json({ message: 'Settings updated', data: updated });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
};





exports.createSettings = async (req, res) => {
  const { name, address, email, contactNumber } = req.body;
  let logo;

 
  
  if (req.file) {
    logo = `/orderuploads/${req.file.filename}`;
  }

  try {
    const created = await prisma.organizationSetting.create({
      
      data: {
        name,
        address,
        email,
        contactNumber,
        ...(logo && { logo })
      }
    });
    res.json({ message: 'Settings created', data: created });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
};