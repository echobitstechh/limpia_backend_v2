import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { User } from './User';
import {DayTypeConstant, PeriodConstant} from "@src/models/enum/enums";
import {Booking} from "@src/models/Booking";


interface CleanerAttributes {
    id: string;
    userId: string;
    preferredLocations?: string[];
    services?: string[];
    availability?: DayTypeConstant[];
    availabilityTime?: PeriodConstant[];
    preferredJobType?: string;
}

interface CleanerCreationAttributes extends Optional<CleanerAttributes, 'id'> {}

class Cleaner extends Model<CleanerAttributes, CleanerCreationAttributes> {
    public id!: string;
    public userId!: string;
    public preferredLocations?: string[];
    public services?: string[];
    public availability?: DayTypeConstant[];
    public availabilityTime?: PeriodConstant[];
    public preferredJobType?: string;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    // Association
    public user?: User;
    public ignoredBookings?: Booking[];
    public addIgnoredBooking!: (bookingId: string) => Promise<void>;
}

const initCleaner = (sequelize: Sequelize) => {
    Cleaner.init(
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                allowNull: false,
                primaryKey: true,
            },
            userId: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'Users',
                    key: 'id',
                },
                onDelete: 'CASCADE',
            },
            preferredLocations: {
                type: DataTypes.JSONB, // Store as JSON array
                allowNull: true,
            },
            services: {
                type: DataTypes.JSONB, // Store as JSON array
                allowNull: true,
            },
            availability: {
                type: DataTypes.JSONB, // Store as JSON array
                allowNull: true,
            },
            availabilityTime: {
                type: DataTypes.JSONB, // Store as JSON array
                allowNull: true,
            },
            preferredJobType: {
                type: DataTypes.STRING,
                allowNull: true,
            },
        },
        {
            sequelize,
            tableName: 'Cleaners',
            timestamps: true,
        }
    );

    return Cleaner;
};

export { Cleaner, initCleaner };
