<?php

return [

    /*
    | Paiement en place ? Tant que c'est faux, le site ne parle jamais d'"essai
    | gratuit" (il n'y a rien a essayer avant de payer) : le teaser de l'accueil
    | est presente comme un apercu.
    */
    'payments_enabled' => (bool) env('PAYMENTS_ENABLED', false),

    /*
    | Editeur du site, affiche sur /legal (obligation d'identification en Belgique
    | et dans l'UE). Les champs vides ne sont pas affiches. Le contact vient de
    | MAIL_FROM_ADDRESS.
    */
    /*
    | Certifications qui proposent l'entrainement au subnetting illimite
    | (/certifications/<slug>/subnetting).
    */
    'subnetting_certifications' => ['ccna-200-301'],

    'publisher' => [
        'name' => env('PUBLISHER_NAME'),
        'company_id' => env('PUBLISHER_COMPANY_ID'),
        'address' => env('PUBLISHER_ADDRESS'),
    ],

];
