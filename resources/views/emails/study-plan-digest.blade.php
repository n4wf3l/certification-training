<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Ta semaine</title>
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
        <div class="brand">{{ $brandName }} - Digest hebdo</div>
        <h1>Ta semaine sur {{ $plan->certification->title }}</h1>
        <p>Salut {{ $plan->user->name }}, voici ton bilan pour la semaine ecoulee.</p>

        <div class="grid">
            <div class="cell">
                <div class="val">{{ $stats['questions_answered'] ?? 0 }}</div>
                <div class="lbl">Questions</div>
            </div>
            <div class="cell">
                <div class="val">{{ $stats['exams_completed'] ?? 0 }}</div>
                <div class="lbl">Examens</div>
            </div>
            <div class="cell">
                <div class="val">{{ $stats['avg_score'] ?? 0 }}%</div>
                <div class="lbl">Moyenne</div>
            </div>
        </div>

        <p>
            Il te reste <strong>{{ $daysUntil }} jour{{ $daysUntil > 1 ? 's' : '' }}</strong> avant l'examen.
            Objectif quotidien : {{ $plan->daily_target }} questions.
        </p>

        <p style="text-align: center;">
            <a href="{{ url('/study-plans/' . $plan->id) }}" class="cta">Voir mon plan</a>
        </p>

        <div class="foot">
            Tu recois ce digest chaque lundi. Tu peux le desactiver depuis la page du plan.
            <br><br>
            {{ $brandName }}
        </div>
    </div>
</body>
</html>
