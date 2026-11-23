// Libellés des domaines du syllabus (clé syllabus_domain -> clé i18n exam_result.*).
// ITIL (Version 5) : les 7 catégories officielles du syllabus PeopleCert v5.0.
// Les anciennes clés ITIL restent pour les résultats d'examens déjà passés.
export const DOMAIN_KEY_MAP = {
    foundations: 'domain_foundations',
    'four-dimensions': 'domain_four_dimensions',
    'lifecycle-activities': 'domain_lifecycle',
    'itil-value-system': 'domain_value_system',
    'value-streams': 'domain_value_streams',
    'digital-ai-innovation': 'domain_digital_ai',
    'other-frameworks': 'domain_other_frameworks',
    'guiding-principles': 'domain_guiding_principles',
    practices: 'domain_practices',
    'continual-improvement': 'domain_continual',
    // CCNA 200-301 v1.1
    'network-fundamentals': 'domain_network_fundamentals',
    'network-access': 'domain_network_access',
    'ip-connectivity': 'domain_ip_connectivity',
    'ip-services': 'domain_ip_services',
    'security-fundamentals': 'domain_security_fundamentals',
    'automation-programmability': 'domain_automation',
};

export function domainLabel(t, key) {
    const dictKey = DOMAIN_KEY_MAP[key];
    return dictKey ? t(`exam_result.${dictKey}`) : key;
}
