<?php

namespace App\Support;

use Illuminate\Session\DatabaseSessionHandler;

/**
 * Handler de session "database" qui n'enregistre ni l'adresse IP ni le user-agent.
 * Laravel les ecrit par defaut dans la table sessions : CertifLoop s'engage a ne pas
 * les conserver (voir /legal). Enregistre a la place du driver "database" dans
 * AppServiceProvider.
 */
class AnonymousDatabaseSessionHandler extends DatabaseSessionHandler
{
    protected function addRequestInformation(&$payload)
    {
        return $this;
    }
}
