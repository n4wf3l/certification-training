<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Résultat - {{ $certification['title'] }}</title>
    <style>
        @page { margin: 24mm 20mm; }
        body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 10.5pt; color: #1f2431; line-height: 1.45; }
        .header { border-bottom: 2px solid #12ccb0; padding-bottom: 12px; margin-bottom: 20px; }
        .header .brand { font-size: 10pt; color: #646c81; text-transform: uppercase; letter-spacing: 1.5px; }
        .header .title { font-size: 22pt; font-weight: bold; color: #141822; margin: 4px 0; }
        .header .meta { font-size: 9pt; color: #646c81; }

        .verdict { text-align: center; padding: 18px; border-radius: 8px; margin-bottom: 18px; }
        .verdict.passed { background: #d4f7ec; border: 2px solid #10b981; color: #065f46; }
        .verdict.failed { background: #ffe4e6; border: 2px solid #f43f5e; color: #881337; }
        .verdict .label { font-size: 10pt; text-transform: uppercase; letter-spacing: 1.5px; font-weight: bold; }
        .verdict .score { font-size: 28pt; font-weight: bold; margin: 4px 0; }
        .verdict .pct { font-size: 11pt; }

        .stats { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .stats td { border: 1px solid #d9dde5; padding: 10px; width: 25%; vertical-align: top; }
        .stats .lbl { font-size: 8pt; text-transform: uppercase; letter-spacing: 1px; color: #646c81; }
        .stats .val { font-size: 14pt; font-weight: bold; color: #141822; margin-top: 2px; }

        h2 { font-size: 12pt; color: #141822; border-bottom: 1px solid #d9dde5; padding-bottom: 4px; margin: 22px 0 10px; }

        .question { border: 1px solid #d9dde5; border-radius: 6px; padding: 12px; margin-bottom: 10px; page-break-inside: avoid; }
        .question.correct { border-left: 4px solid #10b981; }
        .question.wrong { border-left: 4px solid #f43f5e; }

        .q-head { font-size: 9pt; color: #646c81; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
        .q-head .status { float: right; font-weight: bold; padding: 2px 8px; border-radius: 4px; font-size: 8.5pt; }
        .q-head .status.ok { background: #10b981; color: white; }
        .q-head .status.ko { background: #f43f5e; color: white; }
        .q-scenario { background: #f7f8fa; border-left: 3px solid #12ccb0; padding: 6px 10px; margin: 6px 0; font-size: 9.5pt; font-style: italic; color: #363c4c; }
        .q-text { font-weight: bold; font-size: 11pt; color: #141822; margin: 6px 0 8px; }

        .answer { padding: 6px 8px; margin: 3px 0; border-radius: 4px; font-size: 9.5pt; }
        .answer.chosen-correct { background: #d4f7ec; color: #065f46; font-weight: bold; }
        .answer.chosen-wrong { background: #ffe4e6; color: #881337; text-decoration: line-through; }
        .answer.correct { background: #d4f7ec; color: #065f46; font-weight: bold; }
        .answer .letter { display: inline-block; width: 20px; font-weight: bold; }

        .explanation { background: #eefefa; border-left: 3px solid #12ccb0; padding: 6px 10px; margin-top: 6px; font-size: 9pt; color: #14544c; }

        .footer { position: fixed; bottom: -18mm; left: 0; right: 0; text-align: center; font-size: 8pt; color: #8a92a5; }
    </style>
</head>
<body>
    <div class="footer">
        {{ $brand_name ?? 'CertifLoop' }} · Résultat généré le {{ $generated_at }} · page <span class="pagenum"></span>
    </div>

    <div class="header">
        <div class="brand">{{ $brand_name ?? 'CertifLoop' }} - Résultat d'examen blanc</div>
        <div class="title">{{ $certification['title'] }}</div>
        <div class="meta">
            Tentative n° {{ $attempt['id'] }}
            @if(!empty($attempt['started_at']))
                · Démarrée le {{ \Carbon\Carbon::parse($attempt['started_at'])->format('d/m/Y à H:i') }}
            @endif
            @if(!empty($attempt['completed_at']))
                · Terminée le {{ \Carbon\Carbon::parse($attempt['completed_at'])->format('d/m/Y à H:i') }}
            @endif
        </div>
    </div>

    <div class="verdict {{ $attempt['passed'] ? 'passed' : 'failed' }}">
        <div class="label">{{ $attempt['passed'] ? 'Examen validé' : 'Non validé' }}</div>
        <div class="score">{{ $attempt['score'] }}/{{ $attempt['total_questions'] }}</div>
        <div class="pct">{{ $attempt['percentage'] }} % · seuil requis {{ $attempt['passing_score'] }}/{{ $attempt['total_questions'] }}</div>
    </div>

    <table class="stats">
        <tr>
            <td><div class="lbl">Score</div><div class="val">{{ $attempt['score'] }}/{{ $attempt['total_questions'] }}</div></td>
            <td><div class="lbl">Requis</div><div class="val">{{ $attempt['passing_score'] }}</div></td>
            <td><div class="lbl">Écart</div><div class="val">{{ ($attempt['score'] - $attempt['passing_score']) > 0 ? '+' : '' }}{{ $attempt['score'] - $attempt['passing_score'] }}</div></td>
            <td><div class="lbl">Temps</div><div class="val">{{ $duration_human }}</div></td>
        </tr>
    </table>

    <h2>Détail des {{ count($details) }} questions</h2>

    @foreach($details as $d)
        <div class="question {{ $d['is_correct'] ? 'correct' : 'wrong' }}">
            <div class="q-head">
                Q{{ $d['position'] }}
                @if(!empty($d['topic']))
                    · {{ $d['topic'] }}
                @endif
                <span class="status {{ $d['is_correct'] ? 'ok' : 'ko' }}">
                    {{ $d['is_correct'] ? 'CORRECT' : 'INCORRECT' }}
                </span>
            </div>

            @if(!empty($d['scenario']))
                <div class="q-scenario">{{ $d['scenario'] }}</div>
            @endif

            <div class="q-text">{{ $d['question_text'] }}</div>

            @if(!empty($d['chosen']))
                <div class="answer {{ $d['is_correct'] ? 'chosen-correct' : 'chosen-wrong' }}">
                    <span class="letter">{{ $d['chosen']['letter'] }}.</span>
                    Votre réponse : {{ $d['chosen']['text'] }}
                </div>
            @else
                <div class="answer" style="background:#f7f8fa;color:#646c81;font-style:italic;">
                    Non répondue
                </div>
            @endif

            @if(!$d['is_correct'] && !empty($d['correct']))
                <div class="answer correct">
                    <span class="letter">{{ $d['correct']['letter'] }}.</span>
                    Bonne réponse : {{ $d['correct']['text'] }}
                </div>
            @endif

            @if(!empty($d['explanation']))
                <div class="explanation"><strong>Explication :</strong> {{ $d['explanation'] }}</div>
            @endif
        </div>
    @endforeach
</body>
</html>
