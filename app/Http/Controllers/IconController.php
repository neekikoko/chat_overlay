<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Barryvdh\DomPDF\Facade\Pdf;

use Illuminate\Http\Request;

class IconController extends Controller
{
    public function preview()
    {
        $iconPath = public_path('icons');

        if (!File::exists($iconPath)) {
            abort(404, 'Icons folder not found');
        }

        $files = File::files($iconPath);

        $icons = [];

        foreach ($files as $file) {
            $type = mime_content_type($file->getRealPath());

             $icons[] = [
                 'name' => pathinfo($file->getFilename(), PATHINFO_FILENAME),
                 'data' => 'data:' . $type . ';base64,' . base64_encode(file_get_contents($file->getRealPath())),
             ];
         }

        return view('pdf/icon-list', [
            'icons' => $icons
        ]);
    }

    public function generatePdf()
    {
        $iconPath = public_path('icons');

        if (!File::exists($iconPath)) {
            return response()->json(['error' => 'Icons folder not found'], 404);
        }

        $files = File::files($iconPath);

        $icons = [];

        foreach ($files as $file) {
            $path = $file->getRealPath();

            try {
                $img = new \Imagick($path);

                if ($img->getNumberImages() > 1) {
                    $img = $img->coalesceImages();
                    $img->setIteratorIndex(0);
                }

                $img->setImageFormat('png');
                $img->stripImage();

                $pngData = $img->getImagesBlob();

                $img->clear();
                $img->destroy();

                $icons[] = [
                    'name' => pathinfo($file->getFilename(), PATHINFO_FILENAME),
                    'data' => 'data:image/png;base64,' . base64_encode($pngData),
                ];
            } catch (\Throwable $e) {
                \Log::warning("Failed image: " . $file->getFilename() . " - " . $e->getMessage());
            }
        }

        $pdf = Pdf::loadView('pdf/icon-list', [
            'icons' => $icons
        ]);

        $fileName = 'icon-list.pdf';

        File::put(public_path($fileName), $pdf->output());

        return response()->json([
            'url' => asset($fileName)
        ]);
    }
}
