<?php
/**
 * Geo Detection Proxy
 * 
 * The frontend calls this endpoint, and this PHP script calls ipapi.co
 * server-side (no CORS issues). Returns the full geo data as JSON.
 * 
 * This avoids CORS blocks that happen when the browser calls geo APIs directly.
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Get the client's real IP
function getClientIP()
{
    if (!empty($_SERVER['HTTP_CF_CONNECTING_IP'])) {
        return $_SERVER['HTTP_CF_CONNECTING_IP'];
    } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        return trim(explode(',', $_SERVER['HTTP_X_FORWARDED_FOR'])[0]);
    } else {
        return $_SERVER['REMOTE_ADDR'];
    }
}

$clientIP = getClientIP();

// For localhost/private IPs, call without IP (uses server's public IP)
$isPrivate = ($clientIP === '127.0.0.1' || $clientIP === '::1' ||
    filter_var($clientIP, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) === false);

$apiUrl = $isPrivate
    ? "https://ipapi.co/json/"
    : "https://ipapi.co/{$clientIP}/json/";

$ch = curl_init($apiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 8);
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 4);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'User-Agent: SocialImpression/1.0',
    'Accept: application/json'
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlErr = curl_error($ch);
curl_close($ch);

if ($curlErr || !$response || $httpCode !== 200) {
    // Fallback: try freeipapi.com
    $fallbackUrl = $isPrivate
        ? "https://freeipapi.com/api/json/"
        : "https://freeipapi.com/api/json/{$clientIP}";

    $ch2 = curl_init($fallbackUrl);
    curl_setopt($ch2, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch2, CURLOPT_TIMEOUT, 8);
    curl_setopt($ch2, CURLOPT_CONNECTTIMEOUT, 4);
    curl_setopt($ch2, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch2, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch2, CURLOPT_HTTPHEADER, [
        'User-Agent: SocialImpression/1.0',
        'Accept: application/json'
    ]);

    $response = curl_exec($ch2);
    $httpCode = curl_getinfo($ch2, CURLINFO_HTTP_CODE);
    curl_close($ch2);

    if ($response && $httpCode === 200) {
        // Normalize freeipapi format to match ipapi.co format
        $data = json_decode($response, true);
        if (is_array($data)) {
            echo json_encode([
                'ip' => $data['ipAddress'] ?? '',
                'city' => $data['cityName'] ?? '',
                'region' => $data['regionName'] ?? '',
                'country_name' => $data['countryName'] ?? '',
                'country_code' => $data['countryCode'] ?? '',
                'latitude' => $data['latitude'] ?? '',
                'longitude' => $data['longitude'] ?? '',
                'timezone' => $data['timeZone'] ?? '',
                'source' => 'freeipapi',
            ]);
            exit;
        }
    }

    // Both failed
    http_response_code(502);
    echo json_encode(['error' => 'Geo lookup failed', 'ip' => $clientIP]);
    exit;
}

// ipapi.co succeeded — return as-is (it already has all the fields)
echo $response;
