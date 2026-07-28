<?php

return [
    'certification_created' => 'Certification created.',
    'certification_updated' => 'Certification updated.',
    'certification_updated_course_removed' => 'Certification updated - course removed.',
    'certification_deleted' => 'Certification deleted.',
    'course_imported' => 'Course imported: :count blocks for :title.',
    'course_invalid_json' => "JSON is not valid. Check that it starts with [ and ends with ].",
    'course_block_missing_type' => "Block :n: missing 'type' key.",
    'course_block_missing_type_hint_comparison_row' => "Block :n: missing 'type' key - looks like a comparison row. Wrap these objects in { \"type\": \"comparison\", \"columns\": [...], \"rows\": [...] }.",
    'course_block_missing_type_hint_step_or_callout' => "Block :n: missing 'type' key - looks like a step or callout. Add \"type\": \"steps\" (with \"steps\": [...]) or \"type\": \"callout\".",
    'course_block_missing_type_hint_list_or_summary' => "Block :n: missing 'type' key - looks like a list or summary. Add \"type\": \"list\" or \"type\": \"summary\".",
    'course_block_missing_type_hint_paragraph' => "Block :n: missing 'type' key - looks like a paragraph. Add \"type\": \"paragraph\".",
    'course_block_unknown_type' => "Block :n: unknown type ':type'. Allowed: :allowed.",
    'course_too_few_blocks' => 'A course must contain at least 5 blocks. :count received.',
    'course_row_field_type' => 'Block :n: field ":field" must be either a string or a { lang: value } object.',
    'course_row_missing_lang' => 'Block :n: field ":field" is missing the translation for language ":lang".',
    'exam_attempt_abandoned' => 'That exam attempt was abandoned - start a new mock exam to continue your progression.',

    'question_added' => 'Question added.',
    'question_updated' => 'Question updated.',
    'question_deleted' => 'Question deleted.',
    'questions_imported' => ':count question imported successfully.|:count questions imported successfully.',
    'questions_invalid_json' => "JSON is not valid. Check that it starts with [ and ends with ].",
    'questions_row_bad_shape' => 'Question :n: missing prompt or invalid answer count (2 to 6 expected).',
    'questions_row_empty_answer' => 'Question :n: one answer has empty text.',
    'questions_row_wrong_correct_count' => 'Question :n: exactly one correct answer expected, :count found.',
    'questions_row_field_type' => 'Question :n: field ":field" must be either a string or a { lang: value } object.',
    'questions_row_missing_lang' => 'Question :n: field ":field" is missing the translation for language ":lang".',

    'settings_updated' => 'Settings updated.',

    'study_plan_created' => 'Study plan created.',
    'study_plan_deleted' => 'Plan deleted.',

    'report_duplicate' => 'You already reported this question recently - thanks, we are looking into it.',
    'report_submitted' => 'Report saved. Thanks - an admin will review it.',
    'report_updated' => 'Report updated.',

    'exam_domain_unknown' => 'Unknown domain for this certification.',
    'exam_no_questions_language' => 'No questions available in this language yet.',
    'exam_no_questions_domain_language' => 'No questions available in this domain for this language.',
    'ai_api_unreachable' => 'Unable to reach the OpenAI API. Please try again later.',
];
