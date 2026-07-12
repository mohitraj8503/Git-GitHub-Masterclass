$src = "C:\Users\mohit\Documents\Github Masterclass\Git-GitHub-Masterclass-main"
$dest = "C:\Users\mohit\Desktop\Git-GitHub-Masterclass-deploy.tar.gz"
$temp = "C:\Users\mohit\Desktop\_deploy_temp"

# Clean up previous
if (Test-Path $dest) { Remove-Item $dest -Force }
if (Test-Path $temp) { Remove-Item $temp -Recurse -Force }

# Create temp folder
New-Item -ItemType Directory -Path $temp | Out-Null

# Folders to exclude
$excludeDirs = @('.next', 'node_modules', '.git', 'scratch', '.env.local')

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

# Use tar to create .tar.gz (available on Windows 10+)
Set-Location $temp
tar -czf $dest *

# Clean up temp
Set-Location $src
Remove-Item $temp -Recurse -Force

$size = [math]::Round((Get-Item $dest).Length / 1MB, 2)
Write-Host "tar.gz created at: $dest"
Write-Host "Size: ${size} MB"
