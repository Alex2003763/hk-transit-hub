/**
 * Utility function to get the weather icon URL from the Hong Kong Observatory.
 * @param icons - An array of icon numbers provided by the weather API.
 * @returns The URL of the weather icon.
 */
export const getWeatherIcon = (icons: number[]): string => {
  if (!icons || icons.length === 0) {
    // Return a default icon or an empty string if no icon is provided
    return '';
  }
  // The API may provide multiple icons, we'll use the first one.
  const iconNumber = icons[0];
  return `https://www.hko.gov.hk/images/wxicon/pic${iconNumber}.png`;
};