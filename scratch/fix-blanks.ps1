$f = "C:/Users/mohit/Documents/Github Masterclass/Git-GitHub-Masterclass-main/app/admin/dashboard/page.tsx"
$lines = [System.IO.File]::ReadAllLines($f)
$newLines = [System.Collections.Generic.List[string]]::new()

for ($i = 0; $i -lt $lines.Count; $i++) {
    # Lines 1949-1988 (0-indexed: 1948-1987) are blank/whitespace lines to remove
    if ($i -ge 1948 -and $i -le 1987) {
        $trimmed = $lines[$i].Trim()
        if ($trimmed -eq "") {
            continue  # skip blank lines in this range
        }
    }
    $newLines.Add($lines[$i])
}

# Add one blank line between the }) and {currentTab
[System.IO.File]::WriteAllLines($f, $newLines.ToArray())
Write-Host "Done. Removed blank lines. New line count: $($newLines.Count)"
