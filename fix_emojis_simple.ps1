# Simple emoji fix script
$file = "frontend\src\components\CBTAdminPanel.js"
$content = Get-Content $file -Raw

# Fix the most important emojis
$content = $content -replace 'â"', '❓'
$content = $content -replace 'ðŸ"Š', '📊' 
$content = $content -replace 'ðŸ\'', '👥'
$content = $content -replace 'âš™ï¸', '⚙️'
$content = $content -replace 'ðŸ"§', '🔧'
$content = $content -replace 'ðŸ"‹', '📋'
$content = $content -replace 'âž•', '➕'
$content = $content -replace 'ðŸ"', '🔍'
$content = $content -replace 'âœ…', '✅'
$content = $content -replace 'âš ï¸', '⚠️'
$content = $content -replace 'ðŸ"', '📝'
$content = $content -replace 'ðŸ"', '📁'
$content = $content -replace 'ðŸ"', '📄'
$content = $content -replace 'ðŸ"', '🔄'
$content = $content -replace 'â†', '←'
$content = $content -replace 'Ã—', '×'
$content = $content -replace 'ðŸŸ¢', '🟢'
$content = $content -replace 'âœ"', '✓'

Set-Content $file -Value $content -Encoding UTF8
Write-Host "Emojis fixed!"
