// =========================================================
// IST DATE/TIME UTILITIES
// Indian Standard Time (Asia/Kolkata, UTC+05:30)
// =========================================================

// =========================================================
// FORMAT FULL IST DATE TIME
// =========================================================

export const formatISTDateTime = (date) => {
  if (!date) {
    return 'N/A';
  }

  try {
    return new Date(date).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  } catch (error) {
    console.log('formatISTDateTime error:', error);
    return 'Invalid Date';
  }
};

// =========================================================
// FORMAT TIME ONLY (12-HOUR IST)
// =========================================================

export const formatISTTime = (date) => {
  if (!date) {
    return '--';
  }

  try {
    return new Date(date).toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch (error) {
    console.log('formatISTTime error:', error);
    return '--';
  }
};

// =========================================================
// FORMAT RELATIVE TIME
// =========================================================

export const formatRelativeTime = (dateString) => {
  if (!dateString) {
    return 'Never';
  }

  try {
    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
      return 'Never';
    }

    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 1) {
      return 'Just now';
    }

    if (diffMinutes < 60) {
      return `${diffMinutes} min ago`;
    }

    const diffHours = Math.floor(diffMinutes / 60);

    if (diffHours < 24) {
      return `${diffHours} hr ago`;
    }

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day ago`;
  } catch (error) {
    console.log('formatRelativeTime error:', error);
    return 'Never';
  }
};

// =========================================================
// FORMAT NEXT RUN (IST)
// Handles both HH:mm:ss recurring times and ISO absolute dates
// =========================================================

export const formatNextRunIST = (timeString) => {
  if (!timeString) {
    return 'Not Scheduled';
  }

  try {
    // Handles HH:mm:ss format (recurring daily schedule)
    if (typeof timeString === 'string' && timeString.includes(':') && !timeString.includes('T')) {
      const now = new Date();
      const [hours, minutes, seconds] = timeString.split(':').map(Number);

      const date = new Date();
      date.setHours(hours);
      date.setMinutes(minutes);
      date.setSeconds(seconds || 0);

      // If the time has already passed today, schedule for tomorrow
      if (date < now) {
        date.setDate(date.getDate() + 1);
      }

      return date.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    }

    // Handles ISO dates (absolute timestamps)
    return new Date(timeString).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch (error) {
    console.log('formatNextRunIST error:', error);
    return 'Invalid Time';
  }
};

// =========================================================
// GET IST ISO STRING
// Returns ISO-8601 string with +05:30 offset so IoT firmware
// receives the correct local Indian time, not UTC.
// e.g. "2026-05-22T14:26:12.345+05:30"
// =========================================================

export const getISTISOString = () => toISTISOString(new Date());

// =========================================================
// CONVERT ANY DATE TO IST ISO STRING
// Takes a Date (or anything `new Date()` accepts) and returns
// an ISO-8601 string with the +05:30 offset preserved so the
// human-readable time portion matches a clock in India and
// parses back to the same absolute moment.
// e.g. Date(2026-05-28 06:00 IST) → "2026-05-28T06:00:00.000+05:30"
// =========================================================

export const toISTISOString = (input) => {
  try {
    const d = input instanceof Date ? input : new Date(input);
    if (isNaN(d.getTime())) return new Date().toISOString();
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
    const shifted = new Date(d.getTime() + IST_OFFSET_MS);
    return shifted.toISOString().replace('Z', '+05:30');
  } catch (error) {
    console.log('toISTISOString error:', error);
    return new Date().toISOString();
  }
};
