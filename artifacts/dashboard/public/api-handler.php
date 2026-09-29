<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

if (!function_exists('getallheaders')) {
    function getallheaders() {
        $headers = [];
        foreach ($_SERVER as $name => $value) {
            if (substr($name, 0, 5) == 'HTTP_') {
                $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value;
            }
        }
        return $headers;
    }
}

$target_base = "http://apicrm.atozgroupsemarang.com";

// Dapatkan route dari query parameter (menghindari error PATH_INFO di Hostinger)
$route = isset($_GET['route']) ? $_GET['route'] : '';
if (empty($route)) {
    http_response_code(400);
    echo json_encode(["error" => "No route specified"]);
    exit;
}

$query_params = $_GET;
unset($query_params['route']);
$query_string = http_build_query($query_params);

$url = rtrim($target_base, '/') . '/' . ltrim($route, '/');
if (!empty($query_string)) {
    $url .= '?' . $query_string;
}

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $_SERVER['REQUEST_METHOD']);

$headers = [];
foreach (getallheaders() as $name => $value) {
    $lower = strtolower($name);
    if ($lower !== 'host' && $lower !== 'content-length' && $lower !== 'connection') {
        $headers[] = "$name: $value";
    }
}
$headers[] = "Host: apicrm.atozgroupsemarang.com"; 

if (isset($_SERVER['CONTENT_TYPE'])) {
    $headers[] = "Content-Type: " . $_SERVER['CONTENT_TYPE'];
}

curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

if ($_SERVER['REQUEST_METHOD'] !== 'GET' && $_SERVER['REQUEST_METHOD'] !== 'OPTIONS') {
    $body = file_get_contents('php://input');
    curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
}

curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);

$response = curl_exec($ch);
$httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

if ($response === false) {
    http_response_code(502);
    echo json_encode(["success" => false, "message" => "API Handler Error: " . $error]);
} else {
    http_response_code($httpcode);
    echo $response;
}
