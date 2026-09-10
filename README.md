# DISASTERX AI — Natural Disaster Intelligence

DISASTERX AI is a decision-support prototype that combines real public disaster feeds with GIS, regional history, satellite imagery comparison, alerts/rescue handoff, and a local AI+IoT+3D live demonstration.

## Included
- MAP: country/state/district drill-down, administrative boundaries, real USGS/GDACS events, hazard markers, satellite imagery.
- REGION INTELLIGENCE: WHAT HAPPENED / WHAT IS HAPPENING / WHAT MAY HAPPEN, based on returned source records and transparent risk logic.
- ANALYTICS: current source-event distribution and USGS historical earthquake catalog.
- PREDICTIONS: transparent decision-support risk view; no fabricated future events.
- ALERTS: response command center, rescue-request preparation/export, optional authorized webhook.
- REPORTS: source-based situation report export.
- SPACE EYE: browser-side before/after image change detection.
- LIVE DEMO: AI-style risk analysis + simulated IoT sensors + CSS 3D auditorium digital twin + before/after land scenario + timeline + precautions + offline-ready SMS outbox.

## Run locally
1. Extract the ZIP.
2. Open the extracted `DISASTERX AI` folder in VS Code.
3. Open a terminal in that folder (the folder must contain `package.json` and `server.js`).
4. Run:
   npm install
   npm start
5. Open http://localhost:5000

Do NOT use Live Server for this Node/Express project.

## Real-world data
Live map/data features require internet access to reach public sources:
- USGS earthquake feeds/catalog
- GDACS disaster alerts/geometry
- geoBoundaries administrative boundaries
- OpenStreetMap
- Esri World Imagery

The application deliberately does not fabricate current disaster events.

## SMS / offline behavior
The LIVE DEMO has a local SMS outbox that works without internet and demonstrates message preparation/queueing. A browser cannot transmit a real SMS by itself. Actual SMS delivery requires cellular service plus a phone/GSM modem or an authorized SMS gateway. The demo never claims delivery unless an actual integration confirms it.

Replace the five clearly marked demo recipient numbers with authorized administration contacts before any real deployment.

## Rescue response
`RESCUE_WEBHOOK_URL` can be configured for an authorized emergency-response endpoint. Without that configuration, DISASTERX AI prepares/exports the request instead of falsely claiming dispatch.

## Live Demo safety
The 15-day earthquake scenario is a simulation for demonstrating AI/IoT/digital-twin workflows. It is NOT a scientific claim that an earthquake can be predicted to occur on a specific date. Simulated impact visuals are labelled as modelled, not observed damage.

## Deployment
`render.yaml` is included for Render. Configure environment variables and any authorized integrations in the deployment environment.
