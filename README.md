DISASTERX AI
Natural Disaster Intelligence, Risk Visualization & Emergency Decision-Support Platform
> **DISASTERX AI** is a real-data disaster intelligence dashboard that brings live/recent disaster events, historical records, administrative boundaries, map intelligence, satellite-style visualization, infrastructure monitoring simulations, and emergency communication workflows into one platform.
The project is designed for hackathons, academic demonstrations, disaster-management prototypes, and decision-support research.
---
1. Problem Statement
Natural disasters such as earthquakes, floods, cyclones, wildfires and volcanic events can affect people, infrastructure and critical services with little warning. Disaster information is often distributed across multiple portals and data formats, making it difficult for users to quickly answer:
What happened?
Where did it happen?
What is happening now?
What is the historical disaster pattern of this region?
What infrastructure could be vulnerable?
What action should be considered next?
DISASTERX AI addresses this problem by combining public disaster data, geographic boundaries, map visualization, historical analysis, infrastructure/IoT simulation and emergency-response workflows in a single interface.
---
2. Key Objectives
Aggregate disaster information from trusted public sources.
Visualize disaster events geographically.
Allow country, state/province and region-level exploration.
Separate observed data from simulations and decision-support outputs.
Provide historical and current disaster intelligence.
Visualize official/observed alert levels where available.
Support infrastructure monitoring demonstrations using IoT-style sensor values.
Provide satellite-imagery and digital-twin style demonstrations.
Prepare emergency SMS and rescue-response workflows.
Maintain a transparent architecture where unsupported events are never presented as real observations.
---
3. Main Functionalities
A. Interactive Disaster Map
The MAP module is the primary operating screen.
Features
Interactive MapLibre map.
Country selection.
Disaster/hazard selection.
Live/recent event loading.
Disaster markers.
Hazard-specific event information.
Map fly-to/zoom behavior.
Real administrative boundaries.
State/province and district/region labels.
Satellite imagery layer.
OpenStreetMap map layer.
Event selection from the map.
Event details including:
Source
Disaster type
Location
Date/time
Severity
Alert level when supplied by the source
Magnitude where applicable
Depth for earthquakes where available
Original source link
Supported disaster categories in the current backend
Earthquake
Flood
Tropical Storm / Cyclone
Volcanic Eruption
Wildfire
The platform is structured so additional disaster providers can be added later.
---
4. Real-World Data Integration
DISASTERX AI currently uses public sources through the backend.
USGS
The United States Geological Survey provides earthquake feeds and the FDSN earthquake catalog.
Used for:
Recent earthquake events.
Historical earthquake searches.
Magnitude.
Location.
Depth.
Event time.
Event source URL.
GeoJSON event geometry.
Official:
https://earthquake.usgs.gov/earthquakes/feed/
FDSN catalog:
https://earthquake.usgs.gov/fdsnws/event/1/
---
GDACS
The Global Disaster Alert and Coordination System provides disaster event information and alert levels.
Used for:
Earthquakes.
Floods.
Tropical storms/cyclones.
Volcanic eruptions.
Wildfires.
Event IDs.
Event/episode metadata.
Alert levels such as RED, ORANGE, YELLOW and GREEN where supplied.
Event geometry.
Official API documentation:
https://www.gdacs.org/gdacsapi/swagger/index.html
---
geoBoundaries
geoBoundaries provides administrative boundary datasets.
Used for:
Country boundaries.
State/province boundaries.
Administrative region visualization.
GeoJSON boundary layers.
The current application requests the required administrative level from the geoBoundaries API.
Official:
https://www.geoboundaries.org/api.html
---
OpenStreetMap / Nominatim
Used for:
Base map context.
Geographic search/geocoding.
Official:
https://www.openstreetmap.org/
https://nominatim.openstreetmap.org/
---
Esri World Imagery
Used for satellite/aerial imagery visualization in the map and Space Eye module.
Imagery service:
https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer
---
5. Data Sources Planned / Integration-Ready
The project architecture can be extended with additional official sources.
NASA EONET
Natural event information API covering categories such as severe storms and wildfires.
https://eonet.gsfc.nasa.gov/docs/v3
NASA FIRMS
Satellite active-fire products from MODIS, VIIRS and Landsat.
https://firms.modaps.eosdis.nasa.gov/
FIRMS requires appropriate access credentials/MAP_KEY for API usage.
India Meteorological Department (IMD)
Can be integrated for Indian meteorological and weather information where an authorized API/service is available.
https://api.imd.gov.in/public/api_reference.html
> **Important:** These sources are documented as extension points. The current public build's active disaster-data backend is USGS + GDACS; it does not claim that every listed source is currently connected.
---
6. Region Disaster Intelligence
When a state/province or region is selected, DISASTERX AI can request historical records and present regional intelligence.
WHAT HAPPENED?
Historical source records such as:
Previous earthquakes.
Historical GDACS disaster events.
Event dates.
Event locations.
Magnitude/severity where available.
Source attribution.
WHAT IS HAPPENING?
Current/recent records returned by connected public sources.
WHAT MAY HAPPEN?
Decision-support and simulation outputs.
This section is intentionally different from observed event data.
The platform does not claim that a specific disaster will definitely happen on a future date.
---
7. Analytics Module
The ANALYTICS section provides a country-level analytical view.
Current functionality includes:
Live record counts.
Disaster-type distribution.
Severity/alert-level summaries.
Source-based summaries.
Recent event analysis.
One-year earthquake-history loading.
Historical earthquake data from the USGS catalog.
Data-source transparency.
Analytics are calculated from records returned by connected public sources rather than hard-coded disaster statistics.
---
8. Predictions / Decision Support
The PREDICTIONS module is designed as a risk and preparedness decision-support interface.
It can present:
Risk indicators.
Scenario interpretation.
Preparedness guidance.
Model/simulation-style outputs.
Infrastructure-related risk context.
Important limitation
The current system should be described as decision support and scenario simulation, not as a scientifically validated system that predicts an exact future disaster.
For example:
> “High simulated structural risk under the selected scenario”
is valid.
> “An earthquake will definitely happen here in 15 days”
is not claimed by the system.
---
9. Alerts & Rescue Response
The ALERTS module acts as a response command center.
Features include:
Current source event list.
Event severity.
Source alert level.
Event inspection.
Map navigation to an alert.
Structured rescue request preparation.
Local rescue-request history.
Pending response request count.
Optional authorized webhook integration.
Rescue Webhook
The backend supports:
```text
POST /api/rescue/notify
```
If `RESCUE_WEBHOOK_URL` is configured, a structured request can be sent to an authorized external endpoint.
If it is not configured, the application does not pretend that emergency services were contacted.
---
10. Reports Module
The REPORTS section provides a reporting-oriented interface for the disaster intelligence available in the application.
It can be used to inspect:
Disaster records.
Regional intelligence.
Source information.
Historical events.
Response information.
Simulation outputs.
The reporting layer is designed so that observed source records and simulated information can remain distinguishable.
---
11. SPACE EYE
SPACE EYE is the satellite/earth-observation and infrastructure-intelligence demonstration module.
Features
Satellite imagery view.
Geographic focus area.
Infrastructure focus.
Historical space/launch reference.
3D-style digital twin concept.
Current vs simulated-after comparison.
AI-analysis-style interpretation.
Model confidence presentation.
Seismic activity context.
Ground deformation / InSAR concept.
Thermal analysis concept.
Industrial activity context.
15-day scenario tracker.
Predicted impact visualization.
Neighbouring-zone interpretation.
Recommended actions.
Emergency SMS workflow.
Historical launch reference
The project may show the GSLV-F12 / NVS-01 launch as a historical reference.
It is not treated as a current disaster trigger.
---
12. LIVE DEMO — AI + IoT + 3D Digital Twin
LIVE DEMO is a controlled simulation environment designed for demonstrations.
It demonstrates how a future integrated system could combine:
```text
IoT Sensors
     +
Disaster Intelligence
     +
Infrastructure Digital Twin
     +
Risk Scoring
     +
Emergency Communication
```
Simulated sensor inputs
Vibration
Tilt
Structural integrity
Temperature
Occupancy
Emergency button
Scenario states
NORMAL
STRESS
AFTER / IMPACT SIMULATION
Timeline
The demonstration can move through:
Day 1
Day 3
Day 5
Day 7
Day 10
Day 12
Day 15
Digital Twin
The interface compares:
Current/normal condition.
Simulated stressed condition.
Simulated post-impact condition.
These visual states are simulation/model outputs, not satellite-observed damage.
---
13. Risk Visualization
The platform uses transparent severity/risk categories.
Source alert levels
Where GDACS provides an alert level:
RED
ORANGE
YELLOW
GREEN
These are preserved as source alert information.
Application severity
The application maps available event information into:
HIGH
MODERATE
LOW
UNKNOWN
For USGS earthquakes, the current implementation uses magnitude thresholds as a simple visualization classification.
This is a display/decision-support classification, not an official USGS hazard rating.
---
14. Emergency SMS Workflow
DISASTERX AI supports multiple SMS workflows.
Phone-native SMS
On a mobile device, the application can open the native SMS composer using:
```text
sms:<phone>?body=<message>
```
The user then reviews and manually presses Send.
This is useful for hackathon demonstrations without requiring a third-party SMS provider.
Local SMS audit
The browser stores a local audit/outbox record using `localStorage`.
This can record that an SMS composer was opened.
GSM Modem Support
The backend also contains an optional serial/GSM SMS path.
Environment variables:
```env
SMS_PORT=COM3
SMS_BAUD=115200
```
When a compatible SIM-enabled GSM modem is connected and configured, the backend can issue modem commands and report when the modem accepts the SMS command.
Important
A browser or laptop cannot silently send an SMS to a remote phone simply because both devices are on Wi-Fi.
For actual delivery, use:
A phone's cellular SMS composer, or
A SIM-enabled GSM modem, or
An authorized SMS gateway/provider.
The project does not falsely claim delivery when the required communication hardware/service is unavailable.
---
15. Backend API
The Node.js/Express backend exposes the following routes.
Endpoint	Purpose
`GET /api/health`	Server health check
`GET /api/disasters`	Current/recent USGS + GDACS disaster events
`GET /api/earthquakes/history`	Historical USGS earthquake records
`GET /api/boundaries`	geoBoundaries administrative GeoJSON
`GET /api/gdacs/geometry`	GDACS event geometry
`GET /api/region/history`	Regional historical disaster intelligence
`GET /api/geocode`	Nominatim location search
`GET /api/sms/status`	SMS/GSM configuration status
`POST /api/sms/send`	Local queue or GSM SMS workflow
`POST /api/rescue/notify`	Authorized rescue webhook integration
---
16. API Data Flow
```text
User
  |
  v
DISASTERX AI Web Dashboard
  |
  v
Node.js + Express Backend
  |
  +---- USGS ----------------> Earthquake Data
  |
  +---- GDACS ---------------> Disaster Events/Alerts
  |
  +---- geoBoundaries -------> Administrative Boundaries
  |
  +---- Nominatim -----------> Geocoding
  |
  +---- Esri/OSM ------------> Map & Imagery
  |
  +---- Optional GSM --------> SMS
  |
  +---- Optional Webhook ----> Authorized Rescue System
```
---
17. Frontend Architecture
The frontend is a single-page dashboard built using:
HTML5
CSS3
JavaScript
Bootstrap
MapLibre GL JS
Browser LocalStorage
Main navigation:
```text
MAP
ANALYTICS
PREDICTIONS
ALERTS
REPORTS
SPACE EYE
LIVE DEMO
```
The application dynamically renders the selected module without requiring a separate frontend framework.
---
18. Map Architecture
The map uses:
MapLibre GL JS
For:
Interactive rendering.
Zooming.
Panning.
Event markers.
Geographic layers.
OpenStreetMap
For standard map context.
Esri World Imagery
For satellite/aerial imagery.
GeoJSON
For:
Administrative boundaries.
Event geometries.
Disaster features.
HTML Administrative Labels
State/province and region labels are rendered as map markers so that the interface can show readable administrative names without depending on a remote MapLibre glyph/font service.
---
19. Caching & Reliability
The backend uses a short in-memory cache.
Current cache duration:
```text
45 seconds
```
This reduces repeated external API calls while keeping the dashboard reasonably fresh.
External API requests also use:
Request timeouts.
Error handling.
Source-specific warnings.
HTTP status handling.
If a live source becomes unavailable, the application reports that the source could not be reached instead of fabricating replacement data.
---
20. Country & Region Support
The current application includes common country-to-ISO3 mappings such as:
India → IND
China → CHN
Philippines → PHL
Nepal → NPL
Bangladesh → BGD
Japan → JPN
Indonesia → IDN
United States → USA
Australia → AUS
Canada → CAN
Brazil → BRA
Pakistan → PAK
Sri Lanka → LKA
Additional countries can be supported by passing their ISO3 code to the boundary service.
---
21. Technology Stack
Frontend
HTML5
CSS3
JavaScript
Bootstrap 5
MapLibre GL JS
Backend
Node.js
Express.js
Native Fetch API
REST APIs
Geographic Technologies
GeoJSON
MapLibre
OpenStreetMap
Nominatim
Esri World Imagery
geoBoundaries
Disaster Data
USGS
GDACS
Optional / Extension Data
NASA EONET
NASA FIRMS
IMD
Additional authorized disaster-management APIs
Communication
Browser `sms:` URI
LocalStorage SMS audit
SerialPort
GSM modem
Authorized webhook
Development
VS Code
npm
Git
GitHub
Deployment
Node.js server
Render configuration included
---
22. Project Structure
```text
AgriRISK/
│
├── package.json
├── server.js
├── render.yaml
├── README.md
├── LICENSE.txt
├── .gitignore
│
└── public/
    ├── index.html
    ├── app.js
    └── app.css
```
> The repository directory may retain the historical `AgriRISK` folder name from the earlier prototype, while the user-facing product branding is **DISASTERX AI**.
---
23. Installation
Requirements
Install:
Node.js
npm
Git
A modern browser
Recommended:
VS Code
Check Node.js:
```bash
node --version
```
Check npm:
```bash
npm --version
```
---
Install Dependencies
Open a terminal inside the project directory:
```bash
cd AgriRISK
npm install
```
---
Start the Application
```bash
npm start
```
The default server runs on:
```text
http://localhost:5000
```
Open the URL in a browser.
---
24. Running on a Phone for Demonstration
If the laptop and phone are connected to the same Wi-Fi network:
Find the laptop's local IPv4 address.
Start the Node.js server.
Open:
```text
http://YOUR-LAPTOP-IP:5000
```
on the phone.
Example:
```text
http://192.168.100.220:5000
```
This allows the phone to access the locally running dashboard over the local network.
---
25. Optional GSM SMS Configuration
For a compatible SIM-enabled GSM modem:
Windows example
```env
SMS_PORT=COM3
SMS_BAUD=115200
```
Then restart the Node.js server.
Check:
```text
GET /api/sms/status
```
The backend will report whether the serial SMS path is configured.
---
26. Optional Rescue Webhook
Set:
```env
RESCUE_WEBHOOK_URL=https://your-authorized-endpoint.example/api/rescue
```
The application can then send structured rescue requests to the authorized endpoint.
Do not use an endpoint unless you are authorized to send requests to it.
---
27. Environment Variables
Optional:
```env
PORT=5000

SMS_PORT=COM3
SMS_BAUD=115200

RESCUE_WEBHOOK_URL=https://your-authorized-endpoint.example/api/rescue
```
Never commit:
API keys
private tokens
passwords
SIM credentials
private webhook secrets
to GitHub.
---
28. GitHub Deployment
Initialize Git:
```bash
git init
```
Add files:
```bash
git add .
```
Commit:
```bash
git commit -m "Initial DISASTERX AI project"
```
Connect the GitHub repository:
```bash
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
```
Set main:
```bash
git branch -M main
```
Push:
```bash
git push -u origin main
```
---
29. Render Deployment
A `render.yaml` configuration is included.
Typical deployment:
```text
GitHub Repository
       |
       v
Render
       |
       v
Node.js + Express
       |
       v
DISASTERX AI Web Dashboard
```
Set required environment variables in Render if optional SMS/GSM or rescue integrations are used.
---
30. Data Integrity & Transparency
DISASTERX AI follows these principles:
Real observed data
When the interface shows a source event, it should identify the source.
No fabricated live events
The system does not create fake current earthquakes, floods or cyclones to make the dashboard appear active.
Simulation is labelled
LIVE DEMO and SPACE EYE scenarios are explicitly simulation/decision-support demonstrations.
Prediction is not certainty
The system does not claim that a specific disaster will definitely happen on a specific future date.
Satellite imagery is not automatically damage evidence
Imagery visualization and simulated after-states are kept distinct from verified post-disaster observations.
Emergency response is not fabricated
If no authorized rescue endpoint or GSM path is configured, the application does not claim that emergency services were contacted.
---
31. Security Considerations
Keep secrets in environment variables.
Do not expose API keys in frontend JavaScript.
Validate incoming API parameters.
Use HTTPS when deploying publicly.
Restrict rescue webhooks to authorized systems.
Do not expose private personal information in public repositories.
Apply rate limits and authentication before production deployment.
Treat public disaster APIs as external dependencies and handle outages gracefully.
---
32. Limitations
DISASTERX AI is a hackathon/academic decision-support prototype and has important limitations.
Public APIs can experience outages or rate limits.
Current disaster coverage depends on the connected providers.
Country filtering for some external event feeds is based on source metadata and aliases.
The current risk classifications are visualization/decision-support rules, not official government hazard ratings.
The simulation engine is not a validated scientific disaster forecasting model.
The digital twin is a demonstration representation rather than a structural engineering certification tool.
Actual SMS delivery requires a phone's cellular service, a SIM-enabled GSM modem, or an authorized SMS gateway.
Rescue actions require authorized operational integrations.
NASA FIRMS and other optional sources require their own access/credential arrangements.
Production use would require stronger authentication, logging, monitoring, data governance and validation.
---
33. Future Enhancements
Potential next-stage development:
NASA EONET integration.
NASA FIRMS active-fire integration.
IMD live weather/cyclone integration.
More national disaster-management APIs.
Multi-source event deduplication.
Advanced geospatial spatial joins.
Machine-learning risk models trained on historical disaster data.
Weather and hydrological forecasting.
Satellite change detection.
InSAR ground-deformation processing.
Building-level vulnerability models.
Real IoT MQTT integration.
Role-based access for authorities.
Authenticated emergency response integrations.
Automated PDF/CSV disaster reports.
Offline/PWA support.
Multi-language emergency guidance.
Production-grade notification services.
Historical disaster trend dashboards.
Explainable AI risk scoring.
---
34. Suggested Production Architecture
```text
                         DISASTERX AI
                              |
                  ┌───────────┴───────────┐
                  |                       |
             Web Dashboard           Mobile/PWA
                  |                       |
                  └───────────┬───────────┘
                              |
                         API Gateway
                              |
        ┌─────────────────────┼─────────────────────┐
        |                     |                     |
   Disaster APIs          Geo Services          IoT Layer
        |                     |                     |
 USGS / GDACS / NASA     Boundaries / Maps      MQTT / Sensors
        |                     |                     |
        └─────────────────────┼─────────────────────┘
                              |
                    Data Normalization Layer
                              |
                    Geospatial Processing
                              |
                     Risk / AI Engine
                              |
              ┌───────────────┼───────────────┐
              |               |               |
           Analytics       Predictions      Alerts
              |               |               |
              └───────────────┼───────────────┘
                              |
                    Emergency Response
                              |
                 SMS / GSM / Authorized APIs
```
---
35. Why DISASTERX AI Is Different
DISASTERX AI is not designed as a simple disaster-news website.
It combines:
```text
REAL DISASTER DATA
        +
GEOGRAPHIC INTELLIGENCE
        +
HISTORICAL ANALYSIS
        +
RISK / DECISION SUPPORT
        +
SATELLITE VISUALIZATION
        +
IoT INFRASTRUCTURE MONITORING
        +
DIGITAL TWIN SIMULATION
        +
EMERGENCY COMMUNICATION
```
The goal is to move from:
> **“A disaster happened.”**
to:
> **“Where is it, what is happening, what does the historical context show, what infrastructure may be vulnerable under the scenario, and what response should be considered?”**
---
36. Hackathon Demo Flow
Recommended presentation flow:
Step 1 — MAP
Select:
```text
Country → Region → Hazard
```
Show real disaster events and administrative boundaries.
Step 2 — Event Intelligence
Click an event and show:
Source
Location
Date
Severity
Alert level
Original record
Step 3 — ANALYTICS
Show historical/current statistics calculated from source records.
Step 4 — PREDICTIONS
Explain that the output is decision support rather than guaranteed forecasting.
Step 5 — ALERTS
Open an event and demonstrate structured rescue-request preparation.
Step 6 — SPACE EYE
Show satellite imagery, infrastructure focus and the digital-twin scenario.
Step 7 — LIVE DEMO
Demonstrate:
```text
IoT sensor change
      ↓
Risk score
      ↓
Digital twin scenario
      ↓
Recommended action
      ↓
SMS workflow


37. Responsible Use Disclaimer
DISASTERX AI is a decision-support and demonstration platform. It is not a replacement for official emergency-management authorities, government warnings, scientific forecasting systems, structural engineers, or emergency services.
For real emergencies, users should follow instructions from the relevant government disaster-management and emergency authorities.

38. Project Summary
DISASTERX AI provides a unified interface for:
Real-world disaster data
Interactive maps
Administrative boundaries
Historical disaster intelligence
Current/recent event monitoring
Source alert visualization
Analytics
Decision-support scenarios
Satellite imagery
Infrastructure digital twins
IoT sensor simulations
Emergency SMS workflows
Rescue-response integrations
Core technology
HTML5 + CSS3 + JavaScript + Bootstrap + MapLibre + Node.js + Express + REST APIs + GeoJSON + USGS + GDACS + geoBoundaries + OpenStreetMap + Esri World Imagery

Data Source References
USGS Earthquake Hazards Program: https://earthquake.usgs.gov/
GDACS API: https://www.gdacs.org/gdacsapi/swagger/index.html
NASA EONET: https://eonet.gsfc.nasa.gov/docs/v3
NASA FIRMS: https://firms.modaps.eosdis.nasa.gov/
geoBoundaries: https://www.geoboundaries.org/api.html
OpenStreetMap: https://www.openstreetmap.org/
Nominatim: https://nominatim.openstreetmap.org/
Esri World Imagery: https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer
---
License
See `LICENSE.txt` for the project's current license information.
---
DISASTERX AI — From Disaster Data to Intelligent Decisions.
