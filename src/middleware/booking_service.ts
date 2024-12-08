import {DayTypeConstant} from "@src/models/enum/enums";

export const isWithinAvailability = (cleaningTime: Date | null | undefined, availability: DayTypeConstant[] | null |undefined): boolean => {
    if (!cleaningTime || !availability) return false;

    // Get the day of the week from cleaningTime
    const dayOfWeek = cleaningTime.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    console.log('dayOfWeek ====>> ', dayOfWeek);
    console.log('cleaningTime ====>> ', cleaningTime);
    console.log('availability ====>> ', availability);
    // Determine if the day is a weekday or weekend
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5; // Monday to Friday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday


    console.log('isWeekday ====>> ', isWeekday);
    console.log('isWeekend ====>> ', isWeekend);

    console.log('availability.includes(DayTypeConstant.WEEKDAYS) ====>> ', availability.includes(DayTypeConstant.WEEKDAYS));
    console.log('availability.includes(DayTypeConstant.WEEKENDS) ====>> ', availability.includes(DayTypeConstant.WEEKENDS));

    // Check if the availability matches the day type
    return (isWeekday && availability.includes(DayTypeConstant.WEEKDAYS)) || (isWeekend && availability.includes(DayTypeConstant.WEEKENDS));
};
