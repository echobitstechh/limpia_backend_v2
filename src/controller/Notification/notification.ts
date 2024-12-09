import { Response, Request } from "express";
import {
  Notification,
  NotificationType,
} from "../../models/Notification/notification";
import { Booking } from "@src/models/Booking";
import { GenericStatusConstant, UserRole } from "@src/models/enum/enums";
import { Property } from "@src/models/Property";
import { handleAcceptRejectBookingNotification } from "@src/util/notification-helper-func";

export const getAllCleanersNotification = async (
  request: Request,
  response: Response
) => {
  try {
    const { role } = request.user as { id: string; role: string };

    if (role !== "Cleaner") {
      return response.status(403).json({
        status: 403,
        message: "Unauthorized access. Invalid role.",
      });
    }

    const notifications = await Notification.findAll({
      where: {
        recipientType: "cleaner",
      },
    });

    // Check if notifications exist
    if (!notifications || notifications.length === 0) {
      return response.status(404).json({
        status: 404,
        message: "No notifications found",
      });
    }

    // Respond with the notifications data
    response.status(200).json({
      status: 200,
      message: "Notifications retrieved successfully.",
      notifications,
    });
  } catch (error: any) {
    console.error(error);
    response.status(500).json({
      status: 500,
      message: "Error retrieving notifications.",
      error: error.message,
    });
  }
};

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

// Function for testing booking action notification

// export const testBookingActionNotification = async (
//   req: Request,
//   res: Response
// ) => {
//   try {
//     const { action } = req.body;

//     if (!action) {
//       return res.status(400).json({
//         status: 400,
//         message: "Action is required",
//       });
//     }

//     const booking = await Booking.findOne({
//       where: {
//         status: GenericStatusConstant.Active,
//       },
//     });

//     if (!booking) {
//       return res.status(404).json({
//         status: 404,
//         message: "Booking not found",
//       });
//     }

//     const property = await Property.findOne({
//       where: {
//         id: booking.propertyId,
//       },
//     });

//     if (!property) {
//       return res.status(404).json({
//         status: 404,
//         message: "Property not found",
//       });
//     }

//     handleAcceptRejectBookingNotification(booking, UserRole.HomeOwner, action);

//     return res.status(201).json({
//       status: 201,
//       message: "Notification sent successfully",
//     });
//   } catch (error: any) {
//     return res.status(500).json({
//       status: 500,
//       error: `Error sending message: ${error.message}`,
//     });
//   }
// };
