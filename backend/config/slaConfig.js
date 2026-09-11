// backend/config/slaConfig.js

// SLA Durations in hours
const SLA_DURATIONS_HOURS = {
  Critical: 24,
  High: 48,
  Medium: 72,
  Low: 168 // 7 days
};

// Convert hours to milliseconds
const getSlaDurationMs = (priority) => {
  const hours = SLA_DURATIONS_HOURS[priority] || SLA_DURATIONS_HOURS.Medium;
  return hours * 60 * 60 * 1000;
};

// Calculate SLA deadline based on creation/start time
const calculateSlaDeadline = (startDate, priority) => {
  const durationMs = getSlaDurationMs(priority);
  return new Date(new Date(startDate).getTime() + durationMs);
};

module.exports = {
  SLA_DURATIONS_HOURS,
  getSlaDurationMs,
  calculateSlaDeadline
};
