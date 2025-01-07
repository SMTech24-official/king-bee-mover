import { z } from 'zod';

const sendNotificationSchema = z.object({
  body: z.object({
    title: z.string({
      required_error: 'title is required',
    }),
    body: z.string({
      required_error: 'body is required',
    }),
  }),
});

export const notificationValidation = {
  sendNotificationSchema,
};
