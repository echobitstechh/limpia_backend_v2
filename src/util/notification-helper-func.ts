// Path: src/utils/notification-helper-func.ts

// All functions in this file are helper functions for sending notifications to users
// and can be used anywhere in the application with the appropriate parameters

// Except for the scheduleReminderNotification function, which as it name implies send reminder notifications to cleaners
// for jobs starting in 12 hours

import { Booking } from "@src/models/Booking";
import { Notification, NotificationType } from "../models/Notification";
import { Cleaner } from "@src/models/Cleaner";
import admin from "./firebase-config";
import {
  GetLoggedInCleanersFcmToken,
  GetLoggedInUsersFcmToken,
} from "./loggedinuser-helper-func";
import cron from "node-cron";
import moment from "moment";
import { Op } from "sequelize";
import {
  BookingAction,
  GenericStatusConstant,
  UserRole,
} from "@src/models/enum/enums";

// Function to send a notification to a device
export const sendNotification = async (
  tokens: string[],
  title: string,
  body: string,
  data?: { [key: string]: string }
) => {
  const message = {
    notification: {
      title,
      body,
    },
    data: data,
    tokens, // Device token
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(
      "Notification sent successfully:",
      JSON.parse(JSON.stringify(response.responses))
    );
    return response;
  } catch (error) {
    console.error("Error sending notification:", error);
    throw error;
  }
};

// Function to Send notification through topic

export const sendNotificationThroughTopic = async (
  topic: string,
  title: string,
  body: string,
  data?: { [key: string]: string }
) => {
  const message = {
    notification: {
      title,
      body,
    },
    data: data,
    topic, // Device joined topic
  };

  try {
    const response = await admin.messaging().send(message);
    console.log("Notification sent successfully:", response);
    return response;
  } catch (error) {
    console.error("Error sending notification:", error);
    throw error;
  }
};

// function to handle Notification on new created bookings

export const handleNewBookingNotification = async (
  booking: Booking,
  senderId: string
) => {
  try {
    // After successfully created booking save notification for cleaners
    const bookingId = booking.id;
    const notificationTime = new Date();
    const notificationType = NotificationType.NewBooking;
    const recipientType = UserRole.Cleaner;
    const cleaners = await Cleaner.findAll({});
    const message = "New Job Request sent";

    const notificationData = cleaners.map((cleaner) => ({
      recipientId: cleaner.id,
      senderId,
      message,
      notificationType: notificationType as NotificationType,
      recipientType,
      bookingId,
    }));

    // Save notification for all cleaners in the DB
    await Notification.bulkCreate(notificationData);

    // Get all logged in cleaners fcmToken for real-time notification
    const fcmTokens = await GetLoggedInCleanersFcmToken();

    if (!fcmTokens || fcmTokens.length === 0) {
      console.log("No logged in cleaners.");
      return;
    }

    sendNotificationThroughTopic("cleaners", "New booking Added", message, {
      bookingId,
      notificationTime: notificationTime.toISOString(),
    });
  } catch (error: any) {
    console.error("Error handling notification:", error);
    throw error;
  }
};

// handle notification for reminder for cleaner for job to start in 12 hour

export const handleReminderNotification = async () => {
  try {
    // Get all cleaner assignments that are active and have a job start time in 12 hours
    const twelveHoursFromNow = moment().add(12, "hours").startOf("minute");
    const elevenHoursFromNow = moment().add(11, "hours").startOf("minute");

    const assignments = await Booking.findAll({
      where: {
        status: GenericStatusConstant.Active,
      },
    });

    if (assignments.length === 0) {
      console.log("No Active Bookings");
      return;
    }

    // make sure there are assignments with 12 hours from now to start

    // Filter active assignments that are within the 12-hour window
    const filteredAssignments = assignments.map((item) => {
      const assignmentTime = moment(item.cleaningTime);

      // Check if the assignment time is within the next 12 hours
      if (
        assignmentTime &&
        (assignmentTime.isSame(twelveHoursFromNow, "minute") ||
          assignmentTime.isSame(elevenHoursFromNow, "minute"))
      ) {
        return item; // If assignment is within the 12-hour window, return it
      }

      return null; // If no matching time, return null
    });

    const bookingsIn12hours = filteredAssignments.filter(
      (item) => item !== null
    );

    if (!bookingsIn12hours || bookingsIn12hours.length === 0) {
      console.log("No assignments starting in 11 or 12 hours.");
      return;
    }

    // Get all cleaners id in the filtered assignment (id from the Cleaner table)
    const cleanerIds = bookingsIn12hours
      .map((assignment) => assignment.cleanerId)
      .filter((id) => id !== undefined);

    // Get cleaners in the DB

    const cleanersInDB = await Cleaner.findAll({
      where: {
        id: {
          [Op.in]: cleanerIds,
        },
      },
    });

    console.log(
      "cleaners:",
      cleanersInDB.map((cleaner) => cleaner.toJSON())
    );

    // Get all logged in cleaners id in the filtered assignment (id from the User table)
    const loggedInCleanersId = cleanersInDB.map((cleaner) => cleaner.userId);

    const notificationPromises = cleanersInDB.map((cleaner) => ({
      recipientId: cleaner.id,
      senderId: cleaner.id,
      message: `You have a booking scheduled for ${moment(
        twelveHoursFromNow
      ).format("HH:mm")}.`,
      notificationType: NotificationType.JobReminder,
      recipientType: UserRole.Cleaner,
      bookingId: assignments.find((booking) => booking.cleanerId === cleaner.id)
        ?.id,
    }));

    // Save notification for all cleaners

    await Notification.bulkCreate(notificationPromises);

    // Get fcmToken for the cleaners with job within 11 / 12 hours

    const fcmTokens = await GetLoggedInUsersFcmToken(loggedInCleanersId);

    if (!fcmTokens || fcmTokens.length === 0) {
      console.log("No logged in cleaners.");
      return;
    }

    // Send notification to the cleaners
    sendNotification(
      fcmTokens,
      "Job Reminder",
      `You have a booking scheduled for ${twelveHoursFromNow}.`
    );
  } catch (error: any) {
    throw error;
  }
};

// Schedule reminder notification cron job

export const scheduleReminderNotification = () => {
  console.log("Reminder job triggered at:", new Date());

  cron.schedule(
    "* * * * *", // Runs every minute for testing. Change to the your desired schedule
    () => {
      handleReminderNotification();
    },
    {
      scheduled: true,
      timezone: "Africa/Lagos",
    }
  );
};

// Schedule reminder notification on server start
// to be uncommented when ready for production
// scheduleReminderNotification();

// Function to send a accept/reject/reschedule booking notification to homeowner or property manager

export const handleAcceptRejectBookingNotification = async (
  booking: Booking,
  recipientType: UserRole,
  action: string
) => {
  try {
    const actionLowerCase = action.toLowerCase();
    const modifiedAction =
      actionLowerCase === "reschedule" ? "reschedul" : actionLowerCase;
    const bookingId = booking.id;
    const message = `Your booking has been ${modifiedAction}ed by the cleaner`;

    let notificationType: NotificationType;

    switch (action) {
      case BookingAction.ACCEPT:
        notificationType = NotificationType.BookingAccepted;
        break;
      case BookingAction.RESCHEDULE:
        notificationType = NotificationType.BookingRescheduled;
        break;
      case BookingAction.CANCEL:
        notificationType = NotificationType.BookingCancelled;
        break;
      case BookingAction.COMPLETE:
        notificationType = NotificationType.BookingCompleted;
        break;
      default:
        notificationType = NotificationType.BookingIgnored;
        break;
    }

    const senderId = booking.cleanerId;

    if (!senderId) {
      console.log("No sender for this notification");
      return;
    }

    const recipientId = booking.property?.ownerId;

    // checking if there's a recipient for this notification

    if (!recipientId) {
      console.log("No recipient for this notification");
      return;
    }

    const properties = booking.property;

    if (!properties) {
      console.log("Property not found.");
      return;
    }

    const notificationData = {
      recipientId,
      senderId,
      message,
      notificationType,
      recipientType,
      bookingId,
    };

    await Notification.create(notificationData);

    const fcmToken = await GetLoggedInUsersFcmToken([recipientId]);

    sendNotification(fcmToken, notificationType, message, {
      bookingId,
    });
  } catch (error: any) {
    const modifiedAction = action === "reschedule" ? "reschedul" : action;
    console.error(
      `Error handling ${modifiedAction} booking notification:`,
      error
    );
    throw error;
  }
};
