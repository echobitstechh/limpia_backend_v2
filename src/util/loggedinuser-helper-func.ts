// Get all logged in user fcmToken

import { Op } from "sequelize";
import { LoggedInUser } from "../models/LoggedInUser/loggedInUser";

export const GetLoggedInCleanersFcmToken = async () => {
  try {
    const loggedInUsers = await LoggedInUser.findAll({
      where: {
        role: "Cleaner",
      },
      attributes: ["fcmToken", "userId"],
    });

    if (!loggedInUsers || loggedInUsers.length === 0) {
      console.log("No logged in cleaners");
      return [];
    }

    const fcmTokens = loggedInUsers.map((user) => user.fcmToken);

    return fcmTokens;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// Get specific group of logged in users fcmToken

export const GetLoggedInUsersFcmToken = async (userIds: string[]) => {
  try {
    const loggedInUsers = await LoggedInUser.findAll({
      where: {
        userId: {
          [Op.in]: userIds,
        },
      },
      attributes: ["fcmToken"],
    });

    if (!loggedInUsers || loggedInUsers.length === 0) {
      console.log("No logged in users found");
      return [];
    }

    const fcmTokens = loggedInUsers.map((user) => user.fcmToken);

    return fcmTokens;
  } catch (error: any) {
    console.error(error);
    throw error;
  }
};
