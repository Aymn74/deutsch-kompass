# Slop Riyadh

A 3D Riyadh in the browser (three.js, WebGL), inspired by [mrdoob/slop-newyork](https://github.com/mrdoob/slop-newyork).
Walk, drive a white Land Cruiser, or fly a helicopter along King Fahd Road, Olaya, KAFD, Dirah and Diriyah.

Open `index.html` through any static server (for example `npx serve slop-riyadh`). GitHub Pages works too.

## What is real and what is generated

- **Real positions (approximate):** the main arterials, ring roads and landmarks are placed from latitude/longitude
  (Kingdom Centre, Al Faisaliah, KAFD, Burj Rafal, Masmak, National Museum, Water Tower, TV Tower, Ministry of Interior,
  King Fahd National Library, At-Turaif, Wadi Hanifa). Every arterial is drawn as a straight line on Riyadh's grid,
  which runs about 28° west of north.
- **Generated:** local streets, villas, apartments, shop strips, towers, mosques and parks are generated
  deterministically per district (`js/geo.js`, `js/city.js`). OpenStreetMap could not be downloaded when this was built;
  replacing the generator with OSM footprints is the natural next step.

## Files

- `js/geo.js`: coordinate frame, road network, districts, block layout, walk/drive rules
- `js/city.js`: chunk streaming (detail near the player, coarse silhouette to the horizon)
- `js/materials.js`: procedural facade shader (windows, shopfronts, night lights), ground, sky, palms
- `js/landmarks.js`: hand-built landmarks and the Metro Line 1 viaduct
- `js/traffic.js`: lane-following traffic with signals, car models
- `js/player.js`: walking, driving, helicopter
- `js/main.js`: renderer, time-of-day presets (noon, maghrib, night, haboob), cameras, HUD, minimap, atlas

Controls: WASD/arrows, Shift boost, Space jump/climb, Q descend, 1–3 modes, V cameras, C cockpit, M map, T time, H hide HUD.
