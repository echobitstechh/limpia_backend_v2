import { DataTypes, Model, Optional, Sequelize } from "sequelize";

interface LoggedInUserAttributes {
  id: string;
  userId: string;
  username: string;
  fcmToken: string;
  role: string;
}

interface LoggedInUserCreationAttributes
  extends Optional<LoggedInUserAttributes, "id"> {}

// Define the LoggedInUsers model
class LoggedInUser extends Model<
  LoggedInUserAttributes,
  LoggedInUserCreationAttributes
> {
  public id!: string;
  public userId!: string;
  public username!: string;
  public fcmToken!: string;
  public role!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Initialize the LoggedInUsers model
const initLoggedInUser = (sequelize: Sequelize) => {
  LoggedInUser.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4, // Generates a new UUIDv4
        allowNull: false,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      fcmToken: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      role: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: "LoggedInUsers",
      timestamps: true,
    }
  );
  return LoggedInUser;
};

export { LoggedInUser, initLoggedInUser };
