// Catalogue partage des langues supportees par la plateforme.
// Utilise cote admin (formulaire certif : picker multi-langues) et
// cote import ChatGPT (selecteur de langue pour le batch en cours).
//
// - code   : ISO 639-1 (2 lettres), aussi utilise pour l'attribut HTML `lang`
// - label  : nom francais court affiche dans les selects admin
// - native : endonyme (ex: Deutsch) affiche a cote pour reconnaissance visuelle
// - prompt : formulation completement autonome injectee dans le prompt ChatGPT,
//            ecrite dans la langue cible pour maximiser la fidelite du modele.

export const LANGUAGE_CATALOG = [
    { code: 'en', label: 'Anglais', native: 'English', prompt: 'English (US/UK, official certification body vocabulary in English)' },
    { code: 'fr', label: 'Francais', native: 'Francais', prompt: 'francais (France, terminologie officielle francaise)' },
    { code: 'es', label: 'Espagnol', native: 'Espanol', prompt: 'espanol (Espana / America Latina, terminologia oficial en espanol)' },
    { code: 'pt', label: 'Portugais', native: 'Portugues', prompt: 'portugues (Brasil / Portugal, terminologia oficial em portugues)' },
    { code: 'de', label: 'Allemand', native: 'Deutsch', prompt: 'Deutsch (offizielle deutsche Fachterminologie der Zertifizierungsstelle)' },
    { code: 'it', label: 'Italien', native: 'Italiano', prompt: 'italiano (terminologia ufficiale in italiano dell’ente certificatore)' },
    { code: 'nl', label: 'Neerlandais', native: 'Nederlands', prompt: 'Nederlands (officiele Nederlandstalige terminologie van de certificerende instantie)' },
    { code: 'ar', label: 'Arabe', native: 'العربية', prompt: 'العربية (الفصحى الحديثة، المصطلحات الرسمية للجهة المُصْدِرة للشهادة)' },
    // Nouvelles langues officielles ITIL 4/5 (PeopleCert juillet 2026)
    { code: 'zh', label: 'Chinois', native: '中文', prompt: '中文（简体，认证机构官方术语）' },
    { code: 'ja', label: 'Japonais', native: '日本語', prompt: '日本語（認定機関の公式用語）' },
    { code: 'pl', label: 'Polonais', native: 'Polski', prompt: 'polski (oficjalna terminologia jednostki certyfikującej w języku polskim)' },
];

// L'anglais est la langue canonique / principale de la plateforme (decision produit).
// Les tirages d'exam par defaut se font en anglais si l'user n'a pas exprime de preference,
// et c'est la langue de fallback quand une traduction est manquante.
export const DEFAULT_LANGUAGE = 'en';

export function getLanguage(code) {
    return LANGUAGE_CATALOG.find((l) => l.code === code) || null;
}

export function languageLabel(code) {
    return getLanguage(code)?.label ?? code;
}

export function languageNative(code) {
    return getLanguage(code)?.native ?? code;
}

export function languagePromptDescriptor(code) {
    return getLanguage(code)?.prompt ?? code;
}
