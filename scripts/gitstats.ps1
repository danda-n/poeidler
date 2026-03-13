$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $repoRoot

$readmePath = Join-Path $repoRoot "README.MD"
$startMarker = "<!-- gitstats:start -->"
$endMarker = "<!-- gitstats:end -->"
$sourceExtensions = @(".ts", ".tsx", ".css", ".html")
$invariantCulture = [System.Globalization.CultureInfo]::InvariantCulture

function Format-Number([int]$Value) {
  return $Value.ToString("N0", $invariantCulture)
}

function Encode-BadgeValue([string]$Value) {
  return [System.Uri]::EscapeDataString($Value.Replace("-", "--"))
}

function Get-GitOutput([string[]]$Arguments) {
  return (& git @Arguments).TrimEnd()
}

function Get-LineStats([string]$Path) {
  $content = Get-Content $Path
  $totalLines = $content.Count
  $nonEmptyLines = ($content | Where-Object { $_.Trim().Length -gt 0 }).Count

  return [PSCustomObject]@{
    TotalLines = $totalLines
    NonEmptyLines = $nonEmptyLines
  }
}

function Get-ReadmeTemplate {
@"
# PoEidler

Path of Exile-inspired idle/incremental game built with React, TypeScript, and Vite.

## Repository Stats
$startMarker
_Git stats have not been generated yet. Run <code>npm run gitstats</code>._
$endMarker

## Development

- Install dependencies: <code>npm install</code>
- Start the Vite dev server: <code>npm run dev</code>
- Create a production build: <code>npm run build</code>
- Preview the production build locally: <code>npm run preview</code>
- Refresh the GitHub-facing repository stats in this README: <code>npm run gitstats</code>

## Notes

- The generated stats section in this README is based on the local git history in your checkout.
- Re-run <code>npm run gitstats</code> after meaningful history changes if you want the GitHub repo page to reflect updated counts.
"@
}

$totalCommits = [int](Get-GitOutput @("rev-list", "--count", "--all"))
$recent30DayCommits = [int](Get-GitOutput @("rev-list", "--count", "--all", "--since=30 days ago"))
$firstCommitDate = Get-GitOutput @("log", "--reverse", "--date=short", "--pretty=format:%ad", "--all", "--max-count=1")
$latestCommitDate = Get-GitOutput @("log", "-1", "--date=short", "--pretty=format:%ad", "--all")

$contributors = (Get-GitOutput @("shortlog", "-sn", "--all")) -split "`r?`n" | Where-Object { $_ } | ForEach-Object {
  if ($_ -match "^\s*(\d+)\s+(.+)$") {
    [PSCustomObject]@{
      Commits = [int]$matches[1]
      Name = $matches[2]
    }
  }
}

$recentCommits = (Get-GitOutput @("log", "-5", "--date=short", "--pretty=format:%ad%x09%an%x09%s", "--all")) -split "`r?`n" | Where-Object { $_ } | ForEach-Object {
  $parts = $_ -split "`t", 3
  [PSCustomObject]@{
    Date = $parts[0]
    Author = $parts[1]
    Subject = $parts[2]
  }
}

$trackedFiles = (Get-GitOutput @("ls-files")) -split "`r?`n" | Where-Object { $_ }
$fileStats = foreach ($relativePath in $trackedFiles) {
  $extension = [System.IO.Path]::GetExtension($relativePath)
  if ($sourceExtensions -notcontains $extension) {
    continue
  }

  $absolutePath = Join-Path $repoRoot $relativePath
  $lineStats = Get-LineStats $absolutePath
  $language = switch ($extension) {
    ".ts" { "TypeScript" }
    ".tsx" { "TypeScript" }
    ".css" { "CSS" }
    ".html" { "HTML" }
    default { "Other" }
  }

  [PSCustomObject]@{
    Path = $relativePath
    Language = $language
    TotalLines = [int]$lineStats.TotalLines
    NonEmptyLines = [int]$lineStats.NonEmptyLines
  }
}

$fileStats = $fileStats | Sort-Object NonEmptyLines -Descending
$languageStats = $fileStats | Group-Object Language | ForEach-Object {
  [PSCustomObject]@{
    Language = $_.Name
    Files = $_.Count
    TotalLines = ($_.Group | Measure-Object TotalLines -Sum).Sum
    NonEmptyLines = ($_.Group | Measure-Object NonEmptyLines -Sum).Sum
  }
} | Sort-Object NonEmptyLines -Descending

$totalSourceFiles = ($fileStats | Measure-Object).Count
$totalLines = ($fileStats | Measure-Object TotalLines -Sum).Sum
$totalNonEmptyLines = ($fileStats | Measure-Object NonEmptyLines -Sum).Sum
$generatedAt = Get-Date -Format o

$badges = @(
  "[![Commits](https://img.shields.io/badge/commits-$(Encode-BadgeValue (Format-Number $totalCommits))-2f80ed?style=flat-square)](#repository-stats)",
  "[![Contributors](https://img.shields.io/badge/contributors-$(Encode-BadgeValue (Format-Number $contributors.Count))-16a34a?style=flat-square)](#repository-stats)",
  "[![Source files](https://img.shields.io/badge/source_files-$(Encode-BadgeValue (Format-Number $totalSourceFiles))-7c3aed?style=flat-square)](#repository-stats)",
  "[![Non-empty LOC](https://img.shields.io/badge/non--empty_LOC-$(Encode-BadgeValue (Format-Number $totalNonEmptyLines))-c2410c?style=flat-square)](#repository-stats)"
) -join "`n"

$overviewTable = @(
  "| Metric | Value |",
  "| --- | ---: |",
  "| Total commits | $(Format-Number $totalCommits) |",
  "| Contributors | $(Format-Number $contributors.Count) |",
  "| Source files tracked | $(Format-Number $totalSourceFiles) |",
  "| Total source lines | $(Format-Number $totalLines) |",
  "| Non-empty source lines | $(Format-Number $totalNonEmptyLines) |",
  "| Commits in last 30 days | $(Format-Number $recent30DayCommits) |",
  "| First commit | $firstCommitDate |",
  "| Latest commit | $latestCommitDate |"
) -join "`n"

$languageRows = ($languageStats | Select-Object -First 5 | ForEach-Object { "    `"$($_.Language)`" : $($_.NonEmptyLines)" }) -join "`n"
$mermaidChart = if ($languageRows) {
  @(
    '```mermaid',
    'pie showData',
    '    title Tracked non-empty source lines by language',
    $languageRows,
    '```'
  ) -join "`n"
} else {
  "No tracked source files were found for the current language set."
}

$contributorRows = ($contributors | Select-Object -First 5 | ForEach-Object { "| $($_.Name) | $(Format-Number $_.Commits) |" }) -join "`n"
$contributorTable = @(
  "| Contributor | Commits |",
  "| --- | ---: |",
  $contributorRows
) -join "`n"

$fileRows = ($fileStats | Select-Object -First 5 | ForEach-Object { "| <code>$($_.Path)</code> | $(Format-Number $_.NonEmptyLines) | $($_.Language) |" }) -join "`n"
$fileTable = @(
  "| File | Non-empty lines | Language |",
  "| --- | ---: | --- |",
  $fileRows
) -join "`n"

$recentCommitList = ($recentCommits | ForEach-Object { "- $($_.Date) | $($_.Author) | $($_.Subject)" }) -join "`n"

$statsSection = @(
  $startMarker,
  "> Last generated: $generatedAt via <code>npm run gitstats</code>",
  "",
  $badges,
  "",
  $overviewTable,
  "",
  "### Language Breakdown",
  "",
  $mermaidChart,
  "",
  "### Top Contributors",
  "",
  $contributorTable,
  "",
  "### Largest Tracked Source Files",
  "",
  $fileTable,
  "",
  "### Recent Commits",
  "",
  $recentCommitList,
  $endMarker
) -join "`n"

if (Test-Path $readmePath) {
  $readmeContent = Get-Content -Raw $readmePath
} else {
  $readmeContent = Get-ReadmeTemplate
}

if ($readmeContent -notmatch [regex]::Escape($startMarker) -or $readmeContent -notmatch [regex]::Escape($endMarker)) {
  $readmeContent = $readmeContent.TrimEnd() + "`n`n## Repository Stats`n$startMarker`n_Git stats have not been generated yet. Run <code>npm run gitstats</code>._`n$endMarker`n"
}

$escapedStart = [regex]::Escape($startMarker)
$escapedEnd = [regex]::Escape($endMarker)
$updatedReadme = [regex]::Replace($readmeContent, "$escapedStart[\s\S]*?$escapedEnd", [System.Text.RegularExpressions.MatchEvaluator]{ param($match) $statsSection })
Set-Content $readmePath $updatedReadme
Write-Output "Updated $readmePath"
