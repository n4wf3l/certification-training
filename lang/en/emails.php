<?php

return [
    'streak' => [
        'subject'      => 'Your :days-day streak is at risk',
        'title'        => 'Hi :name,',
        'body_1_html'  => 'Your streak of <strong>:days consecutive days</strong> is about to break today unless you complete at least one exercise before midnight.',
        'streak_pill'  => ':days days',
        'body_2'       => 'A single correct answer is enough to extend the streak. No need to run a full exam.',
        'cta'          => 'Resume training',
        'footer'       => 'You are receiving this email because your streak is at risk. It won\'t break as long as you\'re active at least every other day.',
        'tagline'      => 'Adaptive training for IT certifications',
    ],
    'plan_reminder' => [
        'subject'               => 'Your :cert plan has been waiting for :days days',
        'subject_cert_fallback' => 'your certification',
        'title'                 => 'Hey :name,',
        'body_1_html'           => 'Your plan for <strong>:cert</strong> has been waiting for <strong>:days days</strong>.',
        'box_html'              => 'You have <strong>:remaining day(s)</strong> before the exam, and your daily goal is <strong>:target questions</strong>.',
        'body_2'                => 'No need for a marathon: a few questions today are enough to get back in rhythm.',
        'cta'                   => 'Resume my plan',
        'footer'                => 'You receive this email because plan reminders are enabled. You can turn them off from the plan page.',
    ],
    'plan_digest' => [
        'subject'               => ':brand - Your week on :cert',
        'subject_cert_fallback' => 'your plan',
        'brand_tag'             => ':brand - Weekly digest',
        'title'                 => 'Your week on :cert',
        'greeting'              => 'Hi :name, here is your recap for the past week.',
        'label_questions'       => 'Questions',
        'label_exams'           => 'Exams',
        'label_avg'             => 'Average',
        'body_html'             => 'You have <strong>:remaining day(s)</strong> before the exam. Daily goal: :target questions.',
        'cta'                   => 'View my plan',
        'footer'                => 'You receive this digest every Monday. You can disable it from the plan page.',
    ],
];
