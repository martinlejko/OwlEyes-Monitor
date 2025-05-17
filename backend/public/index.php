<?php

// No need for use statements here as they are in app.php

$app = require __DIR__ . '/../src/app.php';

// The error middleware might be better placed within app.php or dependencies.php
// depending on how it needs to interact with the container or other app settings.
// For now, keeping it here if it was essential for index.php specifically.
// However, typical Slim setup might add this in middleware.php or after app creation in app.php.
// Consider moving addErrorMiddleware to app.php or a middleware configuration file if appropriate.
// $errorMiddleware = $app->addErrorMiddleware(true, true, true); 
// This ^ line might be problematic if $app from require doesn't allow immediate chaining
// or if it's already added in the new app.php's included files (e.g. middleware.php)

$app->run();