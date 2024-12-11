import { Request, Response } from "express";
import { Conversation } from "../models/Message/Conversation";
import { Message, MessageStatusType } from "../models/Message/Message";
import { Op } from "sequelize";
import { sendMessageFCM } from "@src/util/message-helper-func";
import { GetLoggedInUsersFcmToken } from "@src/util/loggedinuser-helper-func";
import { sendNotification } from "@src/util/notification-helper-func";

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const {
      message,
      senderId: firstUserId,
      recipientId: secondUserId,
    } = req.body;

    // Get the following user's conversion if it exists or create a new one
    if (!(firstUserId || secondUserId)) {
      return res.status(400).json({
        error: "Sender or Recipient is missing",
        status: 400,
      });
    }

    if (firstUserId === secondUserId) {
      return res.status(400).json({
        error: "Sender and recipient cannot be the same",
      });
    }

    if (!message) {
      return res.status(400).json({
        status: 400,
        error: "Message is required",
      });
    }

    const [conversation, created] = await Conversation.findOrCreate({
      where: {
        [Op.or]: [
          {
            firstUserId,
            secondUserId,
          },
          {
            firstUserId: secondUserId,
            secondUserId: firstUserId,
          },
        ],
      },
      defaults: {
        firstUserId,
        secondUserId,
      },
    });

    const newMessage = await Message.create({
      conversationId: conversation.id,
      senderId: firstUserId,
      recipientId: secondUserId,
      message,
    });

    const dataToSend = {
      conversationId: conversation.id,
      senderId: firstUserId,
      recipientId: secondUserId,
      message,
    };

    // Send Real-time Message to recipient

    await sendMessageFCM(dataToSend);

    return res.status(201).json({
      status: 200,
      message: "Message sent successfully!",
      newMessage,
    });
  } catch (error: any) {
    return res.status(500).json({
      status: 500,
      error: `Error sending message: ${error.message}`,
    });
  }
};

export const getMessage = async (req: Request, res: Response) => {
  try {
    const { id: userId } = req.user as { id: string };
    const { id: recipientId } = req.params; // other user message current user is viewing

    const limit = parseInt(req.query.limit as string) || 10;
    const lastMessageTime = req.query.lastMessageTime as string;

    // get the conversion the user is associated with current user and recipient

    let conversation;

    if (lastMessageTime) {
      conversation = await Conversation.findOne({
        where: {
          [Op.or]: [
            {
              firstUserId: userId,
              secondUserId: recipientId,
            },
            {
              firstUserId: recipientId,
              secondUserId: userId,
            },
          ],
        },
        include: {
          model: Message,
          as: "messages",
          limit,
          where: {
            createdAt: {
              [Op.lt]: lastMessageTime,
            },
          },
        },
      });
    } else {
      conversation = await Conversation.findOne({
        where: {
          [Op.or]: [
            {
              firstUserId: userId,
              secondUserId: recipientId,
            },
            {
              firstUserId: recipientId,
              secondUserId: userId,
            },
          ],
        },
        include: {
          model: Message,
          as: "messages",
          limit,
        },
      });
    }

    if (!conversation) {
      return res.status(404).json({
        status: 404,
        message: "Conversation does not exist",
      });
    }

    res.status(200).json({
      status: 200,
      message: "Conversation retrieved successfully",
      conversation,
    });
  } catch (error: any) {
    console.log(error.message);
    res.status(500).json({
      status: 500,
      message: `Error retriving user's message: try again`,
      error: `Something went wrong: ${error.message}`,
    });
  }
};

// mark all messages for the current user as delivered when user comes online

export const markMessageAsDelivered = async (req: Request, res: Response) => {
  try {
    const { id: userId } = req.user as { id: string };
    const { recipientIds } = req.body;

    const messages = await Message.findAll({
      where: {
        recipientId: userId,
        senderId: {
          [Op.in]: recipientIds,
        },
        status: MessageStatusType.Sent,
      },
      order: [["createdAt", "DESC"]],
    });

    if (messages.length === 0) {
      return res.status(404).json({
        status: 404,
        message: "No message found",
      });
    }

    await Message.update(
      { status: MessageStatusType.Delivered },
      {
        where: {
          recipientId: userId, // current user is the recipient of the message being marked as delivered
          senderId: {
            [Op.in]: recipientIds,
          },
          status: MessageStatusType.Sent,
        },
      }
    );

    // Get the recent delivered messages id
    const deliveredMessageIds = messages.map((item, idx) => {
      const key = `id${idx}`;
      return {
        [key]: item.id,
      };
    });

    const combinedDeliveredMessageIds = Object.assign(
      {},
      ...deliveredMessageIds
    );

    // Send Real-time Message to both recipient and sender if they are online

    const userIds = [userId, ...recipientIds];

    const fcmToken = await GetLoggedInUsersFcmToken(userIds);

    await sendNotification(
      fcmToken,
      "Message Delivered",
      "Message Delivered",
      combinedDeliveredMessageIds
    );

    res.status(200).json({
      status: 200,
      message: "Messages marked as delivered",
      deliveredMessageIds,
    });
  } catch (error: any) {
    res.status(500).json({
      status: 500,
      message: `Error marking message as delivered: try again`,
      error: `Something went wrong: ${error.message}`,
    });
  }
};

// mark message as read when user is online and already in recipient DM (direct message) when the message was sent

export const markMessageAsRead = async (req: Request, res: Response) => {
  try {
    const { id: userId } = req.user as { id: string };
    const { recipientId } = req.body; // other user message current user is viewing

    // when user is online, and is in the recipient DM, mark message as delivered then read

    // Get mesage still in sent status

    const sentMessages = await Message.findAll({
      where: {
        recipientId: userId, // current user is the recipient of the message being marked as delivered
        senderId: recipientId,
        status: MessageStatusType.Sent,
      },
    });

    if (sentMessages.length === 0) {
      // no need to throw an error, maybe the message has been marked as delivered already when user came online
      console.log("No message needs to be marked as delivered");
    } else {
      await Message.update(
        { status: MessageStatusType.Delivered },
        {
          where: {
            recipientId: userId,
            senderId: recipientId,
            status: MessageStatusType.Sent,
          },
        }
      );
    }

    // Get mesage still in delivered status

    const messages = await Message.findAll({
      where: {
        recipientId: userId, // current user is the recipient of the message being marked as read
        senderId: recipientId,
        status: MessageStatusType.Delivered,
      },
    });

    if (messages.length === 0) {
      return res.status(404).json({
        status: 404,
        message: "No message found",
      });
    }

    await Message.update(
      { status: MessageStatusType.Read },
      {
        where: {
          recipientId: userId,
          senderId: recipientId,
          status: MessageStatusType.Delivered,
        },
      }
    );

    // Get the recent read messages ids to send for Real-time UI update
    const readMessageIds = messages.map((item, idx) => {
      const key = `id${idx}`;

      return {
        [key]: item.id,
      };
    });

    const combinedReadMessageIds = Object.assign({}, ...readMessageIds); // makes this object compatible with the data parameter of sendNotification Function

    // Send Real-time Message to both recipient and sender

    const userIds = [userId, recipientId];

    const fcmToken = await GetLoggedInUsersFcmToken(userIds);

    await sendNotification(
      fcmToken,
      "Message Read",
      "Message Read",
      combinedReadMessageIds
    );

    res.status(200).json({
      status: 200,
      message: "Messages marked as read",
      readMessageIds,
    });
  } catch (error: any) {
    res.status(500).json({
      status: 500,
      message: `Error marking message as read: try again`,
      error: `Something went wrong: ${error.message}`,
    });
  }
};
