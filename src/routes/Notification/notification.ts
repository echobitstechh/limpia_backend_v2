import { Router } from "express";
import { getUserNotification } from "../../controller/Notification/notification";
import { authenticate } from "@src/middleware/auth";

const router = Router();

/**
 * @swagger
 * /api/v1/notification/:
 *   get:
 *     summary: Get user notifications
 *     description: Get all notifications for all user
 *     tags:
 *       - Notifications
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
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
 *                   example: "Notifications retrieved successfully."
 *                 notifications:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "b1aaf29e-7c45-4787-a742-b5be39d650c1"
 *                       recipientId:
 *                         type: string
 *                         example: "b1aaf29e-7c45-4787-a742-b5be39d650c1"
 *                       bookingId:
 *                         type: string
 *                         example: "b1aaf29e-7c45-4787-a742-b5be39d650c1"
 *                       messageType:
 *                         type: string
 *                         example: "New Booking"
 *                       recipientType:
 *                         type: string
 *                         example: "Cleaner"
 *                       message:
 *                         type: string
 *                         example: "New Booking Added"
 *                       isRead:
 *                         type: boolean
 *                         example: false
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-10-31T12:00:00Z"
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-10-31T12:00:00Z"
 *       404:
 *         description: No Notifications found
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
 *                   example: "No notifications found."
 *       500:
 *         description: Error retrieving notifications
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
 *                   example: "Error retrieving notifications, try again."
 *                 error:
 *                   type: string
 *                   example: "Error message detail here"
 */

router.get("/", authenticate, getUserNotification);

// router.post("/action", testBookingActionNotification);

export default router;
