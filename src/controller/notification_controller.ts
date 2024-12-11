import { Response, Request } from "express";
import { Notification } from "../models/Notification";

export const getUserNotification = async (
  request: Request,
  response: Response
) => {
  try {
    const { id: userId, role } = request.user as { id: string; role: string };

    const notification = await Notification.findAll({
      where: {
        recipientId: userId,
        recipientType: role.toLowerCase(),
      },
    });

    // check if cleaner has any notification
    if (!notification) {
      return response.status(404).json({
        status: 404,
        message: "No notification for this user",
      });
    }

    // Respond with the cleaner notification data
    response.status(200).json({
      status: 200,
      message: "Notification retrieved successfully.",
      notification,
    });
  } catch (error: any) {
    console.error(error);
    response.status(500).json({
      status: 500,
      message: "Error retrieving user notification",
      error: error.message,
    });
  }
};
