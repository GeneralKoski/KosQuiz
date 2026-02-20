import { useTranslation } from 'react-i18next';

interface Language {
  code: string;
  label: string;
}

const languages: Language[] = [
  { code: 'en', label: 'EN' },
  { code: 'it', label: 'IT' },
  { code: 'fr', label: 'FR' },
  { code: 'es', label: 'ES' },
];

interface LanguageSwitcherProps {
  onLanguageChange?: (code: string) => void;
}

export default function LanguageSwitcher({ onLanguageChange }: LanguageSwitcherProps) {
  const { i18n } = useTranslation();

  const handleChange = (code: string) => {
    i18n.changeLanguage(code);
    onLanguageChange?.(code);
  };

  return (
    <div className="flex gap-1">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => handleChange(lang.code)}
          className={`px-2 py-1 text-xs rounded transition-colors cursor-pointer ${
            i18n.language === lang.code
              ? 'bg-indigo-500 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}
