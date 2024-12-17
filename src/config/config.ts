import { Cleaner, initCleaner } from "@src/models/Cleaner";

require("dotenv").config();
import bcrypt from "bcrypt";
import { Dialect, Sequelize } from "sequelize";
import { initUser, User } from "@src/models/User";
import { Address, initAddress } from "@src/models/Address";
import { initProperty, Property } from "@src/models/Property";
import { Booking, initBooking } from "@src/models/Booking";
import { initNotification } from "@src/models/Notification";
import {
  Conversation,
  initConversation,
} from "@src/models/Message/Conversation";
import {CleaningType, initializeCleaningTypeModel} from "@src/models/CleaningType";
import {initMessage, Message} from "@src/models/Message/Message";

const database = process.env.DB_NAME || "";
const username = process.env.DB_USER || "";
const password = process.env.DB_PASSWORD || "";
const host = process.env.DB_HOST || "";
const dialect = process.env.DB_DIALECT || "postgres";

export const sequelize = new Sequelize(database, username, password, {
  host,
  dialect: dialect as Dialect,
  pool: {
    max: 5, // Maximum number of connections in the pool
    min: 0, // Minimum number of connections
    acquire: 30000, // Maximum time (in ms) Sequelize will try to get a connection before throwing an error
    idle: 10000, // Time (in ms) a connection can be idle before being released
  },
  // dialectOptions: {
  //   ssl: {
  //     require: false,
  //   }
  // },
  logging: false,
});

function defineAssociations() {
  console.log("Associating models...");

  // Cleaner -> User
  console.log("Associating Cleaner -> User...");
  Cleaner.belongsTo(User, { foreignKey: "userId", as: "user" });
  User.hasOne(Cleaner, { foreignKey: "userId", as: "cleaner" });

  // Address -> User
  console.log("Associating Address -> User...");
  Address.hasMany(User, { foreignKey: "addressId", as: "users" });
  User.belongsTo(Address, { foreignKey: "addressId", as: "address" });

  // Property -> Address
  console.log("Associating Property -> Address...");
  Property.belongsTo(Address, { foreignKey: "addressId", as: "address" });
  Address.hasMany(Property, { foreignKey: "addressId", as: "properties" });

  // Property -> User
  console.log("Associating Property -> User...");
  Property.belongsTo(User, { foreignKey: "ownerId", as: "owner" });
  User.hasMany(Property, { foreignKey: "ownerId", as: "properties" });

  // Booking -> Cleaner
  console.log("Associating Booking -> Cleaner...");
  Booking.belongsTo(Cleaner, { foreignKey: "cleanerId", as: "cleaner" });
  Cleaner.hasMany(Booking, { foreignKey: "cleanerId", as: "bookings" });

  Cleaner.belongsToMany(Booking, {
    through: "CleanerIgnoredBookings",
    as: "ignoredBookings",
    foreignKey: "cleanerId",
  });

  Booking.belongsToMany(Cleaner, {
    through: "CleanerIgnoredBookings",
    as: "ignoredByCleaners",
    foreignKey: "bookingId",
  });

  Cleaner.belongsToMany(Booking, {
    through: "CleanerBookings",
    foreignKey: "cleanerId",
  });

  Booking.belongsToMany(Cleaner, {
    through: "CleanerBookings",
    foreignKey: "bookingId",
  });

  // Booking -> Property
  console.log("Associating Booking -> Property...");
  Booking.belongsTo(Property, { foreignKey: "propertyId", as: "property" });
  Property.hasMany(Booking, { foreignKey: "propertyId", as: "bookings" });

  // Conversation -> Message
  console.log("Associating Conversation -> Message...");
  Conversation.hasMany(Message, {
    foreignKey: "conversationId",
    as: "messages",
  });

  Message.belongsTo(Conversation, {
    foreignKey: "conversationId",
    as: "conversation",
  });

  Booking.belongsToMany(CleaningType, {
    through: "BookingCleaningTypes",
    as: "cleaningTypes",
    foreignKey: "bookingId",
    otherKey: "cleaningTypeId",
  });

  CleaningType.belongsToMany(Booking, {
    through: "BookingCleaningTypes",
    as: "bookings",
    foreignKey: "cleaningTypeId",
    otherKey: "bookingId",
  });

  console.log("All associations defined successfully");
}

// Create Master details in the Db
// const createSuperAdmin = async () => {
//   const superAdminEmail = 'superadmin@limpia.com';
//   const superAdminPassword = '@limpiaSuperAdmin1234!';
//
//   const superAdmin = await Admin.findOne({ where: { email: superAdminEmail, role: 'Super Admin' } });
//
//   if (!superAdmin) {
//     const hashedPassword = await bcrypt.hash(superAdminPassword, 10);
//     await Admin.create({
//       firstName: 'limpia',
//       lastName: 'Super Admin',
//       email: superAdminEmail,
//       role: 'Super Admin',
//       password: hashedPassword,
//       phoneNumber: "+2348088890349",
//       isActive: true,
//     });
//     console.log('Super Admin created');
//   } else {
//     console.log('Super Admin already exists');
//   }
// };

async function initialize() {
  initAddress(sequelize);
  initUser(sequelize);
  initCleaner(sequelize);
  initProperty(sequelize);
  initBooking(sequelize);
  initializeCleaningTypeModel(sequelize);


  initNotification(sequelize); // Initialize the Notification model
  initConversation(sequelize); // Initialize the Conversation model
  initMessage(sequelize); // Initialize the Message model

  defineAssociations();
  await sequelize.sync({ alter: true });

  // await createSuperAdmin();
}

initialize().catch(console.error);
