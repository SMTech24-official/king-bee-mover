import catchAsync from '../../../shared/catchAsync';
import pick from '../../../shared/pick';
import sendResponse from '../../../shared/sendResponse';
import { notificationServices } from './notification.service';

const sendSingleNotification = catchAsync(async (req: any, res: any) => {
  const notification = await notificationServices.sendSingleNotification(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'notification sent successfully',
    data: notification,
  });
});

const sendNotifications = catchAsync(async (req: any, res: any) => {
  const notifications = await notificationServices.sendNotifications(req);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'notifications sent successfully',
    data: notifications,
  });
});

const getNotifications = catchAsync(async (req: any, res: any) => {
  const notifications = await notificationServices.getNotificationsFromDB(req);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Notifications retrieved successfully',
    data: notifications,
  });
});

const getSingleNotificationById = catchAsync(async (req: any, res: any) => {
  const notificationId = req.params.notificationId;
  const notification = await notificationServices.getSingleNotificationFromDB(
    req,
    notificationId,
  );

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Notification retrieved successfully',
    data: notification,
  });
});

const sendNotificationForAllDrivers = catchAsync(async (req: any, res: any) => {
  const notification = await notificationServices.sendNotificationForAllDrivers(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'notification sent successfully for all drivers',
    data: notification,
  });
});

const getAllNotificationsForAdmin = catchAsync(async (req: any, res: any) => { 
  const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder'])
  const notifications = await notificationServices.getAllNotificationsForAdmin(options);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'All notifications retrieved successfully for admin',
    data: notifications,
  });
});

export const notificationController = {
   sendSingleNotification,
  sendNotifications,
  getNotifications,
  getSingleNotificationById,
  sendNotificationForAllDrivers,
  getAllNotificationsForAdmin,
};
