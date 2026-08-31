import { useState, useCallback } from "react";
import { LanguageContext, translations } from "@/context/LanguageContext";

export function LanguageProvider({ children }) {
	const [lang, setLang] = useState(() => localStorage.getItem("app_lang") || "uz");

	const t = useCallback((key, ...args) => {
		let text = (translations[lang] && translations[lang][key]) || translations.uz[key] || key;
		if (args.length > 0 && typeof text === 'string') args.forEach((arg, i) => { text = text.replace(`{${i}}`, String(arg)); });
		return text;
	}, [lang]);

	const changeLanguage = (newLang) => {
		setLang(newLang);
		localStorage.setItem("app_lang", newLang);
	};

	return (
		<LanguageContext.Provider value={{ lang, t, changeLanguage }}>
			{children}
		</LanguageContext.Provider>
	);
}
