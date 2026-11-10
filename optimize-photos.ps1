$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$root = Join-Path $PSScriptRoot 'static-site'
$encoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object MimeType -eq 'image/jpeg'
$quality = New-Object System.Drawing.Imaging.EncoderParameters(1)
$quality.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]82)
$script:before = 0L
$script:after = 0L
function Save-Preview($relative, $destination, $maxWidth, $maxHeight) {
 $sourcePath = Join-Path $root $relative
 $destinationPath = Join-Path $root $destination
 $sourceImage = [System.Drawing.Image]::FromFile($sourcePath)
 try {
  if ($sourceImage.PropertyIdList -contains 274) {
   $orientation = $sourceImage.GetPropertyItem(274).Value[0]
   $rotation = @{2=4;3=2;4=6;5=5;6=1;7=7;8=3}
   if ($rotation.ContainsKey([int]$orientation)) { $sourceImage.RotateFlip([System.Drawing.RotateFlipType]$rotation[[int]$orientation]) }
  }
  $scale = [Math]::Min(1.0, [Math]::Min([double]$maxWidth / $sourceImage.Width, [double]$maxHeight / $sourceImage.Height))
  $bitmap = [System.Drawing.Bitmap]::new([Math]::Max(1,[int][Math]::Round($sourceImage.Width*$scale)), [Math]::Max(1,[int][Math]::Round($sourceImage.Height*$scale)))
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  try {
   $graphics.Clear([System.Drawing.Color]::White)
   $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
   $graphics.DrawImage($sourceImage, 0, 0, $bitmap.Width, $bitmap.Height)
   [System.IO.Directory]::CreateDirectory([System.IO.Path]::GetDirectoryName($destinationPath)) | Out-Null
   $bitmap.Save($destinationPath, $encoder, $quality)
  } finally { $graphics.Dispose(); $bitmap.Dispose() }
 } finally { $sourceImage.Dispose() }
 $script:before += (Get-Item -LiteralPath $sourcePath).Length
 $script:after += (Get-Item -LiteralPath $destinationPath).Length
}
$utf8 = New-Object System.Text.UTF8Encoding($false)
foreach ($group in @('board','media','project','sponsorship','marketing','academy')) {
 $manifest = Join-Path $root ('assets/team/'+$group+'.json')
 $members = Get-Content -Raw -Encoding UTF8 -LiteralPath $manifest | ConvertFrom-Json
 foreach ($member in $members) {
  if (!$member.image) { continue }
  $preview = 'assets/team/previews/'+$group+'/'+[System.IO.Path]::GetFileNameWithoutExtension($member.image)+'.jpg'
  Save-Preview $member.image $preview 640 1600
  $member | Add-Member -NotePropertyName preview -NotePropertyValue $preview -Force
 }
 [System.IO.File]::WriteAllText($manifest, (ConvertTo-Json -InputObject @($members) -Depth 10), $utf8)
}
$catalog = Get-Content -Raw -Encoding UTF8 (Join-Path $root 'assets/gallery/catalog.json') | ConvertFrom-Json
$previews = @{}
foreach ($photo in $catalog) {
 $relative = $photo.full -replace '^\.\./',''
 $preview = 'assets/gallery/previews/photo-'+$photo.index+'.jpg'
 Save-Preview $relative $preview 960 1280
 $previews[$photo.full] = '../'+$preview
}
[System.IO.File]::WriteAllText((Join-Path $root 'assets/gallery/previews.json'), (ConvertTo-Json $previews), $utf8)
Write-Output ('Photo previews: {0:N1} MB -> {1:N1} MB ({2:N0}% smaller)' -f ($script:before/1MB), ($script:after/1MB), (100*(1-$script:after/$script:before)))
