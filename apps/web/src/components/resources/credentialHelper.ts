export interface CredentialAccountData {
  email: string;
  password: string;
}

/**
 * Parsea el contenido de una credencial de planillaje.
 * Admite formato JSON estructurado { email, password } y fallback retroactivo
 * para credenciales creadas como texto plano en versiones anteriores.
 */
export const parseCredentialData = (content?: string | null): CredentialAccountData => {
  if (!content) {
    return { email: '', password: '' };
  }
  try {
    const parsed = JSON.parse(content);
    if (typeof parsed === 'object' && parsed !== null) {
      return {
        email:
          typeof parsed.email === 'string'
            ? parsed.email
            : typeof parsed.username === 'string'
              ? parsed.username
              : '',
        password: typeof parsed.password === 'string' ? parsed.password : '',
      };
    }
  } catch {
    // Si no es JSON válido (datos heredados en texto plano), se trata como password
  }
  return { email: '', password: content };
};

/**
 * Serializa los datos de la cuenta de planillaje a JSON para su almacenamiento en BD.
 */
export const serializeCredentialData = (data: CredentialAccountData): string => {
  return JSON.stringify({
    email: data.email.trim(),
    password: data.password.trim(),
  });
};

