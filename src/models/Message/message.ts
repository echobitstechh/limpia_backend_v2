import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export enum MessageStatusType {
  Sent = "sent",
  Delivered = "delivered",
  Read = "read",
}

export interface MessageAttributes {
  id: string;
  conversationId: string;
  senderId: string;
  recipientId: string;
  message: string;
  status?: MessageStatusType;
}

export interface MessageCreationAttributes
  extends Optional<MessageAttributes, "id" | "status"> {}

class Message extends Model<MessageAttributes, MessageCreationAttributes> {
  public id!: string;
  public conversationId!: string;
  public senderId!: string;
  public recipientId!: string;
  public message!: string;
  public status?: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

const initMessage = (sequelize: Sequelize) => {
  Message.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      conversationId: {
        type: DataTypes.UUID, // Foreign key reference to Conversations
        allowNull: false,
        references: {
          model: "Conversations",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      senderId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      recipientId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM(...Object.values(MessageStatusType)),
        defaultValue: "sent",
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: "Messages",
      timestamps: true,
    }
  );
  return Message;
};

export { Message, initMessage };
