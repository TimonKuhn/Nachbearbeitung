import React, { useState } from 'react';
import './Layers.css';
import DropdownCheckbox from './DropdownCheckbox';
import Zuglinien from '../Image/Zuglinien.png';
import Buslinien from '../Image/Buslinien.png';
import Tramlinien from '../Image/Tramlinien.png';
import Schiffelinien from '../Image/Schiffelinien.png';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import TramIcon from '@mui/icons-material/Tram';
import DirectionsRailwayIcon from '@mui/icons-material/DirectionsRailway';
import DirectionsBoatIcon from '@mui/icons-material/DirectionsBoat';

function DropdownChecklist({ onLayerVisibilityChange }) {
  const [checkedItems, setCheckedItems] = useState({
    rail: false,
    bus: false,
    tram: false,
    ferry: false,
    false: false,
  });
  const [menuOpen, setMenuOpen] = useState(false);

  const handleChange = (event) => {
    const { name, checked } = event.target;
    setCheckedItems(prevState => ({ ...prevState, [name]: checked }));
    onLayerVisibilityChange(name, checked);
  };

  const handleToggle = () => {
    setMenuOpen(!menuOpen);
  };

  const handleTouchStart = (event) => {
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      window.touchStartX = touch.clientX;
    }
  };

  const handleTouchMove = (event) => {
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      const touchEndX = touch.clientX;
      const deltaX = touchEndX - window.touchStartX;

      if (deltaX > 100) {
        setMenuOpen(true);
      }
    }
  };

  return (
    <div
      className={`dropdown-checklist-container ${menuOpen ? 'open' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >
      <div className="dropdown-toggle" onClick={handleToggle}></div>
      <div className="dropdown-content">
        <DropdownCheckbox
          label="rail"
          checked={checkedItems.rail}
          onChange={handleChange}
          imageSrc={Zuglinien}
          displayLabel="Zuglinien"
        />
        <DropdownCheckbox
          label="bus"
          checked={checkedItems.bus}
          onChange={handleChange}
          imageSrc={Buslinien}
          displayLabel="Buslinien"
        />
        <DropdownCheckbox
          label="tram"
          checked={checkedItems.tram}
          onChange={handleChange}
          imageSrc={Tramlinien}
          displayLabel="Tramlinien"
        />
        <DropdownCheckbox
          label="ferry"
          checked={checkedItems.ferry}
          onChange={handleChange}
          imageSrc={Schiffelinien}
          displayLabel="Schifflinien"
        />
        <DropdownCheckbox
          label="Zug"
          checked={checkedItems.false}
          onChange={handleChange}
          Icon={DirectionsRailwayIcon}
          displayLabel="Zug"
        />
        <DropdownCheckbox
          label="Bus"
          checked={checkedItems.false}
          onChange={handleChange}
          Icon={DirectionsBusIcon}
          displayLabel="Bus"          
        />
        <DropdownCheckbox
          label="Tram"
          checked={checkedItems.false}
          onChange={handleChange}
          Icon={TramIcon}
          displayLabel="Tram"
        />
        <DropdownCheckbox
          label="Schiffe"
          checked={checkedItems.false}
          onChange={handleChange}
          Icon={DirectionsBoatIcon}
          displayLabel="Schiffe"
        />
      </div>
    </div>
  );
}

export default DropdownChecklist;
