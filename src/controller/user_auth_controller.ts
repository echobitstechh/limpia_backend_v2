import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { Cleaner } from "@src/models/Cleaner";
import { User } from "@src/models/User";
import { signToken, signRefreshToken } from "@src/util/token";
import { GenericStatusConstant, UserRole } from "@src/models/enum/enums";
import { Address } from "@src/models/Address";
import { Property } from "@src/models/Property";
import jwt from "jsonwebtoken";

export const Login = async (req: Request, res: Response) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({
        status: 400,
        message: "Email, password, and role are required",
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

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({
        status: 401,
        message: "Incorrect  password",
      });
    }

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

    return res.status(200).json({
      status: 200,
      message: "Login successful",
      user: {
        ...userData,
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
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET!);

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
      refresh_token: newRefreshToken
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

