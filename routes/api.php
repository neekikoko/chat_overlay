<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ChatMessageController;
use Illuminate\Support\Facades\Log;

// Route::get('/user', function (Request $request) {
//     return $request->user();
// })->middleware('auth:sanctum');

Route::get('/configuration/oauth-token/{name}', [ConfigurationController::class, 'getToken']);

Route::post('/chatbot/chat-message', ChatMessageController::class);

Route::get('/test-log', function () {
    Log::info('Test route hit with get');
    return response()->json(['ok' => true, 'message' => 'Log written']);
});

Route::post('/test-log', function () {
    Log::info('Test route hit with post');
    return response()->json(['ok' => true, 'message' => 'Log written']);
});
