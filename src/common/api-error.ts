import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';

export type ValidationDetails = Record<string, string>;

export function validationError(details: ValidationDetails): UnprocessableEntityException {
  return new UnprocessableEntityException({
    code: 'validation_error',
    message: 'Datos inválidos',
    details,
  });
}

export function notFound(message = 'Recurso no encontrado'): NotFoundException {
  return new NotFoundException({ code: 'not_found', message });
}

export function conflict(message = 'Conflicto'): ConflictException {
  return new ConflictException({ code: 'conflict', message });
}

export function unauthorized(message = 'No autenticado'): UnauthorizedException {
  return new UnauthorizedException({ code: 'unauthorized', message });
}

export function forbidden(message = 'Prohibido'): ForbiddenException {
  return new ForbiddenException({ code: 'forbidden', message });
}
