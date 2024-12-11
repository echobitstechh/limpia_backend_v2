// Get all logged in user fcmToken

import { Op } from "sequelize";
import { User } from "@src/models/User";
export const GetLoggedInCleanersFcmToken = async () => {
  try {
    const loggedInUsers = await User.findAll({
      where: {
        role: "Cleaner",
        fcmToken: {
          [Op.ne]: "",
        },
      },
      attributes: ["fcmToken"],
    });

    if (!loggedInUsers || loggedInUsers.length === 0) {
      console.log("No logged in cleaners");
      return [];
    }

    const fcmTokens = loggedInUsers
      .map((user) => user.fcmToken)
      .filter((token) => token !== undefined);

    return fcmTokens;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// Get specific group of logged in users fcmToken

export const GetLoggedInUsersFcmToken = async (userIds: string[]) => {
  try {
    const loggedInUsers = await User.findAll({
      where: {
        id: {
          [Op.in]: userIds,
        },
      },
      attributes: ["fcmToken"],
    });

    if (!loggedInUsers || loggedInUsers.length === 0) {
      console.log("No logged in users found");
      return [];
    }

    const fcmTokens = loggedInUsers
      .map((user) => user.fcmToken)
      .filter((token) => token !== undefined);

    return fcmTokens;
  } catch (error: any) {
    console.error(error);
    throw error;
  }
};
