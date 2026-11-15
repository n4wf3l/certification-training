<!DOCTYPE html>
<html lang="{{ app()->getLocale() }}">
<head>
    <meta charset="UTF-8">
    <title>{{ __('emails.inactive.subject', ['days' => $days]) }}</title>
    <style>
        body { font-family: 'Helvetica', 'Arial', sans-serif; background: #f7f8fa; margin: 0; padding: 40px 20px; color: #1f2431; }
        .wrap { max-width: 520px; margin: 0 auto; background: white; border-radius: 16px; padding: 32px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
        .brand { font-size: 12px; color: #646c81; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px; }
        h1 { font-size: 22px; margin: 0 0 16px; color: #141822; }
        p { line-height: 1.6; color: #363c4c; }
        .cta { display: inline-block; background: #12ccb0; color: white; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: bold; margin: 20px 0; }
        .foot { margin-top: 28px; font-size: 12px; color: #8a92a5; border-top: 1px solid #eef0f4; padding-top: 16px; }
    </style>
</head>
<body>
    <div class="wrap">
        <div class="brand">{{ $brandName }}</div>
        <h1>{{ __('emails.inactive.title', ['name' => $user->name]) }}</h1>
        <p>{!! __('emails.inactive.body_1_html', ['days' => $days]) !!}</p>
        <p>{{ __('emails.inactive.body_2') }}</p>
        <p style="text-align: center;">
            <a href="{{ url('/login') }}" class="cta">{{ __('emails.inactive.cta') }}</a>
        </p>
        <div class="foot">
            {{ __('emails.inactive.footer') }}
            <br><br>
            {{ $brandName }}
        </div>
    </div>
</body>
</html>
