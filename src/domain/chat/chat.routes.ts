import { Router } from 'express';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

const router = Router();
const chatService = new ChatService();
const chatController = new ChatController(chatService);

router.post('/', chatController.chat);

export default router;
