/**
 * Date utility functions to avoid timezone issues in date handling
 */

/**
 * Format a Date object to YYYY-MM-DD string using local time
 * This prevents timezone-related date shifting issues
 * @param {Date} date - The date object to format
 * @returns {string} Formatted date string in YYYY-MM-DD format
 */
export const formatDateForAPI = (date) => {
  if (!date || !(date instanceof Date)) {
    throw new Error('Invalid date provided to formatDateForAPI');
  }
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * Get today's date formatted for API calls
 * @returns {string} Today's date in YYYY-MM-DD format
 */
export const getTodayForAPI = () => {
  return formatDateForAPI(new Date());
};

/**
 * Check if a date is Sunday (for weekend restrictions)
 * @param {Date} date - The date to check
 * @returns {boolean} True if the date is Sunday
 */
export const isSunday = (date) => {
  return date.getDay() === 0;
};

/**
 * Check if a date is Saturday (for weekend restrictions)
 * @param {Date} date - The date to check  
 * @returns {boolean} True if the date is Saturday
 */
export const isSaturday = (date) => {
  return date.getDay() === 6;
};

/**
 * Check if a date is weekend (Saturday or Sunday)
 * @param {Date} date - The date to check
 * @returns {boolean} True if the date is a weekend
 */
export const isWeekend = (date) => {
  return isSaturday(date) || isSunday(date);
};

/**
 * Parse a date string (YYYY-MM-DD) to a Date object
 * Creates date in local timezone to avoid shifting
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {Date} Date object in local timezone
 */
export const parseDateFromAPI = (dateString) => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

/**
 * Get the day name for a date
 * @param {Date} date - The date object
 * @returns {string} Day name (e.g., "Monday", "Tuesday")
 */
export const getDayName = (date) => {
  return date.toLocaleDateString('en-US', { weekday: 'long' });
};

/**
 * Generate date options for the next N days
 * @param {number} days - Number of days to generate (default: 30)
 * @returns {Array<Date>} Array of date objects
 */
export const generateDateOptions = (days = 30) => {
  const dates = [];
  const today = new Date();
  
  for (let i = 0; i < days; i++) {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
    dates.push(date);
  }
  
  return dates;
};