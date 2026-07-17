Add-Type -AssemblyName System.IO.Compression.FileSystem
$zipPath = 'g:\Downloads\bang-ke-dong-vat-hoang-da-dinh-van-hung\Bảng kê ĐVHD số.docx'
$zip = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
$entry = $zip.GetEntry('word/document.xml')
$stream = $entry.Open()
$reader = New-Object System.IO.StreamReader($stream)
$content = $reader.ReadToEnd()
$reader.Close()
$zip.Dispose()
$text = [System.Text.RegularExpressions.Regex]::Replace($content, '<[^>]+>', ' ')
$text = [System.Text.RegularExpressions.Regex]::Replace($text, '\s+', ' ')
$outLen = [Math]::Min(10000, $text.Length)
Write-Output $text.Substring(0, $outLen)
