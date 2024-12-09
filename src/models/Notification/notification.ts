// Define the Notification model and its attributes

import { DataTypes, Model, Optional, Sequelize } from "sequelize";
import { UserRole } from "../enum/enums";

// Define enum for Notification type

export enum NotificationType {
  NewBooking = "New Booking",
  JobReminder = "Job Reminder",
  BookingAccepted = "Booking Accepted",
  BookingRejected = "Booking Rejected",
  BookingRescheduled = "Booking Rescheduled",
}

interface NotificationAttributes {
  id: string;
  message: string;
  recipientId: string; // This would refer to the user's ID
  senderId: string; // This would refer to the user's ID
  recipientType: UserRole; // Use the enum here
  notificationType: NotificationType; // Use the enum here
  bookingId?: string;
  isRead: boolean;
}

export interface NotificationCreationAttributes
  extends Optional<NotificationAttributes, "id" | "isRead"> {}

// Define the Notification model
class Notification extends Model<
  NotificationAttributes,
  NotificationCreationAttributes
> {
  public id!: string;
  public message!: string;
  public recipientId!: string;
  public senderId!: string;
  public notificationType!: string;
  public recipientType!: UserRole;
  public bookingId?: string;
  public isRead!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Initialize the Notification model
const initNotification = (sequelize: Sequelize) => {
  Notification.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      message: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      recipientId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      senderId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      recipientType: {
        type: DataTypes.ENUM(...Object.values(UserRole)), // Use the enum here
        allowNull: false,
      },
      bookingId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      notificationType: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      isRead: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      sequelize,
      tableName: "Notifications",
      timestamps: true,
    }
  );

  return Notification;
};

export { Notification, initNotification };
