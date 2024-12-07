import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface ConversationAttributes {
  id: string;
  firstUserId: string;
  secondUserId: string;
}

export interface ConversationCreationAttributes
  extends Optional<ConversationAttributes, "id"> {}

class Conversation extends Model<
  ConversationAttributes,
  ConversationCreationAttributes
> {
  public id!: string;
  public firstUserId!: string;
  public secondUserId!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

const initConversation = (sequelize: Sequelize) => {
  Conversation.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      firstUserId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      secondUserId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: "Conversations",
      timestamps: true,
      indexes: [
        {
          unique: true, // Ensure a conversion is unique between two users
          fields: ["firstUserId", "secondUserId"],
        },
      ],
    }
  );
  return Conversation;
};

export { Conversation, initConversation };
