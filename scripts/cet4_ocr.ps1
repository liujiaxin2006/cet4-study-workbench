param([Parameter(Mandatory=$true)][string]$Jobs)
# Run with Windows PowerShell 5.1; OCR stays on the user's computer.
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$storageFileType=[Windows.Storage.StorageFile,Windows.Storage,ContentType=WindowsRuntime]
$streamType=[Windows.Storage.Streams.IRandomAccessStream,Windows.Storage.Streams,ContentType=WindowsRuntime]
$decoderType=[Windows.Graphics.Imaging.BitmapDecoder,Windows.Graphics.Imaging,ContentType=WindowsRuntime]
$bitmapType=[Windows.Graphics.Imaging.SoftwareBitmap,Windows.Graphics.Imaging,ContentType=WindowsRuntime]
$ocrResultType=[Windows.Media.Ocr.OcrResult,Windows.Foundation,ContentType=WindowsRuntime]
$language=[Windows.Globalization.Language,Windows.Globalization,ContentType=WindowsRuntime]::new('zh-Hans-CN')
$engine=[Windows.Media.Ocr.OcrEngine,Windows.Foundation,ContentType=WindowsRuntime]::TryCreateFromLanguage($language)
if(-not $engine){throw 'Windows Chinese OCR language is unavailable.'}
$asyncMethod=[System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {$_.Name -eq 'AsTask' -and $_.IsGenericMethod -and $_.GetParameters().Count -eq 1 -and $_.GetGenericArguments().Count -eq 1} | Select-Object -First 1
function Await-Result($operation,[Type]$resultType){$task=$asyncMethod.MakeGenericMethod($resultType).Invoke($null,@($operation));$task.Wait();return $task.Result}
$items=Get-Content -LiteralPath $Jobs -Raw -Encoding UTF8 | ConvertFrom-Json
$count=0
foreach($item in $items){
 if(Test-Path -LiteralPath $item.output){continue}
 try{
  $file=Await-Result ([Windows.Storage.StorageFile]::GetFileFromPathAsync($item.image)) $storageFileType
  $stream=Await-Result ($file.OpenAsync([Windows.Storage.FileAccessMode]::Read)) $streamType
  $decoder=Await-Result ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) $decoderType
  $bitmap=Await-Result ($decoder.GetSoftwareBitmapAsync()) $bitmapType
  $result=Await-Result ($engine.RecognizeAsync($bitmap)) $ocrResultType
  $lines=@($result.Lines | ForEach-Object { @{text=$_.Text;words=@($_.Words | ForEach-Object {@{text=$_.Text;x=$_.BoundingRect.X;y=$_.BoundingRect.Y;width=$_.BoundingRect.Width;height=$_.BoundingRect.Height}})} })
  @{lines=$lines;source=$item.source;page=$item.page;engine='Windows.Media.Ocr';reviewRequired=$true} | ConvertTo-Json -Depth 8 -Compress | Set-Content -LiteralPath $item.output -Encoding UTF8
  $bitmap.Dispose();$stream.Dispose();$count++;Write-Output ('OCR '+$count+'/'+$items.Count+' '+$item.source+' page '+$item.page)
 }catch{Write-Warning ($item.source+' page '+$item.page+': '+$_.Exception.Message)}
}
