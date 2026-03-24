export const MIN_PASSWORD_LENGTH = 10;

export const PASSWORD_RULES = [
  { label: `Minimo de ${10} caracteres`, test: (v) => v.length >= 10 },
  { label: 'Ao menos uma letra maiuscula (A-Z)', test: (v) => /[A-Z]/.test(v) },
  { label: 'Ao menos uma letra minuscula (a-z)', test: (v) => /[a-z]/.test(v) },
  { label: 'Ao menos um numero (0-9)', test: (v) => /\d/.test(v) },
  { label: 'Ao menos um caractere especial (!@#$...)', test: (v) => /[^A-Za-z0-9]/.test(v) },
];

export const validatePasswordStrength = (password) => {
  const value = String(password || '');
  const errors = [];

  if (value.length < MIN_PASSWORD_LENGTH) {
    errors.push(`A senha deve ter no minimo ${MIN_PASSWORD_LENGTH} caracteres.`);
  }
  if (!/[a-z]/.test(value)) {
    errors.push('A senha deve incluir ao menos uma letra minuscula.');
  }
  if (!/[A-Z]/.test(value)) {
    errors.push('A senha deve incluir ao menos uma letra maiuscula.');
  }
  if (!/\d/.test(value)) {
    errors.push('A senha deve incluir ao menos um numero.');
  }
  if (!/[^A-Za-z0-9]/.test(value)) {
    errors.push('A senha deve incluir ao menos um caractere especial.');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};
