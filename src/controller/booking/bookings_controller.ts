import {Request, Response} from 'express';
import { Property } from '@src/models/property';
import { Booking } from '@src/models/booking';
import { Address } from '@src/models/address';
import { BookingStatusConstant, CleaningTypeConstant, GenericStatusConstant } from '@src/models/enum/enums';

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
            address, city, state, country, zip, location, street
        } = req.body;

        if (!cleaningType || !cleaningTime) {
            return res.status(400).json({
                status: 400,
                message: 'Cleaning type and time are required.',
            });
        }

        let finalPropertyId = propertyId;

        if (role === 'PropertyManager') {
            if (!propertyId) {
                return res.status(400).json({
                    status: 400,
                    message: 'Property ID is required for Property Managers.',
                });
            }

            const property = await Property.findOne({ where: { id: propertyId, ownerId: userId } });
            if (!property) {
                return res.status(404).json({
                    status: 404,
                    message: 'Property not found or does not belong to you.',
                });
            }
        } else if (role === 'HomeOwner') {
            if (!address || !city || !state || !country) {
                return res.status(400).json({
                    status: 400,
                    message: 'Address, city, state, and country are required for HomeOwner bookings.',
                });
            }

            // Check if the HomeOwner has an existing property
            let property = await Property.findOne({ where: { ownerId: userId } });

            if (!property) {

                const newAddress = await Address.create({
                    address,
                    city,
                    location: location || { long: '0.00', lat: '0.00' },
                    state,
                    country,
                    zipCode: zip,
                    street: street
                });

                property = await Property.create({
                    type: type || 'HomeOwner Property',
                    nameOfProperty: `HomeOwner Property - ${userId}`,
                    addressId: newAddress.id,
                    ownerId: userId,
                    status: GenericStatusConstant.Active,
                });
            }

            finalPropertyId = property.id;
        } else {
            return res.status(403).json({
                status: 403,
                message: 'Invalid role for creating bookings.',
            });
        }

        // Create the booking
        const newBooking = await Booking.create({
            propertyId: finalPropertyId,
            cleaningType: cleaningType as CleaningTypeConstant,
            cleaningTime,
            numberOfRooms,
            numberOfBathrooms,
            checklistDetails,
            staffingType,
            bookingStatus: BookingStatusConstant.PENDING,
            status: GenericStatusConstant.Active
        });

        res.status(201).json({
            status: 201,
            message: 'Booking created successfully.',
            booking: newBooking,
        });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({
            status: 500,
            message: 'Error creating booking.',
            error: error.message,
        });
    }
};
