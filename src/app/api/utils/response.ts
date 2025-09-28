
/// RESPONSE BLUEPRINT
/// {
///   meta: {
///     message: string,
///     success: boolean,
///     code: number,
///     errors?: [
///       { field: string, message: string }
///     ]
///   },
///   data: any,
///   pagination?: {
///     page: number,
///     pageSize: number,
///     total: number
///   }
/// }

import { NextResponse } from "next/server";

/// ENUM ERROR TYPES AND MESSAGES AND CODES
export enum ErrorType {
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
}

export const ErrorMessages: { [key in ErrorType]: string } = {
  [ErrorType.INTERNAL_SERVER_ERROR]: 'Terjadi kesalahan pada server',
  [ErrorType.VALIDATION_ERROR]: 'Validasi gagal',
  [ErrorType.UNAUTHORIZED]: 'Tidak diizinkan',
  [ErrorType.FORBIDDEN]: 'Akses ditolak',
  [ErrorType.NOT_FOUND]: 'Sumber daya tidak ditemukan',
};

export const ErrorCodes: { [key in ErrorType]: number } = {
  [ErrorType.INTERNAL_SERVER_ERROR]: 500,
  [ErrorType.VALIDATION_ERROR]: 400,
  [ErrorType.UNAUTHORIZED]: 401,
  [ErrorType.FORBIDDEN]: 403,
  [ErrorType.NOT_FOUND]: 404,
};

interface ApiPagination {
  page: number;
  pageSize: number;
  total: number;
}


interface apiResponseProps {
  error?: ErrorType;
  message?: string;
  data?: any;
  pagination?: ApiPagination;
  status?: number;
  errors?: { field: string; message: string }[];
}


function apiResponse({ error, message, data, pagination, status, errors }: apiResponseProps) {
  const isSuccess = !error;
  const res: NextResponse = NextResponse.json({
    meta: {
      message: message || (error ? ErrorMessages[error] : 'Berhasil'),
      success: isSuccess,
      code: isSuccess ? 200 : (status || (error ? ErrorCodes[error] : 500)),
      errors: errors || []
    },
    data: data || null,
    pagination: pagination || null
    }, { status: isSuccess ? 200 : (status || (error ? ErrorCodes[error] : 500)) });
  return res;
}

// Add static helper for internal server error
namespace apiResponse {
  export function internalError() {
    return apiResponse({ error: ErrorType.INTERNAL_SERVER_ERROR, message: 'Internal server error', status: 500 });
  }

  export function validationError(details: { field: string; message: string }[]) {
    return apiResponse({ error: ErrorType.VALIDATION_ERROR, message: 'Validation failed', status: 400, errors: details });
  }

  export function unauthorized(message?: string) {
    return apiResponse({ error: ErrorType.UNAUTHORIZED, message: message || 'Unauthorized', status: 401 });
  }

  export function forbidden(message?: string) {
    return apiResponse({ error: ErrorType.FORBIDDEN, message: message || 'Forbidden', status: 403 });
  }

  export function notFound(message?: string) {
    return apiResponse({ error: ErrorType.NOT_FOUND, message: message || 'Not Found', status: 404 });
  }

  export function success({ data, message, pagination }: { data?: any; message?: string; pagination?: ApiPagination }) {
    return apiResponse({ data, message: message || 'Success', pagination });
  }
}



/// export response and error types
export { apiResponse };