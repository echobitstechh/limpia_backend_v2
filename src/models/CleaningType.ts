import { DataTypes, Model, Optional, Sequelize } from "sequelize";

// Attributes interface
interface CleaningTypeAttributes {
    id: string;
    name: string;
    images?: string[];
    description?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

// Creation attributes interface
interface CleaningTypeCreationAttributes extends Optional<CleaningTypeAttributes, 'id'> {}

// CleaningType Model
class CleaningType extends Model<CleaningTypeAttributes, CleaningTypeCreationAttributes>
    implements CleaningTypeAttributes {
    public id!: string;
    public name!: string;
    public images?: string[];
    public description?: string;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}


const initializeCleaningTypeModel = (sequelize: Sequelize) => {
    CleaningType.init(
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            images: {
                type: DataTypes.JSONB,
                allowNull: true,
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
        },
        {
            sequelize,
            modelName: 'CleaningType',
            tableName: 'CleaningTypes',
        }
    );
    return CleaningType;
};

export { CleaningType, initializeCleaningTypeModel };
