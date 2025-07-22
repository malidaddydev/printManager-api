const express = require('express');
const router = express.Router();
const workflowController = require('../controllers/workflow.controller');

router.post('/', workflowController.createWorkflow);
router.get('/', workflowController.getAllWorkflows);
router.get('/:id', workflowController.getWorkflowById);
router.put('/:id', workflowController.updateWorkflow);
router.delete('/:id', workflowController.deleteWorkflow);

module.exports = router;
