<?php

return [
    'streak' => [
        'subject'      => 'Ton streak de :days jours est en danger',
        'title'        => 'Salut :name,',
        'body_1_html'  => 'Ton streak de <strong>:days jours consécutifs</strong> risque de casser aujourd\'hui si tu ne fais pas au moins un exercice avant minuit.',
        'streak_pill'  => ':days jours',
        'body_2'       => 'Il te suffit d\'une seule bonne réponse pour prolonger la série. Pas besoin de faire un examen complet.',
        'cta'          => 'Reprendre l\'entraînement',
        'footer'       => 'Tu reçois cet email parce que ton streak est menacé. Il ne partira pas si tu es actif au moins un jour tous les deux jours.',
        'tagline'      => 'Entraînement adaptatif pour certifications IT',
    ],
    'plan_reminder' => [
        'subject'               => 'Ton plan :cert attend depuis :days jours',
        'subject_cert_fallback' => 'ta certification',
        'title'                 => 'Hey :name,',
        'body_1_html'           => 'Ton plan pour <strong>:cert</strong> attend depuis <strong>:days jours</strong>.',
        'box_html'              => 'Il te reste <strong>:remaining jour(s)</strong> avant l\'examen, et ton objectif quotidien est de <strong>:target questions</strong>.',
        'body_2'                => 'Pas la peine de faire un marathon : quelques questions aujourd\'hui suffisent pour reprendre le rythme.',
        'cta'                   => 'Reprendre mon plan',
        'footer'                => 'Tu reçois cet email car tu as activé les rappels de plan. Tu peux le désactiver depuis la page du plan.',
    ],
    'plan_digest' => [
        'subject'               => ':brand - Ta semaine sur :cert',
        'subject_cert_fallback' => 'ton plan',
        'brand_tag'             => ':brand - Digest hebdo',
        'title'                 => 'Ta semaine sur :cert',
        'greeting'              => 'Salut :name, voici ton bilan pour la semaine écoulée.',
        'label_questions'       => 'Questions',
        'label_exams'           => 'Examens',
        'label_avg'             => 'Moyenne',
        'body_html'             => 'Il te reste <strong>:remaining jour(s)</strong> avant l\'examen. Objectif quotidien : :target questions.',
        'cta'                   => 'Voir mon plan',
        'footer'                => 'Tu reçois ce digest chaque lundi. Tu peux le désactiver depuis la page du plan.',
    ],
];
