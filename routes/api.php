<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ChatMessageController;
use App\Http\Controllers\ConfigurationController;
use Illuminate\Support\Facades\Log;

Route::get('/configuration/{name}', [ConfigurationController::class, 'getSetting']);

Route::post('/configuration/save-setting', [ConfigurationController::class, 'saveSetting']);

Route::post('/chatbot/chat-message', ChatMessageController::class);
