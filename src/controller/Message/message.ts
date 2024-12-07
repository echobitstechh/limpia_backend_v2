import { Request, Response } from "express";
import { Conversation } from "../../models/Message/conversation";
import { Message, MessageStatusType } from "../../models/Message/message";
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

    console.log(firstUserId, secondUserId);

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
    console.log(userId, recipientId);

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
    res.status(500).json({
      status: 500,
      message: `Error retriving user's message: try again`,
      error: `Something went wrong: ${error.message}`,
    });
  }
};

// mark message as delivered

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

    // Send Real-time Message to recipient and sender

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

// mark message as read

export const markMessageAsRead = async (req: Request, res: Response) => {
  try {
    const { id: userId } = req.user as { id: string };
    const { recipientId } = req.body;

    const messages = await Message.findAll({
      where: {
        recipientId: userId, // current user is the recipient of the message being marked as delivered
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

    // Send Real-time Message to recipient and sender

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

// export const getAllMessage = async (req: Request, res: Response) => {
//   try {
//     // get the conversion the user is associated with current user and recipient

//     const conversation = await Conversation.findAll({
//       include: {
//         model: Message,
//         as: "messages",
//       },
//     });

//     if (!conversation) {
//       res.status(404).json({
//         status: 404,
//         message: "Conversation does not exist",
//       });
//     }

//     res.status(200).json({
//       status: 200,
//       message: "Conversation retrieved successfully",
//       conversation,
//     });
//   } catch (error: any) {
//     res.status(500).json({
//       status: 500,
//       message: `Error retriving user's message: try again`,
//       error: `Something went wrong: ${error.message}`,
//     });
//   }
// };
