const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const path = require('path');

// Create Product with uploaded files
exports.createProduct = async (req, res) => {
  try {
    const { title, unitPrice, serviceId, category, colorOptions } = req.body;

    if (!title || !unitPrice || !serviceId || !category) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Save uploaded files
    const uploadedFiles = req.files?.map(file => ({
      filename: file.filename,
      path: `/productuploads/${file.filename}`
    })) || [];

    const newProduct = await prisma.product.create({
      data: {
        title,
        unitPrice: parseFloat(unitPrice),
        serviceId: parseInt(serviceId),
        category,
        colorOptions: colorOptions ? JSON.parse(colorOptions) : [],
        files: {
          create: uploadedFiles.map(f => ({
            filename: f.filename,
            filepath: f.path,
            productId: 0 // placeholder
          }))
        }
      },
      include: {
        files: true
      }
    });

    res.status(201).json(newProduct);
  } catch (error) {
    console.error("Create Product Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        files: true,
        service: true
      }
    });
    res.json(products);
  } catch (error) {
    console.error("Get Products Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get single product
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
      include: {
        files: true,
        service: true
      }
    });

    if (!product) return res.status(404).json({ message: "Product not found" });

    res.json(product);
  } catch (error) {
    console.error("Get Product Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update product
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, unitPrice, serviceId, category, colorOptions } = req.body;

    const updatedProduct = await prisma.product.update({
      where: { id: parseInt(id) },
      data: {
        title,
        unitPrice: parseFloat(unitPrice),
        serviceId: parseInt(serviceId),
        category,
        colorOptions: colorOptions ? JSON.parse(colorOptions) : undefined
      }
    });

    res.json(updatedProduct);
  } catch (error) {
    console.error("Update Product Error:", error);
    if (error.code === 'P2025') {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.product.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Delete Product Error:", error);
    if (error.code === 'P2025') {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};
