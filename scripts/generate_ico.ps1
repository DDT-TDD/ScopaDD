# Generates a standard Windows DIB/BMP-based multi-resolution ICO file (16, 24, 32, 48, 64, 128, 256)
# so that Windows Explorer, NSIS, Total Commander, and all shell icon extractors display it at every zoom level.

Add-Type -AssemblyName System.Drawing

$srcPath = Join-Path $PSScriptRoot "..\public\icon.png"
$outPaths = @(
  (Join-Path $PSScriptRoot "..\public\icon.ico"),
  (Join-Path $PSScriptRoot "..\build\icon.ico"),
  (Join-Path $PSScriptRoot "..\build\installerIcon.ico"),
  (Join-Path $PSScriptRoot "..\build\uninstallerIcon.ico"),
  (Join-Path $PSScriptRoot "..\build\installerHeaderIcon.ico")
)

$buildDir = Join-Path $PSScriptRoot "..\build"
if (-not (Test-Path $buildDir)) {
  New-Item -ItemType Directory -Path $buildDir | Out-Null
}

$srcBmp = [System.Drawing.Bitmap]::FromFile((Resolve-Path $srcPath))
$sizes = @(16, 24, 32, 48, 64, 128, 256)
$iconPayloads = @()

foreach ($sz in $sizes) {
  $resized = New-Object System.Drawing.Bitmap($sz, $sz, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($resized)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.DrawImage($srcBmp, 0, 0, $sz, $sz)
  $g.Dispose()

  if ($sz -eq 256) {
    # 256x256 in PNG format
    $ms = New-Object System.IO.MemoryStream
    $resized.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    $iconPayloads += ,@{
      Width = 0
      Height = 0
      Bpp = 32
      Bytes = $ms.ToArray()
    }
    $ms.Dispose()
  } else {
    # Standard Windows DIB (BITMAPINFOHEADER + bottom-up BGRA pixels + 1bpp AND mask)
    $andStride = [Math]::Ceiling($sz / 32.0) * 4
    $xorSize = $sz * $sz * 4
    $andSize = $andStride * $sz
    $totalSize = 40 + $xorSize + $andSize

    $ms = New-Object System.IO.MemoryStream($totalSize)
    $bw = New-Object System.IO.BinaryWriter($ms)

    # BITMAPINFOHEADER (40 bytes)
    $bw.Write([UInt32]40)           # biSize
    $bw.Write([Int32]$sz)           # biWidth
    $bw.Write([Int32]($sz * 2))     # biHeight (2x for XOR + AND mask)
    $bw.Write([UInt16]1)            # biPlanes
    $bw.Write([UInt16]32)           # biBitCount
    $bw.Write([UInt32]0)            # biCompression (BI_RGB)
    $bw.Write([UInt32]($xorSize + $andSize)) # biSizeImage
    $bw.Write([Int32]0)             # biXPelsPerMeter
    $bw.Write([Int32]0)             # biYPelsPerMeter
    $bw.Write([UInt32]0)            # biClrUsed
    $bw.Write([UInt32]0)            # biClrImportant

    # Bottom-up BGRA pixels
    for ($y = $sz - 1; $y -ge 0; $y--) {
      for ($x = 0; $x -lt $sz; $x++) {
        $px = $resized.GetPixel($x, $y)
        $bw.Write([Byte]$px.B)
        $bw.Write([Byte]$px.G)
        $bw.Write([Byte]$px.R)
        $bw.Write([Byte]$px.A)
      }
    }

    # 1-bpp AND mask (bottom-up)
    for ($y = $sz - 1; $y -ge 0; $y--) {
      $rowBytes = New-Object Byte[] $andStride
      for ($x = 0; $x -lt $sz; $x++) {
        $px = $resized.GetPixel($x, $y)
        if ($px.A -lt 128) {
          $byteIdx = [Math]::Floor($x / 8)
          $bitIdx = 7 - ($x % 8)
          $rowBytes[$byteIdx] = $rowBytes[$byteIdx] -bor (1 -shl $bitIdx)
        }
      }
      $bw.Write($rowBytes)
    }

    $bw.Flush()
    $iconPayloads += ,@{
      Width = [Byte]$sz
      Height = [Byte]$sz
      Bpp = [UInt16]32
      Bytes = $ms.ToArray()
    }
    $bw.Dispose()
    $ms.Dispose()
  }

  $resized.Dispose()
}

$srcBmp.Dispose()

# Assemble complete .ico file
$icoStream = New-Object System.IO.MemoryStream
$icoWriter = New-Object System.IO.BinaryWriter($icoStream)

$count = [UInt16]$iconPayloads.Count
$icoWriter.Write([UInt16]0)     # Reserved
$icoWriter.Write([UInt16]1)     # Type = 1 (ICO)
$icoWriter.Write([UInt16]$count)

$offset = 6 + ($count * 16)
foreach ($entry in $iconPayloads) {
  $icoWriter.Write([Byte]$entry.Width)
  $icoWriter.Write([Byte]$entry.Height)
  $icoWriter.Write([Byte]0)       # bColorCount
  $icoWriter.Write([Byte]0)       # bReserved
  $icoWriter.Write([UInt16]1)     # wPlanes
  $icoWriter.Write([UInt16]$entry.Bpp)
  $icoWriter.Write([UInt32]$entry.Bytes.Length)
  $icoWriter.Write([UInt32]$offset)
  $offset += $entry.Bytes.Length
}

foreach ($entry in $iconPayloads) {
  $icoWriter.Write($entry.Bytes)
}

$icoWriter.Flush()
$icoBytes = $icoStream.ToArray()
$icoWriter.Dispose()
$icoStream.Dispose()

foreach ($out in $outPaths) {
  [System.IO.File]::WriteAllBytes($out, $icoBytes)
  Write-Output "Wrote DIB/BMP+PNG ICO ($($icoBytes.Length) bytes) -> $out"
}

Copy-Item -Path $srcPath -Destination (Join-Path $buildDir "icon.png") -Force
