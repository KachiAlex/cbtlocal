# Fix corrupted emojis in CBTAdminPanel.js
$content = Get-Content "frontend\src\components\CBTAdminPanel.js" -Raw

# Replace corrupted emojis with correct ones
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
$content = $content -replace 'ðŸ'¡', '💡'
$content = $content -replace 'â†', '←'
$content = $content -replace 'Ã—', '×'
$content = $content -replace 'ðŸŸ¢', '🟢'
$content = $content -replace 'âœ"', '✓'

# Write the fixed content back
Set-Content "frontend\src\components\CBTAdminPanel.js" -Value $content -Encoding UTF8
