<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\ConfigurationController;

Route::get('/configuration', function () {
    return Inertia::render('Configuration');
});

Route::get('', function () {
    return Inertia::render('ChatOverlayBigIcons');
});

Route::get('api/configuration/oauth-token/{name}', [ConfigurationController::class, 'getToken']);
