$src = "C:\Users\mohit\Documents\Github Masterclass\Git-GitHub-Masterclass-main"
$dest = "C:\Users\mohit\Desktop\github-masterclass-v2.tar.gz"
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

# Create tar.gz using native Windows bsdtar
# -c: create, -z: compress with gzip, -f: file
# -C: change to directory first so we don't store absolute paths
Start-Process -FilePath "tar.exe" -ArgumentList "-czf", "`"$dest`"", "-C", "`"$temp`"", "." -NoNewWindow -Wait

# Clean up temp
Remove-Item $temp -Recurse -Force

if (Test-Path $dest) {
    $size = [math]::Round((Get-Item $dest).Length / 1MB, 2)
    Write-Host "Tarball created at: $dest"
    Write-Host "Size: ${size} MB"
} else {
    Write-Error "Failed to create tarball"
}
