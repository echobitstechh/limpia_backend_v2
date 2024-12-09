// Function for cleaner edit profile
import { Cleaner } from "@src/models/Cleaner";
import { UserRole } from "@src/models/enum/enums";
import { Request, Response } from "express";

export const cleanerEditProfile = async (req: Request, res: Response) => {
  try {
    const { id, role } = req.user as { id: string; role: string };
    const {
      preferredLocations,
      services,
      availability,
      availabilityTime,
      preferredJobType,
    } = req.body;

    if (role !== UserRole.Cleaner) {
      return res.status(403).json({
        status: 403,
        message: "Only cleaners can perform this action",
      });
    }

    const user = await Cleaner.findOne({
      where: {
        id,
      },
    });

    if (!user) {
      return res.status(404).json({
        status: 404,
        message: "User not found",
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

    res.status(200).json({
      status: 200,
      message: "Operation successful",
      cleaner,
    });
  } catch (error: any) {
    res.status(500).json({
      status: 500,
      message: "Error editing profile",
      error: error.message,
    });
  }
};
