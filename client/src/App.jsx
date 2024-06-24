import './App.css';
import React, { useEffect, useState, useRef } from 'react';
import MapWrapper from './components/MapWrapper.jsx';
import Header from './components/Header.jsx';
import InfoPage from './components/InfoPage.jsx';
import GeoJSON from 'ol/format/GeoJSON';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

function App() {
  const [features, setFeatures] = useState([]);
  const [bbox, setBbox] = useState('838667,5997631,909982,6036843'); // Default bounding box
  const [zoom, setZoom] = useState(12); // Default zoom level
  const mapRef = useRef(); // Ref to access map instance

  return (
    <div className="App">
      <Router>
        <Header />
        <Routes>
          <Route path="/" element={<MapWrapper ref={mapRef} features={features} />} />
          <Route path="/InfoPage/:trainId/:line_name/:type" element={<InfoPage />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;