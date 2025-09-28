import express from 'express';
import { AIController } from './ai.controller';

const router = express.Router();
const aiController = new AIController();

// AI Chat endpoint
router.post('/chat', aiController.sendMessage);

// AI Health check
router.get('/health', aiController.healthCheck);

export default router;


