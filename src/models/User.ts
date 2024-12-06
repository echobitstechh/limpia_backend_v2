import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { UserRole, GenericStatusConstant } from './enum/enums';
import { Address } from './address';

interface UserAttributes {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: UserRole;
    status: GenericStatusConstant;
    addressId: string;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id'> {}

class User extends Model<UserAttributes, UserCreationAttributes> {
    public id!: string;
    public firstName!: string;
    public lastName!: string;
    public email!: string;
    public password!: string;
    public role!: UserRole;
    public status!: GenericStatusConstant;
    public addressId!: string;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    // Association
    public address?: Address;
}

const initUser = (sequelize: Sequelize) => {
    User.init(
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                allowNull: false,
                primaryKey: true,
            },
            firstName: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            lastName: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            email: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
            },
            password: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            role: {
                type: DataTypes.ENUM(...Object.values(UserRole)),
                allowNull: false,
            },
            status: {
                type: DataTypes.ENUM(...Object.values(GenericStatusConstant)),
                allowNull: false,
                defaultValue: GenericStatusConstant.Active,
            },
            addressId: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'Addresses',
                    key: 'id',
                },
                onDelete: 'CASCADE',
            },
        },
        {
            sequelize,
            tableName: 'Users',
            timestamps: true,
        }
    );

    return User;
};

export { User, initUser };
