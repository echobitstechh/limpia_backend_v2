// Path: src/utils/notification-helper-func.ts
import { Booking } from "@src/models/Booking";
import {
  Notification,
  NotificationCreationAttributes,
  NotificationType,
} from "../models/Notification/notification";
import { Cleaner } from "@src/models/Cleaner";
import admin from "./firebase-config";
import {
  GetLoggedInCleanersFcmToken,
  GetLoggedInUsersFcmToken,
} from "./loggedinuser-helper-func";
import cron from "node-cron";
import moment from "moment";
import { Op } from "sequelize";
import { Property } from "@src/models/Property";
import {
  BookingAction,
  BookingStatusConstant,
  CleaningTypeConstant,
  DayTypeConstant,
  GenericStatusConstant,
  PaymentStatusConstant,
  PeriodConstant,
  PropertyTypeConstant,
  StaffingTypeConstant,
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

  console.log(data);

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

export const handleNotification = async (
  booking: Booking,
  senderId: string
) => {
  try {
    // After successfully created booking save notification for cleaners
    const bookingId = booking.id;
    const bookingTime = booking.cleaningTime;
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

    // Save notification for all cleaners
    await Notification.bulkCreate(notificationData);

    // Get all logged in cleaners fcmToken for real-time notification
    const fcmTokens = await GetLoggedInCleanersFcmToken();

    if (!fcmTokens || fcmTokens.length === 0) {
      console.log("No logged in cleaners.");
      return;
    }

    sendNotificationThroughTopic("cleaners", "New booking Added", message, {
      bookingId,
      bookingTime: bookingTime?.toString() as string,
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

    // console.log("Assignments:", assignments);
    // console.log("12 hours from now:", twelveHoursFromNow);

    // // make sure there are assignments with 12 hours from now to start

    // // Filter active assignments that are within the 12-hour window
    const filteredAssignments = assignments.map((item) => {
      const assignmentTime = moment(item.cleaningTime);

      console.log("Checking assignment time:", assignmentTime?.format("HH:mm"));
      console.log("Current time:", moment().format("HH:mm"));
      console.log(
        "12 hours from now:",
        moment(twelveHoursFromNow).format("HH:mm")
      );
      console.log(
        "11 hours from now:",
        moment(elevenHoursFromNow).format("HH:mm")
      );

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

    // Get all cleaners id in the filtered assignment
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

    // console.log(notificationPromises);

    // Save notification for all cleaners

    await Notification.bulkCreate(notificationPromises);

    // Get fcmToken for the cleaners with job within 11 / 12 hours

    const fcmTokens = await GetLoggedInUsersFcmToken(cleanerIds);

    if (!fcmTokens || fcmTokens.length === 0) {
      console.log("No logged in cleaners.");
      return;
    }

    console.log("Sending notifications to FCM tokens:", fcmTokens);

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
scheduleReminderNotification();

// Function for testing reminder notification

export const addTestBooking = async () => {
  try {
    // Optionally clear the table first to avoid duplicates during testing
    await Booking.destroy({
      where: {},
    });

    const now = new Date();

    // Get the time 12 hours and 1 minute from now

    const tweleveHoursFromNow = new Date(now.getTime() + 12 * 60 * 60 * 1000);

    // Add a new test address

    // const testAddress = await Address.create({
    //   address: "No 1, Test Street",
    //   street: "Test Street",
    //   city: "Test City",
    //   location: { long: "0.00", lat: "0.00" },
    //   state: "Test State",
    //   country: "Test Country",
    // });

    // Add a new test user

    // const testUser = await User.create({
    //   firstName: "Test5",
    //   lastName: "Cleaner",
    //   email: "cleaner5@gmail.com",
    //   password: "password",
    //   role: UserRole.Cleaner,
    //   status: GenericStatusConstant.Active,
    //   addressId: "685cb4a4-2356-4f0e-be19-57b7ae9b8039",
    // });

    // Add a new test property

    // const testProperty = await Property.create({
    //   type: "House",
    //   nameOfProperty: "Test Property",
    //   numberOfUnits: "1",
    //   numberOfRooms: "3",
    //   numberOfBathrooms: "2",
    //   addressId: "685cb4a4-2356-4f0e-be19-57b7ae9b8039",
    //   images: ["image1.jpg", "image2.jpg"],
    //   status: GenericStatusConstant.Active,
    //   ownerId: "a609eeae-10f1-4c9b-a676-e1832e53151b",
    // });

    // public id!: string;
    // public userId!: string;
    // public preferredLocations?: string[];
    // public services?: string[];
    // public availability?: DayTypeConstant[];
    // public availabilityTime?: PeriodConstant[];
    // public preferredJobType?: string;

    // Add a new test cleaner

    // const testCleaner = await Cleaner.create({
    //   userId: testUser.id,
    //   preferredLocations: ["Lekki", "Ikoyi"],
    //   services: ["Cleaning", "Laundry"],
    //   availability: [DayTypeConstant.WEEKDAYS, DayTypeConstant.WEEKENDS],
    //   availabilityTime: [PeriodConstant.EVENING, PeriodConstant.AFTERNOON],
    //   preferredJobType: "Cleaning",
    // });

    // Add a new test booking

    // delete booking if it already exists

    await Booking.destroy({
      where: {
        status: GenericStatusConstant.Active,
      },
    });

    const testBooking = await Booking.create({
      images: ["image1.jpg", "image2.jpg"],
      status: GenericStatusConstant.Active,
      propertyType: PropertyTypeConstant.House,
      cleanerId: "45e2947b-9a18-457e-830d-ec7db42a9f37",
      propertyId: "ec7d5b6c-551f-432b-81b3-d44f7cafff4a",
      cancelReason: "Not available",
      rescheduleReason: "Not available",
      numberOfRooms: "3",
      numberOfBathrooms: "2",
      cleanerPreferences: "None",
      staffingType: StaffingTypeConstant.CLEANING_CREW,
      cleaningType: CleaningTypeConstant.DEEP_CLEANING,
      cleaningTime: tweleveHoursFromNow,
      price: 20000n,
      paymentStatus: PaymentStatusConstant.COMPLETED,
      bookingStatus: BookingStatusConstant.PENDING,
    });

    // handleReminderNotification();

    // console.log("Test booking created:", testBooking.toJSON());
  } catch (error) {
    console.error("Error creating test booking:", error);
  }
};

// Function to send a accept/reject/reschedule booking notification to homeowner or property manager

export const handleAcceptRejectBookingNotification = async (
  booking: Booking,
  recipientType: UserRole,
  action: string
) => {
  try {
    const modifiedAction = action === "reschedule" ? "reschedul" : action;
    const bookingId = booking.id;
    const message = `Your booking has been ${modifiedAction}ed by the cleaner`;

    const notificationType =
      action === "accept" || action === "reject"
        ? action === "accept"
          ? NotificationType.BookingAccepted
          : NotificationType.BookingRejected
        : NotificationType.BookingRescheduled;

    const senderId = booking.cleanerId;

    if (!senderId) {
      console.log("No sender for this notification");
      return;
    }

    const property = await Property.findOne({
      where: {
        id: booking.propertyId,
      },
    });

    const recipientId = property?.ownerId;

    // checking if there's a recipient for this notification

    if (!recipientId) {
      console.log("No recipient for this notification");
      return;
    }

    const properties = await Property.findOne({
      where: {
        id: booking.propertyId,
      },
    });

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
