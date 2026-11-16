{{--
    Referencement : adresse canonique, versions par langue (hreflang), noindex des
    pages privees et donnees structurees JSON-LD. Rendu dans le HTML initial, donc
    lu par les moteurs sans executer le JavaScript.
--}}
@php
    use App\Support\LocaleUrl;

    $component = $page['component'] ?? '';
    $props = $page['props'] ?? [];
    $locale = app()->getLocale();
    $alternates = LocaleUrl::alternates(request());
    $canonical = $alternates[$locale] ?? $alternates[LocaleUrl::DEFAULT];
    $brand = $brandName ?? 'CertifLoop';

    // Pages privees ou de compte : jamais indexees.
    $private = preg_match('#^(Admin/|Auth/|Exam/(Take|Result)|Profile/|Stats/|Bookmarks/|StudyPlan/|Offline|Certificate/)#', $component) === 1;

    $organization = array_filter([
        '@type' => 'Organization',
        'name' => config('certifloop.publisher.name') ?: $brand,
        'url' => LocaleUrl::to('/', LocaleUrl::DEFAULT),
    ]);

    $jsonLd = [];
    if ($component === 'Home') {
        $jsonLd[] = [
            '@context' => 'https://schema.org',
            '@type' => 'WebSite',
            'name' => $brand,
            'url' => $alternates[$locale],
            'inLanguage' => $locale,
            'description' => __('meta.description'),
            'publisher' => $organization,
        ];
        $ready = collect($props['certifications'] ?? [])->filter(fn ($c) => ! empty($c['ready']))->values();
        if ($ready->isNotEmpty()) {
            $jsonLd[] = [
                '@context' => 'https://schema.org',
                '@type' => 'ItemList',
                'itemListElement' => $ready->map(fn ($c, $i) => [
                    '@type' => 'ListItem',
                    'position' => $i + 1,
                    'url' => LocaleUrl::to('/certifications/'.$c['slug'], $locale),
                    'name' => $c['title'],
                ])->all(),
            ];
        }
    } elseif ($component === 'Certification/Show' && ! empty($props['certification'])) {
        $cert = $props['certification'];
        $certUrl = LocaleUrl::to('/certifications/'.$cert['slug'], $locale);
        $jsonLd[] = array_filter([
            '@context' => 'https://schema.org',
            '@type' => 'Course',
            'name' => $cert['title'],
            'description' => $cert['description'] ?? null,
            'url' => $certUrl,
            'inLanguage' => $locale,
            'isAccessibleForFree' => true,
            'provider' => $organization,
            'offers' => ['@type' => 'Offer', 'price' => 0, 'priceCurrency' => 'EUR', 'category' => 'Free'],
            'hasCourseInstance' => ['@type' => 'CourseInstance', 'courseMode' => 'online', 'courseWorkload' => 'PT'.((int) ($cert['duration_minutes'] ?? 60)).'M'],
        ]);
        $jsonLd[] = [
            '@context' => 'https://schema.org',
            '@type' => 'BreadcrumbList',
            'itemListElement' => [
                ['@type' => 'ListItem', 'position' => 1, 'name' => $brand, 'item' => LocaleUrl::to('/', $locale)],
                ['@type' => 'ListItem', 'position' => 2, 'name' => $cert['title'], 'item' => $certUrl],
            ],
        ];
    }
@endphp
@if ($private)
        <meta name="robots" content="noindex, nofollow">
@else
        <link rel="canonical" href="{{ $canonical }}">
@foreach ($alternates as $code => $href)
        <link rel="alternate" hreflang="{{ $code }}" href="{{ $href }}">
@endforeach
        <link rel="alternate" hreflang="x-default" href="{{ $alternates[LocaleUrl::DEFAULT] }}">
@endif
@foreach ($jsonLd as $block)
        <script type="application/ld+json">{!! json_encode($block, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP) !!}</script>
@endforeach
