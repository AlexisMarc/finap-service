export function resolveCorsOrigins(): string[] | boolean {
  const raw = process.env.CORS_ORIGINS;
  const list = raw
    ? raw
        .split(',')
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0)
    : [];

  if (list.length > 0) {
    return list;
  }

  // Sin lista explícita: en producción no se autoriza cross-origin;
  // en local/preview se permite para facilitar el desarrollo.
  return process.env.VERCEL_ENV === 'production' ? false : true;
}
