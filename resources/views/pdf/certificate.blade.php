<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Certificat - {{ $certification_title }}</title>
    <style>
        @page { margin: 0; }
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            color: #141822;
            margin: 0;
            padding: 0;
            width: 297mm;
            height: 210mm;
            background: #f7f8fa;
        }
        .certificate {
            width: 277mm;
            height: 190mm;
            margin: 10mm;
            background: white;
            border: 8px solid #12ccb0;
            position: relative;
            padding: 40px 60px;
            box-sizing: border-box;
        }
        .certificate::before {
            content: '';
            position: absolute;
            top: 12px; left: 12px; right: 12px; bottom: 12px;
            border: 1px solid #12ccb0;
            pointer-events: none;
        }
        .brand {
            font-size: 11pt;
            color: #12ccb0;
            text-transform: uppercase;
            letter-spacing: 3px;
            font-weight: bold;
            text-align: center;
            margin-bottom: 8px;
        }
        .title-main {
            font-size: 42pt;
            font-weight: bold;
            text-align: center;
            color: #141822;
            letter-spacing: 2px;
            margin: 12px 0 24px;
        }
        .presented-to {
            text-align: center;
            font-size: 11pt;
            color: #646c81;
            margin-bottom: 12px;
        }
        .name {
            text-align: center;
            font-size: 32pt;
            font-weight: bold;
            color: #12ccb0;
            border-bottom: 2px solid #d9dde5;
            padding-bottom: 16px;
            margin: 0 40px 24px;
            font-style: italic;
        }
        .description {
            text-align: center;
            font-size: 12pt;
            color: #363c4c;
            line-height: 1.6;
            margin: 20px 60px;
        }
        .cert-title {
            font-weight: bold;
            color: #141822;
        }
        .score-row {
            text-align: center;
            margin: 30px 0 20px;
        }
        .score-box {
            display: inline-block;
            padding: 12px 24px;
            background: #eefefa;
            border: 1px solid #12ccb0;
            border-radius: 8px;
            margin: 0 8px;
        }
        .score-box .label {
            font-size: 8pt;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            color: #12ccb0;
            font-weight: bold;
        }
        .score-box .val {
            font-size: 20pt;
            font-weight: bold;
            color: #14544c;
            margin-top: 2px;
        }
        .footer {
            position: absolute;
            bottom: 30px;
            left: 60px;
            right: 60px;
            display: table;
            width: calc(100% - 120px);
        }
        .footer-cell {
            display: table-cell;
            width: 50%;
            font-size: 9pt;
            color: #646c81;
        }
        .footer-cell.right { text-align: right; }
        .footer-cell .label {
            font-size: 7pt;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            color: #8a92a5;
            margin-bottom: 2px;
        }
        .footer-cell .val { font-weight: bold; color: #141822; }
        .serial {
            font-family: 'Courier New', monospace;
            font-size: 8pt;
        }
    </style>
</head>
<body>
    <div class="certificate">
        <div class="brand">{{ $brand_name }}</div>
        <div class="title-main">CERTIFICAT DE MAITRISE</div>

        <div class="presented-to">Decerne a</div>
        <div class="name">{{ $user_name }}</div>

        <div class="description">
            pour avoir atteint <strong>{{ $mastery_pct }}%</strong> de maitrise sur le programme
            <span class="cert-title">{{ $certification_title }}</span>,
            avec un meilleur score de <strong>{{ $best_score }}/{{ $total_questions }}</strong> aux examens blancs.
        </div>

        <div class="score-row">
            <div class="score-box">
                <div class="label">Maitrise</div>
                <div class="val">{{ $mastery_pct }}%</div>
            </div>
            <div class="score-box">
                <div class="label">Meilleur score</div>
                <div class="val">{{ $best_score }}/{{ $total_questions }}</div>
            </div>
        </div>

        <div class="footer">
            <div class="footer-cell">
                <div class="label">Delivre le</div>
                <div class="val">{{ $awarded_date }}</div>
            </div>
            <div class="footer-cell right">
                <div class="label">Numero de serie</div>
                <div class="val serial">{{ $token }}</div>
            </div>
        </div>
    </div>
</body>
</html>
