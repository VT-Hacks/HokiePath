import { Request, Response, NextFunction } from 'express';
import { ChatService } from './chat.service';
import { APIError } from '../../common/errors';

export class ChatController {
  constructor(private readonly service: ChatService) {
    if (!service) throw new APIError('Chat service not provided');
  }

  chat = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { user_id, message, subject } = req.body;

      if (!user_id || !message) throw new APIError('user_id and message are required');

      const result = await this.service.chatWithChad(user_id, message);
      res.status(200).json(result);
    } catch (error) {
      console.error('Chat error:', error);
      return next(error);
    }
  };
}
