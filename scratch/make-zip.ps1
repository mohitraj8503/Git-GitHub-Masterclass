$src = "C:\Users\mohit\Documents\Github Masterclass\Git-GitHub-Masterclass-main"
$dest = "C:\Users\mohit\Desktop\github-masterclass-v2.zip"
$temp = "C:\Users\mohit\Desktop\_deploy_temp"

# Clean up previous
if (Test-Path $dest) { Remove-Item $dest -Force }
if (Test-Path $temp) { Remove-Item $temp -Recurse -Force }

# Create temp folder
New-Item -ItemType Directory -Path $temp | Out-Null

# Folders to exclude
$excludeDirs = @('.next', 'node_modules', '.git', 'scratch')

# Copy files, excluding unwanted dirs
Get-ChildItem -Path $src -Force | Where-Object {
    -not ($excludeDirs -contains $_.Name)
} | ForEach-Object {
    $target = Join-Path $temp $_.Name
    if ($_.PSIsContainer) {
        Copy-Item $_.FullName $target -Recurse -Force
    } else {
        Copy-Item $_.FullName $target -Force
    }
}

# Create zip
Compress-Archive -Path "$temp\*" -DestinationPath $dest -Force

# Clean up temp
Remove-Item $temp -Recurse -Force

$size = [math]::Round((Get-Item $dest).Length / 1MB, 2)
Write-Host "Zip created at: $dest"
Write-Host "Size: ${size} MB"
