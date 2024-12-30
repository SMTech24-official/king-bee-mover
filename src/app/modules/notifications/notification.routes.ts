import express from 'express';
import { notificationController } from './notification.controller';
import auth from '../../middlewares/auth';
import { notificationValidation } from './notification.validation';
import validateRequest from '../../middlewares/validateRequest';
import { UserRole } from '@prisma/client';

const router = express.Router();

router.post('/send-notification-to-drivers',
  auth(),
  validateRequest(notificationValidation.sendNotificationSchema),
  notificationController.sendNotificationForAllDrivers
);

router.post(
  '/',
  auth(),
  notificationController.sendNotifications,
);

router.get('/admin',
  auth(UserRole.Admin),
  notificationController.getAllNotificationsForAdmin
);

router.post(
  '/:userId',
  auth(),
  validateRequest(notificationValidation.sendNotificationSchema),
  notificationController.sendSingleNotification,
);

router.get('/', auth(), notificationController.getNotifications);

router.get(
  '/:notificationId',
  auth(),
  notificationController.getSingleNotificationById,
);



export const notificationsRoute = router;
