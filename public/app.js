const $ = (s) => document.querySelector(s);
const app = $("#app");


const COUNTRY_VIEWS = {
  "India": {center:[78.96,22.50],zoom:4.25},
  "China": {center:[104.20,35.80],zoom:4.15},
  "Philippines": {center:[122.20,12.20],zoom:5.10},
  "Nepal": {center:[84.10,28.30],zoom:7.0},
  "Bangladesh": {center:[90.40,23.70],zoom:6.2},
  "Japan": {center:[138.00,36.20],zoom:5.4},
  "Indonesia": {center:[117.00,-2.20],zoom:4.6},
  "United States": {center:[-98.60,39.80],zoom:3.7},
  "Australia": {center:[134.00,-25.00],zoom:4.0},
  "Canada": {center:[-106.30,57.00],zoom:3.5},
  "Brazil": {center:[-52.50,-10.50],zoom:4.0},
  "Pakistan": {center:[69.30,30.40],zoom:5.2},
  "Sri Lanka": {center:[80.70,7.70],zoom:7.0}
};
const HAZARD_ICONS = {
  "Earthquake":"◈","Volcanic Eruption":"🌋","Tsunami":"🌊",
  "Tropical Storm / Cyclone":"🌀","Flood":"🌊","Drought":"☀",
  "Heatwave":"♨","Landslide":"⛰","Wildfire":"🔥",
  "Tornado":"🌀","Hailstorm":"◆","Lightning":"ϟ","All Disasters":"●"
};

const countries = [
  ["India","🇮🇳"],["China","🇨🇳"],["Philippines","🇵🇭"],
  ["Nepal","🇳🇵"],["Bangladesh","🇧🇩"],["Japan","🇯🇵"],
  ["Indonesia","🇮🇩"],["United States","🇺🇸"],["Australia","🇦🇺"],
  ["Canada","🇨🇦"],["Brazil","🇧🇷"],["Pakistan","🇵🇰"],["Sri Lanka","🇱🇰"]
];

const hazards = [
  ["All Disasters","◉"],["Earthquake","⌁"],["Volcanic Eruption","♨"],
  ["Tsunami","≈"],["Tropical Storm / Cyclone","↝"],["Flood","≋"],
  ["Drought","◌"],["Heatwave","⌁"],["Landslide","⌁"],
  ["Wildfire","♨"],["Tornado","◉"],["Hailstorm","•"],["Lightning","ϟ"]
];

let state = {
  country:"India",
  hazard:"All Disasters",
  nav:"MAP",
  satellite:false,
  boundaries:true,
  districts:false,
  risk:true,
  markers:true,
  events:[],
  history:[],
  selected:null,
  region:null,
  regionHistory:[],
  regionLoading:false,
  map:null,
  markerObjs:[],
  labelObjs:[],
  mapReady:false,
  adm1:null,
  adm2:null,
  rescueRequests: JSON.parse(localStorage.getItem("DISASTERX AI-rescue-requests")||"[]"),
  demo: {
    day: 1,
    running: false,
    scenario: "normal",
    vibration: 0.12,
    tilt: 0.04,
    temperature: 28.5,
    structural: 98,
    occupancy: 420,
    confidence: 72,
    smsOutbox: JSON.parse(localStorage.getItem("DISASTERX AI-sms-outbox")||"[]")
  }
};

function esc(v=""){
  return String(v).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
}
function fmt(v){ return v ? new Date(v).toLocaleString() : "Unavailable"; }
function sevClass(s){ return String(s||"UNKNOWN").toLowerCase(); }
function flag(c){ return (countries.find(x=>x[0]===c)||["","🌍"])[1]; }

const API_BASE = "";
async function api(path, options={}){
  const res = await fetch(API_BASE + path, {
    ...options,
    headers: {"Accept":"application/json", ...(options.headers||{})}
  });
  let data = {};
  try { data = await res.json(); } catch(e) {}
  if(!res.ok) throw new Error(data.message || data.error || `${res.status} ${res.statusText}`);
  return data;
}
function resizeMap(){
  if(!state.map) return;
  try{
    state.map.resize();
  }catch(e){
    console.warn("Map resize:", e);
  }
}
function toggleLayer(key){
  if(!(key in state)) return;
  state[key]=!state[key];
  renderSidebar();
  if(state.mapReady) updateLayerVisibility();
  if(key==="districts" && state.mapReady) drawAdminLabels();
}

function shell(){
  app.innerHTML = `
  <div class="app">
    <header class="topbar">
      <div class="brand">
        <div class="brand-mark">🌿</div>
        <div>
          <div class="brand-name">DISASTERX AI</div>
          <div class="brand-sub">NATURAL DISASTER INTELLIGENCE</div>
          <div class="brand-tag">PREPARE TODAY • SAFER TOMORROW</div>
        </div>
      </div>
      <nav id="nav"></nav>
      <div class="top-actions">
        <div class="top-country"><span>${flag(state.country)}</span><b>${esc(state.country)}</b><select aria-label="Country" onchange="selectCountry(this.value)">${countries.map(([c,f])=>`<option value="${esc(c)}" ${state.country===c?"selected":""}>${f} ${esc(c)}</option>`).join("")}</select></div>
        <div class="live"><span></span>LIVE DATA<br><small id="last">Connecting…</small></div>
        <button class="emergency-mode" onclick="activateEmergencyMode()">🚨 EMERGENCY MODE</button>
      </div>
    </header>
    <main class="workspace">
      <aside class="sidebar" id="sidebar"></aside>
      <section class="content" id="content"></section>
    </main>
    <div class="sources-strip">
      <span>DATA: USGS • GDACS • geoBoundaries • OpenStreetMap • Esri World Imagery • NASA EONET-compatible architecture</span>
      <span>OBSERVED SOURCE DATA • NO FABRICATED CURRENT EVENTS</span>
    </div>
  </div>`;
  renderNav();
  renderSidebar();
  renderContent();
}
function renderNav(){
  const items = [
    ["MAP","⌖"],["ANALYTICS","▥"],["PREDICTIONS","◈"],["ALERTS","!"],["REPORTS","▤"],["SPACE EYE","◉"],["LIVE DEMO","◆"]
  ];
  $("#nav").innerHTML = items.map(([n,i]) =>
    `<button class="${state.nav===n?"active":""}" onclick="setNav('${n}')">${i} ${n}</button>`
  ).join("");
}
function setNav(n){
  if(state.nav==="MAP" && n!=="MAP" && state.map){
    try{ state.map.remove(); }catch(e){}
    state.map=null;
    state.mapReady=false;
    state.markerObjs=[];
    clearAdminLabels();
  }
  state.nav=n;
  renderNav();
  renderContent();
  if(n==="MAP") setTimeout(()=>{ resizeMap(); if(state.mapReady) drawEvents(); },50);
}

function renderSidebar(){
  $("#sidebar").innerHTML = `
    <section>
      <h3>SELECT COUNTRY</h3>
      ${countries.map(([c,f])=>`<button class="country ${state.country===c?"active":""}" onclick="selectCountry('${esc(c)}')"><span>${f}</span>${esc(c)}<b>◉</b></button>`).join("")}
    </section>
    <section class="hazard-list">
      <h3>SELECT DISASTER TYPE</h3>
      ${hazards.map(([h,i])=>`<button class="hazard ${state.hazard===h?"active":""}" onclick="selectHazard('${esc(h)}')"><span>${i}</span>${esc(h)}<b>○</b></button>`).join("")}
    </section>
    <section>
      <h3>MAP LAYERS</h3>
      ${[
        ["Satellite imagery","satellite"],
        ["Political boundaries","boundaries"],
        ["District boundaries","districts"],
        ["Observed risk colors","risk"],
        ["Live disaster markers","markers"]
      ].map(([n,k])=>`<button class="layer" onclick="toggleLayer('${k}')"><i class="${state[k]?"on":""}">${state[k]?"✓":""}</i>${n}</button>`).join("")}
    </section>
    <section class="sources">
      <h3>OFFICIAL / PUBLIC SOURCES</h3>
      <div><strong>USGS</strong> — earthquake catalog & real-time feeds</div>
      <div><strong>GDACS</strong> — global disaster alerts & geometry</div>
      <div><strong>geoBoundaries</strong> — administrative boundaries</div>
      <div><strong>OpenStreetMap</strong> — geographic basemap</div>
      <div><strong>Esri</strong> — World Imagery satellite basemap</div>
      <div style="margin-top:7px">National authority connectors can be configured where API/feed access is provided (e.g. IMD/PAGASA/NDRRMC).</div>
    </section>`;
}
async function selectCountry(c){
  state.country=c; state.region=null; state.selected=null; state.regionHistory=[];
  renderSidebar();
  if(state.mapReady && state.map){
    const v=COUNTRY_VIEWS[c] || {center:[78.96,22.5],zoom:4};
    state.map.flyTo({center:v.center,zoom:v.zoom,duration:900,essential:true});
  }else if(state.mapFallback){ showMapFallback(); }
  await loadEvents();
  if(state.mapReady) await loadBoundaries();
}
async function selectHazard(h){
  state.hazard=h; state.selected=null; state.regionHistory=[];
  renderSidebar();
  await loadEvents();
  if(state.region) await loadRegionHistory(state.region);
}

async function loadEvents(){
  showMapNotice("Loading live source data…");
  try{
    const d=await api(`/api/disasters?country=${encodeURIComponent(state.country)}&type=${encodeURIComponent(state.hazard)}&days=30`);
    state.events=d.events||[];
    $("#last").textContent=new Date(d.generatedAt).toLocaleString();
    if(d.warnings?.length) console.warn(d.warnings.join(" | "));
    if(state.nav==="MAP"){
      updateMapHeader();
      if(state.mapReady) drawEvents();
    }else{
      renderContent();
    }
  }catch(e){
    state.events=[];
    showMapNotice("Live sources unavailable. Check internet connection.");
    console.error(e);
    if(state.nav!=="MAP") renderContent();
    else {
      updateMapHeader();
      if(state.mapReady) drawEvents();
    }
  }
}

async function loadBoundaries(){
  if(!state.mapReady) return;
  try{
    const a1=await api(`/api/boundaries?country=${encodeURIComponent(state.country)}&adm=ADM1`);
    state.adm1=a1.geojson;
    const a2=await api(`/api/boundaries?country=${encodeURIComponent(state.country)}&adm=ADM2`);
    state.adm2=a2.geojson;
    setSourceData("adm1", addRiskProperties(state.adm1));
    setSourceData("adm2", state.adm2);
    if(state.mapReady) drawAdminLabels();
  }catch(e){ console.warn("Boundary load:",e.message); }
}

function addRiskProperties(geo){
  if(!geo?.features) return geo;
  const features=geo.features.map(f=>({
    ...f,
    properties:{...(f.properties||{}),_risk:riskForFeature(f)}
  }));
  return {...geo,features};
}
function riskForFeature(f){
  const events=state.events.filter(e=>Number.isFinite(e.longitude)&&Number.isFinite(e.latitude)&&pointInGeometry([e.longitude,e.latitude],f.geometry));
  if(events.some(e=>e.severity==="HIGH")) return "HIGH";
  if(events.some(e=>e.severity==="MODERATE")) return "MODERATE";
  if(events.some(e=>e.severity==="LOW")) return "LOW";
  return "CLEAR";
}
function flattenCoords(c,out=[]){
  if(!Array.isArray(c)) return out;
  if(typeof c[0]==="number"){out.push(c);return out;}
  c.forEach(x=>flattenCoords(x,out)); return out;
}
function pointInRing(p,r){
  let inside=false;
  for(let i=0,j=r.length-1;i<r.length;j=i++){
    const xi=r[i][0],yi=r[i][1],xj=r[j][0],yj=r[j][1];
    const hit=((yi>p[1])!==(yj>p[1]))&&(p[0]<((xj-xi)*(p[1]-yi))/((yj-yi)||1e-12)+xi);
    if(hit) inside=!inside;
  }
  return inside;
}
function pointInGeometry(p,g){
  if(!g) return false;
  if(g.type==="Polygon"){
    const rings=g.coordinates||[]; return !!rings[0]&&pointInRing(p,rings[0])&&!rings.slice(1).some(r=>pointInRing(p,r));
  }
  if(g.type==="MultiPolygon") return (g.coordinates||[]).some(x=>pointInGeometry(p,{type:"Polygon",coordinates:x}));
  return false;
}


function featureName(f){
  const p=f?.properties||{};
  return p.shapeName || p.shapeNameEn || p.name || p.NAME_1 || p.NAME_2 || p.NAME || "Selected region";
}
function featureCode(f){
  const p=f?.properties||{};
  return p.shapeISO || p.shapeID || p.gid || p.GID_1 || p.GID_2 || "";
}
function featureCenter(f){
  const pts=flattenCoords(f?.geometry?.coordinates||[]);
  if(!pts.length) return null;
  let minx=Infinity,miny=Infinity,maxx=-Infinity,maxy=-Infinity;
  pts.forEach(p=>{minx=Math.min(minx,p[0]);maxx=Math.max(maxx,p[0]);miny=Math.min(miny,p[1]);maxy=Math.max(maxy,p[1]);});
  return [(minx+maxx)/2,(miny+maxy)/2];
}
function fitFeature(f){
  const pts=flattenCoords(f?.geometry?.coordinates||[]);
  if(pts.length<2 || !state.map) return;
  let minx=Infinity,miny=Infinity,maxx=-Infinity,maxy=-Infinity;
  pts.forEach(p=>{minx=Math.min(minx,p[0]);maxx=Math.max(maxx,p[0]);miny=Math.min(miny,p[1]);maxy=Math.max(maxy,p[1]);});
  state.map.fitBounds([[minx,miny],[maxx,maxy]],{padding:90,duration:900,maxZoom:9});
}
function eventDate(e){
  return e?.time ? new Date(e.time).toLocaleDateString() : "Date unavailable";
}
async function loadRegionHistory(feature){
  state.region=feature;
  state.regionHistory=[];
  state.regionLoading=true;
  renderMapOverlays();
  fitFeature(feature);
  try{
    const name=featureName(feature);
    const d=await api(`/api/region/history?country=${encodeURIComponent(state.country)}&region=${encodeURIComponent(name)}&type=${encodeURIComponent(state.hazard)}&days=1825`);
    const local=(d.events||[]).filter(e =>
      Number.isFinite(e.longitude)&&Number.isFinite(e.latitude)&&
      pointInGeometry([e.longitude,e.latitude],feature.geometry)
    );
    state.regionHistory=local.slice(0,60);
  }catch(e){
    console.warn("Region history:",e.message);
    state.regionHistory=[];
  }finally{
    state.regionLoading=false;
    renderMapOverlays();
  }
}

function clearAdminLabels(){
  state.labelObjs.forEach(m=>{try{m.remove()}catch(e){}});
  state.labelObjs=[];
}
function drawAdminLabels(){
  if(!state.mapReady || !state.maplibreLabels) return;
  clearAdminLabels();
  const add=(geo, cls, minZoom)=>{
    if(!geo?.features) return;
    geo.features.forEach(f=>{
      const center=featureCenter(f);
      const name=featureName(f);
      if(!center || !name) return;
      const el=document.createElement("div");
      el.className=cls;
      el.textContent=name;
      el.dataset.minZoom=String(minZoom);
      const marker=new maplibregl.Marker({element:el,anchor:"center"}).setLngLat(center).addTo(state.map);
      state.labelObjs.push(marker);
    });
  };
  add(state.adm1,"admin-label adm1-label-html",3);
  if(state.districts) add(state.adm2,"admin-label adm2-label-html",6);
  updateAdminLabelVisibility();
}
function updateAdminLabelVisibility(){
  if(!state.map) return;
  const z=state.map.getZoom();
  state.labelObjs.forEach(m=>{
    const el=m.getElement();
    const min=Number(el.dataset.minZoom||0);
    const isDistrict=el.classList.contains("adm2-label-html");
    el.style.display=(z>=min && (!isDistrict || state.districts) && state.boundaries)?"block":"none";
  });
}
function showMapFallback(){
  const host=document.querySelector("#map");
  if(!host) return;
  const v=COUNTRY_VIEWS[state.country] || COUNTRY_VIEWS.India;
  const lon=v.center[0],lat=v.center[1];
  const d=state.country==="India"?12:state.country==="China"?22:12;
  host.innerHTML=`<iframe title="OpenStreetMap" class="map-fallback-frame" src="https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(lon-d)},${encodeURIComponent(lat-d/1.4)},${encodeURIComponent(lon+d)},${encodeURIComponent(lat+d/1.4)}&layer=mapnik" loading="eager"></iframe>`;
  state.mapFallback=true;
}
function initMap(){
  if(state.map) return;
  if(typeof maplibregl === "undefined"){
    showMapNotice("Map library could not be loaded. Check your internet connection and refresh.");
    return;
  }
  const view=COUNTRY_VIEWS[state.country] || {center:[78.96,22.5],zoom:4.2};
  state.map=new maplibregl.Map({
    container:"map",
    style:{
      version:8,
      sources:{
        osm:{type:"raster",tiles:["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],tileSize:256,attribution:"© OpenStreetMap contributors"},
        esri:{type:"raster",tiles:["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],tileSize:256,maxzoom:19,attribution:"Esri World Imagery"},
        adm1:{type:"geojson",data:{type:"FeatureCollection",features:[]}},
        adm2:{type:"geojson",data:{type:"FeatureCollection",features:[]}},
        eventGeo:{type:"geojson",data:{type:"FeatureCollection",features:[]}}
      },
      layers:[
        {id:"osm",type:"raster",source:"osm"},
        {id:"esri",type:"raster",source:"esri",layout:{visibility:"none"}},
        {id:"adm1-fill",type:"fill",source:"adm1",paint:{
          "fill-color":["match",["get","_risk"],"HIGH","#ff334f","MODERATE","#ff9d22","LOW","#f0cf39","CLEAR","#19c77a","#263e4b"],
          "fill-opacity":0.14
        }},
        {id:"adm1-line",type:"line",source:"adm1",paint:{"line-color":"#69e7ff","line-width":1.2,"line-opacity":.9}},
        {id:"adm2-line",type:"line",source:"adm2",minzoom:5.5,paint:{"line-color":"#5faabd","line-width":.55,"line-opacity":.55}},

        {id:"event-fill",type:"fill",source:"eventGeo",paint:{"fill-color":["get","color"],"fill-opacity":.2}},
        {id:"event-line",type:"line",source:"eventGeo",paint:{"line-color":["get","color"],"line-width":2.1,"line-opacity":.85}}
      ]
    },
    center:view.center,zoom:view.zoom,
    attributionControl:true
  });
  state.map.addControl(new maplibregl.NavigationControl({showCompass:true}),"bottom-right");
  state.map.on("load",async()=>{
    state.mapReady=true;
    state.maplibreLabels=true;
    try{state.map.resize();}catch(e){}
    await loadBoundaries();
    drawEvents();
    drawAdminLabels();
    renderMapOverlays();
  });
  state.map.on("zoomend",()=>updateAdminLabelVisibility());
  const mapFallbackTimer=setTimeout(()=>{
    if(!state.mapReady && state.map){
      try{state.map.remove()}catch(e){}
      state.map=null;
      state.mapReady=false;
      clearAdminLabels();
      showMapNotice("MapLibre did not finish loading. Showing OpenStreetMap fallback.");
      showMapFallback();
    }
  },10000);
  state.map.on("load",()=>clearTimeout(mapFallbackTimer));
  state.map.on("error",e=>{
    console.warn("MapLibre:",e?.error||e);
    if(!state.mapReady) showMapNotice("Map source error. Check internet access.");
  });
  state.map.on("click","adm1-fill",e=>{
    const f=e.features?.[0]; if(!f)return;
    loadRegionHistory(f);
  });
  state.map.on("click","adm2-line",e=>{
    if(!state.districts)return;
    const f=e.features?.[0]; if(f) loadRegionHistory(f);
  });
  state.map.on("click","event-fill",e=>{
    const id=e.features?.[0]?.properties?.eventId;
    const ev=state.events.find(x=>x.id===id);
    if(ev) selectEvent(ev);
  });
}

function setSourceData(id,data){
  const s=state.map?.getSource(id);
  if(s) s.setData(data);
}
function fitCountry(){
  const bounds={
    India:[[67,6],[98,37]],
    China:[[73,17],[135,54]],
    Philippines:[[116,4],[127,22]],
    Nepal:[[80,26],[89,31]],
    Bangladesh:[[87,20],[93,27]],
    Japan:[[122,24],[146,46]],
    Indonesia:[[94,-11],[142,7]],
    "United States":[[-126,24],[-66,50]],
    Australia:[[112,-44],[154,-10]],
    Canada:[[-141,42],[-52,84]],
    Brazil:[[-74,-34],[-34,6]],
    Pakistan:[[60,23],[78,38]],
    "Sri Lanka":[[79,5],[82,10]]
  }[state.country] || [[-180,-60],[180,75]];
  state.map.fitBounds(bounds,{padding:40,duration:800,maxZoom:7});
}
function updateLayerVisibility(){
  if(!state.map)return;
  const v=(id,on)=>state.map.getLayer(id)&&state.map.setLayoutProperty(id,"visibility",on?"visible":"none");
  v("osm",!state.satellite); v("esri",state.satellite);
  v("adm1-line",state.boundaries); v("adm1-fill",state.boundaries&&state.risk);
  v("adm2-line",state.boundaries&&state.districts);
  updateAdminLabelVisibility();
  if(!state.markers){state.markerObjs.forEach(m=>m.remove());}
  else drawEvents();
}

function makeCircle(lon,lat,km){
  const pts=[];
  for(let i=0;i<=64;i++){
    const a=i*Math.PI*2/64;
    pts.push([lon+(km/111)*Math.cos(a),lat+(km/111)*Math.sin(a)]);
  }
  return {type:"Feature",properties:{},geometry:{type:"Polygon",coordinates:[pts]}};
}

function drawEvents(){
  if(!state.mapReady)return;
  state.markerObjs.forEach(m=>m.remove()); state.markerObjs=[];
  const geo=[];
  if(state.markers){
    state.events.slice(0,300).forEach(e=>{
      if(!Number.isFinite(e.longitude)||!Number.isFinite(e.latitude))return;
      const el=document.createElement("div");
      const alertClass=e.alertLevel?String(e.alertLevel).toLowerCase():sevClass(e.severity);
      el.className=`event-marker ${alertClass}`;
      el.innerHTML=`<span>${HAZARD_ICONS[e.type]||"●"}</span>`;
      el.title=`${e.type} • ${e.title}`;
      el.onclick=()=>selectEvent(e);
      const m=new maplibregl.Marker({element:el}).setLngLat([e.longitude,e.latitude]).addTo(state.map);
      state.markerObjs.push(m);
      if(e.type==="Earthquake" && Number.isFinite(e.magnitude) && e.magnitude>=4){
        const radius=Math.min(120,Math.max(8,e.magnitude*4));
        const c=makeCircle(e.longitude,e.latitude,radius);
        c.properties={eventId:e.id,color:colorForEvent(e)};
        geo.push(c);
      }
    });
  }
  setSourceData("eventGeo",{type:"FeatureCollection",features:geo});
  if(state.adm1) setSourceData("adm1",addRiskProperties(state.adm1));
  updateLayerVisibilityNoDraw();
}
function updateLayerVisibilityNoDraw(){
  if(!state.map)return;
  const v=(id,on)=>state.map.getLayer(id)&&state.map.setLayoutProperty(id,"visibility",on?"visible":"none");
  v("osm",!state.satellite); v("esri",state.satellite);
  v("adm1-line",state.boundaries); v("adm1-fill",state.boundaries&&state.risk); v("adm2-line",state.boundaries&&state.districts);
  updateAdminLabelVisibility();
}
async function selectEvent(e){
  state.selected=e;
  renderMapOverlays();
  if(state.map) state.map.flyTo({center:[e.longitude,e.latitude],zoom:Math.max(7,state.map.getZoom()),duration:800});
  if(e.source==="GDACS"&&e.eventId&&e.episodeId){
    try{
      const d=await api(`/api/gdacs/geometry?eventtype=${encodeURIComponent(e.eventTypeCode||"")}&eventid=${encodeURIComponent(e.eventId)}&episodeid=${encodeURIComponent(e.episodeId)}`);
      const g=normalizeGeometryResponse(d.geometry,e);
      if(g) setSourceData("eventGeo",g);
    }catch(err){console.warn("GDACS geometry:",err.message)}
  }
}
function normalizeGeometryResponse(raw,e){
  let g=raw;
  if(raw?.geometry)g=raw.geometry;
  if(raw?.geojson)g=raw.geojson;
  if(raw?.data)g=raw.data;
  if(!g)return null;
  if(g.type==="FeatureCollection"){
    return {...g,features:g.features.map(f=>({...f,properties:{...(f.properties||{}),eventId:e.id,color:colorForEvent(e)}}))};
  }
  if(g.type==="Feature") return {type:"FeatureCollection",features:[{...g,properties:{...(g.properties||{}),eventId:e.id,color:colorForEvent(e)}}]};
  if(g.type==="Polygon"||g.type==="MultiPolygon") return {type:"FeatureCollection",features:[{type:"Feature",properties:{eventId:e.id,color:colorForEvent(e)},geometry:g}]};
  return null;
}
function colorFor(s){return s==="HIGH"?"#ff334f":s==="MODERATE"?"#ff9d22":s==="LOW"?"#f0cf39":s==="GREEN"?"#19c77a":"#24d7ff"}
function colorForEvent(e){return e?.alertLevel==="RED"?"#ff334f":e?.alertLevel==="ORANGE"?"#ff9d22":e?.alertLevel==="YELLOW"?"#f0cf39":e?.alertLevel==="GREEN"?"#19c77a":colorFor(e?.severity)}

function updateMapHeader(){
  const title=document.querySelector(".map-title");
  if(title) title.innerHTML=`<strong>NATURAL HAZARD MAP</strong><small>${flag(state.country)} ${esc(state.country)} • ${esc(state.hazard)} • ${state.events.length} source events</small>`;
  const stats=document.querySelector(".map-stats");
  if(stats){
    stats.innerHTML=`
      <div class="stat"><b class="high-t">${state.events.filter(e=>e.severity==="HIGH").length}</b><small>HIGH</small></div>
      <div class="stat"><b class="moderate-t">${state.events.filter(e=>e.severity==="MODERATE").length}</b><small>MODERATE</small></div>
      <div class="stat"><b class="low-t">${state.events.filter(e=>e.severity==="LOW").length}</b><small>LOW</small></div>
      <div class="stat"><b>${state.events.length}</b><small>EVENTS</small></div>`;
  }
}
function renderContent(){
  const c=$("#content");
  if(state.nav==="MAP"){
    c.innerHTML=`<div class="map-shell">
      <div id="map"></div>
      <div class="map-title"><strong>NATURAL HAZARD MAP</strong><small>${flag(state.country)} ${esc(state.country)} • ${esc(state.hazard)} • ${state.events.length} source events</small></div>
      <div class="search"><input id="searchInput" placeholder="Search state / province / district / region..." onkeydown="if(event.key==='Enter')searchLocation()"><button onclick="searchLocation()">GO</button></div>
      <div class="map-actions"><button onclick="fitCountry()">⌖ Country</button><button onclick="toggleLayer('satellite')">🛰 Satellite</button><button onclick="toggleLayer('boundaries')">▱ Layers</button><button onclick="toggleLayer('risk')">◌ Risk</button></div>
      <div class="legend"><strong>OBSERVED SOURCE ALERT LEVEL</strong><span class="dot high"></span>RED <span class="dot moderate"></span>ORANGE <span class="dot low"></span>YELLOW <span class="dot green"></span>GREEN</div>
      <div class="map-notice" id="mapNotice"></div>
      <div class="map-stats">
        <div class="stat"><b class="high-t">${state.events.filter(e=>e.severity==="HIGH").length}</b><small>HIGH</small></div>
        <div class="stat"><b class="moderate-t">${state.events.filter(e=>e.severity==="MODERATE").length}</b><small>MODERATE</small></div>
        <div class="stat"><b class="low-t">${state.events.filter(e=>e.severity==="LOW").length}</b><small>LOW</small></div>
        <div class="stat"><b>${state.events.length}</b><small>EVENTS</small></div>
      </div>
      <div id="mapOverlays"></div>
    </div>`;
    setTimeout(()=>{
      initMap();
      if(state.mapReady){state.map.resize();drawEvents();renderMapOverlays();}
    },0);
    return;
  }
  if(state.nav==="ANALYTICS"){ renderAnalytics(c); return; }
  if(state.nav==="PREDICTIONS"){ renderPredictions(c); return; }
  if(state.nav==="ALERTS"){ renderAlerts(c); return; }
  if(state.nav==="REPORTS"){ renderReports(c); return; }
  if(state.nav==="SPACE EYE"){ renderSpaceEye(c); return; }
  if(state.nav==="LIVE DEMO"){ renderLiveDemo(c); return; }
}
function renderMapOverlays(){
  const o=$("#mapOverlays"); if(!o)return;
  if(state.selected){
    const e=state.selected;
    o.innerHTML=`<div class="overlay-card event-card">
      <button class="close" onclick="clearSelected()">✕</button>
      <small>${esc(e.source)} • ${esc(e.type)}</small>
      <h2>${esc(e.title)}</h2>
      <span class="badge ${sevClass(e.severity)}">${esc(e.severity)}</span>
      <p>${esc(e.location)}</p>
      <div class="event-meta"><span>${e.magnitude!=null?"Magnitude "+esc(e.magnitude):"Source event"}</span><span>${fmt(e.time)}</span></div>
      ${e.depthKm!=null?`<p>Depth: ${e.depthKm} km</p>`:""}
      <a href="${esc(e.url||"#")}" target="_blank" rel="noopener">Open official source ↗</a>
    </div>`;
    return;
  }
  if(state.region){
    const f=state.region, name=featureName(f);
    const current=state.events.filter(e=>Number.isFinite(e.longitude)&&Number.isFinite(e.latitude)&&pointInGeometry([e.longitude,e.latitude],f.geometry));
    const hist=state.regionHistory||[];
    const high=hist.filter(e=>e.severity==="HIGH").length;
    const moderate=hist.filter(e=>e.severity==="MODERATE").length;
    const low=hist.filter(e=>e.severity==="LOW").length;
    const latest=hist.slice(0,8);
    o.innerHTML=`<div class="overlay-card region-card">
      <button class="close" onclick="clearRegion()">✕</button>
      <small>REGION DISASTER INTELLIGENCE</small>
      <h2>${flag(state.country)} ${esc(name)}</h2>
      <div class="region-sub">${esc(state.country)} • ${esc(state.hazard)} • Administrative report</div>
      <div class="region-grid">
        <div><b>${current.length}</b><small>CURRENT SOURCE EVENTS</small></div>
        <div><b>${hist.length}</b><small>HISTORICAL RECORDS</small></div>
        <div><b class="high-t">${high}</b><small>HIGH</small></div>
        <div><b class="moderate-t">${moderate}</b><small>MODERATE</small></div>
      </div>
      ${state.regionLoading?`<div class="history-loading">Loading real historical records from connected sources…</div>`:
      `<div class="history-section"><h3>WHAT HAPPENED?</h3>
        ${latest.length?latest.map((e,i)=>`<button class="history-row" onclick="selectHistoricalEvent(${i})">
          <span class="history-icon">${HAZARD_ICONS[e.type]||"●"}</span>
          <span><strong>${esc(e.title)}</strong><small>${eventDate(e)} • ${esc(e.source)} • ${esc(e.severity)}</small></span>
        </button>`).join(""):`<p class="muted">No matching historical source record was returned for this region and hazard.</p>`}
      </div>
      <div class="history-section"><h3>WHAT IS HAPPENING?</h3>
        <p>${current.length?`${current.length} matching source event(s) are currently plotted inside this region.`:"No matching current source event is currently plotted inside this region."}</p>
      </div>
      <div class="history-section"><h3>WHAT MAY HAPPEN?</h3>
        <p>DISASTERX AI can calculate a transparent risk signal from observed data, but it does not invent a future event. Official forecasts and warnings remain authoritative.</p>
      </div>
      <div class="source-note">Source-derived records only • Exact damage/impact is shown only when the source provides it.</div>`}
    </div>`;
  }else o.innerHTML="";
}
function selectHistoricalEvent(index){
  const e=(state.regionHistory||[])[index];
  if(!e)return;
  state.selected=e;
  renderMapOverlays();
  if(state.map && Number.isFinite(e.longitude)&&Number.isFinite(e.latitude)){
    state.map.flyTo({center:[e.longitude,e.latitude],zoom:Math.max(7,state.map.getZoom()),duration:800});
  }
}
function clearSelected(){state.selected=null;renderMapOverlays()}
function clearRegion(){state.region=null;renderMapOverlays()}

async function searchLocation(){
  const q=$("#searchInput")?.value?.trim(); if(!q)return;
  try{
    const d=await api(`/api/geocode?q=${encodeURIComponent(q)}`);
    const x=d.results?.[0]; if(x&&state.map)state.map.flyTo({center:[x.lon,x.lat],zoom:9,duration:900});
  }catch(e){alert(e.message)}
}

function renderAnalytics(c){
  const counts={};
  state.events.forEach(e=>counts[e.type]=(counts[e.type]||0)+1);
  const max=Math.max(1,...Object.values(counts));
  c.innerHTML=`<div class="page"><div class="page-head"><div><small>ANALYTICS</small><h1>${flag(state.country)} ${esc(state.country)} disaster intelligence</h1><p>Analytics are calculated from live records returned by connected public sources. They are not fabricated current statistics.</p></div><button class="primary" onclick="loadHistory()">Load 1-year earthquake history</button></div>
    <div class="metric-row">
      <div class="metric"><b>${state.events.length}</b><span>Observed events</span></div>
      <div class="metric"><b class="high-t">${state.events.filter(e=>e.severity==="HIGH").length}</b><span>High source alerts</span></div>
      <div class="metric"><b class="moderate-t">${state.events.filter(e=>e.severity==="MODERATE").length}</b><span>Moderate source alerts</span></div>
      <div class="metric"><b>${new Set(state.events.map(e=>e.source)).size}</b><span>Sources with records</span></div>
    </div>
    <div class="cards"><div class="card"><h3>LIVE EVENT DISTRIBUTION</h3>${Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div class="bar"><span>${esc(k)}</span><i><b style="width:${v/max*100}%"></b></i><strong>${v}</strong></div>`).join("")||`<p class="muted">No source events currently returned.</p>`}</div>
    <div class="card"><h3>HISTORICAL EARTHQUAKE RECORDS</h3><div id="historyBox">${state.history.length?state.history.slice(0,15).map(e=>`<div class="timeline"><div><b>${new Date(e.time).toLocaleDateString()}</b><span>${esc(e.title)}</span><small>${e.source}</small></div></div>`).join(""):`<p class="muted">Click “Load 1-year earthquake history” to query the USGS historical catalog for this country.</p>`}</div></div></div></div>`;
}
async function loadHistory(){
  try{
    const d=await api(`/api/earthquakes/history?country=${encodeURIComponent(state.country)}&days=365`);
    state.history=d.events||[]; renderContent();
  }catch(e){alert(e.message)}
}

function baselineRisk(){
  const high=state.events.filter(e=>e.severity==="HIGH").length;
  const mod=state.events.filter(e=>e.severity==="MODERATE").length;
  const low=state.events.filter(e=>e.severity==="LOW").length;
  const recent=state.events.filter(e=>Date.now()-new Date(e.time||0).getTime()<7*86400000).length;
  return Math.min(99,Math.round(Math.min(60,high*20)+Math.min(25,mod*5)+Math.min(15,low*2)+Math.min(10,recent)));
}
function renderPredictions(c){
  const score=baselineRisk();
  const level=score>=70?"HIGH":score>=35?"MODERATE":score>0?"LOW":"NO SIGNAL";
  c.innerHTML=`<div class="page"><div class="page-head"><div><small>PREDICTION / RISK ASSESSMENT</small><h1>${flag(state.country)} ${esc(state.country)} • ${esc(state.hazard)}</h1><p>This is a transparent baseline risk index derived from current observed source activity. It is not a forecast, guarantee, or official emergency warning.</p></div><div class="risk-box"><b>${score}</b><span>/ 100 • ${level}</span></div></div>
  <div class="reason-grid"><div class="card"><h3>WHY THIS SCORE</h3><ul><li>${state.events.filter(e=>e.severity==="HIGH").length} high-severity source records.</li><li>${state.events.filter(e=>e.severity==="MODERATE").length} moderate-severity source records.</li><li>${state.events.filter(e=>e.severity==="LOW").length} low-severity source records.</li><li>${state.events.filter(e=>Date.now()-new Date(e.time||0).getTime()<7*86400000).length} records are within the last 7 days.</li></ul></div>
  <div class="card"><h3>MODEL LIMITATION</h3><p>No synthetic rainfall, population, damage or future event data are inserted.</p><p>The score is a source-activity index and should be replaced/augmented by validated hazard-specific models for operational deployment.</p></div>
  <div class="card"><h3>DECISION SUPPORT</h3><p>Use the observed event, official source record and competent national authority warning together.</p><p><strong>FIELD VERIFICATION RECOMMENDED</strong> for high-severity observations.</p></div></div></div>`;
}

function rescueKey(e){ return `${e.id||e.title}|${e.time||""}`; }
function saveRescueRequests(){ localStorage.setItem("DISASTERX AI-rescue-requests",JSON.stringify(state.rescueRequests.slice(0,100))); }
function requestRescueById(id){
  const e=(state.events||[]).find(x=>x.id===id); if(!e)return;
  const key=rescueKey(e);
  const existing=state.rescueRequests.find(r=>r.key===key);
  if(existing){ alert(`Rescue request already prepared. Status: ${existing.status}`); return; }
  const req={
    id:`RR-${Date.now()}`, key, createdAt:new Date().toISOString(), status:"REQUEST PREPARED",
    disaster:{id:e.id,source:e.source,type:e.type,title:e.title,location:e.location,severity:e.severity,time:e.time,latitude:e.latitude,longitude:e.longitude,url:e.url||null},
    requestedSupport:["Search & rescue","Medical assistance","Evacuation support","Emergency supplies"],
    note:"Prepared from observed source data. No emergency dispatch is claimed until an authorized response channel acknowledges the request."
  };
  state.rescueRequests.unshift(req); saveRescueRequests(); renderAlerts($("#content"));
}
async function sendRescueRequestById(id){
  const e=(state.events||[]).find(x=>x.id===id); if(!e)return;
  const req={requestId:`RR-${Date.now()}`,createdAt:new Date().toISOString(),status:"RESPONSE REQUEST",disaster:{id:e.id,source:e.source,type:e.type,title:e.title,location:e.location,severity:e.severity,time:e.time,latitude:e.latitude,longitude:e.longitude,url:e.url||null},requestedSupport:["Search & rescue","Medical assistance","Evacuation support","Emergency supplies"]};
  try{
    const r=await fetch("/api/rescue/notify",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(req)});
    const d=await r.json();
    if(!r.ok){ alert(d.message||d.error||"Authorized rescue endpoint is not configured."); return; }
    state.rescueRequests.unshift({...req,status:"SENT TO AUTHORIZED ENDPOINT"}); saveRescueRequests(); renderAlerts($("#content"));
    alert("Rescue request sent to the configured authorized response endpoint.");
  }catch(err){ alert("Rescue endpoint unavailable. You can export the request instead."); }
}

function exportRescueRequestById(id){
  const e=(state.events||[]).find(x=>x.id===id); if(!e)return;
  const payload={requestId:`RR-${Date.now()}`,createdAt:new Date().toISOString(),sourceData:e,requestedSupport:["Search & rescue","Medical assistance","Evacuation support","Emergency supplies"],status:"REQUEST PREPARED",disclaimer:"DISASTERX AI is decision-support. This export does not constitute an emergency dispatch or confirmation of receipt."};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}); const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=`DISASTERX AI-Rescue-Request-${Date.now()}.json`; a.click(); URL.revokeObjectURL(a.href);
}
function renderAlerts(c){
  const es=[...state.events].sort((a,b)=>({HIGH:0,MODERATE:1,LOW:2,UNKNOWN:3}[a.severity]??3)-({HIGH:0,MODERATE:1,LOW:2,UNKNOWN:3}[b.severity]??3));
  const pending=state.rescueRequests.filter(r=>r.status!=="COMPLETED").length;
  c.innerHTML=`<div class="page"><div class="page-head"><div><small>LIVE ALERTS • RESPONSE COMMAND CENTER</small><h1>Alerts & Rescue Response</h1><p>${esc(state.country)} • ${esc(state.hazard)} • ${es.length} records returned by connected sources. Select an alert to inspect it on the map, then prepare a structured rescue request.</p></div><div class="response-badge">${pending} RESPONSE REQUEST${pending===1?"":"S"}</div></div>
  <div class="response-banner"><div><b>🚑 RESPONSE WORKFLOW</b><span>Detect → Verify source → Prepare rescue request → Authorized team acknowledges → Respond</span></div><small>No dispatch is claimed unless a real authorized integration confirms it.</small></div>
  <div class="alert-list">${es.slice(0,80).map((e,i)=>{const exists=state.rescueRequests.some(r=>r.key===rescueKey(e)); return `<div class="alert-row alert-row-action"><button class="alert-main" onclick='openAlert(${JSON.stringify(e).replace(/'/g,"&#39;")})'><span class="signal ${sevClass(e.severity)}"></span><div><b>${esc(e.title)}</b><small>${esc(e.source)} • ${esc(e.location)}</small></div><strong>${esc(e.severity)}</strong><time>${fmt(e.time)}</time><span>›</span></button><div class="rescue-actions"><button class="rescue-btn" onclick="requestRescueById(${JSON.stringify(e.id)})">🚑 ${exists?"REQUEST READY":"PREPARE REQUEST"}</button><button class="send-btn" onclick="sendRescueRequestById(${JSON.stringify(e.id)})">Send</button><button class="export-btn" onclick="exportRescueRequestById(${JSON.stringify(e.id)})">Export</button></div></div>`}).join("")||`<div class="card"><p class="muted">No matching source alerts are currently returned.</p></div>`}</div>
  <div class="card response-note-card"><h3>AUTHORIZED RESPONSE INTEGRATION</h3><p>For deployment, connect this workflow to an authorized emergency-management, fire/rescue, police, medical or disaster-response channel.  DISASTERX AI deliberately does not invent phone numbers, team identities or dispatch confirmations.</p><p><strong>Supported handoff:</strong> every request contains the real source event, location, coordinates when available, severity, timestamp, source URL and requested assistance categories.</p></div></div>`;
}
function openAlert(e){state.selected=e;state.nav="MAP";renderNav();renderContent();setTimeout(()=>{if(state.mapReady)selectEvent(e)},200)}

function renderReports(c){
  const score=baselineRisk();
  c.innerHTML=`<div class="page"><div class="page-head"><div><small>REPORTS</small><h1>Situation report</h1><p>Generated from the current source response. The report does not invent impact numbers.</p></div><button class="primary" onclick="downloadReport()">Download JSON</button></div>
  <div class="report"><h2>${flag(state.country)} ${esc(state.country)} • ${esc(state.hazard)}</h2><p>Generated: ${new Date().toLocaleString()}</p><div class="metric-row"><div class="metric"><b>${state.events.length}</b><span>Observed events</span></div><div class="metric"><b class="high-t">${state.events.filter(e=>e.severity==="HIGH").length}</b><span>High</span></div><div class="metric"><b class="moderate-t">${state.events.filter(e=>e.severity==="MODERATE").length}</b><span>Moderate</span></div><div class="metric"><b>${score}</b><span>Baseline risk index</span></div></div><h3>RESCUE DECISION SUPPORT</h3><p>Prioritize review and field verification for high-severity source observations. DISASTERX AI does not autonomously dispatch emergency teams. Official authority instructions remain controlling.</p></div></div>`;
}
function downloadReport(){
  const report={generatedAt:new Date().toISOString(),country:state.country,hazard:state.hazard,events:state.events,baselineRisk:baselineRisk(),disclaimer:"Decision-support system. Observed records are source-derived; baseline risk is not an official forecast or warning."};
  const blob=new Blob([JSON.stringify(report,null,2)],{type:"application/json"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`DISASTERX AI-${Date.now()}.json`;a.click();
}

let beforeData=null,afterData=null,spaceMeta={};
function renderSpaceEye(c){
  const d=state.demo, day=d.day, insight=demoDayInsight(day);
  c.innerHTML=`<div class="space-eye-page">
    <div class="space-eye-head">
      <div class="space-title"><div class="space-orb">◉</div><div><small>🛰 SPACE EYE • REMOTE SENSING + AI DIGITAL TWIN</small><h1>ISRO Launch Impact Analysis <em>(DEMO)</em></h1><p>Scenario analysis around GSSS College Auditorium, Mysore. GSLV-F12 is used only as a historical launch reference; the earthquake scenario is simulated.</p></div></div>
      <div class="launch-card"><div class="launch-icon">🚀</div><div><b>GSLV-F12 / NVS-01</b><small>Launch reference: 29 May 2023 • ISRO</small><span>Historical reference • not a current trigger</span></div></div>
      <div class="focus-card"><b>FOCUS AREA</b><strong>GSSS College Auditorium</strong><small>Mysore, Karnataka, India</small><span>Local demo radius: 20 km</span></div>
    </div>

    <div class="space-main-grid">
      <section class="space-card sat-card"><div class="space-card-head"><span>🛰 SATELLITE VIEW</span><b class="live-pill">● LIVE BASEMAP</b></div><div id="spaceMap" class="space-map"></div><div class="space-map-overlay"><span class="risk-key red">● HIGH</span><span class="risk-key orange">● MODERATE</span><span class="risk-key yellow">● LOW</span><span class="risk-key green">● SAFE</span></div><div class="sat-footer"><span>Satellite basemap: Esri World Imagery</span><span>GIS focus: Mysore • 20 km analysis ring</span></div></section>

      <section class="space-card twin-card"><div class="space-card-head"><span>◈ 3D AUDITORIUM DIGITAL TWIN</span><div><button class="mini-tab ${d.scenario!=="after"?"active":""}" onclick="demoSetScenario('normal')">CURRENT VIEW</button><button class="mini-tab ${d.scenario==="after"?"active":""}" onclick="demoSetScenario('after')">AFTER SCENARIO</button></div></div><div class="space-auditorium ${d.scenario==='after'?'after':''}"><div class="space-stage">STAGE</div><div class="space-seats">${Array.from({length:9},(_,r)=>`<div>${Array.from({length:18},(_,i)=>`<i class="${d.scenario==='after'&&((r*3+i)%11===0)?'danger':''}"></i>`).join('')}</div>`).join('')}</div><span class="space-exit ex1">EXIT</span><span class="space-exit ex2">EXIT</span><span class="space-sensor s1">◉ VIBRATION <b>${d.vibration.toFixed(2)} g</b></span><span class="space-sensor s2">◉ TILT <b>${d.tilt.toFixed(2)}°</b></span><span class="space-sensor s3">◉ STRUCTURE <b>${d.structural}%</b></span><span class="space-sensor s4">◉ TEMP <b>${d.temperature.toFixed(1)}°C</b></span></div><div class="twin-status"><span>Structure health <b>${d.structural}%</b></span><span>Occupancy <b>${d.occupancy}</b></span><span>Scenario <b>DAY ${day}/15</b></span></div></section>

      <section class="space-card why-card"><div class="space-card-head"><span>⌁ WHY THIS RISK? • AI ANALYSIS</span><b class="confidence">${d.confidence}%</b></div><div class="confidence-title">MODEL CONFIDENCE</div><div class="confidence-bars">${[1,2,3,4,5,6].map((x,i)=>`<i style="height:${20+i*8+(d.confidence%12)}%"></i>`).join('')}</div><ul class="why-list"><li>Historical seismic activity in the region</li><li>Recent regional source observations</li><li>IoT vibration / tilt signals (simulated)</li><li>Ground-deformation workflow (InSAR concept)</li><li>Geological / fault-line context</li><li>Infrastructure vulnerability assessment</li></ul><div class="model-chain"><b>HOW THE DEMO MODEL WORKS</b><span>Satellite → Sensors → Historical data → Feature extraction → Risk score → Actions</span></div></section>

      <section class="space-card activities-card"><div class="space-card-head"><span>◌ ACTIVITIES OBSERVED / DATA SUPPORT</span><b>TRACEABLE INPUTS</b></div><div class="activity-grid"><div class="activity"><div class="activity-icon industrial">🏭</div><b>Industrial activity</b><small>Context layer</small><strong>MONITORED</strong></div><div class="activity"><div class="activity-icon seismic">〽</div><b>Seismic signals</b><small>${d.vibration.toFixed(2)} g simulated</small><strong class="warn">${d.vibration>.35?'ELEVATED':'BASELINE'}</strong></div><div class="activity"><div class="activity-icon deform">⌁</div><b>Ground deformation</b><small>InSAR workflow</small><strong class="warn">DEMO MODEL</strong></div><div class="activity"><div class="activity-icon thermal">◉</div><b>Thermal activity</b><small>Remote-sensing concept</small><strong>NORMAL</strong></div></div><div class="source-chips"><span>USGS seismic catalog</span><span>Esri satellite basemap</span><span>ISRO launch reference</span><span>IoT sensor layer</span><span>Geological context</span><span>Historical records</span></div></section>

      <section class="space-card day-card"><div class="space-card-head"><span>⏱ 15-DAY RISK TRACKER</span><b>CLICK A DAY</b></div><div class="day-track">${[1,3,5,7,10,12,15].map(x=>`<button class="day-dot ${day>=x?'reached':''} ${day===x?'selected':''}" onclick="spaceJumpDay(${x})"><i></i><span>Day ${x}</span></button>`).join('')}</div><div class="day-detail ${insight.color}"><div><b>DAY ${day} • ${insight.title}</b><strong>${insight.risk}</strong></div><p>${insight.note}</p><div>${insight.actions.map(a=>`<span>✓ ${esc(a)}</span>`).join('')}</div></div></section>

      <section class="space-card sms-card"><div class="space-card-head"><span>📡 ADMINISTRATION ALERTS • SMS</span><b>${DEMO_ADMINS.length} NUMBERS</b></div><p>Real SMS using your phone's own SIM. Open this dashboard on the Android phone, tap a recipient, then press Send in Messages. No external SMS provider is used.</p>${DEMO_ADMINS.map((a,i)=>`<div class="space-recipient"><span>${i+1}</span><div><b>${esc(a.role)}</b><small>${esc(a.phone)}</small></div><strong>READY</strong></div>`).join('')}<div class="sms-button-row"><button class="space-send" onclick="demoSendSMS('8971799921')">📱 SMS SANIKA</button><button class="space-send" onclick="demoSendSMS('6363242461')">📱 SMS EMERGENCY</button></div><div class="sms-mini-preview"><b>SAMPLE DAY ${day} MESSAGE</b><pre>${esc(demoMessage())}</pre></div></section>

      <section class="space-card impact-map-card"><div class="space-card-head"><span>◎ PREDICTED IMPACT • NEIGHBOUR ZONES</span><b>MODELED</b></div><div class="impact-map-visual"><div class="impact-center">GSSS<br>COLLEGE</div><div class="impact-ring ring1"><span>Mysore • HIGH</span></div><div class="impact-ring ring2"><span>Srirangapatna • MODERATE</span></div><div class="impact-ring ring3"><span>Mandya • LOW</span></div><div class="impact-zone z1">North zone</div><div class="impact-zone z2">South zone</div></div><div class="neighbor-list"><span class="high">● Mysore — HIGH</span><span class="orange">● Srirangapatna — MODERATE</span><span class="yellow">● Mandya — LOW</span><span class="green">● Hunsur — MINIMAL</span></div></section>

      <section class="space-card actions-card"><div class="space-card-head"><span>⚡ ACTIONS REQUIRED</span><b>DECISION SUPPORT</b></div><div class="action-three"><div><b>🟢 BEFORE</b><span>Inspect structure</span><span>Clear exits</span><span>Secure heavy equipment</span><span>Brief staff</span></div><div><b>🟠 DURING</b><span>Follow official warning</span><span>Drop, cover, hold</span><span>Use marked routes</span><span>Avoid elevators</span></div><div><b>🔵 AFTER</b><span>Account for occupants</span><span>Check injuries</span><span>Inspect damage</span><span>Request authorized support</span></div></div><div class="disclaimer">⚠ All future impact visuals are simulated decision-support. They are not observed damage or a confirmed earthquake prediction.</div></section>
    </div>
  </div>`;
  setTimeout(initSpaceMap,30);
}
function initSpaceMap(){
  const host=document.getElementById('spaceMap');
  if(!host || typeof maplibregl==='undefined') return;
  if(host._spaceMap){try{host._spaceMap.remove()}catch(e){}}
  const m=new maplibregl.Map({container:host,style:{version:8,sources:{sat:{type:'raster',tiles:['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],tileSize:256},osm:{type:'raster',tiles:['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],tileSize:256},risk:{type:'geojson',data:{type:'FeatureCollection',features:[{type:'Feature',geometry:{type:'Point',coordinates:[76.6394,12.2958]},properties:{}}]}}},layers:[{id:'sat',type:'raster',source:'sat'},{id:'risk-glow',type:'circle',source:'risk',paint:{'circle-radius':55,'circle-color':'#ff334f','circle-opacity':.18,'circle-blur':.7}}]},center:[76.6394,12.2958],zoom:10.5,interactive:false});
  host._spaceMap=m;
  m.on('load',()=>{m.addControl(new maplibregl.NavigationControl({showCompass:false,showZoom:false}),'top-right'); try{m.resize()}catch(e){}});
}
function spaceJumpDay(day){ demoJump(day); }
window.spaceJumpDay=spaceJumpDay;

function spaceUpload(input,which){
  const f=input.files?.[0];if(!f)return;
  const r=new FileReader();r.onload=()=>{if(which==="before")beforeData=r.result;else afterData=r.result;spaceMeta[which]={name:f.name,size:f.size};if(beforeData&&afterData)compareImages(beforeData,afterData);renderContent()};r.readAsDataURL(f);
}
function compareImages(a,b){
  const A=new Image(),B=new Image();
  A.onload=()=>B.onload=()=>{
    const w=Math.min(A.width,B.width),h=Math.min(A.height,B.height),c=document.createElement("canvas");c.width=w;c.height=h;
    const x=c.getContext("2d");x.drawImage(A,0,0,w,h);const da=x.getImageData(0,0,w,h).data;x.clearRect(0,0,w,h);x.drawImage(B,0,0,w,h);const db=x.getImageData(0,0,w,h).data;
    let changed=0;for(let i=0;i<da.length;i+=4){const d=Math.abs(da[i]-db[i])+Math.abs(da[i+1]-db[i+1])+Math.abs(da[i+2]-db[i+2]);if(d>90)changed++}
    spaceMeta.diff=Number((changed/(w*h)*100).toFixed(2));renderContent();
  };A.src=a;B.src=b;
}
function clearSpace(){beforeData=null;afterData=null;spaceMeta={};renderContent()}

function showMapNotice(text){
  const el=document.querySelector("#mapNotice");
  if(el){el.textContent=text;el.style.display=text?"block":"none";}
}

shell();
loadEvents();

/* ============================================================
   DISASTERX AI LIVE DEMO — AI + IoT + 3D DIGITAL TWIN + SMS OUTBOX
   This module is a self-contained, browser-side simulation.
   It never claims that an earthquake can be scientifically
   predicted to occur on a specific date.
   ============================================================ */

const DEMO_ADMINS = [
  {id:"A1",role:"Sanika (You)",phone:"8971799921"},
  {id:"A2",role:"Family / Emergency",phone:"6363242461"}
];

function activateEmergencyMode(){
  document.body.classList.toggle("emergency-active");
  const active=document.body.classList.contains("emergency-active");
  alert(active ? "Emergency Mode ON — prioritise verified warnings, evacuation routes and official instructions." : "Emergency Mode OFF.");
}

function demoDayInsight(day){
  const map={
    1:{title:"Baseline observation",risk:"LOW / WATCH",color:"green",note:"Establish baseline from historical seismic context and connected sensor readings.",actions:["Inspect structure","Verify exits","Start sensor baseline"]},
    5:{title:"Signal accumulation",risk:"MODERATE / WATCH",color:"yellow",note:"Demo model highlights increasing simulated ground-motion indicators; verify every signal before action.",actions:["Recheck sensors","Brief staff","Secure loose equipment"]},
    10:{title:"Preparedness window",risk:"ELEVATED / PREPARE",color:"orange",note:"Decision-support scenario recommends readiness measures; this is not a scientific earthquake forecast.",actions:["Stage first aid","Confirm assembly points","Test communications"]},
    15:{title:"Peak scenario",risk:"HIGH / SIMULATION",color:"red",note:"Demonstration event window. Show predicted impacts, evacuation workflow and SMS escalation.",actions:["Evacuate if official warning","Account for occupants","Request authorized support"]}
  };
  return map[day]||map[1];
}

function demoPersist(){
  localStorage.setItem("DISASTERX AI-sms-outbox",JSON.stringify(state.demo.smsOutbox||[]));
}

function demoScore(){
  const d=state.demo;
  const sensor=(Math.min(1,d.vibration/0.75)*35)+(Math.min(1,d.tilt/0.25)*20)+(Math.max(0,(100-d.structural))/100*25);
  const regional=Math.min(20,Math.max(0,(state.events||[]).filter(e=>e.type==="Earthquake").length*2));
  return Math.max(15,Math.min(94,Math.round(28+sensor*.55+regional)));
}

function demoRiskLabel(score){
  if(score>=75)return ["HIGH","#ff334f"];
  if(score>=55)return ["ELEVATED","#ff9d22"];
  if(score>=35)return ["MODERATE","#f0cf39"];
  return ["LOW","#19c77a"];
}

function demoMessage(){
  const d=state.demo, score=demoScore(), risk=demoRiskLabel(score)[0], insight=demoDayInsight(d.day);
  return `DISASTERX AI ALERT — DAY ${d.day}/15
Location: GSSS College Auditorium, Mysore
Scenario: Earthquake preparedness simulation
Risk signal: ${risk} | Model confidence: ${d.confidence}%

Analysis: ${insight.note}

Actions required:
• ${insight.actions.join("\n• ")}

IMPORTANT: DEMONSTRATION ONLY. This is not a confirmed earthquake prediction. Follow official authority warnings.`;
}

function renderLiveDemo(c){
  const d=state.demo, score=demoScore(), risk=demoRiskLabel(score);
  const impact=d.scenario==="after";
  const stress=d.scenario==="stress";
  const outbox=d.smsOutbox||[];
  c.innerHTML=`<div class="live-demo-page">
    <div class="live-demo-head">
      <div>
        <small>LIVE DEMO • AI + IoT + DIGITAL TWIN + SMS</small>
        <h1>Auditorium Earthquake Response Scenario</h1>
        <p>End-to-end preparedness demonstration using a simulated 15-day risk scenario.</p>
      </div>
      <div class="simulation-badge"><b>⚠ SIMULATION MODE</b><span>Decision support only — not a real-time earthquake forecast.</span></div>
    </div>

    <div class="demo-grid">
      <section class="demo-twin card">
        <div class="demo-tabs">
          <button class="${d.scenario==="normal"?"active":""}" onclick="demoSetScenario('normal')">3D VIEW</button>
          <button class="${d.scenario==="stress"?"active":""}" onclick="demoSetScenario('stress')">STRESS SIMULATION</button>
          <button class="${d.scenario==="after"?"active":""}" onclick="demoSetScenario('after')">AFTER SCENARIO</button>
        </div>
        <div class="auditorium-wrap ${stress?"stress":""} ${impact?"after":""}">
          <div class="auditorium-3d">
            <div class="aud-wall wall-back"><div class="stage"><span>STAGE</span></div></div>
            <div class="aud-floor">
              ${Array.from({length:10},(_,r)=>`<div class="seat-row">${Array.from({length:14},(_,i)=>`<i class="${impact&&((r+i)%9===0)?"seat-risk":""}"></i>`).join("")}</div>`).join("")}
              <div class="aisle aisle-left"></div><div class="aisle aisle-right"></div>
            </div>
            <div class="aud-wall wall-left"></div><div class="aud-wall wall-right"></div>
            <div class="exit exit-a">EXIT</div><div class="exit exit-b">EXIT</div>
            <div class="sensor-chip vib ${d.vibration>.35?"warn":""}">● VIBRATION<br><b>${d.vibration.toFixed(2)} g</b><small>${d.vibration>.35?"ELEVATED":"NORMAL"}</small></div>
            <div class="sensor-chip tilt ${d.tilt>.15?"warn":""}">● TILT<br><b>${d.tilt.toFixed(2)}°</b><small>${d.tilt>.15?"ELEVATED":"NORMAL"}</small></div>
            <div class="sensor-chip structure ${d.structural<75?"warn":""}">● STRUCTURAL<br><b>${d.structural}%</b><small>${d.structural<75?"STRESS":"NORMAL"}</small></div>
            <div class="sensor-chip temp">● TEMPERATURE<br><b>${d.temperature.toFixed(1)} °C</b><small>NORMAL</small></div>
            <div class="sensor-chip button">● EMERGENCY BUTTON<br><b>ONLINE</b></div>
          </div>
        </div>
        <div class="twin-controls">
          <button class="primary" onclick="demoAdvance()">▶ Advance Scenario</button>
          <button onclick="demoRunStress()">⚡ Simulate Sensor Stress</button>
          <button onclick="demoSetScenario('after')">After Scenario</button>
          <button onclick="demoReset()">↺ Reset</button>
        </div>
      </section>

      <section class="demo-ai card">
        <div class="section-title"><span>🧠 AI PREDICTION & ANALYSIS</span><b>EARTHQUAKE</b></div>
        <div class="risk-box">
          <div><strong>⚠ ${risk[0]} RISK</strong><span>Forecast horizon<br><b>15 DAYS</b></span></div>
          <label>Model confidence <b>${d.confidence}%</b></label>
          <div class="progress"><i style="width:${d.confidence}%"></i></div>
          <small>Scenario day: <b>Day ${d.day}</b> / 15</small>
        </div>
        <div class="day-insight ${demoDayInsight(d.day).color}"><div><b>DAY ${d.day} • ${demoDayInsight(d.day).title}</b><span>${demoDayInsight(d.day).risk}</span></div><p>${esc(demoDayInsight(d.day).note)}</p><div class="mini-actions">${demoDayInsight(d.day).actions.map(x=>`<span>✓ ${esc(x)}</span>`).join("")}</div></div>
        <h3>KEY FACTORS</h3>
        <ul class="factor-list">
          <li>⌁ Historical seismic activity</li>
          <li>⌁ Regional recent seismic context</li>
          <li>◉ IoT auditorium sensor readings</li>
          <li>⌖ Regional hazard exposure</li>
          <li>⌂ Infrastructure vulnerability</li>
        </ul>
        <div class="recommendation"><h3>💡 AI RECOMMENDATION</h3>
          <ul><li>Conduct structural inspection</li><li>Keep emergency exits clear</li><li>Prepare evacuation routes</li><li>Secure heavy equipment</li><li>Test emergency communication</li><li>Prepare emergency supplies</li></ul>
        </div>
      </section>

      <section class="demo-sensors card">
        <div class="section-title"><span>📡 IoT SENSOR NETWORK</span><b>LOCAL DEMO</b></div>
        <div class="sensor-grid">
          ${[
            ["Vibration",d.vibration.toFixed(2)+" g",d.vibration>.35?"ELEVATED":"NORMAL"],
            ["Tilt",d.tilt.toFixed(2)+"°",d.tilt>.15?"ELEVATED":"NORMAL"],
            ["Structural integrity",d.structural+"%",d.structural<75?"STRESS":"NORMAL"],
            ["Temperature",d.temperature.toFixed(1)+" °C","NORMAL"],
            ["Occupancy",d.occupancy+" people","MONITORED"],
            ["Emergency button","ONLINE","READY"]
          ].map(x=>`<div class="sensor-row"><span class="sensor-dot"></span><div><b>${x[0]}</b><small>${x[2]}</small></div><strong>${x[1]}</strong></div>`).join("")}
        </div>
        <p class="demo-note">Sensor values are simulated for the demonstration. Connect approved hardware to replace them with real readings.</p>
      </section>

      <section class="demo-before-after">
        <div class="impact-card before">
          <h3>BEFORE • CURRENT</h3>
          <div class="land-scene normal-land"><span class="land-building">AUDITORIUM</span><span class="road"></span><span class="tree t1"></span><span class="tree t2"></span><span class="tree t3"></span></div>
          <div class="impact-status">✓ Stable condition<br><small>Normal surroundings • exits accessible</small></div>
        </div>
        <div class="impact-card after-card">
          <h3>PREDICTED AFTER • SIMULATION</h3>
          <div class="land-scene impact-land"><span class="land-building cracked">AUDITORIUM</span><span class="road blocked"></span><span class="crack c1"></span><span class="crack c2"></span><span class="impact-zone"></span></div>
          <div class="impact-status warning">⚠ Modelled impact<br><small>Potential damage/blocked access — not observed damage</small></div>
        </div>
      </section>

      <section class="demo-timeline card">
        <h3>TIMELINE • SIMULATION</h3>
        <div class="timeline-demo">
          ${[1,4,8,15].map((day,i)=>`<button class="${d.day>=day?"reached":""}" onclick="demoJump(${day})"><b>Day ${day}</b><span>${["Early signals","Increasing activity","Higher risk","Potential event"][i]}</span></button>`).join("")}
        </div>
      </section>

      <section class="demo-actions card">
        <h3>RESPONSE ACTIONS</h3>
        <div class="action-cols">
          <div><b>🟢 BEFORE</b><span>Inspect & prepare</span><span>Clear exits</span><span>Brief staff & students</span></div>
          <div><b>🟠 DURING</b><span>Evacuate immediately</span><span>Avoid elevators</span><span>Follow marked routes</span></div>
          <div><b>🔵 AFTER</b><span>Account for occupants</span><span>Check for injuries</span><span>Request emergency support</span></div>
        </div>
      </section>

      <section class="demo-sms card">
        <div class="section-title"><span>📱 ADMINISTRATION ALERTS • SMS</span><b>${outbox.length} QUEUED/SENT</b></div>
        <p class="sms-sub">Normal SMS workflow. The browser can prepare/queue messages offline; actual delivery requires cellular service or an authorized SMS/GSM gateway.</p>
        <div class="admin-list">
          ${DEMO_ADMINS.map(a=>{
            const sent=outbox.find(x=>x.id===a.id);
            return `<div class="admin-row"><span class="sms-num">${a.id.replace("A","")}</span><div><b>${a.role}</b><small>${a.phone}</small></div><strong class="${sent?"sent":""}">${sent?"✓ "+sent.status:"READY"}</strong></div>`;
          }).join("")}
        </div>
        <button class="primary wide" onclick="demoSendSMS()">📱 OPEN REAL SMS</button>
        <div class="sms-preview"><h4>SAMPLE SMS</h4><pre>${esc(demoMessage())}</pre></div>
      </section>
    </div>
  </div>`;
}

function demoSetScenario(mode){
  const d=state.demo;
  d.scenario=mode;
  if(mode==="normal"){d.vibration=.12;d.tilt=.04;d.structural=98;}
  if(mode==="stress"){d.vibration=.48;d.tilt=.18;d.structural=72;}
  if(mode==="after"){d.vibration=.62;d.tilt=.24;d.structural=58;}
  d.confidence=Math.min(88,72+Math.round(Math.max(0,d.vibration-.12)*18));
  renderContent();
}
function demoRunStress(){
  state.demo.scenario="stress";
  state.demo.vibration=Math.min(.75,state.demo.vibration+.18);
  state.demo.tilt=Math.min(.35,state.demo.tilt+.07);
  state.demo.structural=Math.max(45,state.demo.structural-11);
  state.demo.confidence=Math.min(91,state.demo.confidence+4);
  renderContent();
}
function demoAdvance(){
  const d=state.demo;
  d.day=Math.min(15,d.day+1);
  if(d.day>=4){d.vibration=Math.min(.30,.12+(d.day-3)*.025);d.tilt=Math.min(.12,.04+(d.day-3)*.009);d.structural=Math.max(82,98-(d.day-3)*1.2);}
  if(d.day>=8){d.vibration=Math.min(.45,d.vibration+.035);d.tilt=Math.min(.18,d.tilt+.012);d.structural=Math.max(70,d.structural-2.4);}
  if(d.day===15) d.scenario="stress";
  d.confidence=Math.min(86,72+Math.floor(d.day/3));
  renderContent();
}
function demoJump(day){
  const d=state.demo;d.day=day;
  if(day===1){d.scenario="normal";d.vibration=.12;d.tilt=.04;d.structural=98;}
  if(day===4){d.scenario="normal";d.vibration=.16;d.tilt=.05;d.structural=95;}
  if(day===8){d.scenario="stress";d.vibration=.30;d.tilt=.12;d.structural=86;}
  if(day===15){d.scenario="after";d.vibration=.62;d.tilt=.24;d.structural=58;}
  d.confidence=72+Math.floor(day/3);
  renderContent();
}
function demoReset(){
  state.demo.day=1;state.demo.scenario="normal";state.demo.vibration=.12;state.demo.tilt=.04;state.demo.structural=98;state.demo.confidence=72;
  renderContent();
}
function demoSendSMS(phone){
  const now = new Date().toISOString();
  const body = demoMessage();

  // Keep a local audit/outbox record inside the browser.
  state.demo.smsOutbox = DEMO_ADMINS.map(a => ({
    id:a.id,
    phone:a.phone,
    role:a.role,
    status:"SMS COMPOSER OPENED",
    createdAt:now,
    message:body
  }));
  demoPersist();
  renderContent();

  // Android/iOS SMS composer using the phone's own SIM.
  // The dashboard must be opened on the phone for this to use that phone's SIM.
  const target = phone || DEMO_ADMINS[0].phone;
  const smsURL = `sms:${target}?body=${encodeURIComponent(body)}`;

  try {
    window.location.href = smsURL;
  } catch (e) {
    alert("Open DISASTERX AI on the Android phone, then tap OPEN REAL SMS.");
  }
}

function openSingleSMS(phone){
  const body = demoMessage();
  const smsURL = `sms:${phone}?body=${encodeURIComponent(body)}`;
  window.location.href = smsURL;
}
window.openSingleSMS = openSingleSMS;

window.demoSetScenario=demoSetScenario;
window.demoRunStress=demoRunStress;
window.demoAdvance=demoAdvance;
window.demoJump=demoJump;
window.demoReset=demoReset;
window.demoSendSMS=demoSendSMS;
