// Constants for the application

module.exports = {
  USER_ROLES: {
    CUSTOMER: 'customer',
    ARTISAN: 'artisan',
    ADMIN: 'admin',
  },

  JOB_STATUS: {
    PENDING: 'pending',
    ACCEPTED: 'accepted',
    QUOTED: 'quoted',
    CONFIRMED: 'confirmed',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    RATED: 'rated',
    CANCELLED: 'cancelled',
    DISPUTED: 'disputed',
  },

  TICKET_STATUS: {
    OPEN: 'open',
    IN_REVIEW: 'in_review',
    RESOLVED: 'resolved',
    CLOSED: 'closed',
  },

  TICKET_PRIORITY: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
  },

  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500,
  },
};
