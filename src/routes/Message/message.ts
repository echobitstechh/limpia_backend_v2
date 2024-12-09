import { NextFunction, Request, Response, Router } from "express";
import {
  getMessage,
  markMessageAsDelivered,
  markMessageAsRead,
  sendMessage,
} from "../../controller/Message/message";
import jwt, { JwtPayload } from "jsonwebtoken";
import { authenticate } from "@src/middleware/auth";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET as string;

/**
 * @swagger
 * /api/v1/messages/:
 *   get:
 *     summary: Get user message
 *     description: Get message for user
 *     tags:
 *       - Messages
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "Messages retrieved successfully."
 *                 conversation:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "b1aaf29e-7c45-4787-a742-b5be39d650c1"
 *                     firstUserId:
 *                       type: string
 *                       example: "b1aaf29e-7c45-4787-a742-b5be39d650c1"
 *                     secondUserId:
 *                       type: string
 *                       example: "b1aaf29e-7c45-4787-a742-b5be39d650c1"
 *                     messages:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "b1aaf29e-7c45-4787-a742-b5be39d650c1"
 *                           conversationId:
 *                             type: string
 *                             example: "b1aaf29e-7c45-4787-a742-b5be39d650c1"
 *                           recipientId:
 *                             type: string
 *                             example: "b1aaf29e-7c45-4787-a742-b5be39d650c1"
 *                           senderId:
 *                             type: string
 *                             example: "b1aaf29e-7c45-4787-a742-b5be39d650c1"
 *                           status:
 *                             type: string
 *                             example: "sent"
 *                           message:
 *                             type: string
 *                             example: "New Booking Added"
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                             example: "2024-10-31T12:00:00Z"
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *                             example: "2024-10-31T12:00:00Z"
 *       404:
 *         description: No Message found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 404
 *                 message:
 *                   type: string
 *                   example: "No Message found."
 *       500:
 *         description: Error retrieving message
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 500
 *                 message:
 *                   type: string
 *                   example: "Error retrieving message, try again."
 *                 error:
 *                   type: string
 *                   example: "Error message detail here"
 */

router.get("/:id", getMessage);

/**
 * @swagger
 * /api/v1/message:
 *   post:
 *     summary: Send a message to a logged in user
 *     description: This endpoint allows a logged in user to send a message to another user
 *     tags:
 *       - Messages
 *     security:
 *       - bearerAuth: []  # Assuming you're using JWT authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               senderId:
 *                 type: string
 *                 example: "b2c4f29e-7c45-4787-a742-b5be39d650c1"
 *                 description: The ID of the sender .
 *               recipientId:
 *                 type: string
 *                 example: "c3a4f29e-7c45-4787-a742-b5be39d650d3"
 *                 description: The ID of the recipient
 *               message:
 *                 type: string
 *                 example: "Hello, I'm interested in your property"
 *     responses:
 *       200:
 *         description: message sent successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "Message sent successfully."
 *                 newMessage:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "f2c7d9e0-8b3c-4b5a-9b3f-1fdc0562e24b"
 *                     senderId:
 *                       type: string
 *                       example: "c3a4f29e-7c45-4787-a742-b5be39d650d3"
 *                     recipientId:
 *                       type: string
 *                       example: "b2c4f29e-7c45-4787-a742-b5be39d650c1"
 *                     status:
 *                       type: string
 *                       example: "sent"
 *                     conversationId:
 *                       type: string
 *                       example: "b1aaf29e-7c45-4787-a742-b5be39d650c1"
 *                     message:
 *                       type: string
 *                       example: "Hello, I'm interested in your property"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-10-31T12:00:00Z"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-10-31T12:00:00Z"
 *       400:
 *         description: Bad request - Missing or invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 400
 *                 message:
 *                   type: string
 *                   example: "senderId, recipientId and message are required"
 *       500:
 *         description: Internal Server Error - Error assigning cleaner to booking
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 500
 *                 message:
 *                   type: string
 *                   example: "Error assigning cleaner to booking."
 *                 error:
 *                   type: string
 *                   example: "An unexpected error occurred"
 */

router.post("/", authenticate, sendMessage);

/**
 * @swagger
 * /api/v1/messages/markDelivered:
 *   post:
 *     summary: Mark message as delivered
 *     description: Mark message as delivered
 *     tags: [Messages]
 *
 *
 */

router.post("/markDelivered", authenticate, markMessageAsDelivered);

router.post("/markRead", authenticate, markMessageAsRead);

export default router;
