import { Request, Response } from "express";

import {
  BookingAction,
  BookingStatusConstant,
  CleaningTypeConstant,
  DayTypeConstant,
  GenericStatusConstant,
  PeriodConstant,
  UserRole,
} from "@src/models/enum/enums";
import { Property } from "@src/models/Property";
import { Address } from "@src/models/Address";
import { Booking } from "@src/models/Booking";
import axios from "axios";
import { Cleaner } from "@src/models/Cleaner";
import { User } from "@src/models/User";
import { isWithinAvailability } from "@src/middleware/booking_service";
import {
  handleAcceptRejectBookingNotification,
  handleNewBookingNotification,
  sendNotificationThroughTopic,
} from "@src/util/notification-helper-func";

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

export const createBooking = async (req: Request, res: Response) => {
  try {
    const { id: userId, role } = req.user as { id: string; role: string };

    const {
      propertyId,
      cleaningType,
      cleaningTime,
      numberOfRooms,
      numberOfBathrooms,
      staffingType,
      checklistDetails,
      type, // For HomeOwner: e.g., apartment, house
    } = req.body;

    if (!cleaningType || !cleaningTime) {
      return res.status(400).json({
        status: 400,
        message: "Cleaning type and time are required.",
      });
    }

    let finalPropertyId = propertyId;

    if (role === UserRole.PropertyManager) {
      if (!propertyId) {
        return res.status(400).json({
          status: 400,
          message: "Property ID is required for Property Managers.",
        });
      }

      const property = await Property.findOne({
        where: { id: propertyId, ownerId: userId },
      });

      if (!property) {
        return res.status(404).json({
          status: 404,
          message: "Property not found or does not belong to you.",
        });
      }
    } else if (role === UserRole.HomeOwner) {
      let property = await Property.findOne({ where: { ownerId: userId } });

      if (!property) {
        return res.status(400).json({
          status: 400,
          message: "User does not have a property.",
        });
      }

      finalPropertyId = property.id;
    } else {
      return res.status(403).json({
        status: 403,
        message: "Invalid role for creating bookings.",
      });
    }

    const newBooking = await Booking.create({
      propertyId: finalPropertyId,
      cleaningType: cleaningType as CleaningTypeConstant,
      cleaningTime,
      propertyType: type,
      numberOfRooms,
      numberOfBathrooms,
      checklistDetails,
      staffingType,
      bookingStatus: BookingStatusConstant.PENDING,
      status: GenericStatusConstant.Active,
    });

    // Send notification to all cleaners on successful booking creation

    await handleNewBookingNotification(newBooking, userId);

    res.status(201).json({
      status: 201,
      message: "Booking created successfully.",
      booking: newBooking,
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({
      status: 500,
      message: "Error creating booking.",
      error: error.message,
    });
  }
};

export const getBookings = async (req: Request, res: Response) => {
  try {
    const { id: userId, role } = req.user as { id: string; role: string };

    let bookings;

    if (role === UserRole.PropertyManager || role === UserRole.HomeOwner) {
      bookings = await Booking.findAll({
        include: [
          {
            model: Property,
            as: "property",
            where: { ownerId: userId },
            include: [
              {
                model: Address,
                as: "address",
              },
            ],
          },
        ],
      });
    } else {
      return res.status(403).json({
        status: 403,
        message: "Invalid role for retrieving bookings.",
      });
    }

    res.status(200).json({
      status: 200,
      message: "Bookings retrieved successfully.",
      bookings,
    });
  } catch (error: any) {
    console.error("Error retrieving bookings:", error);
    res.status(500).json({
      status: 500,
      message: "Error retrieving bookings.",
      error: error.message,
    });
  }
};

export const getNearByBookings = async (req: Request, res: Response) => {
  try {
    const { id: userId, role } = req.user as { id: string; role: string };

    if (role !== UserRole.Cleaner) {
      return res.status(403).json({
        status: 403,
        message: "Only cleaners can access nearby bookings.",
      });
    }

    const cleaner = await Cleaner.findOne({
      where: { userId: userId },
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

    if (!cleaner) {
      return res.status(404).json({
        status: 404,
        message: "Cleaner not found.",
      });
    }

    const cleanerAddress = `${cleaner.user?.address?.address}, 
        ${cleaner.user?.address?.city}, ${cleaner.user?.address?.state}, 
        ${cleaner.user?.address?.country}`;

    const { preferredLocations, services, availability, availabilityTime } =
      cleaner;

    const bookings = await Booking.findAll({
      where: {
        status: GenericStatusConstant.Active,
        bookingStatus: BookingStatusConstant.PENDING,
        cleaningType: services,
      },
      attributes: [
        "id",
        "propertyId",
        "cleaningType",
        "numberOfRooms",
        "numberOfBathrooms",
        "bookingStatus",
        "checklistDetails",
        "cleaningTime",
      ],
      include: [
        {
          model: Property,
          as: "property",
          attributes: [
            "id",
            "type",
            "nameOfProperty",
            "numberOfUnits",
            "numberOfRooms",
            "numberOfBathrooms",
            "addressId",
            "images",
            "status",
            "ownerId",
          ],
          include: [
            {
              model: Address,
              as: "address",
              attributes: ["street", "street", "city", "state", "country"],
            },
          ],
        },
      ],
    });

    const CleanerIgnoredBookings = cleaner.ignoredBookings;

    if (!bookings.length) {
      return res.status(404).json({
        status: 404,
        message: "No bookings available at this time.",
      });
    }

    const filteredBookings = bookings.filter((booking) => {
      const bookingAddress = booking.property?.address;
      if (!bookingAddress) {
        console.log(`Booking ${booking.id} skipped: No property address.`);
        return false;
      }

      if (cleaner.ignoredBookings?.includes(booking)) {
        console.log(
          `Booking ${booking.id} skipped: Cleaner has ignored this booking.`
        );
        return false;
      }

      let matchesLocation = false;
      let matchesAvailability = false;
      let matchesPeriod = false;

      if (preferredLocations) {
        matchesLocation =
          preferredLocations.includes(bookingAddress.city) ||
          preferredLocations.includes(bookingAddress.state);

        if (!matchesLocation) {
          console.log(
            `Booking ${booking.id} skipped: Location mismatch. Booking address: ${bookingAddress.city}, ${bookingAddress.state}.`
          );
        }
      } else {
        console.log(`Booking ${booking.id}: No preferred locations specified.`);
      }

      matchesAvailability = isWithinAvailability(
        booking.cleaningTime,
        availability
      );

      if (!matchesAvailability) {
        console.log(
          `Booking ${booking.id} skipped: Availability mismatch. Cleaning time: ${booking.cleaningTime}.`
        );
      }

      if (availabilityTime) {
        matchesPeriod = availabilityTime.some((period) => {
          const bookingHour = new Date(
            booking.cleaningTime ?? Date.now()
          ).getHours();

          console.log("Booking hour:", bookingHour);
          if (period === PeriodConstant.MORNING && bookingHour < 12)
            return true;
          if (
            period === PeriodConstant.AFTERNOON &&
            bookingHour >= 12 &&
            bookingHour < 18
          )
            return true;
          return period === PeriodConstant.EVENING && bookingHour >= 18;
        });

        if (!matchesPeriod) {
          console.log(
            `Booking ${booking.id} skipped: Period mismatch. Cleaning time: ${booking.cleaningTime}.`
          );
        }
      } else {
        console.log(
          `Booking ${booking.id}: No availability periods specified.`
        );
      }

      const matches = matchesLocation && matchesAvailability && matchesPeriod;

      if (!matches) {
        console.log(
          `Booking ${booking.id} skipped: One or more conditions did not match.`
        );
      }

      return matches;
    });

    if (!filteredBookings.length) {
      console.log(`No bookings match the provided preferences.`);
      return res.status(404).json({
        status: 404,
        message: "No bookings match your preferences.",
      });
    }

    const destinations = filteredBookings
      .map((b) =>
        b.property?.address
          ? `${b.property.address.street || ""}, ${b.property.address.city}, 
                       ${b.property.address.state}, ${
              b.property.address.country
            }`
          : null
      )
      .filter(Boolean)
      .join("|");

    if (!destinations) {
      return res.status(404).json({
        status: 404,
        message: "No valid property addresses for bookings.",
      });
    }

    const { data } = await axios.get(
      `https://maps.googleapis.com/maps/api/distancematrix/json`,
      {
        params: {
          origins: cleanerAddress,
          destinations,
          key: GOOGLE_API_KEY,
        },
      }
    );

    const distances = data.rows[0]?.elements || [];

    const bookingsWithDistance = filteredBookings.map((booking, index) => ({
      ...booking.toJSON(),
      distance: distances[index]?.distance?.value || Number.MAX_SAFE_INTEGER,
    }));

    const sortedBookings = bookingsWithDistance.sort(
      (a, b) => a.distance - b.distance
    );

    res.status(200).json({
      status: 200,
      message: `Found ${sortedBookings.length} nearby bookings matching your preferences.`,
      bookings: sortedBookings,
    });
  } catch (error: any) {
    console.error("Error fetching nearby bookings:", error);
    res.status(500).json({
      status: 500,
      message: "Error fetching nearby bookings.",
      error: error.message,
    });
  }
};

export const getCleanerBookings = async (req: Request, res: Response) => {
  try {
    const { id: userId, role } = req.user as { id: string; role: string };

    // Check if the user has a Cleaner role
    if (role !== UserRole.Cleaner) {
      return res.status(403).json({
        status: 403,
        message: "Only cleaners can retrieve their bookings.",
      });
    }

    // Find the cleaner associated with the userId
    const cleaner = await Cleaner.findOne({
      where: { userId },
    });

    if (!cleaner) {
      return res.status(404).json({
        status: 404,
        message: "Cleaner not found.",
      });
    }

    const cleanerId = cleaner.id;

    // Fetch bookings associated with the cleaner using belongsToMany mapping
    const bookings = await Booking.findAll({
      include: [
        {
          model: Cleaner,
          where: { id: cleanerId }, // Filter by cleaner ID
          through: {
            attributes: [], // Exclude join table attributes
          },
        },
        {
          model: Property,
          as: "property",
          attributes: [
            "id",
            "type",
            "nameOfProperty",
            "numberOfUnits",
            "numberOfRooms",
            "numberOfBathrooms",
            "addressId",
            "images",
            "status",
            "ownerId",
          ],
          include: [
            {
              model: Address,
              as: "address",
              attributes: ["street", "street", "city", "state", "country"],
            },
          ],
        },
      ],
    });

    // Respond with the bookings
    res.status(200).json({
      status: 200,
      total: bookings.length,
      message: "Cleaner bookings retrieved successfully.",
      bookings,
    });
  } catch (error: any) {
    console.error("Error retrieving cleaner bookings:", error);
    res.status(500).json({
      status: 500,
      message: "Error retrieving cleaner bookings.",
      error: error.message,
    });
  }
};

export const actionBooking = async (req: Request, res: Response) => {
  try {
    const { id: userId, role } = req.user as { id: string; role: string };
    const { bookingId, action, reason, newDatetime, checklist } = req.body;

    if (role !== UserRole.Cleaner) {
      return res.status(403).json({
        status: 403,
        message: "Only cleaners can perform this booking actions.",
      });
    }

    const cleaner = await Cleaner.findOne({ where: { userId } });

    if (!cleaner) {
      return res.status(404).json({
        status: 404,
        message: "Cleaner not found.",
      });
    }

    const booking = await Booking.findOne({ where: { id: bookingId } });

    if (!booking) {
      return res.status(404).json({
        status: 404,
        message: "Booking not found.",
      });
    }

    switch (action) {
      case BookingAction.ACCEPT:
        if (booking.bookingStatus !== BookingStatusConstant.PENDING) {
          return res.status(400).json({
            status: 400,
            message: "Only pending bookings can be accepted.",
          });
        }

        await booking.addCleaner(cleaner);
        booking.bookingStatus = BookingStatusConstant.IN_PROGRESS;
        break;

      case BookingAction.IGNORE:
        if (booking.bookingStatus !== BookingStatusConstant.PENDING) {
          return res.status(400).json({
            status: 400,
            message: "Only pending bookings can be ignored.",
          });
        }
        await cleaner.addIgnoredBooking(booking.id);
        break;

      case BookingAction.RESCHEDULE:
        if (!newDatetime) {
          return res.status(400).json({
            status: 400,
            message: "Reschedule requires a new datetime.",
          });
        }
        if (
          booking.cleanerId?.includes(cleaner.id) ||
          booking.bookingStatus !== BookingStatusConstant.IN_PROGRESS
        ) {
          return res.status(403).json({
            status: 403,
            message:
              "You can only reschedule bookings you have accepted and are in progress.",
          });
        }
        booking.cleaningTime = newDatetime;
        booking.bookingStatus = BookingStatusConstant.RESCHEDULED;
        booking.rescheduleReason = reason || "No reason provided";
        break;

      case BookingAction.CANCEL:
        if (booking.cleanerId?.includes(cleaner.id)) {
          return res.status(403).json({
            status: 403,
            message: "You can only cancel bookings you accepted.",
          });
        }
        booking.bookingStatus = BookingStatusConstant.CANCELLED;
        booking.cancelReason = reason || "No reason provided";
        break;

      case BookingAction.COMPLETE:
        if (booking.cleanerId !== cleaner.id) {
          return res.status(403).json({
            status: 403,
            message: "You can only complete bookings you accepted.",
          });
        }
        if (!checklist) {
          return res.status(400).json({
            status: 400,
            message: "Completion requires a checklist.",
          });
        }
        booking.checklistDetails = checklist;
        booking.bookingStatus = BookingStatusConstant.COMPLETED;
        break;

      default:
        return res.status(400).json({
          status: 400,
          message: "Invalid action.",
        });
    }

    await booking.save();

    // Send notification to the property owner (recipient)

    // check if recipient is a property manager or homeowner which the notification function needs

    const recipient = await User.findOne({
      where: { id: booking.property?.ownerId },
      attributes: ["id", "role"],
    });

    if (!recipient) {
      return res.status(404).json({
        status: 404,
        message: "Recipient not found.",
      });
    }

    const recipientRole = recipient.role;

    await handleAcceptRejectBookingNotification(booking, recipientRole, action);

    res.status(200).json({
      status: 200,
      message: `Booking ${action.toLowerCase()}ed successfully.`,
      booking,
    });
  } catch (error: any) {
    console.error("Error performing booking action:", error);
    res.status(500).json({
      status: 500,
      message: "Error performing booking action.",
      error: error.message,
    });
  }
};
