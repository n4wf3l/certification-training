<?php

return [
    'certification_created' => 'Certification créée.',
    'certification_updated' => 'Certification mise à jour.',
    'certification_updated_course_removed' => 'Certification mise à jour - cours retiré.',
    'certification_deleted' => 'Certification supprimée.',
    'course_imported' => 'Cours importé : :count blocs pour :title.',
    'course_invalid_json' => "Le JSON n'est pas valide. Vérifie qu'il commence par [ et se termine par ].",
    'course_block_missing_type' => "Bloc :n : clé 'type' manquante.",
    'course_block_unknown_type' => "Bloc :n : type ':type' inconnu. Autorisés : :allowed.",
    'course_too_few_blocks' => 'Un cours doit contenir au moins 5 blocs. :count reçu(s).',
    'course_row_field_type' => 'Bloc :n : le champ « :field » doit être une string ou un objet { lang: valeur }.',
    'course_row_missing_lang' => 'Bloc :n : le champ « :field » manque la traduction pour la langue « :lang ».',
    'exam_attempt_abandoned' => 'Cette tentative a été abandonnée - lance un nouvel examen blanc pour continuer ta progression.',

    'question_added' => 'Question ajoutée.',
    'question_updated' => 'Question mise à jour.',
    'question_deleted' => 'Question supprimée.',
    'questions_imported' => ':count question importée avec succès.|:count questions importées avec succès.',
    'questions_invalid_json' => "Le JSON n'est pas valide. Vérifie qu'il commence par [ et se termine par ].",
    'questions_row_bad_shape' => 'Question :n : énoncé manquant ou nombre de réponses invalide (2 à 6 attendues).',
    'questions_row_empty_answer' => 'Question :n : une réponse a un texte vide.',
    'questions_row_wrong_correct_count' => 'Question :n : une seule réponse correcte attendue, :count trouvée(s).',
    'questions_row_field_type' => 'Question :n : le champ « :field » doit être une string ou un objet { lang: valeur }.',
    'questions_row_missing_lang' => 'Question :n : le champ « :field » manque la traduction pour la langue « :lang ».',

    'settings_updated' => 'Paramètres mis à jour.',

    'study_plan_created' => 'Plan de révision créé.',
    'study_plan_deleted' => 'Plan supprimé.',

    'report_duplicate' => 'Tu as déjà signalé cette question récemment - merci, on regarde.',
    'report_submitted' => 'Signalement enregistré. Merci - un admin va regarder.',
    'report_updated' => 'Signalement mis à jour.',

    'exam_domain_unknown' => 'Domaine inconnu pour cette certification.',
    'exam_no_questions_language' => "Aucune question disponible dans cette langue pour l'instant.",
    'exam_no_questions_domain_language' => 'Aucune question disponible dans ce domaine pour cette langue.',
    'ai_api_unreachable' => "Impossible de contacter l'API OpenAI. Réessaie plus tard.",
];
