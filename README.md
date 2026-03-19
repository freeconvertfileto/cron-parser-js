# Cron Expression Parser

Parse and explain any cron expression with field-by-field breakdown, human-readable description, and next 10 scheduled run times, entirely in the browser.

**Live Demo:** https://file-converter-free.com/en/developer-tools/cron-parser-online

## How It Works

`validatePart(val, min, max)` checks each of the 5 fields against patterns for `*`, `*/step`, `N-M` ranges, comma lists, and exact integers — returning false if the value falls outside the allowed range for that field. Six-field expressions (with a leading seconds field) are accepted and the seconds field is silently stripped. `describeField(val, idx)` produces a short English phrase for each field value. `humanReadable(parts)` checks for 6 common exact-match patterns first, then builds a composite description. `parsePart(val, min, max)` expands each field into a concrete integer set. `nextRuns(parts, count)` simulates forward from now (capped at 100,000 iterations), applying month, day (union when both DOM and DOW are non-`*`), hour, and minute filters, collecting up to 10 firing times.

## Features

- Validates all 5 cron fields with range checking
- Accepts 6-field expressions (strips leading seconds field)
- Per-field breakdown with value and plain-English description
- Human-readable summary of the full expression
- Next 10 scheduled run times (forward simulation)

## Browser APIs Used

- (No external APIs — pure DOM and date math)

## Code Structure

| File | Description |
|------|-------------|
| `cron-parser.js` | `validatePart` range/pattern checker, `describeField` per-field English, `humanReadable` summary, `parsePart` field expander, `nextRuns` forward-simulation (10 runs, 100k limit) |

## Usage

| Element ID / Selector | Purpose |
|----------------------|---------|
| `#crpInput` | Cron expression text input |
| `#crpParse` | Parse button |
| `#crpError` | Error message display |
| `#crpDescription` | Human-readable description |
| `#crpBreakdown` | Per-field breakdown list |
| `#crpNextRuns` | List of next 10 run times |

## License

MIT
