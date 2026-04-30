<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\ConfigurationController;
use App\Http\Controllers\IconController;

Route::get('/configuration', function () {
    return Inertia::render('Configuration');
});

Route::get('', function () {
    return Inertia::render('ChatOverlayBigIcons');
});

Route::get('/icons/preview', [IconController::class, 'preview']);
