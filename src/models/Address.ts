import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { User } from '@src/models/User';

interface AddressAttributes {
    id: string;
    address: string; // Full address (optional, deprecated if street + unitNumber is used)
    street: string; // Street name
    unitNumber?: string; // Unit, Apartment, or Suite number
    city: string;
    location: { long: string; lat: string }; // Geographic coordinates
    state: string;
    country: string;
    zipCode?: string; // Postal/ZIP code
}

interface AddressCreationAttributes extends Optional<AddressAttributes, 'id' | 'zipCode' | 'unitNumber'> {}

class Address extends Model<AddressAttributes, AddressCreationAttributes> {
    public id!: string;
    public address!: string;
    public street!: string;
    public unitNumber?: string;
    public city!: string;
    public location!: { long: string; lat: string };
    public state!: string;
    public country!: string;
    public zipCode?: string;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    // Associations
    public users?: User[];
}

const initAddress = (sequelize: Sequelize) => {
    Address.init(
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                allowNull: false,
                primaryKey: true,
            },
            address: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            street: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            unitNumber: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            city: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            location: {
                type: DataTypes.JSONB,
                allowNull: true,
                defaultValue: { long: '0.00', lat: '0.00' },
            },
            state: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            country: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            zipCode: {
                type: DataTypes.STRING,
                allowNull: true,
            },
        },
        {
            sequelize,
            tableName: 'Addresses',
            timestamps: true,
        }
    );

    return Address;
};

export { Address, initAddress };
