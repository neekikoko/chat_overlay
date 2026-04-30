<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ConfigurationController extends Controller
{
    // Get a single setting
    public function getSetting(string $name): JsonResponse
    {
        $setting = Setting::where('name', $name)->first();

        return response()->json([
            'value' => $setting ? $setting->value : '',
        ]);
    }

    // Save or update a setting
    public function saveSetting(Request $request): JsonResponse
    {
        $name = $request->input('name');
        $value = $request->input('value');



        if (!$name) {
            return response()->json(['status' => 'error', 'message' => 'Name is required'], 400);
        }

        Setting::updateOrCreate(
            ['name' => $name],
            ['value' => $value ? $value : '']
        );

        return response()->json(['status' => 'ok']);
    }
}
