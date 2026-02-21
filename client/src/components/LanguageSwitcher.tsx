import { useTranslation } from "react-i18next";

interface Language {
  code: string;
  label: string;
}

const languages: Language[] = [
  { code: "en", label: "EN" },
  { code: "it", label: "IT" },
  { code: "fr", label: "FR" },
  { code: "es", label: "ES" },
];

interface LanguageSwitcherProps {
  onLanguageChange?: (code: string) => void;
}

export default function LanguageSwitcher({
  onLanguageChange,
}: LanguageSwitcherProps) {
  const { i18n } = useTranslation();

  const handleChange = (code: string) => {
    i18n.changeLanguage(code);
    onLanguageChange?.(code);
  };

  return (
    <div className="flex gap-1 bg-[#111] p-1 rounded-lg border border-white/5">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => handleChange(lang.code)}
          className={`px-3 py-1 text-[10px] sm:text-xs font-black rounded-md transition-all uppercase tracking-widest cursor-pointer ${
            i18n.language === lang.code
              ? "bg-[var(--accent-color)] text-black shadow-sm scale-[1.05]"
              : "bg-transparent text-white/40 hover:text-white hover:bg-white/5"
          }`}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}
