import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { HandleErrorWithLogger } from './common/errors';
import { httpLogger } from './common/logger';
import courseRoutes from './domain/courses/course.routes';
import careerRoutes from './domain/careers/career.routes';
import chatRoutes from './domain/chat/chat.routes';

const app = express();
app.use(httpLogger);
app.use(helmet());
app.use(cors());
app.use((req, res, next) => {
 if (req.method !== 'GET') {
   express.json()(req, res, next);
 } else {
   next();
 }
});
app.use((req, res, next) => {
 console.log(`METHOD: ${req.method}, BODY:`, req.body);
 next();
});
app.use(express.urlencoded({ extended: true }));
app.get('/api/stream-course-summary', async (req, res) => {});
app.get('/api/v1/health', (req, res) => {
 res.status(200).json({ message: 'Server is Healthy😉' });
});
app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/careers', careerRoutes);
app.use("/api/v1/chat", chatRoutes);


app.use(HandleErrorWithLogger);
export default app;
