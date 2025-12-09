export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: '\u0939\u093f\u0928\u094d\u0926\u0940 (Hindi)' },
  { code: 'or', label: '\u0b13\u0b21\u0b3c\u0b3f\u0b06 (Odia)' },
  { code: 'bn', label: '\u09ac\u09be\u0982\u09b2\u09be (Bengali)' },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]['code'];
