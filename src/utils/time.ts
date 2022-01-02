function isLeapYear(year: number): boolean {
    return year % 400 === 0 || (year % 100 !== 0 && year % 4 === 0);
}

export const minutesInAnHour = 60;
export const secondsInAnHour = 60 * minutesInAnHour;
export const millisecondsInAnHour = 1000 * secondsInAnHour;

export const hoursInADay = 24;
export const minutesInADay = hoursInADay * 60;
export const secondsInADay = minutesInADay * 60;
export const millisecondsInADay = secondsInADay * 1000;

export const daysInAWeek = 7;
export const hoursInAWeek = 24 * daysInAWeek;
export const minutesInAWeek = hoursInAWeek * 60;
export const secondsInAWeek = minutesInAWeek * 60;
export const millisecondsInAWeek = secondsInAWeek * 1000;

export function daysInYear(year: number): number {
    return isLeapYear(year) ? 366 : 365;
}
export function hoursInYear(year: number): number {
    return 24 * daysInYear(year);
}
export function minutesInYear(year: number): number {
    return 60 * hoursInYear(year);
}
export function secondsInYear(year: number): number {
    return 60 * minutesInYear(year);
}
export function millisecondsInYear(year: number): number {
    return 1000 * secondsInYear(year);
}
