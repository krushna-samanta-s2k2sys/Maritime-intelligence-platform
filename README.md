# S&P Maritime Intelligence Platform — React App

## Prerequisites

- Node.js 18+

## Install dependencies

Run once after cloning or pulling new changes:

```powershell
cd "c:\S&P\Maritime\UX\react-app"
npm install
```

## Start the dev server

> **Note:** The `&` in the folder path `S&P` breaks `npm run dev` in cmd.exe.
> Use the direct Node call below instead.

```powershell
cd "c:\S&P\Maritime\UX\react-app"
node .\node_modules\vite\bin\vite.js
```

Then open **http://localhost:5173** in your browser.

## Build for production

```powershell
cd "c:\S&P\Maritime\UX\react-app"
node .\node_modules\vite\bin\vite.js build
```

Output is written to `dist\`.

https://www.marinetraffic.com/en/ais/home/centerx:-143.8/centery:17.5/zoom:2

## Pages

| Route | Page |
|---|---|
| `/dashboard` | Dashboard |
| `/vessels` | Vessels |
| `/companies` | Companies |
| `/ports` | Ports |
| `/movements` | Movements |
| `/fixtures` | Fixtures |
| `/psc` | PSC Inspections |
| `/compliance` | Compliance |
| `/events` | Events |
| `/imo-core` | IMO Core (Bi-Temporal) |
| `/gis-ais` | GIS / AIS Map |
| `/etl` | ETL Pipeline |
| `/bigquery` | BigQuery Console |
