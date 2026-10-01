/** An error the client caused or can act on; sent as `{ error: { code, message } }` */
export class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const badRequest = (message, code = 'invalid_request') => new HttpError(400, code, message);
export const unauthorized = (message = 'Faça login para continuar.') => new HttpError(401, 'unauthorized', message);
export const forbidden = (message = 'Você não tem acesso a este recurso.') => new HttpError(403, 'forbidden', message);
export const notFound = (message = 'Não encontrado.') => new HttpError(404, 'not_found', message);
export const conflict = (message, code = 'conflict') => new HttpError(409, code, message);

// eslint-disable-next-line no-unused-vars -- Express identifies error handlers by their four arguments
export const errorHandler = (err, req, res, next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message } });
    return;
  }
  // Malformed JSON body
  if (err?.type === 'entity.parse.failed') {
    res.status(400).json({ error: { code: 'invalid_json', message: 'O corpo da requisição não é um JSON válido.' } });
    return;
  }
  console.error(err);
  res.status(500).json({ error: { code: 'internal_error', message: 'Erro interno. Tente novamente.' } });
};
