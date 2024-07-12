import "./styles.css";
import "ol/ol.css";

import proj4 from "proj4";
import { Map, View } from "ol";
import { Tile as TileLayer } from "ol/layer";
import { XYZ, TileWMS } from "ol/source";
import { defaults as defaultControls, ScaleLine, Control } from "ol/control";
import { register } from "ol/proj/proj4";
import TileGrid from "ol/tilegrid/TileGrid";
import { TILEGRID_ORIGIN, TILEGRID_RESOLUTIONS, WMS_TILE_SIZE } from "./config";

// Projektionen für die Schweiz hinzufügen
proj4.defs(
  "EPSG:2056",
  "+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 +k_0=1 +x_0=2600000 +y_0=1200000 +ellps=bessel +towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs"
);
proj4.defs(
  "EPSG:21781",
  "+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 +k_0=1 +x_0=600000 +y_0=200000 +ellps=bessel +towgs84=674.4,15.1,405.3,0,0,0,0 +units=m +no_defs"
);
register(proj4);

// Hintergrund-Luftbild von Swisstopo
const orthophotoLayer = new TileLayer({
  id: "orthophoto-layer",
  source: new XYZ({
    url: `https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.swissimage/default/current/3857/{z}/{x}/{y}.jpeg`,
    attributions: '&copy; <a href="https://www.swisstopo.admin.ch/en/home.html">Swisstopo</a>'
  }),
  visible: true
});

// Landeskarte von Swisstopo
const landeskarteLayer = new TileLayer({
  id: "landeskarte-layer",
  source: new XYZ({
    url: `https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-farbe/default/current/3857/{z}/{x}/{y}.jpeg`,
    attributions: '&copy; <a href="https://www.swisstopo.admin.ch/en/home.html">Swisstopo</a>'
  }),
  visible: false
});

// Tiled WMS Layer für Sperrungen Fusswege hinzufügen
const sperrungenLayer = new TileLayer({
  id: "sperrungen-layer",
  opacity: 0.8,
  source: new TileWMS({
    url: `https://wms0.geo.admin.ch/?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&FORMAT=image%2Fpng&TRANSPARENT=true&LAYERS=ch.astra.wanderland-sperrungen_umleitungen&LANG=en`,
    gutter: 120,
    tileGrid: new TileGrid({
      projection: "EPSG:3857",
      tileSize: WMS_TILE_SIZE,
      origin: TILEGRID_ORIGIN,
      resolutions: TILEGRID_RESOLUTIONS
    })
  }),
  visible: false
});

// Neuer WMS Layer hinzufügen
const neuerWmsLayerSource = new TileWMS({
  url: `http://localhost:8000/wms/`,
  params: {
    'layers': 'ne:0',
    'format': 'image/png', // beachte: 'format' statt 'FORMAT'
    'transparent': true  // Parameter für Transparenz
  }
});

const neuerWmsLayer = new TileLayer({
  id: "neuer-wms-layer",
  opacity: 0.8,
  source: neuerWmsLayerSource,
  visible: true
});

const view = new View({
  projection: "EPSG:3857",
  center: [924299.5, 5933573.7], // Koordinaten in EPSG:3857 für die Schweiz
  zoom: 8
});

const map = new Map({
  target: "map",
  controls: defaultControls().extend([
    new ScaleLine({
      units: "metric"
    })
  ]),
  layers: [orthophotoLayer, landeskarteLayer, sperrungenLayer, neuerWmsLayer],
  view: view
});

// Update WMS parameters on view change
view.on('change:resolution', updateWmsLayerParams);
view.on('change:center', updateWmsLayerParams);

function updateWmsLayerParams() {
  const extent = view.calculateExtent(map.getSize());
  const bbox = extent.join(',');

  // Logging nur, wenn BBOX sich ändert
  console.log('Updating WMS layer BBOX:', bbox);

  // Die WMS-Parameter im gewünschten Format aktualisieren
  neuerWmsLayerSource.updateParams({
    'bbox': bbox,
    'width': map.getSize()[0],
    'height': map.getSize()[1]
  });
}

// Custom Control for Layer Switching
class LayerSwitcherControl extends Control {
  constructor(opt_options) {
    const options = opt_options || {};

    const element = document.createElement('div');
    element.className = 'layer-switcher ol-unselectable ol-control';

    const orthophotoCheckbox = document.createElement('input');
    orthophotoCheckbox.type = 'checkbox';
    orthophotoCheckbox.id = 'orthophoto-layer';
    orthophotoCheckbox.checked = true;
    orthophotoCheckbox.addEventListener('change', () => {
      orthophotoLayer.setVisible(orthophotoCheckbox.checked);
    });

    const orthophotoLabel = document.createElement('label');
    orthophotoLabel.htmlFor = 'orthophoto-layer';
    orthophotoLabel.appendChild(document.createTextNode('Orthophoto'));

    const landeskarteCheckbox = document.createElement('input');
    landeskarteCheckbox.type = 'checkbox';
    landeskarteCheckbox.id = 'landeskarte-layer';
    landeskarteCheckbox.addEventListener('change', () => {
      landeskarteLayer.setVisible(landeskarteCheckbox.checked);
    });

    const landeskarteLabel = document.createElement('label');
    landeskarteLabel.htmlFor = 'landeskarte-layer';
    landeskarteLabel.appendChild(document.createTextNode('Landeskarte'));

    const sperrungenCheckbox = document.createElement('input');
    sperrungenCheckbox.type = 'checkbox';
    sperrungenCheckbox.id = 'sperrungen-layer';
    sperrungenCheckbox.addEventListener('change', () => {
      sperrungenLayer.setVisible(sperrungenCheckbox.checked);
    });

    const sperrungenLabel = document.createElement('label');
    sperrungenLabel.htmlFor = 'sperrungen-layer';
    sperrungenLabel.appendChild(document.createTextNode('Sperrungen Fusswege'));

    const neuerWmsCheckbox = document.createElement('input');
    neuerWmsCheckbox.type = 'checkbox';
    neuerWmsCheckbox.id = 'neuer-wms-layer';
    neuerWmsCheckbox.checked = true;
    neuerWmsCheckbox.addEventListener('change', () => {
      neuerWmsLayer.setVisible(neuerWmsCheckbox.checked);
    });

    const neuerWmsLabel = document.createElement('label');
    neuerWmsLabel.htmlFor = 'neuer-wms-layer';
    neuerWmsLabel.appendChild(document.createTextNode('Neuer WMS Layer'));

    element.appendChild(orthophotoCheckbox);
    element.appendChild(orthophotoLabel);
    element.appendChild(document.createElement('br'));
    element.appendChild(landeskarteCheckbox);
    element.appendChild(landeskarteLabel);
    element.appendChild(document.createElement('br'));
    element.appendChild(sperrungenCheckbox);
    element.appendChild(sperrungenLabel);
    element.appendChild(document.createElement('br'));
    element.appendChild(neuerWmsCheckbox);
    element.appendChild(neuerWmsLabel);

    super({
      element: element,
      target: options.target
    });
  }
}

map.addControl(new LayerSwitcherControl());

// Initial update of WMS layer parameters
updateWmsLayerParams();
