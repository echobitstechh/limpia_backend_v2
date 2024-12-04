import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { User } from './user'; // Import the User model

interface CleanerAttributes {
    id: string;
    userId: string;
    preferredLocations?: string[];
    services?: string[];
    availability?: string[];
    availabilityTime?: string[];
    preferredJobType?: string;
}

interface CleanerCreationAttributes extends Optional<CleanerAttributes, 'id'> {}

class Cleaner extends Model<CleanerAttributes, CleanerCreationAttributes> {
    public id!: string;
    public userId!: string;
    public preferredLocations?: string[];
    public services?: string[];
    public availability?: string[];
    public availabilityTime?: string[];
    public preferredJobType?: string;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    // Association
    public user?: User;
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
