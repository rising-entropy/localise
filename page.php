<?php
$editme = fopen('EDITME.txt', 'r') or die('<p>Unable to open EDITME.txt file</p>');
$numpages = fgets($editme);
fgets($editme);
$rndon = fgets($editme);
$angles = fgets($editme);
$autoply = fgets($editme);
$loops = fgets($editme);
fclose($editme);

session_set_cookie_params(3000,'/');
session_start();
$cntr = $_SESSION['pagecount'] ?? 0;

if ($cntr == 0) {
  $pageary = range(1,$numpages );
  $_SESSION['pagearray'] = $pageary;
  $_SESSION['subno'] = 'INTRO PAGE SKIPPED';
}

if (isset($_POST['page'])) {
  $pageary = $_SESSION['pagearray'];
  $res = $_POST['degs'];
  if(is_numeric($res)){
    $_SESSION['d'.$pageary[$cntr-1]] = $pageary[$cntr-1].' , '.$res.' , '.$cntr;
  } else {
    exit('<h2>Something nasty here, try the test again</h2>');
  }
}

if ($cntr >= $numpages){
  header('location:end.php');
  exit();
}

if (isset($_POST['start'])) {
  $ptno = $_POST['partno'];
  if(is_numeric($ptno)){
    $_SESSION['subno']=$ptno;
  } else if ($ptno==''){
    $_SESSION['subno']='not set';
  } else {
    exit('<h2>Something nasty here, go back &amp; try again</h2>');
  }
}

if ($rndon > chr(32) && $cntr == 0) {
  shuffle($pageary);
  $_SESSION['pagearray'] = $pageary;
}

if ($angles > chr(32)) {
  $image='head.png';
} else {
  $image='headNA.png';
}

if ($autoply > chr(32)) {
  $ap='autoplay';
} else {
  $ap='';
}

if ($loops > chr(32)) {
  $lp='loop';
} else {
  $lp='';
}

echo '<!doctype html>
<html lang="en">
<head>
<title>Localise test</title>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" type="text/css" href="main.css">
<link rel="stylesheet" type="text/css" href="head.css">
<script src="head.js" defer></script>
</head>
<body>
<main>
<h2>Localise test '.((string)$cntr+1).'</h2>

<audio '.$ap.' '.$lp.' src="audiofiles/'.(string)$pageary[$cntr].'.wav"></audio>

<img src="images/'.$image.'" alt="overhead diagram of head showing angles on surrounding circle">

';

$currentAudio = (string)$pageary[$cntr];
$isFirstPage = ($cntr == 0);
$isLastPage = ($cntr == (int)$numpages - 1);
$cntr ++;
$_SESSION['pagecount'] = $cntr;
?>

<form action="page.php" method="post" id="degs-form">
  <div class="centr">
    <img src="images/ply.png" alt="play icon"><img src="images/pse.png" alt="pause icon">
  </div>
  <input type="number" value="0" name="degs" id="degs-input" readonly><label>&deg;</label>
  <input type="hidden" name="page" value="1">
  <div class="centr">
    <input type="submit" value="Submit" name="page">
  </div>
</form>
<script>
var RESPONSES_KEY = 'localiseResponses';
var UUID_KEY = 'localiseSubmitterUuid';

if (<?php echo $isFirstPage ? 'true' : 'false'; ?>) {
  localStorage.setItem(RESPONSES_KEY, JSON.stringify([]));
  localStorage.setItem(UUID_KEY, crypto.randomUUID());
}

document.getElementById('degs-form').addEventListener('submit', function(e) {
  e.preventDefault();
  var form = e.target;
  var degrees = document.getElementById('degs-input').value;
  var audioFile = <?php echo json_encode($currentAudio); ?>;
  var isLastPage = <?php echo $isLastPage ? 'true' : 'false'; ?>;

  var responses = JSON.parse(localStorage.getItem(RESPONSES_KEY) || '[]');
  responses.push({ audio_file: audioFile, degrees: Number(degrees) });
  localStorage.setItem(RESPONSES_KEY, JSON.stringify(responses));

  if (!isLastPage) {
    form.submit();
    return;
  }

  var submitterUuid = localStorage.getItem(UUID_KEY);
  var submittedAtEpoch = performance.timeOrigin + performance.now();

  fetch('https://kanishk-test-api.devangk.dev/submissions/bulk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      submitter_uuid: submitterUuid,
      submitted_at_epoch: submittedAtEpoch,
      responses: responses
    })
  }).then(function(res) {
    if (!res.ok) {
      return res.json().then(function(data) {
        alert('Submission error: ' + (data.error || res.status));
      });
    }
    localStorage.removeItem(RESPONSES_KEY);
    localStorage.removeItem(UUID_KEY);
    form.submit();
  }).catch(function(err) {
    alert('Network error: ' + err.message);
  });
});
</script>
</main>
</body>
</html>