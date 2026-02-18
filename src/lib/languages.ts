// Shared language definitions for CampusHub multilingual support

export const CONTENT_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
] as const;

export type ContentLanguageCode = typeof CONTENT_LANGUAGES[number]['code'];

export const getLanguageLabel = (code: string): string => {
  const lang = CONTENT_LANGUAGES.find(l => l.code === code);
  return lang ? `${lang.nativeName} (${lang.name})` : code;
};

export const getLanguageName = (code: string): string => {
  const lang = CONTENT_LANGUAGES.find(l => l.code === code);
  return lang?.name || code;
};
