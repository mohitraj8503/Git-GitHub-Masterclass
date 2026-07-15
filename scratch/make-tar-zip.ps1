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

# Run tar.exe from inside the temp folder to avoid any prefix in pathing
Push-Location $temp
# We use Get-ChildItem to get all items and pass them to tar
$items = Get-ChildItem -Force | Select-Object -ExpandProperty Name
& "tar.exe" -a -cf $dest $items
Pop-Location

# Clean up temp
Remove-Item $temp -Recurse -Force

if (Test-Path $dest) {
    $size = [math]::Round((Get-Item $dest).Length / 1MB, 2)
    Write-Host "Zip created successfully at: $dest"
    Write-Host "Size: ${size} MB"
} else {
    Write-Error "Failed to create Zip"
}
