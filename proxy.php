<?php

$url = filter_var($_POST['url']);

if (!$url || !preg_match("/^https?:/i", $url)) {
    echo '{ "result": "Invalid URL. Please check your URL and try again.", "error": true }';
    return;
}

$parsed_url = parse_url($url);
$scheme = strtolower($parsed_url['scheme']);
if (($scheme !== "http" && $scheme !== "https")) {
    echo '{ "result": "Invalid URL - Please check your URL and try again.", "error": true }';
    return;
}

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
$data = curl_exec($ch);
$info = curl_getinfo($ch);
curl_close($ch);

if ($data === false) {
	echo '{ "result": "Unable to parse URL. Please check your URL and try again.", "error": true }';
	return;
}

$contentLength = intval($info['download_content_length']);
$status = intval($info['http_code']);

if ($status >= 400) {
	echo '{ "result": "URL returned bad status code ' . $status . '.", "error": true }';
	return;
}

if ($contentLength >= 52428800) {
	echo '{ "result": "URL content length greater than 10 megs (' . $contentLength . '). Validation not available for files this large.", "responseCode": "1" }';
	return;
}

$response = new StdClass();
$response->status = $status;
$response->length = $contentLength;
$response->url = $info['url'];
$response->content = $data;

echo json_encode($response);

?>
