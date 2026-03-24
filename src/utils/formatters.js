export const cleanDigits = (value) => String(value || '').replace(/\D/g, '');

/**
 * Formata CNPJ: 00.000.000/0000-00
 */
export const formatCNPJ = (value) => {
  if (!value) return '';
  const clean = cleanDigits(value).slice(0, 14);
  if (clean.length !== 14) return clean;
  return clean.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
};

/**
 * Mascara progressiva de CNPJ para inputs
 */
export const maskCNPJ = (value) => {
  const digits = cleanDigits(value).slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
};

/**
 * Mascara progressiva de CPF para inputs
 */
export const maskCPF = (value) => {
  const digits = cleanDigits(value).slice(0, 11);
  return digits
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2');
};

/**
 * Mascara progressiva de telefone para inputs
 */
export const maskPhone = (value) => {
  const digits = cleanDigits(value).slice(0, 11);
  if (digits.length <= 10) return digits.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
  return digits.replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
};
