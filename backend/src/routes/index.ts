import express from 'express';
import candidatesRouter from './candidates';
import interviewsRouter from './interviews';
import hrUsersRouter from './hr-users';
import communicationsRouter from './communications';
import dashboardRouter from './dashboard';
import notificationsRouter from './notifications';
import aiRouter from './ai';
import workflowRouter from './workflow';
import reportsRouter from './reports';
import chatRouter from './chat';
import { smsTestRouter } from './sms-test';

const router = express.Router();

router.use('/candidates', candidatesRouter);
router.use('/interviews', interviewsRouter);
router.use('/hr-users', hrUsersRouter);
router.use('/communications', communicationsRouter);
router.use('/dashboard', dashboardRouter);
router.use('/notifications', notificationsRouter);
router.use('/ai', aiRouter);
router.use('/workflow', workflowRouter);
router.use('/reports', reportsRouter);
router.use('/chat', chatRouter);
router.use('/sms-test', smsTestRouter);

export default router;