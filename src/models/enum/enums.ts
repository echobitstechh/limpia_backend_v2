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
