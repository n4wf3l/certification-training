<!DOCTYPE html>
<html lang="{{ app()->getLocale() }}">
<head>
    <meta charset="UTF-8">
    <title>{{ __('certificate.page_title', ['title' => $certification_title]) }}</title>
    <style>
        /* Explicit A4 landscape + zero page margin. DomPDF is very strict:
           any mismatch between @page size and body/inner content dimensions
           triggers a phantom second page. Keep dimensions loose. */
        @page { size: A4 landscape; margin: 0; }
        html, body {
            margin: 0;
            padding: 0;
            font-family: 'Helvetica', 'Arial', sans-serif;
            color: #141822;
            background: #f7f8fa;
        }
        /* Outer certificate frame : green border, no fixed height (natural
           content flow avoids overflow issues). Inner ::before overlay
           REMOVED because it competed with padding calculations. */
        .certificate {
            width: 277mm;
            min-height: 165mm;
            margin: 12mm auto;
            background: white;
            padding: 30px 60px 24px;
            box-sizing: border-box;
            text-align: center;
        }

        .brand {
            font-size: 11pt;
            color: #12ccb0;
            text-transform: uppercase;
            letter-spacing: 3px;
            font-weight: bold;
            margin-bottom: 6px;
        }
        .title-main {
            font-size: 34pt;
            font-weight: bold;
            color: #141822;
            letter-spacing: 2px;
            margin: 6px 0 14px;
        }
        .presented-to {
            font-size: 11pt;
            color: #646c81;
            margin-bottom: 6px;
        }
        .name {
            font-size: 28pt;
            font-weight: bold;
            color: #12ccb0;
            border-bottom: 2px solid #d9dde5;
            padding-bottom: 10px;
            margin: 0 60px 14px;
            font-style: italic;
        }
        .description {
            font-size: 11pt;
            color: #363c4c;
            line-height: 1.5;
            margin: 10px 80px;
        }
        .cert-title { font-weight: bold; color: #141822; }

        /* Score boxes : inline-block centered, natural width */
        .score-row { margin: 14px 0 10px; }
        .score-box {
            display: inline-block;
            padding: 8px 20px;
            background: #eefefa;
            border: 1px solid #12ccb0;
            border-radius: 8px;
            margin: 0 5px;
        }
        .score-box .label {
            font-size: 8pt;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            color: #12ccb0;
            font-weight: bold;
        }
        .score-box .val {
            font-size: 17pt;
            font-weight: bold;
            color: #14544c;
            margin-top: 2px;
        }
        .earned-via {
            font-size: 9pt;
            color: #14544c;
            font-style: italic;
            margin: 10px 80px 0;
            padding: 6px 12px;
            background: #eefefa;
            border-radius: 6px;
        }

        /* Verify block : centered, generous width, no risk of clipping.
           This is a bold layout choice - the QR sits below the content
           rather than bottom-right. Trade off: less "framed diploma" feel,
           gain: bulletproof rendering in DomPDF and better readability. */
        .verify {
            margin: 16px auto 4px;
            width: 240px;
        }
        .verify img {
            display: block;
            width: 78px;
            height: 78px;
            margin: 0 auto;
            padding: 3px;
            border: 1px solid #d9dde5;
            border-radius: 4px;
            background: white;
        }
        .verify .verify-label {
            font-size: 7pt;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            color: #12ccb0;
            font-weight: bold;
            margin-top: 5px;
        }
        .verify .verify-url {
            font-family: 'Courier New', monospace;
            font-size: 7pt;
            color: #363c4c;
            margin-top: 2px;
            /* 240px container easily fits any realistic URL on one line */
        }

        /* Footer : issued date + serial, small, centered, at the bottom.
           Uses a 2-cell table (DomPDF's most reliable layout) so columns
           don't shift when content changes length. */
        .footer-table {
            margin-top: 14px;
            width: 100%;
            border-collapse: collapse;
        }
        .footer-table td {
            font-size: 8pt;
            color: #646c81;
            text-align: center;
            padding: 0 20px;
        }
        .footer-table .label {
            font-size: 7pt;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            color: #8a92a5;
        }
        .footer-table .val {
            font-weight: bold;
            color: #141822;
            margin-top: 2px;
        }
        .serial {
            font-family: 'Courier New', monospace;
            font-size: 8pt;
        }
    </style>
</head>
<body>
    <div class="certificate">
        <div class="brand">{{ $brand_name }}</div>
        <div class="title-main">{{ __('certificate.title') }}</div>

        <div class="presented-to">{{ __('certificate.awarded_to') }}</div>
        <div class="name">{{ $user_name }}</div>

        <div class="description">
            {!! __('certificate.description_html', [
                'pct' => $mastery_pct,
                'title' => e($certification_title),
                'score' => $best_score,
                'total' => $total_questions,
            ]) !!}
        </div>

        <div class="score-row">
            <div class="score-box">
                <div class="label">{{ __('certificate.label_mastery') }}</div>
                <div class="val">{{ $mastery_pct }}%</div>
            </div>
            <div class="score-box">
                <div class="label">{{ __('certificate.label_best_score') }}</div>
                <div class="val">{{ $best_score }}/{{ $total_questions }}</div>
            </div>
        </div>

        <div class="earned-via">
            {{ __('certificate.earned_via', ['total' => $total_questions]) }}
        </div>

        @if (!empty($qr_data_uri) && !empty($verification_url))
            <div class="verify">
                <img src="{{ $qr_data_uri }}" alt="QR verification">
                <div class="verify-label">{{ __('certificate.verify_label') }}</div>
                <div class="verify-url">{{ preg_replace('#^https?://#', '', $verification_url) }}</div>
            </div>
        @endif

        <table class="footer-table">
            <tr>
                <td>
                    <div class="label">{{ __('certificate.issued_on') }}</div>
                    <div class="val">{{ $awarded_date }}</div>
                </td>
                <td>
                    <div class="label">{{ __('certificate.serial_number') }}</div>
                    <div class="val serial">{{ $token }}</div>
                </td>
            </tr>
        </table>
    </div>
</body>
</html>
