<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ChatMessageController;
use App\Http\Controllers\ConfigurationController;
use Illuminate\Support\Facades\Log;

Route::get('/configuration/oauth-token/{name}', [ConfigurationController::class, 'getToken']);

Route::post('/chatbot/chat-message', ChatMessageController::class);
