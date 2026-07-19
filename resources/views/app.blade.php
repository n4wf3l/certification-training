<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="h-full">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="theme-color" content="#0b0f17">

        <title inertia>{{ $brandName ?? 'CertifLoop' }}</title>
        <script>window.__BRAND_NAME__ = @json($brandName ?? 'CertifLoop');</script>

        {{-- Favicon : logo custom si upload, sinon un SVG inline avec le logo par défaut --}}
        @if(!empty($brandLogoUrl))
            <link rel="icon" href="{{ $brandLogoUrl }}">
            <link rel="apple-touch-icon" href="{{ $brandLogoUrl }}">
        @else
            <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect width='24' height='24' rx='6' fill='%2312ccb0'/%3E%3Cpath d='M4 14 8 10l4 4 8-8' stroke='white' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round' fill='none'/%3E%3C/svg%3E">
        @endif

        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">

        @routes
        @viteReactRefresh
        @vite(['resources/js/app.jsx', "resources/js/Pages/{$page['component']}.jsx"])
        @inertiaHead
    </head>
    <body class="min-h-full bg-white font-sans text-slate-900 antialiased selection:bg-brand-500 selection:text-white dark:bg-[#0b0f17] dark:text-slate-100">
        @inertia
    </body>
</html>
