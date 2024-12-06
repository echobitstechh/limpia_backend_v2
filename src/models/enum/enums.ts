export enum UserRole {
    Cleaner = "Cleaner",
    HomeOwner = "HomeOwner",
    PropertyManager = "PropertyManager",
    Admin = "Admin", // Optional additional roles
}

export enum GenericStatusConstant {
    Active = "Active",
    Inactive = "Inactive",
    Deleted = "Deleted",
}

export enum PropertyTypeConstant {
    Apartment = "Apartment",
    House = "House",
}

export enum StaffingTypeConstant {
    INDIVIDUAL_CLEANER = "INDIVIDUAL_CLEANER",
    CLEANING_CREW = "CLEANING_CREW",
}

export enum CleaningTypeConstant {
    STANDARD_CLEANING = "STANDARD_CLEANING",
    REGULAR_CLEANING = "REGULAR_CLEANING",
    DEEP_CLEANING = "DEEP_CLEANING",
}

export enum BookingStatusConstant {
    PENDING = "PENDING",
    CONFIRMED = "CONFIRMED",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED",
    RESCHEDULED = "RESCHEDULED",
    FAILED = "FAILED",
    REVIEW_PENDING = "REVIEW_PENDING",
}


export enum PaymentStatusConstant {
    PENDING = "PENDING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    REFUNDED = "REFUNDED",
    PARTIALLY_REFUNDED = "PARTIALLY_REFUNDED",
    CANCELLED = "CANCELLED",
    IN_PROGRESS = "IN_PROGRESS",
    DISPUTED = "DISPUTED",
}

export enum GeneralAreaTasks {
    DUSTING = "Dusting",
    VACUUMING_SWEEPING = "Vacuuming & Sweeping",
    MOPPING = "Mopping",
    DOORS_HANDLES = "Doors & Handles",
    MIRRORS_GLASS_SURFACES = "Mirrors & Glass Surfaces",
    WINDOWS = "Windows",
}

export enum KitchenTasks {
    COUNTERS_SURFACES = "Counters & Surfaces",
    APPLIANCES = "Appliances",
    CABINETS_DRAWERS = "Cabinets & Drawers",
    FLOORING = "Flooring",
}

export enum BathroomTasks {
    SINK_COUNTERS = "Sink & Counters",
    TOILET = "Toilet",
    SHOWER_BATHTUB = "Shower/Bathtub",
    MIRRORS_GLASS_SURFACES = "Mirrors & Glass Surfaces",
    CABINETS_DRAWERS = "Cabinets & Drawers",
    FLOORING = "Flooring",
}
