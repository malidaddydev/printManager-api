const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Helper function to generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      is_admin: user.is_admin,
      is_manager: user.is_manager,
      is_member: user.is_member
    },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Check if user exists
    const user = await prisma.users.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 2. Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 3. Generate JWT token
    const token = generateToken(user);

    // 4. Update last login time
    await prisma.users.update({
      where: { id: user.id },
      data: { last_login_at: new Date() }
    });

    // 5. Return user data (without password) and token
    const { password_hash, ...userData } = user;
    res.status(200).json({
      ...userData,
      token
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.registerUser = async (req, res) => {
  try {
    const { username, email, password, first_name, last_name } = req.body;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.users.create({
      data: {
        username,
        email,
        password_hash: hashedPassword,
        first_name,
        last_name,
        // Default values will be applied from Prisma schema
      },
    });

    const { password_hash, ...userData } = user;
    const token = generateToken(user);

    res.status(201).json({
      ...userData,
      token
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};