// send message to a recipient via FCM
import { GetLoggedInUsersFcmToken } from "./loggedinuser-helper-func";
import { sendNotification } from "./notification-helper-func";

export const sendMessageFCM = async (data: { [key: string]: string }) => {
  try {
    const { recipientId } = data;
    const fcmToken = await GetLoggedInUsersFcmToken([recipientId]);

    if (!fcmToken || fcmToken.length === 0) {
      console.log("recipient not logged in");
      return;
    }

    console.log(fcmToken);

    await sendNotification(
      fcmToken,
      "New Message",
      "Your Have a New Message",
      data
    );

    console.log("Message sent Succefully!");
  } catch (error: any) {
    console.log(error.message);
    throw error;
  }
};
