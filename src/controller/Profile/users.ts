// Endpoint to edit users
import { Address } from "@src/models/Address";
import { User } from "@src/models/User";
import { Request, Response } from "express";

export const editUser = async (req: Request, res: Response) => {
  try {
    const { id, role: userRole } = req.user as { id: string; role: string };

    // info to edit except password #to be modified to the appropiate req.body received
    const {
      firstName,
      lastName,
      email,
      role,
      status,
      city,
      location,
      state,
      country,
      zip,
      street,
    } = req.body;

    if (!Object.keys(req.body).length) {
      return res.status(400).json({
        status: 400,
        message: "Atleast one user detials to edit is needed",
      });
    }

    const user = await User.findOne({
      where: {
        id,
        role: userRole,
      },
    });

    if (!user) {
      return res.status(404).json({
        status: 404,
        message: "User not found!",
      });
    }

    if (city || location || state || country || zip || street) {
      const userAddress = await Address.findOne({
        where: {
          id: user.addressId,
        },
      });

      if (!userAddress) {
        return res.status(404).json({
          status: 404,
          message: "No Address for user found",
        });
      } else {
        // edit the user based on the given details in req.body (if given), else the user's already available details
        await userAddress
          .update({
            city: city || userAddress.city,
            location: location || userAddress.location,
            state: state || userAddress.state,
            country: country || userAddress.country,
            zipCode: zip || userAddress.zipCode,
            street: street || userAddress.street,
          })
          .then(() => console.log("User address successfully edited"));
      }
    } else {
      console.log("no provided data to edit user's address");
    }

    if (firstName || lastName || role || email || status) {
      // edit the user based on the given details if given else the user's already available details
      await user.update({
        firstName: firstName || user.firstName,
        lastName: lastName || user.lastName,
        role: role || user.role,
        email: email || user.email,
        status: status || user.status,
      });
    } else {
      console.log("No provided data to edit user details");
    }

    res.status(200).json({
      status: 200,
      message: "Edit Operation successful",
    });
  } catch (error: any) {
    res.status(500).json({
      status: 500,
      message: "Error Performing Edit Operation!",
      error: error.message,
    });
  }
};
