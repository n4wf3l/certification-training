<!DOCTYPE html>
<html lang="{{ app()->getLocale() }}">
<head>
    <meta charset="UTF-8">
    <title>{{ __('emails.plan_digest.subject', ['brand' => $brandName, 'cert' => $plan->certification->title]) }}</title>
    <style>
        body { font-family: 'Helvetica', 'Arial', sans-serif; background: #f7f8fa; margin: 0; padding: 40px 20px; color: #1f2431; }
        .wrap { max-width: 560px; margin: 0 auto; background: white; border-radius: 16px; padding: 32px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
        .brand { font-size: 12px; color: #646c81; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px; }
        h1 { font-size: 22px; margin: 0 0 16px; color: #141822; }
        .grid { display: table; width: 100%; margin: 20px 0; border-spacing: 8px; }
        .cell { display: table-cell; background: #eefefa; border: 1px solid #12ccb0; border-radius: 8px; padding: 12px; text-align: center; width: 33%; vertical-align: top; }
        .cell .val { font-size: 24px; font-weight: bold; color: #12ccb0; }
        .cell .lbl { font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: #14544c; margin-top: 4px; }
        p { line-height: 1.6; color: #363c4c; }
        .cta { display: inline-block; background: #12ccb0; color: white; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: bold; margin: 12px 0; }
        .foot { margin-top: 28px; font-size: 12px; color: #8a92a5; border-top: 1px solid #eef0f4; padding-top: 16px; }
    </style>
</head>
<body>
    <div class="wrap">
        <div class="brand">{{ __('emails.plan_digest.brand_tag', ['brand' => $brandName]) }}</div>
        <h1>{{ __('emails.plan_digest.title', ['cert' => $plan->certification->title]) }}</h1>
        <p>{{ __('emails.plan_digest.greeting', ['name' => $plan->user->name]) }}</p>

        <div class="grid">
            <div class="cell">
                <div class="val">{{ $stats['questions_answered'] ?? 0 }}</div>
                <div class="lbl">{{ __('emails.plan_digest.label_questions') }}</div>
            </div>
            <div class="cell">
                <div class="val">{{ $stats['exams_completed'] ?? 0 }}</div>
                <div class="lbl">{{ __('emails.plan_digest.label_exams') }}</div>
            </div>
            <div class="cell">
                <div class="val">{{ $stats['avg_score'] ?? 0 }}%</div>
                <div class="lbl">{{ __('emails.plan_digest.label_avg') }}</div>
            </div>
        </div>

        <p>
            {!! __('emails.plan_digest.body_html', ['remaining' => $daysUntil, 'target' => $plan->daily_target]) !!}
        </p>

        <p style="text-align: center;">
            <a href="{{ url('/study-plans/' . $plan->id) }}" class="cta">{{ __('emails.plan_digest.cta') }}</a>
        </p>

        <div class="foot">
            {{ __('emails.plan_digest.footer') }}
            <br><br>
            {{ $brandName }}
        </div>
    </div>
</body>
</html>
