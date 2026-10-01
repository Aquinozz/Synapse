import { badRequest } from './errors.js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Trimmed non-empty string within a length limit */
export const text = (value, field, { max = 200 } = {}) => {
  if (typeof value !== 'string' || !value.trim()) throw badRequest(`Informe ${field}.`);
  const trimmed = value.trim();
  if (trimmed.length > max) throw badRequest(`${field} deve ter no máximo ${max} caracteres.`);
  return trimmed;
};

export const email = (value) => {
  const address = text(value, 'o e-mail', { max: 254 }).toLowerCase();
  if (!EMAIL.test(address)) throw badRequest('E-mail inválido.');
  return address;
};

export const password = (value) => {
  if (typeof value !== 'string' || value.length < 8) {
    throw badRequest('A senha deve ter pelo menos 8 caracteres.');
  }
  if (value.length > 200) throw badRequest('A senha deve ter no máximo 200 caracteres.');
  return value;
};

export const oneOf = (value, options, field) => {
  if (!options.includes(value)) throw badRequest(`${field} inválido.`);
  return value;
};

/** Weekday as in Date.getDay(): 0 = domingo */
export const weekday = (value) => {
  if (!Number.isInteger(value) || value < 0 || value > 6) throw badRequest('Dia da semana inválido.');
  return value;
};

/** "HH:MM" in 24h */
export const time = (value) => {
  if (typeof value !== 'string' || !TIME.test(value)) throw badRequest('Horário inválido. Use o formato HH:MM.');
  return value;
};

export const id = (value, field = 'identificador') => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) throw badRequest(`${field} inválido.`);
  return parsed;
};
