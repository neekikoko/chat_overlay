<?php

namespace App\Http\Controllers;

use App\Models\OauthToken;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ConfigurationController extends Controller
{
    public function getToken(string $name): JsonResponse
    {
        $token = OauthToken::where('name', $name)->first();

        if (!$token) {
            return response()->json([
                'token' => null,
            ]);
        }

        return response()->json([
            'token' => $token->token,
        ]);
    }
}
