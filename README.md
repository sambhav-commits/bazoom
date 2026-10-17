# NovaDrive continuity dashboard · P3

A compact, Vercel-ready Next.js dashboard for the NovaDrive supplier-continuity case. It uses the final `CONTENT.txt` solution as its decision and calculation reference. The original case evidence remains distinct from dated public research; public sources are capability or financial context, not proof of a NovaDrive-approved factory or available capacity.

## What is in the dashboard

The eight workspace views cover portfolio priorities and the four-week pilot; 23 confirmed manufacturers, 29 supply links, 10 planned allocations and separate ownership/provisional/hypothesis layers; the reproducible P3 screen and historical P2; eight event records with two U2 reviews and one U3 booking check; route-specific sourcing comparisons, seven component/common-input recovery routes and switching-load estimates; an action register; original case evidence and public-source review; and 25 acceptance-test records. Action, alert, qualification, research, model and test changes are saved with audit history.

The interface uses white, charcoal, green and restrained amber, with no gradients. Its priority bars and tier composition ring are drawn from the current filters and P3 model with lightweight CSS/SVG; the project ships no image or charting libraries. `lib/data.json` is the compact dashboard data; `lib/sections.json` holds the complete M1–M10 and A1–A12 solution excerpts on the server for the reference drawer. Neither the scanned handbook nor the original large files are required at runtime.

## Run locally

Use Node.js 22.13 or newer:

```sh
npm ci
npm run validate
npm run typecheck
npm run dev
```

To compare the packaged case data and all 22 reference sections against the supplied final text, run `node scripts/audit-content.mjs "<absolute-path-to-CONTENT.txt>"`. The audit checks the A4 raw indicators, all 115 A6 P3 cells, M6 switching loads, M7 route screens, M9 recovery routes, and A12 expectations. It reads the source file locally; `CONTENT.txt` is not required in the deployed bundle.

Open `http://localhost:3000`. Without environment variables, local development uses a local SQLite file under `.data/` and bypasses the password screen. Set `ACCESS_PASSWORD` during development if you want to exercise sign-in. The local SQLite file is ignored and must not be deployed as application data.

## Publish on Vercel

1. Import this folder as a **Next.js** project in Vercel. If importing the enclosing `IITM` directory, set the project root to `novadrive-vercel`. The build command is `npm run build` and the framework preset is Next.js; no custom output directory is needed.
2. Connect a Neon Postgres database through the Vercel Marketplace or another compatible Postgres service. Set `DATABASE_URL` to its server-side connection string. The app creates its two workspace tables and index on first access. Use a dedicated database/role for this dashboard.
3. Set `ACCESS_PASSWORD` to a strong editor passphrase and `SESSION_SECRET` to a separate random secret in Vercel's environment settings. Add the three variables to every environment where the dashboard will run. Do not prefix them with `NEXT_PUBLIC_`.
4. Deploy. The production build deliberately shows **Hosting setup required** until all three variables exist. The dashboard and case evidence are public to view; visitors see a read-only seed workspace, while saved records and audit history remain available only to signed-in editors. Sign in at `/editor` to save actions, reviews and validation results. Inspect the Meridian EV-003 → DOC-039 → ACT-MERIDIAN path, save and reopen an action, then record the result in Validation.

To deploy from a terminal instead, run `npx vercel` followed by `npx vercel --prod` from this folder after signing in and setting the same project environment variables. A Vercel account and database credentials are required; this repository contains neither.

## Data and decision limits

The case snapshot is 30 September 2025; public research is dated 5 October 2026. Planned component allocations are award shares, not purchases, spare capacity or proof of independence. P3 is a screening index, not loss or probability. E uses the highest disclosed downstream Tier-1 allocation reached on a confirmed path. Five Tier-3 financial inputs are missing and appear as score intervals. A candidate fit score does not grant production approval: eight dated, evidence-backed gates plus factory, programme, volume, approver and validity are required. The M1 $5.5m figure is a stress comparison derived from one week of P1/P2 gross revenue equivalent and an assumed 25% contribution margin, not an observed loss or ROI.

`npm run validate` checks the network counts, all 115 P3 sensitivity cells against `CONTENT.txt`, required scores, action floors, candidate arithmetic and approval/closure guards. Its output is saved to `validation/calculations.json`. The 25 in-app acceptance rows start as **NOT EXECUTED** and should only be marked after observing the deployed build.

The source reference includes M10's proposed live URL, QR code and tester record fields, but this repository does not contain a completed Vercel deployment or observed production acceptance results. The dashboard is a case-data prototype: source review and stateful decisions work, while automatic ingestion from external event feeds and a fully normalized live supplier registry remain future integration work.
