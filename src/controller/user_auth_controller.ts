import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { Cleaner } from "@src/models/Cleaner";
import { User } from "@src/models/User";
import { signToken, signRefreshToken, verifyToken } from "@src/util/token";
import { GenericStatusConstant, UserRole } from "@src/models/enum/enums";
import { Address } from "@src/models/Address";
import { Property } from "@src/models/Property";
import jwt from "jsonwebtoken";
import admin from "@src/util/firebase-config";

export const Login = async (req: Request, res: Response) => {
  try {
    const { email, password, role, fcmToken } = req.body;

    if (!email || !password || !role || !fcmToken) {
      return res.status(400).json({
        status: 400,
        message: "Email, password, role and fcmtoken are required",
      });
    }

    const user = await User.findOne({
      where: { email, role },
    });

    if (!user) {
      return res.status(404).json({
        status: 404,
        message: "Email not registered",
      });
    }

    // const passwordMatch = await bcrypt.compare(password, user.password);
    // if (!passwordMatch) {
    //   return res.status(401).json({
    //     status: 401,
    //     message: "Incorrect  password",
    //   });
    // }

    const { password: _, ...userData } = user.get({ plain: true });

    let roleDetails: any = {};

    if (role === UserRole.Cleaner) {
      const cleaner = await Cleaner.findOne({
        where: { userId: user.id },
      });
      if (cleaner) {
        roleDetails = cleaner.get({ plain: true });
      }
    }

    const token = signToken(user.id, user.role);
    const refreshToken = signRefreshToken(user.id, user.role);

    // Update FCM Token on successful login

    // Add cleaners to FCM topic "cleaners" on successful login for targeting cleaners only for notifications

    if (role === UserRole.Cleaner) {
      await admin.messaging().subscribeToTopic(fcmToken, "cleaners");
      console.log("Added cleaner to FCM topic 'cleaners' successfully");
    }

    await User.update(
      { fcmToken },
      {
        where: {
          id: user.id,
          role,
        },
      }
    );

    return res.status(200).json({
      status: 200,
      message: "Login successful",
      user: {
        ...userData,
        fcmToken,
        roleDetails,
      },
      token,
      refreshToken,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: 500,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const signUp = async (req: Request, res: Response) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      role,
      address,
      city,
      location,
      state,
      country,
      zip,
      street,
      preferredLocations,
      services,
      availability,
      availabilityTime,
      preferredJobType,
    } = req.body;

    // Validate mandatory fields
    if (
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !role ||
      !address ||
      !city ||
      !state ||
      !country
    ) {
      return res.status(400).json({
        status: 400,
        message: "Missing required fields",
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        status: 409,
        message: "Email already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create Address
    const userAddress = await Address.create({
      address,
      city,
      location: location || { long: "0.00", lat: "0.00" },
      state,
      country,
      zipCode: zip,
      street: street,
    });

    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role,
      addressId: userAddress.id,
      status: GenericStatusConstant.Active,
    });

    let property = await Property.create({
      type: role || "HomeOwner Property",
      nameOfProperty: `HomeOwner Property - ${user.id}`,
      addressId: userAddress.id,
      ownerId: user.id,
      status: GenericStatusConstant.Active,
    });

    let cleanerDetails = null;

    if (role === UserRole.Cleaner) {
      const cleaner = await Cleaner.create({
        userId: user.id,
        preferredLocations,
        services,
        availability,
        availabilityTime,
        preferredJobType,
      });

      cleanerDetails = await Cleaner.findOne({
        where: { id: cleaner.id },
        include: [
          {
            model: User,
            as: "user",
            attributes: { exclude: ["password"] },
            include: [
              {
                model: Address,
                as: "address",
              },
            ],
          },
        ],
      });
    }

    const userData = await User.findOne({
      where: { id: user.id },
      attributes: { exclude: ["password"] },
      include: [
        {
          model: Address,
          as: "address",
        },
      ],
    });
    const token = signToken(user.id, user.role);
    const refreshToken = signRefreshToken(user.id, user.role);

    return res.status(201).json({
      status: 201,
      message: "User registered successfully",
      user: role === UserRole.Cleaner ? cleanerDetails : userData,
      token,
      refreshToken,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: 500,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const refreshAccessToken = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        status: 401,
        message: "Refresh token is missing or invalid.",
      });
    }
    const refreshToken = authHeader.split(" ")[1];

    // Verify the refresh token
    const decoded = verifyToken(refreshToken);

    const { id, role } = decoded as { id: string; role: string };

    // Fetch the user associated with the token
    const user = await User.findOne({ where: { id, role } });
    if (!user) {
      return res.status(404).json({
        status: 404,
        message: "User not found.",
      });
    }

    const newAccessToken = signToken(user.id, user.role);
    const newRefreshToken = signRefreshToken(user.id, user.role);

    return res.status(200).json({
      status: 200,
      message: "Access token refreshed successfully.",
      token: newAccessToken,
      refresh_token: newRefreshToken,
    });
  } catch (error) {
    console.error("Error refreshing access token:", error);
    return res.status(500).json({
      status: 500,
      message: "Internal server error.",
      error: error.message,
    });
  }
};

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
      preferredLocations,
      services,
      availability,
      availabilityTime,
      preferredJobType,
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

    if (
      preferredLocations ||
      services ||
      availability ||
      availabilityTime ||
      preferredJobType
    ) {
      if (role !== UserRole.Cleaner) {
        return res.status(403).json({
          status: 403,
          message: "Only cleaners can perform this action",
        });
      }

      const cleaner = await Cleaner.findOne({
        where: {
          userId: user.id,
        },
      });

      if (!cleaner) {
        return res.status(404).json({
          status: 404,
          message: "Cleaner not found",
        });
      }

      // Edits the cleaners details based on the req.body data (if given), else still use the data in the DB
      await cleaner.update({
        preferredLocations: preferredLocations || cleaner.preferredLocations,
        services: services || cleaner.services,
        availability: availability || cleaner.availability,
        availabilityTime: availabilityTime || cleaner.availabilityTime,
        preferredJobType: preferredJobType || cleaner.preferredJobType,
      });
    } else {
      console.log("no provided data to edit user's cleaner info");
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

export const signOut = async (req: Request, res: Response) => {
  try {
    const { id, role } = req.user as { id: string; role: string };

    // Fetch the user associated with the token
    const user = await User.findOne({ where: { id, role } });
    if (!user) {
      return res.status(404).json({
        status: 404,
        message: "User not found.",
      });
    }

    // Update the FCM token to null on successful sign out

    // Remove cleaners from FCM topic "cleaners" on successful sign out to stop receiving notifications

    if (role === UserRole.Cleaner) {
      await admin.messaging().unsubscribeFromTopic(user.fcmToken!, "cleaners");
      console.log("Removed cleaner from FCM topic 'cleaners' successfully");
    }
    await User.update(
      { fcmToken: "" },
      {
        where: {
          id: user.id,
          role,
        },
      }
    );

    return res.status(200).json({
      status: 200,
      message: "Sign out successful.",
    });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({
      status: 500,
      message: "Internal server error",
      error: error.message,
    });
  }
};
