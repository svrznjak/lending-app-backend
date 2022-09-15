import validator from 'validator';

export const sanitizeText = function sanitizeText({
  text,
  trim = true,
  escape = true,
}: {
  text: string;
  trim?: boolean;
  escape?: boolean;
}): string {
  if (trim) text = validator.trim(text);
  if (escape) text = validator.escape(text);
  return text;
};

export const sanitizeEmail = function sanitizeEmail({ email }: { email: string }): string {
  email = sanitizeText({ text: email, escape: false, trim: true });
  email = validator.normalizeEmail(email, {
    gmail_remove_dots: false,
    gmail_remove_subaddress: false,
    gmail_convert_googlemaildotcom: false,
    outlookdotcom_remove_subaddress: false,
    yahoo_remove_subaddress: false,
    icloud_remove_subaddress: false,
  });
  return email;
};
