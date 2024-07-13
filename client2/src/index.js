import "./styles.css";
import "ol/ol.css";
import proj4 from "proj4";
import { Map, View } from "ol";
import { Tile as TileLayer, Vector as VectorLayer } from "ol/layer";
import { XYZ, TileWMS, Vector as VectorSource } from "ol/source";
import { defaults as defaultControls, ScaleLine, Control } from "ol/control";
import { register } from "ol/proj/proj4";
import TileGrid from "ol/tilegrid/TileGrid";
import { TILEGRID_ORIGIN, TILEGRID_RESOLUTIONS, WMS_TILE_SIZE } from "./config";
import GeoJSON from "ol/format/GeoJSON";
import { Style, Stroke } from 'ol/style';

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
    'LAYERS': 'ne:0',
    'FORMAT': 'image/png',
    'TRANSPARENT': true
  },
  serverType: 'geoserver'
});

const neuerWmsLayer = new TileLayer({
  id: "neuer-wms-layer",
  opacity: 1,
  source: neuerWmsLayerSource,
  visible: true
});

// Fetch WFS Data
async function fetchWfsData(bbox) {
  const url = `http://localhost:8000/wfs/?bbox=${bbox}`;
  const response = await fetch(url);
  const data = await response.json();
  console.log(url);
  return data;
}

// Create WFS Layer
async function createWfsLayer(bbox) {
  const geojsonData = await fetchWfsData(bbox);
  
  const wfsSource = new VectorSource({
    features: new GeoJSON().readFeatures(geojsonData, {
      featureProjection: 'EPSG:3857'
    })
  });

  const wfsLayer = new VectorLayer({
    source: wfsSource,
    visible: true,
    style: new Style({
      stroke: new Stroke({
        color: 'blue',
        width: 10
      })
    })
  });

  return wfsLayer;
}

// Initialize the map
const view = new View({
  projection: "EPSG:3857",
  center: [924299.5, 5933573.7],
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

// Custom Control for Layer Switching
class LayerSwitcherControl extends Control {
  constructor(opt_options) {
    const options = opt_options || {};

    const element = document.createElement('div');
    element.className = 'layer-switcher ol-unselectable ol-control';

    const layers = [
      { layer: orthophotoLayer, name: 'Orthophoto' },
      { layer: landeskarteLayer, name: 'Landeskarte' },
      { layer: sperrungenLayer, name: 'Sperrungen Fusswege' },
      { layer: neuerWmsLayer, name: 'Buslinien Stadt Bern' },
      { layer: null, name: 'WFS Layer' } // Placeholder for WFS layer
    ];

    layers.forEach(({ layer, name }) => {
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = layer ? layer.getVisible() : true; // WFS layer defaults to true
      if (layer) {
        checkbox.addEventListener('change', () => {
          layer.setVisible(checkbox.checked);
        });
      }

      const label = document.createElement('label');
      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(name));

      element.appendChild(label);
      element.appendChild(document.createElement('br'));
    });

    super({
      element: element,
      target: options.target
    });
  }

  addWfsLayerCheckbox(wfsLayer) {
    const layerSwitcher = this.element;

    const wfsCheckbox = document.createElement('input');
    wfsCheckbox.type = 'checkbox';
    wfsCheckbox.checked = true; // Default to checked
    wfsCheckbox.addEventListener('change', () => {
      wfsLayer.setVisible(wfsCheckbox.checked);
    });

    const wfsLabel = document.createElement('label');
    wfsLabel.appendChild(wfsCheckbox);
    wfsLabel.appendChild(document.createTextNode('WFS Layer'));

    layerSwitcher.appendChild(wfsLabel);
    layerSwitcher.appendChild(document.createElement('br'));
  }
}

// Create the LayerSwitcherControl and add it to the map
const layerSwitcherControl = new LayerSwitcherControl();
map.addControl(layerSwitcherControl);

// Fetch and add WFS layer
const bbox = '827000,5930000,830000,5936000';
createWfsLayer(bbox).then((wfsLayer) => {
  map.addLayer(wfsLayer);

  // Add the WFS layer checkbox to the LayerSwitcherControl
  layerSwitcherControl.addWfsLayerCheckbox(wfsLayer);
});
