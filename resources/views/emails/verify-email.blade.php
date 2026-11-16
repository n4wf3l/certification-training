<!DOCTYPE html>
<html lang="{{ app()->getLocale() }}">
<head>
    <meta charset="UTF-8">
    <title>{{ __('emails.verify.subject') }}</title>
    <style>
        body { font-family: 'Helvetica', 'Arial', sans-serif; background: #f7f8fa; margin: 0; padding: 40px 20px; color: #1f2431; }
        .wrap { max-width: 520px; margin: 0 auto; background: white; border-radius: 8px; padding: 32px; border: 1px solid #e3e6ec; }
        .brand { font-size: 12px; color: #646c81; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px; }
        h1 { font-size: 22px; margin: 0 0 16px; color: #141822; }
        p { line-height: 1.6; color: #363c4c; }
        .cta { display: inline-block; background: #2fd4b7; color: #0b0f17; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 20px 0; }
        .small { font-size: 13px; color: #646c81; }
        .link { word-break: break-all; font-size: 12px; color: #646c81; }
        .foot { margin-top: 28px; font-size: 12px; color: #8a92a5; border-top: 1px solid #eef0f4; padding-top: 16px; }
    </style>
</head>
<body>
    <div class="wrap">
        <div class="brand">{{ $brandName }}</div>
        <h1>{{ __('emails.verify.title', ['name' => $user->name]) }}</h1>
        <p>{{ __('emails.verify.body_1') }}</p>
        <p style="text-align: center;">
            <a href="{{ $url }}" class="cta">{{ __('emails.verify.cta') }}</a>
        </p>
        <p class="small">{{ __('emails.verify.expires', ['minutes' => $minutes]) }}</p>
        <p class="link">{{ $url }}</p>
        <div class="foot">{{ __('emails.verify.footer') }}</div>
    </div>
</body>
</html>
