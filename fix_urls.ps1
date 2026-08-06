# Temporary helper: replace hardcoded localhost URLs with API_ORIGIN in frontend/src
$srcDir = "c:/Users/Nguyen Tan Dat/Documents/GitHub/Spotify-Clone/frontend/src"
$files = Get-ChildItem -Path $srcDir -Recurse -Include *.ts,*.tsx | Where-Object { $_.FullName -notmatch '\\node_modules\\' }

# Regex patterns
# Pattern 1: URL inside double quotes  -> template literal
$dqPattern = '"http://(?:127\.0\.0\.1|localhost):8000([^"]*)"'
# Pattern 2: URL inside backticks (template literal) already
$btPattern = '`http://(?:127\.0\.0\.1|localhost):8000([^`]*)`'

foreach ($f in $files) {
    $content = Get-Content -LiteralPath $f.FullName -Raw
    $original = $content
    $changed = $false

    # Replace double-quoted URLs
    if ($content -match $dqPattern) {
        $content = $content -replace $dqPattern, '$${API_ORIGIN}$1'
        $changed = $true
    }
    # Replace backtick URLs
    if ($content -match $btPattern) {
        $content = $content -replace $btPattern, '$${API_ORIGIN}$1'
        $changed = $true
    }

    # Add import if file now references API_ORIGIN but has no import
    if ($content -match 'API_ORIGIN' -and $content -notmatch 'from\s+["'']<?\.\.?/.*config/api["'']' -and $content -notmatch 'from\s+["'']\./config/api["'']') {
        $rel = $f.FullName.Substring($srcDir.Length).TrimStart('\','/')
        $dir = Split-Path $rel -Parent
        $depth = if ([string]::IsNullOrEmpty($dir)) { 0 } else { ($dir -split '[\\/]').Count }
        $importPath = if ($depth -le 0) { "./config/api" } else { ("../" * $depth) + "config/api" }
        $importLine = "import { API_ORIGIN } from `"$importPath`";`n"
        # Insert after the first import line
        if ($content -match '(?m)^import .*$') {
            $content = $content -replace '(?m)^(import .*?;\n)', ('$1' + $importLine)
        } else {
            $content = $importLine + $content
        }
        $changed = $true
    }

    if ($changed -and $content -ne $original) {
        Set-Content -LiteralPath $f.FullName -Value $content -NoNewline
        Write-Output ("Updated: " + $f.FullName)
    }
}
Write-Output "Done."
