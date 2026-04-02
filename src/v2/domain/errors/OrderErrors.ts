export class OrderNotFoundError extends Error {
  constructor(orderId: string) {
    super(`Order with ID ${orderId} not found`);
    this.name = 'OrderNotFoundError';
  }
}

export class OrderValidationError extends Error {
  constructor(message: string, public details?: string[]) {
    super(message);
    this.name = 'OrderValidationError';
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string = 'Unauthorized access') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class OrderStatusError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OrderStatusError';
  }
}

export class SubscriptionLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SubscriptionLimitError';
  }
}