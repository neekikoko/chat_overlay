<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Events\ChatMessageReceived;
use Illuminate\Support\Facades\Log;

class ChatMessageController extends Controller
{
    public function __invoke(Request $request)
    {
        broadcast(new ChatMessageReceived($request->all()));

        return response()->json(['ok' => true]);
    }
}
