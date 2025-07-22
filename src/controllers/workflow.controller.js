const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// CREATE Workflow
exports.createWorkflow = async (req, res) => {
  try {
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    const workflow = await prisma.workflow.create({
      data: { title }
    });

    res.status(201).json(workflow);
  } catch (error) {
    console.error("Create Workflow Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET all Workflows
exports.getAllWorkflows = async (req, res) => {
  try {
    const workflows = await prisma.workflow.findMany({
      include: {
        stages: true,
        services: true
      }
    });
    res.json(workflows);
  } catch (error) {
    console.error("Get Workflows Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET a single Workflow by ID
exports.getWorkflowById = async (req, res) => {
  const { id } = req.params;

  try {
    const workflow = await prisma.workflow.findUnique({
      where: { id: parseInt(id) },
      include: {
        stages: true,
        services: true
      }
    });

    if (!workflow) {
      return res.status(404).json({ message: "Workflow not found" });
    }

    res.json(workflow);
  } catch (error) {
    console.error("Get Workflow Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// UPDATE Workflow
exports.updateWorkflow = async (req, res) => {
  const { id } = req.params;
  const { title } = req.body;

  try {
    const updatedWorkflow = await prisma.workflow.update({
      where: { id: parseInt(id) },
      data: { title }
    });

    res.json(updatedWorkflow);
  } catch (error) {
    console.error("Update Workflow Error:", error);
    if (error.code === 'P2025') {
      return res.status(404).json({ message: "Workflow not found" });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

// DELETE Workflow
exports.deleteWorkflow = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.workflow.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: "Workflow deleted successfully" });
  } catch (error) {
    console.error("Delete Workflow Error:", error);
    if (error.code === 'P2025') {
      return res.status(404).json({ message: "Workflow not found" });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};
