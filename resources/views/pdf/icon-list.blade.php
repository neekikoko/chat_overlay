<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">

    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 16px;
        }

        .header {
            font-size: 24px;
            margin-bottom: 10px;
        }

        .subline {
            margin-bottom: 20px;
        }

        .grid {

        }

        .icon {
            padding: 9px;
            vertical-align: top;
            width: 64px;
            display: inline-block;
        }

        .icon-name {
            margin-top: 5px;
            word-break: break-word;
            text-align: center;
            font-size: 10px;
        }

        img {
            width: 64px;
            height: 64px;
            object-fit: contain;
        }
    </style>
</head>
<body>

<!--<div class="header">Available icons</div>-->

<div class="grid">
    @foreach($icons as $icon)
        <div class="icon">
            <img src="{{ $icon['data'] }}">
            <div class="icon-name">{{ $icon['name'] }}</div>
        </div>
    @endforeach
</div>

</body>
</html>
