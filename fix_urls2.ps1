# Fix frontend files: restore backticks and add API_ORIGIN imports
$srcDir = "c:/Users/Nguyen Tan Dat/Documents/GitHub/Spotify-Clone/frontend/src"
$files = Get-ChildItem -Path $srcDir -Recurse -Include *.ts,*.tsx | Where-Object { $_.FullName -notmatch '\\\\node_modules\\\\' }

foreach ($f in $files) {
    $content = Get-Content -LiteralPath $f.FullName -Raw
    $orig = $content
    $rel = $f.FullName.Substring($srcDir.Length).TrimStart('\','/')
    $dir = Split-Path $rel -Parent

    # Compute import path from file dir to config/api
    $depth = if ([string]::IsNullOrEmpty($dir)) { 0 } else { ($dir -split '[\\/]').Count }
    $importPath = if ($depth -le 0) { "./config/api" } else { ("../" * $depth) + "config/api" }

    $needsImport = $false

    # 1. Restore backticks for fetch(API_ORIGIN...)
    # Pattern: fetch(${API_ORIGIN}/... )  -> fetch(`${API_ORIGIN}/...`)
    # Match fetch( followed by ${API_ORIGIN} and capture until closing paren
    $content = [regex]::Replace($content, 'fetch\(\$\{API_ORIGIN\}([^;\r\n]*?)\)', 'fetch(${API_ORIGIN}$1)')

    # 2. Restore backticks for axios.get(${API_ORIGIN}...)
    $content = [regex]::Replace($content, '(axios\.(?:get|post|put|delete))\(\$\{API_ORIGIN\}([^;\r\n]*?)\)', '$1(${API_ORIGIN}$2)')

    if ($content -match '\$\{API_ORIGIN\}') { $needsImport = $true }

    # 3. Add import if file references API_ORIGIN but has no import line
    if ($content -match 'API_ORIGIN' -and $content -notmatch 'from\s+["'']\.\.?/.*config/api["'']' -and $content -notmatch 'from\s+["'']\./config/api["'']') {
        $importLine = "import { API_ORIGIN } from `"$importPath`";`n"
        if ($content -match '(?m)^(import .*?;\n)') {
            $content = $content -replace '(?m)^(import .*?;\n)', ('$1' + [regex]::Escape($importLine))
        } else {
            $content = $importLine + $content
        }
        $needsImport = $true
    }

    if ($content -ne $orig) {
        Set-Content -LiteralPath $f.FullName -Value $content -NoNewline
        Write-Output ("Updated: " + $f.FullName)
    }
}
Write-Output "DONE"
