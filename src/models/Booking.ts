import {
    BookingStatusConstant,
    CleaningTypeConstant,
    GenericStatusConstant,
    PaymentStatusConstant, PropertyTypeConstant,
    StaffingTypeConstant
} from "@src/models/enum/enums";
import {DataTypes, Model, Optional, Sequelize} from "sequelize";
import {User} from "@src/models/User";
import {Property} from "@src/models/Property";



interface BookingAttributes {
    id: string;
    images?: string[];
    status: GenericStatusConstant;
    propertyType: PropertyTypeConstant;
    cleanerId?: string[]; //TODO: UI Supports multiple cleaners. This should be an array ??`
    numberOfRooms?: string;
    cancelReason?: string;
    rescheduleReason?: string;
    numberOfBathrooms?: string;
    cleanerPreferences?: string;
    staffingType?: StaffingTypeConstant;
    cleaningType?: CleaningTypeConstant;
    cleaningTime?: Date;
    checklistDetails?: ChecklistDetails;
    price?: bigint;
    propertyId?: string;
    paymentStatus?: PaymentStatusConstant;
    bookingStatus?: BookingStatusConstant;

}

interface BookingCreationAttributes
    extends Omit<BookingAttributes, 'id' | 'createdAt' | 'updatedAt'> {
    // 'id' is excluded because it's typically auto-generated
    // 'createdAt' and 'updatedAt' are excluded because they're managed by Sequelize or the database
}


interface BookingCreationAttributes extends Optional<BookingAttributes, 'id'> {}




class Booking extends Model<BookingAttributes, BookingCreationAttributes> {
    public id!: string;
    public images?: string[];
    public status!: GenericStatusConstant;
    public propertyType!: PropertyTypeConstant;
    public cleanerId?: string[];
    public propertyId?: string;
    public cancelReason?: string;
    public rescheduleReason?: string;
    public numberOfRooms?: string;
    public numberOfBathrooms?: string;
    public cleanerPreferences?: string;
    public staffingType?: StaffingTypeConstant;
    public cleaningType?: CleaningTypeConstant;
    public cleaningTime?: Date;
    public checklistDetails?: ChecklistDetails;
    public price?: bigint;
    public paymentStatus?: PaymentStatusConstant;
    public bookingStatus?: BookingStatusConstant;

    // Association
    public property?: Property;

}


const initBooking = (sequelize: Sequelize) => {
    Booking.init(
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                allowNull: false,
                primaryKey: true,
            },
            images: {
                type: DataTypes.JSONB,
                allowNull: true,
            },
            status: {
                type: DataTypes.ENUM(...Object.values(GenericStatusConstant)),
                allowNull: false,
                defaultValue: GenericStatusConstant.Active,
            },
            propertyType: {
                type: DataTypes.ENUM(...Object.values(PropertyTypeConstant)),
                allowNull: false,
                defaultValue: PropertyTypeConstant.House,
            },
            cleanerId: {
                type: DataTypes.UUID,
                allowNull: true,
                references: {
                    model: 'Cleaners',
                    key: 'id',
                },
                onDelete: 'CASCADE',
            },
            propertyId: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'Properties',
                    key: 'id',
                },
                onDelete: 'CASCADE',
            },
            numberOfRooms: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            numberOfBathrooms: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            rescheduleReason: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            cancelReason: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            cleanerPreferences: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            staffingType: {
                type: DataTypes.ENUM(...Object.values(StaffingTypeConstant)),
                allowNull: true,
            },
            cleaningType: {
                type: DataTypes.ENUM(...Object.values(CleaningTypeConstant)),
                allowNull: true,
            },
            cleaningTime: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            checklistDetails: {
                type: DataTypes.JSONB, // Use JSONB for structured checklist data
                allowNull: true,
            },
            price: {
                type: DataTypes.BIGINT,
                allowNull: true,
            },
            paymentStatus: {
                type: DataTypes.ENUM(...Object.values(PaymentStatusConstant)),
                allowNull: true,
            },
            bookingStatus: {
                type: DataTypes.ENUM(...Object.values(BookingStatusConstant)),
                allowNull: true,
            },
        },
        {
            sequelize,
            tableName: 'Bookings', // Updated table name
            timestamps: true,
        }
    );

    return Booking;
};


interface ChecklistDetails {
    generalAreasTasks?: Task[];
    kitchenTasks?: Task[];
    bathroomTasks?: Task[];
}

// Define Task structure
interface Task {
    taskName: string; // e.g., "Dusting", "Vacuuming"
    completed: boolean; // true/false based on completion status
}


export { Booking, initBooking };
