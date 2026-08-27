/**
 * Small request-body validators.
 *
 * The write routes previously passed req.body straight into SQL parameters.
 * Postgres would then reject a bad type itself, which surfaces as a 500 and an
 * "Internal server error" — the caller learns nothing about which field was
 * wrong, and the log fills with database errors that are really client
 * mistakes. Worse, a field with no length bound lets a caller store an
 * arbitrarily large string in a VARCHAR column until the insert fails.
 *
 * Deliberately hand-rolled rather than pulling in a schema library: the rules
 * needed here are a handful of type and range checks, and a dependency would be
 * more surface area than the problem warrants.
 */

/** Trimmed string, or null when absent. Rejects non-strings and overlong input. */
function str(value, { field, required = false, max = 255 } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required) throw new ValidationError(`${field} is required`);
    return null;
  }
  if (typeof value !== 'string') {
    throw new ValidationError(`${field} must be text`);
  }
  const trimmed = value.trim();
  if (required && !trimmed) throw new ValidationError(`${field} is required`);
  if (trimmed.length > max) {
    throw new ValidationError(`${field} must be ${max} characters or fewer`);
  }
  return trimmed || null;
}

/** Finite number within range, or null when absent. */
function num(value, { field, min = null, max = null } = {}) {
  if (value === undefined || value === null || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) {
    throw new ValidationError(`${field} must be a number`);
  }
  if (min !== null && n < min) {
    throw new ValidationError(`${field} must be at least ${min}`);
  }
  if (max !== null && n > max) {
    throw new ValidationError(`${field} must be at most ${max}`);
  }
  return n;
}

/** Boolean, or null when absent. Accepts the string forms a client may send. */
function bool(value, { field } = {}) {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new ValidationError(`${field} must be true or false`);
}

/** Array of plain objects, capped so one request cannot create unbounded rows. */
function list(value, { field, max = 100 } = {}) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    throw new ValidationError(`${field} must be a list`);
  }
  if (value.length > max) {
    throw new ValidationError(`${field} cannot contain more than ${max} items`);
  }
  return value;
}

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.status = 400;
  }
}

/**
 * Wraps an async route handler so a ValidationError becomes a 400 with the
 * offending field named, and anything else falls through to the global handler.
 */
function handle(fn) {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      if (error instanceof ValidationError) {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  };
}

module.exports = { str, num, bool, list, ValidationError, handle };
