// src/utils/indiaTime.js
const INDIA_TIME_ZONE = 'Asia/Kolkata';

// Set process timezone to Indian Standard Time across all environments
if (process.env.TZ !== INDIA_TIME_ZONE) {
  process.env.TZ = INDIA_TIME_ZONE;
}

const getIndiaDateTimeParts = (date = new Date()) => {
  const targetDate = date instanceof Date ? date : new Date(date);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: INDIA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).formatToParts(targetDate);

  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
};

const getIndiaDate = (date = new Date()) => {
  const parts = getIndiaDateTimeParts(date);
  return `${parts.year}-${parts.month}-${parts.day}`;
};

const getIndiaDateTime = (date = new Date()) => {
  const parts = getIndiaDateTimeParts(date);
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
};

const getIndiaTime = (date = new Date()) => {
  const parts = getIndiaDateTimeParts(date);
  return `${parts.hour}:${parts.minute}:${parts.second}`;
};

const getIndiaYear = (date = new Date()) => {
  const parts = getIndiaDateTimeParts(date);
  return parseInt(parts.year, 10);
};

const getIndiaMonth = (date = new Date()) => {
  const parts = getIndiaDateTimeParts(date);
  return parseInt(parts.month, 10);
};

const getIndiaMonthStart = (date = new Date()) => {
  const parts = getIndiaDateTimeParts(date);
  return `${parts.year}-${parts.month}-01`;
};

const getIndiaMonthEnd = (date = new Date()) => {
  const parts = getIndiaDateTimeParts(date);
  const year = parseInt(parts.year, 10);
  const month = parseInt(parts.month, 10);
  const lastDay = new Date(year, month, 0).getDate();
  return `${parts.year}-${parts.month}-${String(lastDay).padStart(2, '0')}`;
};

module.exports = {
  INDIA_TIME_ZONE,
  getIndiaDateTimeParts,
  getIndiaDate,
  getIndiaDateTime,
  getIndiaTime,
  getIndiaYear,
  getIndiaMonth,
  getIndiaMonthStart,
  getIndiaMonthEnd
};
