$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$targets = @(
  'package.json',
  'tsconfig.json',
  'README.md',
  '.env.local.example',
  'data\\stored-notices.json',
  'data\\departments.seed.json'
)
foreach ($relative in $targets) {
  $path = Join-Path (Get-Location) $relative
  if (Test-Path $path) {
    $content = [System.IO.File]::ReadAllText($path)
    [System.IO.File]::WriteAllText($path, $content, $utf8NoBom)
    Write-Host "fixed BOM: $relative"
  }
}
