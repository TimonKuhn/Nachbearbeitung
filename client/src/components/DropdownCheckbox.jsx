import React from 'react';
import './Layers.css';

function DropdownCheckbox({ label, checked, onChange, imageSrc, displayLabel, Icon }) {
  return (
    <div className="dropdown-checkbox">
      <input
        type="checkbox"
        id={label}
        name={label}
        checked={checked}
        onChange={onChange}
      />
      {imageSrc && <img src={imageSrc} alt={displayLabel} className="dropdown-checkbox-image" />}
      {Icon && <Icon className="dropdown-icon" />}
      <label htmlFor={label}>{displayLabel}</label><br />
    </div>
  );
}

export default DropdownCheckbox;
