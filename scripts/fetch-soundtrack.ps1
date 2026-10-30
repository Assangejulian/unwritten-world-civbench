$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$sourceRoot = Join-Path $projectRoot 'art-source/audio'
New-Item -ItemType Directory -Force -Path $sourceRoot | Out-Null
$pieces = Invoke-RestMethod 'https://incompetech.com/music/royalty-free/pieces.json'
$titles = @('Ishikari Lore','Eastminster','Desert City','Dhaka','Ibn Al-Noor','Angevin','Angevin B','Asian Drums','Heroic Age','Ancient Rite','AngloZulu','Temple of the Manes','The Britons','Intrepid')
$jobs = @()
foreach ($title in $titles) {
    $piece = $pieces | Where-Object { $_.title -eq $title } | Select-Object -First 1
    if (!$piece) { throw "Missing official track metadata: $title" }
    $key = ($title.ToLowerInvariant() -replace '[^a-z0-9]+','-').Trim('-')
    $jobs += [PSCustomObject]@{key=$key;title=$title;artist='Kevin MacLeod';license='CC BY 4.0';licenseUrl='https://creativecommons.org/licenses/by/4.0/';source=('https://incompetech.com/music/royalty-free/index.html?isrc='+$piece.isrc);url=('https://incompetech.com/music/royalty-free/mp3-royaltyfree/'+[Uri]::EscapeDataString($piece.filename));extension='.mp3';instruments=$piece.instruments;description=$piece.description}
}
$oga = @(
    @('asianoriental1','Asianoriental1','Tozan','https://opengameart.org/content/asianoriental1','asianoriental1.ogg'),
    @('asianoriental2','Asianoriental2','Tozan','https://opengameart.org/content/asianoriental2','asianoriental2.ogg'),
    @('samurai','Samurai Eats Ninja for Breakfast','Ragnar Random','https://opengameart.org/content/orchestral-and-world-music-pack','06_-_samurai'),
    @('sultan','Poison the Sultan with Saltpeter','Ragnar Random','https://opengameart.org/content/orchestral-and-world-music-pack','08_-_poison_the_sultan_with_saltpeter_world'),
    @('tribe','The Tribe Is Mellow','Ragnar Random','https://opengameart.org/content/orchestral-and-world-music-pack','09_-_the_tribe'),
    @('shaman','The Shaman Is Dancing','Ragnar Random','https://opengameart.org/content/orchestral-and-world-music-pack','10_-_the_shaman'),
    @('qetzyl','Dungeon of Qetzyl','Ragnar Random','https://opengameart.org/content/orchestral-and-world-music-pack','11_-_dungeon'),
    @('lake-aria','Lake Aria','John Oestmann','https://opengameart.org/content/chasing-the-leviathan-adventure-world-music-album','01-0x2a721-lake_aria')
)
foreach ($entry in $oga) {
    $page = Invoke-WebRequest $entry[3]
    if ($page.Content -notmatch 'CC0') { throw "License evidence missing: $($entry[3])" }
    [IO.File]::WriteAllText((Join-Path $sourceRoot ($entry[0]+'-source.html')),$page.Content)
    $pattern = [regex]::Escape(($entry[4] -replace '\.ogg$',''))
    $link = $page.Links | Where-Object { $_.href -match '/sites/default/files/' -and $_.href -match $pattern } | Select-Object -First 1
    if (!$link) { throw "Download missing: $($entry[0])" }
    $jobs += [PSCustomObject]@{key=$entry[0];title=$entry[1];artist=$entry[2];license='CC0';licenseUrl='https://creativecommons.org/publicdomain/zero/1.0/';source=$entry[3];url=([Uri]::new([Uri]$entry[3],$link.href).AbsoluteUri);extension='.ogg'}
}
foreach ($entry in @(@('kalinka','Kalinka','Pracchia-78','https://commons.wikimedia.org/wiki/File:Kalinka.ogg'),@('arirang','Arirang','United States Army Chorus','https://commons.wikimedia.org/wiki/File:Arirang.ogg'))) {
    $page = Invoke-WebRequest $entry[3]
    [IO.File]::WriteAllText((Join-Path $sourceRoot ($entry[0]+'-source.html')),$page.Content)
    $link = $page.Links | Where-Object { $_.href -match '^https://upload.wikimedia.org/.*\.ogg(?:\?|$)' } | Select-Object -First 1
    if (!$link -or $page.Content -notmatch 'public domain') { throw "Public-domain recording evidence missing: $($entry[0])" }
    $jobs += [PSCustomObject]@{key=$entry[0];title=$entry[1];artist=$entry[2];license= $(if($entry[0] -eq 'arirang'){'US Government Public Domain'}else{'Public Domain worldwide'});licenseUrl=$entry[3];source=$entry[3];url=$link.href.Split('?')[0];extension='.ogg'}
}
$licensePage = Invoke-WebRequest 'https://incompetech.com/music/royalty-free/licenses/'
[IO.File]::WriteAllText((Join-Path $sourceRoot 'incompetech-license-source.html'),$licensePage.Content)
$trackPage = Invoke-WebRequest 'https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1100719'
if($trackPage.Content -notmatch 'By Attribution 4.0') { throw 'Official CC BY 4.0 evidence missing' }
[IO.File]::WriteAllText((Join-Path $sourceRoot 'incompetech-attribution-source.html'),$trackPage.Content)
[IO.File]::WriteAllText((Join-Path $sourceRoot 'music-sources.json'),($jobs | ConvertTo-Json -Depth 5))
$jobs | ForEach-Object -Parallel {
    $file = Join-Path $using:sourceRoot ($_.key+$_.extension)
    if (!(Test-Path -LiteralPath $file)) { Invoke-WebRequest $_.url -OutFile $file -TimeoutSec 90 }
    "Downloaded $($_.key)"
} -ThrottleLimit 4
