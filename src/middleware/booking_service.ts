import {DayTypeConstant} from "@src/models/enum/enums";

export const isWithinAvailability = (cleaningTime: Date | null | undefined, availability: DayTypeConstant[] | null |undefined): boolean => {
    if (!cleaningTime || !availability) return false;

    // Get the day of the week from cleaningTime
    const dayOfWeek = cleaningTime.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    // Determine if the day is a weekday or weekend
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5; // Monday to Friday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday

    // Check if the availability matches the day type
    return (isWeekday && availability.includes(DayTypeConstant.WEEKDAYS)) || (isWeekend && availability.includes(DayTypeConstant.WEEKENDS));
};
