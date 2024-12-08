import { Booking } from "@src/models/Booking";
import {
  BookingAction,
  BookingStatusConstant,
  UserRole,
} from "@src/models/enum/enums";
import { Property } from "@src/models/Property";
import { handleAcceptRejectBookingNotification } from "@src/util/notification-helper-func";
import { Request, Response } from "express";

export const homeOwnerAction = async (req: Request, res: Response) => {
  try {
    const { id, role } = req.user as { id: string; role: string };

    const { action, newDatetime, reason, bookingId } = req.body;

    if (role !== UserRole.HomeOwner) {
      return res.status(403).json({
        status: 403,
        message: "Only homeowner can perform this booking actions",
      });
    }

    if (!Object.values(BookingAction).includes(action)) {
      return res.status(400).json({
        status: 400,
        message: "Accepted actions are: cancel, renotify or reschedule",
      });
    }

    // Find the booking based on the booking id from the req.body and if it's inactive (already accepted by a cleaner)

    const booking = await Booking.findOne({
      where: {
        id: bookingId,
      },
    });

    if (!booking) {
      return res.status(404).json({
        status: 404,
        message: "Booking not found",
      });
    }

    // Confirm booking belongs to current user

    const property = await Property.findOne({
      where: {
        id: booking?.propertyId,
        ownerId: id,
      },
    });

    if (!property) {
      return res.status(404).json({
        status: 404,
        message: "Booking doesn't belong to current user",
      });
    }

    // Get the cleaner id for whom to send notification of the homeowner chosen action

    const cleanerId = booking?.cleanerId;

    if (!cleanerId) {
      return res.status(400).json({
        status: 400,
        message: "Booking does not have an assigned cleaner to notify.",
      });
    }

    // After all the checks update the booking based on homeowner(current user) action

    switch (action) {
      case "renotify":
        if (booking.bookingStatus !== BookingStatusConstant.IN_PROGRESS) {
          return res.status(400).json({
            status: 400,
            message:
              "Cleaners can only be renotified for bookings in progress.",
          });
        }
        // send renotify notification to cleaner (recipient)
        await handleAcceptRejectBookingNotification(
          booking,
          UserRole.Cleaner,
          "renofi"
        );
        return res.status(200).json({
          status: 200,
          message: "Successfully renotified cleaner",
          booking,
        });
      case BookingAction.RESCHEDULE:
        if (!newDatetime) {
          return res.status(400).json({
            status: 400,
            message: "Reschedule requires a new datetime.",
          });
        }

        // update booking cleaning time and reason for reschedule

        await booking.update({
          cleaningTime: newDatetime,
          rescheduleReason: reason || "no reason provided",
          bookingStatus: BookingStatusConstant.RESCHEDULED,
        });

        await handleAcceptRejectBookingNotification(
          booking,
          UserRole.Cleaner,
          "reschedule"
        );

        return res.status(200).json({
          status: 200,
          message: "Successfully rescheduled booking",
          booking,
        });
      case BookingAction.CANCEL:
        await booking.update({
          cancelReason: reason || "no reason provided",
          bookingStatus: BookingStatusConstant.CANCELLED,
        });
        await handleAcceptRejectBookingNotification(
          booking,
          UserRole.Cleaner,
          "reschedule"
        );

        return res.status(200).json({
          status: 200,
          message: "Successfully reschedule booking",
          booking,
        });

      default:
        return res.status(400).json({
          status: 400,
          message: "Invalid action.",
        });
    }
  } catch (error: any) {
    res.status(500).json({
      status: 500,
      message: "Error performing action",
      error: error.message,
    });
  }
};
