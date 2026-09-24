export function validateEnv(config: Record<string, unknown>): Record<string, unknown> {
  const required = ['DATABASE_URL', 'DATABASE_URL_UNPOOLED', 'JWT_SECRET'];
  const missing = required.filter((key) => {
    const value = config[key];
    return value === undefined || value === null || value === '';
  });

  if (missing.length > 0) {
    throw new Error(
      `Configuración inválida: faltan variables de entorno requeridas -> ${missing.join(', ')}. ` +
        'Revisa .env.example y tu archivo .env.',
    );
  }

  return config;
}
