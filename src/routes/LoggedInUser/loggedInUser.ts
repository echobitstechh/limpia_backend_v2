import { Router } from "express";

import {
  AddLoggedInUser,
  getLoggedInUsers,
  logoutUser,
} from "@src/controller/LoggedInUser/loggedInUser";
import { authenticate } from "@src/middleware/auth";

const router = Router();

/**
 * @swagger
 * /api/v1/loggedInUser:
 *   post:
 *     summary: Add logged in user
 *     description: Adds a logged in user with the provided details.
 *     tags:
 *       - LoggedInUser
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - fcmToken
 *               - role
 *             properties:
 *               userId:
 *                 type: string
 *                 example: "b1aaf29e-7c45-4787-a742-b5be39d650c1"
 *               fcmToken:
 *                 type: string
 *                 example: "fcmToken"
 *               role:
 *                 type: string
 *                 example: "admin"
 *     responses:
 *       201:
 *         description: Logged in user created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 201
 *                 message:
 *                   type: string
 *                   example: "Logged in user created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                       example: b1aaf29e-7c45-4787-a742-b5be39d650c1"
 *                     fcmToken:
 *                       type: string
 *                       example: "eyJpZCI6ImIwZjVkMDU1LTJjNDUtNDMwOS1iN2VlLWEzNzhiZjI5MGZiMCIsInJvbGUiOiJDbGVhbmVyIiwiaWF0IjoxNzMzMzM4Njk4LC"
 *                     role:
 *                       type: string
 *                       example: "Cleaner"
 *
 *       400:
 *         description: No userId, fcmToken and role in request body
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Please provide userId, fcmToken and role"
 *                 status:
 *                   type: integer
 *                   example: 400
 *       500:
 *         description: Internal server error
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
 *                   example: "Error creating logged in user"
 *                 error:
 *                   type: string
 *                   example: "Error message detail here"
 */

router.post("/", AddLoggedInUser as any);

// Get logged in users

router.get("/", authenticate, getLoggedInUsers as any);

// Log out current logged in user

router.post("/logout", authenticate, logoutUser as any);

export default router;
