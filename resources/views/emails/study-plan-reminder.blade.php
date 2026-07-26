<!DOCTYPE html>
<html lang="{{ app()->getLocale() }}">
<head>
    <meta charset="UTF-8">
    <title>{{ __('emails.plan_reminder.subject', ['cert' => $plan->certification->title, 'days' => $daysSince]) }}</title>
    <style>
        body { font-family: 'Helvetica', 'Arial', sans-serif; background: #f7f8fa; margin: 0; padding: 40px 20px; color: #1f2431; }
        .wrap { max-width: 520px; margin: 0 auto; background: white; border-radius: 16px; padding: 32px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
        .brand { font-size: 12px; color: #646c81; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px; }
        h1 { font-size: 22px; margin: 0 0 16px; color: #141822; }
        .box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 4px; margin: 20px 0; color: #78350f; font-size: 14px; }
        p { line-height: 1.6; color: #363c4c; }
        .cta { display: inline-block; background: #12ccb0; color: white; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: bold; margin: 20px 0; }
        .foot { margin-top: 28px; font-size: 12px; color: #8a92a5; border-top: 1px solid #eef0f4; padding-top: 16px; }
    </style>
</head>
<body>
    <div class="wrap">
        <div class="brand">{{ $brandName }}</div>
        <h1>{{ __('emails.plan_reminder.title', ['name' => $plan->user->name]) }}</h1>
        <p>{!! __('emails.plan_reminder.body_1_html', ['cert' => e($plan->certification->title), 'days' => $daysSince]) !!}</p>
        <div class="box">
            {!! __('emails.plan_reminder.box_html', ['remaining' => $daysUntil, 'target' => $plan->daily_target]) !!}
        </div>
        <p>{{ __('emails.plan_reminder.body_2') }}</p>
        <p style="text-align: center;">
            <a href="{{ url('/study-plans/' . $plan->id) }}" class="cta">{{ __('emails.plan_reminder.cta') }}</a>
        </p>
        <div class="foot">
            {{ __('emails.plan_reminder.footer') }}
            <br><br>
            {{ $brandName }}
        </div>
    </div>
</body>
</html>
