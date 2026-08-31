/* =============================================================================
   Where CommBank customers actually are.

   The city list is weighted for Australian outbound travel rather than global
   population: Bali, Auckland and Queenstown outrank Berlin, because that's what
   an Australian bank's overseas transaction feed genuinely looks like.

   Coordinates are real. Amounts and rates are illustrative — see the README.
   ============================================================================= */

/** Approximate units per 1 AUD, with the symbol used to render them. */
export const WORLD_CURRENCIES = {
  IDR: { symbol: 'Rp', perAud: 10600, decimals: 0 },
  NZD: { symbol: 'NZ$', perAud: 1.09, decimals: 2 },
  USD: { symbol: 'US$', perAud: 0.65, decimals: 2 },
  JPY: { symbol: '¥', perAud: 96, decimals: 0 },
  GBP: { symbol: '£', perAud: 0.51, decimals: 2 },
  THB: { symbol: '฿', perAud: 22.5, decimals: 2 },
  SGD: { symbol: 'S$', perAud: 0.88, decimals: 2 },
  FJD: { symbol: 'FJ$', perAud: 1.47, decimals: 2 },
  VND: { symbol: '₫', perAud: 16500, decimals: 0 },
  EUR: { symbol: '€', perAud: 0.6, decimals: 2 },
  AED: { symbol: 'AED ', perAud: 2.39, decimals: 2 },
  INR: { symbol: '₹', perAud: 55, decimals: 2 },
  HKD: { symbol: 'HK$', perAud: 5.09, decimals: 2 },
  KRW: { symbol: '₩', perAud: 880, decimals: 0 },
  CNY: { symbol: 'CN¥', perAud: 4.7, decimals: 2 },
  MYR: { symbol: 'RM', perAud: 3.05, decimals: 2 },
  PHP: { symbol: '₱', perAud: 37, decimals: 2 },
  LKR: { symbol: 'LKR ', perAud: 200, decimals: 0 },
  NPR: { symbol: 'NPR ', perAud: 88, decimals: 0 },
  TRY: { symbol: '₺', perAud: 22, decimals: 2 },
  EGP: { symbol: 'EGP ', perAud: 32, decimals: 2 },
  ZAR: { symbol: 'R', perAud: 12.2, decimals: 2 },
  CAD: { symbol: 'CA$', perAud: 0.89, decimals: 2 },
  MXN: { symbol: 'MX$', perAud: 12.5, decimals: 2 },
  PEN: { symbol: 'S/', perAud: 2.42, decimals: 2 },
  ARS: { symbol: 'AR$', perAud: 650, decimals: 0 },
  BRL: { symbol: 'R$', perAud: 3.55, decimals: 2 },
  CLP: { symbol: 'CLP ', perAud: 620, decimals: 0 },
  CHF: { symbol: 'CHF ', perAud: 0.57, decimals: 2 },
  CZK: { symbol: 'Kč', perAud: 15, decimals: 2 },
  DKK: { symbol: 'kr', perAud: 4.5, decimals: 2 },
  SEK: { symbol: 'kr', perAud: 6.9, decimals: 2 },
  ISK: { symbol: 'ISK ', perAud: 90, decimals: 0 },
  VUV: { symbol: 'VT', perAud: 78, decimals: 0 },
  WST: { symbol: 'WS$', perAud: 1.8, decimals: 2 },
  MVR: { symbol: 'Rf', perAud: 10, decimals: 2 },
  KHR: { symbol: '៛', perAud: 2650, decimals: 0 },
  LAK: { symbol: '₭', perAud: 14000, decimals: 0 },
  TWD: { symbol: 'NT$', perAud: 21, decimals: 2 },
}

/**
 * `weight` drives how often a city appears in the live feed.
 * Bali alone accounts for more Australian card taps than most of Europe.
 */
export const WORLD_CITIES = [
  // --- South-east Asia and the Pacific: the bulk of Australian travel ---
  { name: 'Denpasar', cc: 'IDN', country: 'Indonesia', lat: -8.65, lon: 115.22, currency: 'IDR', weight: 40 },
  { name: 'Ubud', cc: 'IDN', country: 'Indonesia', lat: -8.51, lon: 115.26, currency: 'IDR', weight: 18 },
  { name: 'Seminyak', cc: 'IDN', country: 'Indonesia', lat: -8.69, lon: 115.17, currency: 'IDR', weight: 16 },
  { name: 'Auckland', cc: 'NZL', country: 'New Zealand', lat: -36.85, lon: 174.76, currency: 'NZD', weight: 30 },
  { name: 'Queenstown', cc: 'NZL', country: 'New Zealand', lat: -45.03, lon: 168.66, currency: 'NZD', weight: 16 },
  { name: 'Christchurch', cc: 'NZL', country: 'New Zealand', lat: -43.53, lon: 172.64, currency: 'NZD', weight: 10 },
  { name: 'Nadi', cc: 'FJI', country: 'Fiji', lat: -17.8, lon: 177.42, currency: 'FJD', weight: 12 },
  { name: 'Denarau', cc: 'FJI', country: 'Fiji', lat: -17.77, lon: 177.38, currency: 'FJD', weight: 7 },
  { name: 'Port Vila', cc: 'VUT', country: 'Vanuatu', lat: -17.73, lon: 168.32, currency: 'VUV', weight: 4 },
  { name: 'Apia', cc: 'WSM', country: 'Samoa', lat: -13.83, lon: -171.77, currency: 'WST', weight: 3 },
  { name: 'Bangkok', cc: 'THA', country: 'Thailand', lat: 13.76, lon: 100.5, currency: 'THB', weight: 18 },
  { name: 'Phuket', cc: 'THA', country: 'Thailand', lat: 7.88, lon: 98.39, currency: 'THB', weight: 12 },
  { name: 'Chiang Mai', cc: 'THA', country: 'Thailand', lat: 18.79, lon: 98.98, currency: 'THB', weight: 6 },
  { name: 'Singapore', cc: 'SGP', country: 'Singapore', lat: 1.35, lon: 103.82, currency: 'SGD', weight: 20 },
  { name: 'Ho Chi Minh City', cc: 'VNM', country: 'Vietnam', lat: 10.82, lon: 106.63, currency: 'VND', weight: 11 },
  { name: 'Hanoi', cc: 'VNM', country: 'Vietnam', lat: 21.03, lon: 105.85, currency: 'VND', weight: 8 },
  { name: 'Hoi An', cc: 'VNM', country: 'Vietnam', lat: 15.88, lon: 108.34, currency: 'VND', weight: 5 },
  { name: 'Kuala Lumpur', cc: 'MYS', country: 'Malaysia', lat: 3.14, lon: 101.69, currency: 'MYR', weight: 9 },
  { name: 'Siem Reap', cc: 'KHM', country: 'Cambodia', lat: 13.36, lon: 103.86, currency: 'KHR', weight: 4 },
  { name: 'Luang Prabang', cc: 'LAO', country: 'Laos', lat: 19.89, lon: 102.14, currency: 'LAK', weight: 2 },
  { name: 'Manila', cc: 'PHL', country: 'Philippines', lat: 14.6, lon: 120.98, currency: 'PHP', weight: 7 },
  { name: 'Cebu', cc: 'PHL', country: 'Philippines', lat: 10.32, lon: 123.89, currency: 'PHP', weight: 4 },

  // --- North Asia ---
  { name: 'Tokyo', cc: 'JPN', country: 'Japan', lat: 35.68, lon: 139.69, currency: 'JPY', weight: 26 },
  { name: 'Osaka', cc: 'JPN', country: 'Japan', lat: 34.69, lon: 135.5, currency: 'JPY', weight: 14 },
  { name: 'Kyoto', cc: 'JPN', country: 'Japan', lat: 35.01, lon: 135.77, currency: 'JPY', weight: 11 },
  { name: 'Niseko', cc: 'JPN', country: 'Japan', lat: 42.8, lon: 140.69, currency: 'JPY', weight: 8 },
  { name: 'Seoul', cc: 'KOR', country: 'South Korea', lat: 37.57, lon: 126.98, currency: 'KRW', weight: 9 },
  { name: 'Hong Kong', cc: 'HKG', country: 'Hong Kong', lat: 22.32, lon: 114.17, currency: 'HKD', weight: 10 },
  { name: 'Shanghai', cc: 'CHN', country: 'China', lat: 31.23, lon: 121.47, currency: 'CNY', weight: 8 },
  { name: 'Taipei', cc: 'TWN', country: 'Taiwan', lat: 25.03, lon: 121.57, currency: 'TWD', weight: 5 },

  // --- South Asia and the Middle East ---
  { name: 'Delhi', cc: 'IND', country: 'India', lat: 28.61, lon: 77.21, currency: 'INR', weight: 10 },
  { name: 'Mumbai', cc: 'IND', country: 'India', lat: 19.08, lon: 72.88, currency: 'INR', weight: 8 },
  { name: 'Bengaluru', cc: 'IND', country: 'India', lat: 12.97, lon: 77.59, currency: 'INR', weight: 6 },
  { name: 'Colombo', cc: 'LKA', country: 'Sri Lanka', lat: 6.93, lon: 79.86, currency: 'LKR', weight: 4 },
  { name: 'Kathmandu', cc: 'NPL', country: 'Nepal', lat: 27.72, lon: 85.32, currency: 'NPR', weight: 3 },
  { name: 'Malé', cc: 'MDV', country: 'Maldives', lat: 4.17, lon: 73.51, currency: 'MVR', weight: 4 },
  { name: 'Dubai', cc: 'ARE', country: 'UAE', lat: 25.2, lon: 55.27, currency: 'AED', weight: 12 },
  { name: 'Abu Dhabi', cc: 'ARE', country: 'UAE', lat: 24.45, lon: 54.38, currency: 'AED', weight: 5 },
  { name: 'Istanbul', cc: 'TUR', country: 'Türkiye', lat: 41.01, lon: 28.98, currency: 'TRY', weight: 6 },

  // --- Europe ---
  { name: 'London', cc: 'GBR', country: 'United Kingdom', lat: 51.51, lon: -0.13, currency: 'GBP', weight: 24 },
  { name: 'Edinburgh', cc: 'GBR', country: 'United Kingdom', lat: 55.95, lon: -3.19, currency: 'GBP', weight: 8 },
  { name: 'Manchester', cc: 'GBR', country: 'United Kingdom', lat: 53.48, lon: -2.24, currency: 'GBP', weight: 6 },
  { name: 'Dublin', cc: 'IRL', country: 'Ireland', lat: 53.35, lon: -6.26, currency: 'EUR', weight: 6 },
  { name: 'Paris', cc: 'FRA', country: 'France', lat: 48.86, lon: 2.35, currency: 'EUR', weight: 14 },
  { name: 'Nice', cc: 'FRA', country: 'France', lat: 43.7, lon: 7.27, currency: 'EUR', weight: 5 },
  { name: 'Rome', cc: 'ITA', country: 'Italy', lat: 41.9, lon: 12.5, currency: 'EUR', weight: 13 },
  { name: 'Florence', cc: 'ITA', country: 'Italy', lat: 43.77, lon: 11.26, currency: 'EUR', weight: 8 },
  { name: 'Venice', cc: 'ITA', country: 'Italy', lat: 45.44, lon: 12.32, currency: 'EUR', weight: 6 },
  { name: 'Barcelona', cc: 'ESP', country: 'Spain', lat: 41.39, lon: 2.17, currency: 'EUR', weight: 9 },
  { name: 'Madrid', cc: 'ESP', country: 'Spain', lat: 40.42, lon: -3.7, currency: 'EUR', weight: 6 },
  { name: 'Lisbon', cc: 'PRT', country: 'Portugal', lat: 38.72, lon: -9.14, currency: 'EUR', weight: 6 },
  { name: 'Athens', cc: 'GRC', country: 'Greece', lat: 37.98, lon: 23.73, currency: 'EUR', weight: 7 },
  { name: 'Santorini', cc: 'GRC', country: 'Greece', lat: 36.39, lon: 25.46, currency: 'EUR', weight: 5 },
  { name: 'Amsterdam', cc: 'NLD', country: 'Netherlands', lat: 52.37, lon: 4.9, currency: 'EUR', weight: 7 },
  { name: 'Berlin', cc: 'DEU', country: 'Germany', lat: 52.52, lon: 13.4, currency: 'EUR', weight: 6 },
  { name: 'Munich', cc: 'DEU', country: 'Germany', lat: 48.14, lon: 11.58, currency: 'EUR', weight: 5 },
  { name: 'Vienna', cc: 'AUT', country: 'Austria', lat: 48.21, lon: 16.37, currency: 'EUR', weight: 4 },
  { name: 'Prague', cc: 'CZE', country: 'Czechia', lat: 50.08, lon: 14.44, currency: 'CZK', weight: 4 },
  { name: 'Zürich', cc: 'CHE', country: 'Switzerland', lat: 47.38, lon: 8.54, currency: 'CHF', weight: 4 },
  { name: 'Copenhagen', cc: 'DNK', country: 'Denmark', lat: 55.68, lon: 12.57, currency: 'DKK', weight: 3 },
  { name: 'Stockholm', cc: 'SWE', country: 'Sweden', lat: 59.33, lon: 18.07, currency: 'SEK', weight: 3 },
  { name: 'Reykjavík', cc: 'ISL', country: 'Iceland', lat: 64.15, lon: -21.94, currency: 'ISK', weight: 2 },

  // --- The Americas ---
  { name: 'Los Angeles', cc: 'USA', country: 'United States', lat: 34.05, lon: -118.24, currency: 'USD', weight: 20 },
  { name: 'New York', cc: 'USA', country: 'United States', lat: 40.71, lon: -74.01, currency: 'USD', weight: 18 },
  { name: 'Honolulu', cc: 'USA', country: 'United States', lat: 21.31, lon: -157.86, currency: 'USD', weight: 12 },
  { name: 'San Francisco', cc: 'USA', country: 'United States', lat: 37.77, lon: -122.42, currency: 'USD', weight: 9 },
  { name: 'Las Vegas', cc: 'USA', country: 'United States', lat: 36.17, lon: -115.14, currency: 'USD', weight: 8 },
  { name: 'Vancouver', cc: 'CAN', country: 'Canada', lat: 49.28, lon: -123.12, currency: 'CAD', weight: 7 },
  { name: 'Toronto', cc: 'CAN', country: 'Canada', lat: 43.65, lon: -79.38, currency: 'CAD', weight: 5 },
  { name: 'Mexico City', cc: 'MEX', country: 'Mexico', lat: 19.43, lon: -99.13, currency: 'MXN', weight: 4 },
  { name: 'Lima', cc: 'PER', country: 'Peru', lat: -12.05, lon: -77.04, currency: 'PEN', weight: 3 },
  { name: 'Cusco', cc: 'PER', country: 'Peru', lat: -13.53, lon: -71.97, currency: 'PEN', weight: 3 },
  { name: 'Buenos Aires', cc: 'ARG', country: 'Argentina', lat: -34.6, lon: -58.38, currency: 'ARS', weight: 3 },
  { name: 'Rio de Janeiro', cc: 'BRA', country: 'Brazil', lat: -22.91, lon: -43.17, currency: 'BRL', weight: 3 },
  { name: 'Santiago', cc: 'CHL', country: 'Chile', lat: -33.45, lon: -70.67, currency: 'CLP', weight: 2 },

  // --- Africa ---
  { name: 'Cape Town', cc: 'ZAF', country: 'South Africa', lat: -33.92, lon: 18.42, currency: 'ZAR', weight: 5 },
  { name: 'Johannesburg', cc: 'ZAF', country: 'South Africa', lat: -26.2, lon: 28.05, currency: 'ZAR', weight: 3 },
  { name: 'Cairo', cc: 'EGY', country: 'Egypt', lat: 30.04, lon: 31.24, currency: 'EGP', weight: 4 },
  { name: 'Marrakesh', cc: 'MAR', country: 'Morocco', lat: 31.63, lon: -7.99, currency: 'EUR', weight: 3 },
]

/**
 * Where Australians actually went. Ordered by outbound trips — Indonesia and
 * New Zealand at the top, which is what makes this an Australian bank's chart
 * rather than a generic one.
 */
export const TOP_COUNTRIES = [
  { cc: 'IDN', code: 'IDN', name: 'Indonesia', value: 100 },
  { cc: 'NZL', code: 'NZL', name: 'New Zealand', value: 84 },
  { cc: 'USA', code: 'USA', name: 'United States', value: 61 },
  { cc: 'JPN', code: 'JPN', name: 'Japan', value: 57 },
  { cc: 'GBR', code: 'GBR', name: 'United Kingdom', value: 44 },
]

/** Merchant categories seen on the global feed, for the row pictogram. */
export const GLOBAL_CATEGORIES = ['dining', 'retail', 'transport', 'attraction', 'convenience']

/** Format an amount in a world currency. */
export function formatWorldAmount(amount, currency) {
  const meta = WORLD_CURRENCIES[currency] ?? { symbol: '', decimals: 2 }
  const value = new Intl.NumberFormat('en-AU', {
    minimumFractionDigits: meta.decimals,
    maximumFractionDigits: meta.decimals,
  }).format(amount)
  return `${meta.symbol}${value}`
}
