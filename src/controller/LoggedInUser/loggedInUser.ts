// controler to add logged in user with fcmToken

import { Response, Request } from "express";
import { LoggedInUser } from "../../models/LoggedInUser/loggedInUser";
import admin from "@src/util/firebase-config";
import { Cleaner } from "@src/models/Cleaner";

export const AddLoggedInUser = async (request: Request, response: Response) => {
  try {
    const { userId, fcmToken, role, username } = request.body;
    console.log(userId, fcmToken, role, username);
    if (!userId || !fcmToken || !role) {
      return response.status(400).json({
        status: 400,
        message: "Please provide userId, fcmToken, username and role",
      });
    }

    const loggedInUser = await LoggedInUser.findOne({
      where: { userId, role },
    });

    console.log(loggedInUser);

    if (loggedInUser) {
      return response.status(400).json({
        status: 400,
        message: "User already logged in, on another device",
      });
    }

    const newLoggedInUser = await LoggedInUser.create({
      userId,
      username,
      role,
      fcmToken,
    });

    // Add user to the cleaners topic for FCM real-time notification

    // #to be uncommented when online for real-time notification
    if (role === "Cleaner") {
      await admin.messaging().subscribeToTopic(fcmToken, "cleaners");
    }

    response.status(201).json({
      status: 201,
      message: "Logged in user created successfully",
      newLoggedInUser,
    });
  } catch (error: any) {
    console.error(error);
    response.status(500).json({
      status: 500,
      message: "Error creating logged in user",
      error: error.message,
    });
  }
};

export const getLoggedInUsers = async (
  request: Request,
  response: Response
) => {
  try {
    const loggedInUsers = await LoggedInUser.findAll();

    // Check if logged in users exist
    if (!loggedInUsers || loggedInUsers.length === 0) {
      return response.status(404).json({
        status: 404,
        message: "No logged in users found",
      });
    }

    // Respond with the logged in users data
    response.status(200).json({
      status: 200,
      message: "Logged in users retrieved successfully",
      loggedInUsers,
    });
  } catch (error: any) {
    console.error(error);
    response.status(500).json({
      status: 500,
      message: "Error retrieving logged in users",
      error: error.message,
    });
  }
};

export const logoutUser = async (req: Request, res: Response) => {
  try {
    const { id: userId, role } = req.user as { id: string; role: string };

    const cleaner = await Cleaner.findOne({
      where: {
        userId,
      },
    });

    if (!cleaner) {
      return res.status(404).json({
        status: 404,
        message: "User not found",
      });
    }

    const loggedInUser = await LoggedInUser.findOne({
      where: {
        userId: cleaner.id,
      },
    });

    if (!loggedInUser) {
      return res.status(404).json({
        status: 404,
        message: "Not logged in",
      });
    }

    await loggedInUser.destroy();

    res.status(200).json({
      status: 200,
      message: "Logged out successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      status: 500,
      message: "Can't Log out try again",
      error: error.message,
    });
  }
};
