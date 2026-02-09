<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('ChatBot');
});

Route::get('/overlay/big-icons', function () {
    return Inertia::render('ChatOverlayBigIcons');
});
