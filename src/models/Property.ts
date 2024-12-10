import { DataTypes, Model, Optional, Sequelize } from "sequelize";
import { GenericStatusConstant } from "@src/models/enum/enums";
import { Address } from "./Address";
import { User } from "./User";


interface PropertyAttributes {
  id: string;
  type: string;
  nameOfProperty?: string;
  numberOfUnits?: string;
  numberOfRooms?: string;
  numberOfBathrooms?: string;
  addressId: string;
  images?: string[];
  status: GenericStatusConstant;
  ownerId: string;
}

interface PropertyCreationAttributes
  extends Optional<
    PropertyAttributes,
    "id" | "numberOfUnits" | "numberOfRooms" | "numberOfBathrooms" | "images"
  > {}

class Property extends Model<PropertyAttributes, PropertyCreationAttributes> {
  public id!: string;
  public type!: string;
  public nameOfProperty?: string;
  public numberOfUnits?: string;
  public numberOfRooms?: string;
  public numberOfBathrooms?: string;
  public addressId!: string;
  public images?: string[];
  public status!: GenericStatusConstant;
  public ownerId!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public address?: Address;
  public owner?: User;
}

const initProperty = (sequelize: Sequelize) => {
  Property.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      nameOfProperty: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      numberOfUnits: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      numberOfRooms: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      numberOfBathrooms: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      addressId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "Addresses",
          key: "id",
        },
        onDelete: "CASCADE",
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
      ownerId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "Users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
    },
    {
      sequelize,
      tableName: "Properties",
      timestamps: true,
    }
  );

  return Property;
};

export { Property, initProperty };
