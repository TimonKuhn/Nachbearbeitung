import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import TileWMS from 'ol/source/TileWMS';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { useNavigate } from 'react-router-dom';
import { Fill, Stroke, Style } from 'ol/style.js';
import { FullScreen, ScaleLine, defaults as defaultControls } from 'ol/control.js';
import GeoJSON from 'ol/format/GeoJSON';
import CheckBoxLayers from './Layers';
import BackgroundButton from './backgroundButton';
import Searchbar from './Searchbar';
import * as olProj from 'ol/proj';
import axios from 'axios';

import { bbox as bboxStrategy } from 'ol/loadingstrategy';



const MapWrapper = forwardRef((props, ref) => {
    const [map, setMap] = useState();
    const [featuresLayer, setFeaturesLayer] = useState();
    const [backgroundMap, setBackgroundMap] = useState('Landeskarte-farbe');
    const [layerVisibility, setLayerVisibility] = useState({
        rail: false,
        bus: false,
        tram: false,
        ferry: false,
    });
    const desktopMinZoom = 8.3;
    const mobileMinZoom = 7.5;
    const [toggleMenu, setToggleMenu] = useState(false);
    const mapElement = useRef();
    const mapRef = useRef();
    mapRef.current = map;
    const navigate = useNavigate();

    const featureStyle = (feature) => {
        const type = feature.get('type');
        let mainStrokeStyle;
        let secondaryStrokeStyle;
        let haloStrokeStyle = new Stroke({
            color: 'rgba(255, 255, 255, 0.5)', // Transparent halo color
            width: 10, // Width of the halo
        });

        switch (type) {
            case 'rail':
                mainStrokeStyle = new Stroke({
                    color: 'black',
                    width: 2,
                });
                break;
            case 'bus':
                mainStrokeStyle = new Stroke({
                    color: 'black',
                    width: 2,
                    lineDash: [5, 15], // Dashed line
                });
                break;
            case 'tram':
                mainStrokeStyle = new Stroke({
                    color: 'black',
                    width: 4,
                    lineCap: 'butt', // Square ends
                });

                secondaryStrokeStyle = new Stroke({
                    color: 'white',
                    width: 2,
                    lineCap: 'butt', // Square ends
                });

            case 'ferry':
                mainStrokeStyle = new Stroke({
                    color: 'black',
                    width: 4,
                    lineDash: [2, 10], // Square ends
                });

                return [
                    new Style({
                        stroke: haloStrokeStyle,
                        zIndex: 2, // Ensure halo is underneath feature but above overlay
                    }),
                    new Style({
                        stroke: mainStrokeStyle,
                        zIndex: 3, // Feature layer
                    }),
                    new Style({
                        stroke: secondaryStrokeStyle,
                        zIndex: 4, // Overlay secondary style on top
                    })
                ];
            default:
                mainStrokeStyle = new Stroke({
                    color: 'black',
                    width: 3,
                });
        }

        return [
            new Style({
                stroke: haloStrokeStyle,
                zIndex: 2,
            }),
            new Style({
                stroke: mainStrokeStyle,
                zIndex: 3,
            })
        ];
    };

    useEffect(() => {
        const initialFeaturesLayer = new VectorLayer({
            source: new VectorSource(),
            style: featureStyle,
        });

        const initialMap = new Map({
            target: mapElement.current,
            layers: [getBackgroundLayer(), initialFeaturesLayer],
            view: new View({
                projection: 'EPSG:3857',
                center: [919705.97978, 5923388.48616],
                zoom: 1,
                maxZoom: 20,
                minZoom: getMinZoom(),
                extent: getBackgroundExtent(),
            }),
            controls: defaultControls({
                attributionOptions: { collapsible: false },
            }).extend([]),
        });

        initialMap.on('click', (event) => {
            initialMap.forEachFeatureAtPixel(event.pixel, (feature) => {
                const trainId = feature.get('train_id'); // Assuming the feature has a property train_id
                const line_name = feature.get('line_name');
                const type = feature.get('type');
                navigate(`/InfoPage/${trainId}/${line_name}/${type}`);
            });
        });

        setMap(initialMap);
        setFeaturesLayer(initialFeaturesLayer);

        return () => {
            if (initialMap) {
                initialMap.setTarget(null);
            }
        };
    }, []);

    const getMinZoom = () => {
        return window.matchMedia('(max-width: 1080px)').matches ? mobileMinZoom : desktopMinZoom;
    };

    useEffect(() => {
        fetchFeatures();
    }, [layerVisibility]);

    const fetchFeatures = () => {
        console.log('Fetching features...');
        if (featuresLayer) {
            const currentMap = mapRef.current;
            const view = currentMap.getView();
            const extent = view.calculateExtent(currentMap.getSize());
            const newBbox = extent.map(coord => Math.round(coord)).join(',');
            const newZoom = Math.round(view.getZoom());

            Object.keys(layerVisibility).forEach((layerType) => {
                // Immer die WMS-Abfrage ausführen
                console.log(`Fetching data for layer: ${layerType}`);

                // Bisherige Funktionalität beibehalten
                fetch(`http://localhost:8000/get_all_journey/?bbox=${newBbox}&key=5cc87b12d7c5370001c1d6559e7fd9aab7a44ca1b7692b2adfeb2602&zoom=${newZoom}&type=${layerType}`)
                    .then(response => response.json())
                    .then((fetchedFeatures) => {
                        const wktOptions = {
                            dataProjection: 'EPSG:3857',
                            featureProjection: 'EPSG:3857'
                        };
                        const parsedFeatures = new GeoJSON().readFeatures(fetchedFeatures, wktOptions);
                        const source = featuresLayer.getSource();
                        console.log(`Adding features for layer: ${layerType}`, parsedFeatures);
                        source.addFeatures(parsedFeatures.filter(feature => feature.get('type') === layerType));
                    })
                    .catch(error => console.error('Error fetching data:', error));

                // Neue WMS-Abfrage
                axios.get('http://localhost:8000/wms/', {
                    params: {
                        layers: layerType,  // Sie können hier den tatsächlichen Layernamen anpassen
                        bbox: newBbox,
                        width: 768,
                        height: 330
                    },
                    responseType: 'blob'
                })
                .then(response => {
                    const url = URL.createObjectURL(new Blob([response.data]));
                    // Hier können Sie das WMS-Bild verarbeiten, z.B. es auf der Karte anzeigen
                    console.log(`WMS image URL for layer ${layerType}:`, url);

                    // Überprüfen, ob bereits ein Layer für diesen Typ existiert
                    const existingLayer = currentMap.getLayers().getArray().find(layer => layer.get('name') === `wms-${layerType}`);
                    currentMap.addLayer(createCustomWMSLayer(), { zIndex: Infinity });
                    if (existingLayer) {
                        // Aktualisieren Sie die Quelle des bestehenden Layers
                        existingLayer.getSource().setUrl(url);
                    } else {
                        // Neuer Image Layer hinzufügen
                        const imageLayer = new TileLayer({
                            source: new TileWMS({
                                url: url,
                                params: {
                                    'LAYERS': layerType,
                                    'FORMAT': 'image/png'
                                },
                                projection: 'EPSG:3857'
                            }),
                            name: `wms-${layerType}`
                        });
                        currentMap.addLayer(imageLayer);
                    }
                })
                .catch(error => console.error('Error fetching WMS data:', error));

                // Features entfernen, wenn das Layer nicht sichtbar ist
                if (!layerVisibility[layerType]) {
                    const source = featuresLayer.getSource();
                    const featuresToRemove = source.getFeatures().filter(feature => feature.get('type') === layerType);
                    console.log(`Removing features for layer: ${layerType}`, featuresToRemove);
                    featuresToRemove.forEach(feature => source.removeFeature(feature));
                }
            });
        }
    };




    useImperativeHandle(ref, () => ({
        getMap: () => mapRef.current
    }));

// Funktion zum Abrufen des Hintergrund-Layers
const getBackgroundLayer = () => {
    switch (backgroundMap) {
        case 'osm':
            return new TileLayer({ source: new OSM() });
        case 'Landeskarte-farbe':
        case 'Landeskarte-grau':
        case 'Luftbild':
            return new TileLayer({
                source: new TileWMS({
                    url: 'https://wms.geo.admin.ch/',
                    crossOrigin: 'anonymous',
                    attributions: '© <a href="http://www.geo.admin.ch/internet/geoportal/en/home.html">SWISSIMAGE / geo.admin.ch</a>',
                    projection: 'EPSG:3857',
                    params: {
                        'LAYERS': getLayerName(backgroundMap),
                        'FORMAT': 'image/jpeg'
                    },
                })
            });
        default:
            return new TileLayer({ source: new OSM() });
    }
};

function createCustomWMSLayer() {
    const baseUrl = 'http://localhost:8080/geoserver/wms';
    const params = {
        'LAYERS': 'ne:0', // Ersetze 'deinLayerName' mit dem tatsächlichen Namen deines Layers
        'VERSION': '1.1.1',
        'FORMAT': 'image/png',
        'TILED': true,
    };

    const url = new URL(baseUrl);
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

    console.log('Custom WMS Layer created with URL:', url.toString());

    return new TileLayer({
        source: new TileWMS({
            url: baseUrl,
            params: params,
            serverType: 'geoserver',
        }),
    });
}



// Funktion zum Erstellen des WFS Layers
const createWfsLayer = () => {
    console.log('Creating WFS Layer...XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX');
    const wfsUrl = 'http://localhost:8000/wfs/';
    const vectorSource = new VectorSource({
        format: new GeoJSON(),
        url: function(extent) {
            const bbox = extent.join(',');
            return `${wfsUrl}?bbox=${bbox}`;
        },
        strategy: bboxStrategy,
    });

    return new VectorLayer({
        source: vectorSource,
    });
};


// Funktion zum Abrufen des Layer-Namens
const getLayerName = (mapType) => {
    switch (mapType) {
        case 'Landeskarte-farbe':
            return 'ch.swisstopo.pixelkarte-farbe';
        case 'Landeskarte-grau':
            return 'ch.swisstopo.pixelkarte-grau';
        case 'Luftbild':
            return 'ch.swisstopo.images-swissimage';
        default:
            return '';
    }
};

// Funktion zum Abrufen des Hintergrund-Ausdehnung
const getBackgroundExtent = () => {
    return [506943.5, 5652213.5, 1301728.5, 6191092];
};

// Suchfunktion
const handleSearch = (stop) => {
    if (stop) {
        const view = map.getView();
        const lonLat = [stop.lon, stop.lat];
        const transformedCoords = olProj.fromLonLat(lonLat, 'EPSG:3857');
        view.setCenter(transformedCoords);
        view.setZoom(16);
    } else {
        alert('Stop not found.');
    }
};

// Funktion zum Ändern des Hintergrunds
const handleBackgroundChange = (mapType) => {
    setBackgroundMap(mapType);
};

// Funktion zum Abrufen von Geodaten
const fetchGeoData = async (mapType) => {
    try {
        let geoServiceUrl;
        switch (mapType) {
            case 'Landeskarte-farbe':
                geoServiceUrl = 'https://wms.geo.admin.ch/?LAYERS=ch.swisstopo.swisstlm3d-wanderwege';
                break;
            case 'Landeskarte-grau':
                geoServiceUrl = 'https://wms.geo.admin.ch/?LAYERS=ch.swisstopo.pixelkarte-grau';
                break;
            case 'Luftbild':
                geoServiceUrl = 'https://wms.geo.admin.ch/?LAYERS=ch.swisstopo.swissimage-product';
                break;
            case 'osm':
                console.log('OpenStreetMap è un servizio basato su vettori. Non è richiesta una chiamata separata per i dati geoservizi.');
                return;
            default:
                console.error('Tipo di mappa non riconosciuto:', mapType);
                return;
        }

        const response = await fetch(geoServiceUrl);
        if (!response.ok) {
            throw new Error('Errore nel recupero dei dati geoservizi');
        }
        console.log("Dati geoservizi recuperati con successo per la mappa:", mapType);

    } catch (error) {
        console.error('Errore durante il recupero dei dati geoservizi:', error.message);
    }
};

// Funktion zum Abrufen des eigenen WMS-Layers
const getCustomWmsLayer = () => {
    return new TileLayer({
        source: new TileWMS({
            url: 'http://localhost:8000/wms/',
            crossOrigin: 'anonymous',
            params: {
                'LAYERS': 'ne:0',
                'BBOX': '821802.7469837219,5615499.530783547,860986.6866042244,5919283.470404049',
                'WIDTH': 256,
                'HEIGHT': 256,
                'FORMAT': 'image/png'
            },
        })
    });
};

// Initialisierung der Karte
const initializeMap = () => {
    const backgroundLayer = getBackgroundLayer();
    const customWmsLayer = getCustomWmsLayer();
    const wfsLayer = createWfsLayer(); // WFS Layer erstellen

    const map = new Map({
        target: 'map',
        layers: [
            wfsLayer, // WFS Layer zur Karte hinzufügen
            backgroundLayer,
            customWmsLayer
        ],
        view: new View({
            center: olProj.fromLonLat([8.231, 46.798], 'EPSG:3857'),
            zoom: 8
        })
    });

    // Hintergrund-Layer wechseln
    const switchBackgroundLayer = (mapType) => {
        map.removeLayer(backgroundLayer);
        const newBackgroundLayer = getBackgroundLayer(mapType);
        map.getLayers().insertAt(0, newBackgroundLayer);
    };

    // Ereignis für den Wechsel des Hintergrunds
    document.getElementById('backgroundSelect').addEventListener('change', (event) => {
        const selectedMapType = event.target.value;
        handleBackgroundChange(selectedMapType);
        switchBackgroundLayer(selectedMapType);
    });
};

// Sicherstellen, dass das DOM vollständig geladen ist, bevor die Karte initialisiert wird
document.addEventListener('DOMContentLoaded', () => {
    initializeMap();
});


    useEffect(() => {
        if (map) {
            const layers = map.getLayers().getArray();
            layers[0] = getBackgroundLayer();
            map.render();
        }
    }, [backgroundMap, map]);

    useEffect(() => {
        if (featuresLayer) {
            const features = featuresLayer.getSource().getFeatures();
            features.forEach(feature => {
                const type = feature.get('type');
                feature.setStyle(layerVisibility[type] ? featureStyle(feature) : null);
            });
        }
    }, [layerVisibility, featuresLayer]);

    const handleLayerVisibilityChange = (layerType, isVisible) => {
        setLayerVisibility(prevState => ({
            ...prevState,
            [layerType]: isVisible
        }));
    };

    return (
        <div style={{ position: 'relative', flex: "100 0 0" }}>
            <Searchbar onSearch={handleSearch} />
            <CheckBoxLayers onLayerVisibilityChange={handleLayerVisibilityChange} />
            <div className="container">
                <div className="white-overlay" style={{ zIndex: 1, backgroundColor: 'rgba(255, 255, 255, 0.2)', pointerEvents: 'none' }}></div>
                <div ref={mapElement} className="map-container"></div>
                <BackgroundButton
                    setBackgroundMap={handleBackgroundChange}
                    toggleMenu={toggleMenu}
                    fetchGeoData={fetchGeoData}
                />
            </div>
        </div>
    );
});

export default MapWrapper;
