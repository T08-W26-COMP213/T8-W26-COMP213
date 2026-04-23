# StockGuard UML (Release 1.0)

This folder contains **as-implemented** UML source files aligned to the current StockGuard codebase.

## Files

- `use-case-diagram.puml`
- `class-diagram.puml`
- `sequence-log-usage.puml`
- `component-diagram.puml`
- `activity-log-usage.puml`

## Generate Diagrams (PNG + SVG)

From repo root in PowerShell:

```powershell
.\scripts\generate-uml.ps1
```

Output is written to:

- `docs/uml/generated/`

## Notes for AI (Claude/ChatGPT)

When asking AI to update these diagrams, keep these constraints:

1. Do not invent non-implemented classes or collections.
2. Keep model names exact: `User`, `Inventory`, `UsageLog`, `SystemSettings`.
3. Use real API paths under `/api/*`.
4. Keep risk values as `Low`, `Medium`, `High` (UI labels map separately).
5. Keep `UsageLog.usageDate` as `String (YYYY-MM-DD)`.

## Current scope boundary

Not implemented as persistent models in Release 1.0:

- Report model/table
- Trends cache collection
- Persistent `systemlogs` collection

