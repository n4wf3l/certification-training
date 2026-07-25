<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Ton streak est en danger</title>
    <style>
        body { font-family: 'Helvetica', 'Arial', sans-serif; background: #f7f8fa; margin: 0; padding: 40px 20px; color: #1f2431; }
        .wrap { max-width: 520px; margin: 0 auto; background: white; border-radius: 16px; padding: 32px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
        .brand { font-size: 12px; color: #646c81; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px; }
        h1 { font-size: 22px; margin: 0 0 16px; color: #141822; }
        .streak-num { display: inline-block; background: linear-gradient(135deg, #fb923c, #ef4444); color: white; font-weight: bold; font-size: 32px; padding: 12px 24px; border-radius: 12px; margin: 16px 0; }
        p { line-height: 1.6; color: #363c4c; }
        .cta { display: inline-block; background: #12ccb0; color: white; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: bold; margin: 20px 0; }
        .foot { margin-top: 28px; font-size: 12px; color: #8a92a5; border-top: 1px solid #eef0f4; padding-top: 16px; }
    </style>
</head>
<body>
    <div class="wrap">
        <div class="brand">{{ $brandName }}</div>
        <h1>Salut {{ $user->name }},</h1>
        <p>Ton streak de <strong>{{ $streak }} jours consécutifs</strong> risque de casser aujourd'hui si tu ne fais pas au moins un exercice avant minuit.</p>
        <div class="streak-num">{{ $streak }} jours</div>
        <p>Il te suffit d'une seule bonne réponse pour prolonger la série. Pas besoin de faire un examen complet.</p>
        <p style="text-align: center;">
            <a href="{{ url('/') }}" class="cta">Reprendre l'entraînement</a>
        </p>
        <div class="foot">
            Tu reçois cet email parce que ton streak est menacé. Il ne partira pas si tu es actif au moins un jour tous les deux jours.
            <br><br>
            {{ $brandName }} · Entraînement adaptatif pour certifications IT
        </div>
    </div>
</body>
</html>
