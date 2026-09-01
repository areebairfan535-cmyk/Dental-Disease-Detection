<?php
function analyzeDentalImage(string $absoluteImagePath, string $publicImagePath): array
{
    $openAiKey = getenv('OPENAI_API_KEY') ?: '';
    if ($openAiKey !== '') {
        return analyzeWithOpenAiVision($absoluteImagePath, $publicImagePath, $openAiKey);
    }

    $pythonAiUrl = getenv('DENTAL_AI_URL') ?: '';
    if ($pythonAiUrl !== '') {
        return analyzeWithPythonService($absoluteImagePath, $pythonAiUrl);
    }

    jsonResponse([
        'success' => false,
        'error' => 'AI model is not configured. Set OPENAI_API_KEY for vision analysis or DENTAL_AI_URL for your trained dental model.'
    ], 503);
}

function analyzeWithOpenAiVision(string $absoluteImagePath, string $publicImagePath, string $apiKey): array
{
    if (!extension_loaded('openssl') && !function_exists('curl_init')) {
        jsonResponse([
            'success' => false,
            'error' => 'PHP OpenSSL or cURL extension is required to call OpenAI over HTTPS. Enable openssl in php.ini, then restart PHP.'
        ], 500);
    }

    $mimeType = detectMimeType($absoluteImagePath);
    $imageData = base64_encode(file_get_contents($absoluteImagePath));
    $dataUrl = "data:$mimeType;base64,$imageData";

    $payload = [
        'model' => getenv('OPENAI_VISION_MODEL') ?: 'gpt-4.1-mini',
        'input' => [[
            'role' => 'user',
            'content' => [
                [
                    'type' => 'input_text',
                    'text' => 'Analyze this teeth/dental image for visible oral health concerns. Return ONLY compact JSON with these keys: diagnosis, confidence, severity, detected_issues, recommendations, tooth_positions, urgent_warning. Use cautious language, do not claim certainty, and recommend a dentist for concerning findings.'
                ],
                [
                    'type' => 'input_image',
                    'image_url' => $dataUrl
                ]
            ]
        ]]
    ];

    [$status, $response] = postJson('https://api.openai.com/v1/responses', $payload, [
        'Authorization: Bearer ' . $apiKey
    ]);

    if ($status >= 400 || $response === '') {
        $details = $response ? json_decode($response, true) : null;
        $apiError = is_array($details) ? ($details['error'] ?? null) : null;
        $code = is_array($apiError) ? ($apiError['code'] ?? null) : null;
        $message = is_array($apiError) ? ($apiError['message'] ?? 'OpenAI vision request failed') : 'OpenAI vision request failed';

        if ($status === 429 || $code === 'insufficient_quota') {
            $message = 'OpenAI quota/billing issue. Add billing/credits on the OpenAI Platform, then restart the backend.';
        } elseif ($status === 401) {
            $message = 'OpenAI API key is invalid or expired. Create a new key and update backend/.env.';
        }

        jsonResponse([
            'success' => false,
            'error' => $message,
            'status' => $status,
            'code' => $code,
            'details' => $details
        ], 502);
    }

    $decoded = json_decode($response, true);
    $text = extractOpenAiText(is_array($decoded) ? $decoded : []);
    $analysis = parseJsonFromText($text);

    return normalizeAnalysis($analysis, $publicImagePath);
}

function analyzeWithPythonService(string $absoluteImagePath, string $serviceUrl): array
{
    [$status, $response] = postMultipart(rtrim($serviceUrl, '/') . '/predict', 'image', $absoluteImagePath);

    if ($status >= 400 || $response === '') {
        jsonResponse([
            'success' => false,
            'error' => 'Python AI service request failed',
            'status' => $status,
            'details' => $response ? json_decode($response, true) : null
        ], 502);
    }

    $analysis = json_decode($response, true);
    if (!is_array($analysis)) {
        jsonResponse(['success' => false, 'error' => 'Python AI service returned invalid JSON'], 502);
    }

    return normalizeAnalysis($analysis, basename($absoluteImagePath));
}

function postJson(string $url, array $payload, array $headers = []): array
{
    $body = json_encode($payload);
    $caFile = __DIR__ . '/cacert.pem';

    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        $curlOptions = [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => array_merge($headers, ['Content-Type: application/json']),
            CURLOPT_POSTFIELDS => $body,
            CURLOPT_TIMEOUT => 60
        ];
        if (is_file($caFile)) {
            $curlOptions[CURLOPT_CAINFO] = $caFile;
        }
        curl_setopt_array($ch, $curlOptions);

        $response = curl_exec($ch);
        $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($response === false) {
            jsonResponse(['success' => false, 'error' => 'HTTP request failed: ' . $error], 502);
        }

        return [$status, $response];
    }

    $context = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => implode("\r\n", array_merge($headers, [
                'Content-Type: application/json',
                'Content-Length: ' . strlen($body)
            ])),
            'content' => $body,
            'timeout' => 60,
            'ignore_errors' => true
        ],
        'ssl' => is_file($caFile) ? [
            'cafile' => $caFile,
            'verify_peer' => true,
            'verify_peer_name' => true
        ] : []
    ]);

    $response = @file_get_contents($url, false, $context);
    if ($response === false) {
        $error = error_get_last();
        jsonResponse([
            'success' => false,
            'error' => 'HTTP request failed: ' . ($error['message'] ?? 'Unknown error')
        ], 502);
    }

    return [httpStatusFromHeaders($http_response_header ?? []), $response === false ? '' : $response];
}

function postMultipart(string $url, string $fieldName, string $filePath): array
{
    $caFile = __DIR__ . '/cacert.pem';

    if (function_exists('curl_init') && class_exists('CURLFile')) {
        $file = new CURLFile($filePath, detectMimeType($filePath), basename($filePath));
        $ch = curl_init($url);
        $curlOptions = [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => [$fieldName => $file],
            CURLOPT_TIMEOUT => 60
        ];
        if (is_file($caFile)) {
            $curlOptions[CURLOPT_CAINFO] = $caFile;
        }
        curl_setopt_array($ch, $curlOptions);

        $response = curl_exec($ch);
        $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($response === false) {
            jsonResponse(['success' => false, 'error' => 'HTTP request failed: ' . $error], 502);
        }

        return [$status, $response];
    }

    $boundary = '----DentalAiBoundary' . bin2hex(random_bytes(8));
    $filename = basename($filePath);
    $mimeType = detectMimeType($filePath);
    $fileContent = file_get_contents($filePath);

    $body = "--$boundary\r\n"
        . "Content-Disposition: form-data; name=\"$fieldName\"; filename=\"$filename\"\r\n"
        . "Content-Type: $mimeType\r\n\r\n"
        . $fileContent . "\r\n"
        . "--$boundary--\r\n";

    $context = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => implode("\r\n", [
                "Content-Type: multipart/form-data; boundary=$boundary",
                'Content-Length: ' . strlen($body)
            ]),
            'content' => $body,
            'timeout' => 60,
            'ignore_errors' => true
        ],
        'ssl' => is_file($caFile) ? [
            'cafile' => $caFile,
            'verify_peer' => true,
            'verify_peer_name' => true
        ] : []
    ]);

    $response = @file_get_contents($url, false, $context);
    if ($response === false) {
        $error = error_get_last();
        jsonResponse([
            'success' => false,
            'error' => 'HTTP request failed: ' . ($error['message'] ?? 'Unknown error')
        ], 502);
    }

    return [httpStatusFromHeaders($http_response_header ?? []), $response === false ? '' : $response];
}

function httpStatusFromHeaders(array $headers): int
{
    foreach ($headers as $header) {
        if (preg_match('/^HTTP\/\S+\s+(\d+)/', $header, $matches)) {
            return (int) $matches[1];
        }
    }

    return 0;
}

function detectMimeType(string $filePath): string
{
    if (function_exists('mime_content_type')) {
        return mime_content_type($filePath) ?: 'image/jpeg';
    }

    $extension = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
    return match ($extension) {
        'png' => 'image/png',
        'gif' => 'image/gif',
        'webp' => 'image/webp',
        default => 'image/jpeg'
    };
}

function extractOpenAiText(array $response): string
{
    if (isset($response['output_text'])) {
        return (string) $response['output_text'];
    }

    foreach (($response['output'] ?? []) as $item) {
        foreach (($item['content'] ?? []) as $content) {
            if (isset($content['text'])) {
                return (string) $content['text'];
            }
        }
    }

    return '';
}

function parseJsonFromText(string $text): array
{
    $text = trim($text);
    $decoded = json_decode($text, true);
    if (is_array($decoded)) {
        return $decoded;
    }

    if (preg_match('/\{.*\}/s', $text, $matches)) {
        $decoded = json_decode($matches[0], true);
        if (is_array($decoded)) {
            return $decoded;
        }
    }

    jsonResponse(['success' => false, 'error' => 'AI response was not valid JSON', 'raw_response' => $text], 502);
}

function normalizeAnalysis(array $analysis, string $imagePath): array
{
    $diagnosis = (string) ($analysis['diagnosis'] ?? $analysis['result'] ?? 'Review needed');
    $issues = $analysis['detected_issues'] ?? [$diagnosis];
    $recommendations = $analysis['recommendations'] ?? [$analysis['advice'] ?? 'Please consult a licensed dentist for confirmation.'];

    if (is_string($issues)) {
        $issues = [$issues];
    }
    if (is_string($recommendations)) {
        $recommendations = [$recommendations];
    }

    $confidence = (float) ($analysis['confidence'] ?? 0);
    if ($confidence > 1) {
        $confidence = $confidence / 100;
    }

    $issueText = strtolower(implode(' ', $issues) . ' ' . $diagnosis);

    return [
        'confidence' => max(0, min(1, $confidence)),
        'cavity_detected' => str_contains($issueText, 'cavity') || str_contains($issueText, 'caries') ? 1 : 0,
        'plaque_detected' => str_contains($issueText, 'plaque') ? 1 : 0,
        'tartar_detected' => str_contains($issueText, 'tartar') || str_contains($issueText, 'calculus') ? 1 : 0,
        'gum_disease_detected' => str_contains($issueText, 'gum') || str_contains($issueText, 'gingivitis') || str_contains($issueText, 'periodontal') ? 1 : 0,
        'severity' => strtolower((string) ($analysis['severity'] ?? 'unknown')),
        'detected_issues' => array_values($issues),
        'other_issues' => array_values($issues),
        'recommendations' => array_values($recommendations),
        'tooth_positions' => $analysis['tooth_positions'] ?? [],
        'urgent_warning' => $analysis['urgent_warning'] ?? null,
        'image_path' => $imagePath
    ];
}
?>
