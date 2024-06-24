import React, { useState } from 'react';
import Landeskarte_farbe from '../Image/Landeskarte_farbe.png';
import Landeskarte_grau from '../Image/Landeskarte_grau.png';
import Bild_Luftbild from '../Image/Bild_Luftbild.png';
import Bild_osm from '../Image/Bild_osm.png';
import './backgroundButton.css';
import TileLayer from 'ol/layer/Tile';


function BackgroundButton({ setBackgroundMap, fetchGeoData, map }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleBackgroundChange = async (mapType) => {
    removeBackgroundLayer(); // Rimuovi il layer di sfondo precedente
    await setBackgroundMap(mapType); // Imposta lo sfondo sulla mappa
    setMenuOpen(false); // Chiudi il menu dopo aver selezionato uno sfondo
    // Chiama la funzione per caricare i dati geoservizi
    await fetchGeoData(mapType); 
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen); // Cambia lo stato di menuOpen quando il pulsante viene cliccato
  };

  const removeBackgroundLayer = () => {
    // Rimuovi il layer di sfondo precedente
    if (map) {
      const layers = map.getLayers();
      layers.forEach(layer => {
        if (layer instanceof TileLayer) {
          map.removeLayer(layer);
        }
      });
    }
  };

  const backgroundImageSrc = (mapType) => {
    switch (mapType) {
      case 'Landeskarte-farbe':
        return Landeskarte_farbe;
      case 'Landeskarte-grau':
        return Landeskarte_grau;
      case 'Luftbild':
        return Bild_Luftbild;
      case 'osm':
        return Bild_osm;
      default:
        return Landeskarte_farbe;
    }
  };

  return (
    <div className="background-container" onClick={toggleMenu}>
      <img src={backgroundImageSrc()} width="50" height="50" onClick={toggleMenu} alt="Background" />
      {menuOpen && (
        <div className="background-select">
          <div onClick={() => handleBackgroundChange('Landeskarte-farbe')}>
            <img src={Landeskarte_farbe} width="50" height="50" alt="Landeskarte Farbe" />
          </div>
          <div onClick={() => handleBackgroundChange('Landeskarte-grau')}>
            <img src={Landeskarte_grau} width="50" height="50" alt="Landeskarte Grau" />
          </div>
          <div onClick={() => handleBackgroundChange('Luftbild')}>
            <img src={Bild_Luftbild} width="50" height="50" alt="Luftbild" />
          </div>
          <div onClick={() => handleBackgroundChange('osm')}>
            <img src={Bild_osm} width="50" height="50" alt="OpenStreetMap" />
          </div>
        </div>
      )}
    </div>
  );
}

export default BackgroundButton;
