import React, { useState, useEffect } from 'react';
import './Searchbar.css';
import SearchIcon from '@mui/icons-material/Search';

const Searchbar = ({ onSearch }) => {
    const [inputValue, setInputValue] = useState('');
    const [stops, setStops] = useState([]);
    const [filteredStops, setFilteredStops] = useState([]);

    useEffect(() => {
        fetch('/stops')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok ' + response.statusText);
                }
                return response.json();
            })
            .then(data => setStops(data))
            .catch(error => console.error('Error fetching stops:', error));
    }, []);

    const handleInputChange = (event) => {
        const value = event.target.value;
        setInputValue(value);
        setFilteredStops(
            stops.filter(stop => stop.name.toLowerCase().includes(value.toLowerCase()))
        );
    };

    const handleSearch = (stop) => {
        if (stop) {
            onSearch(stop);
        }
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter' && filteredStops.length > 0) {
            handleSearch(filteredStops[0]);
        }
    };

    return (
        <div className="searchbar-container">
            <input
                type="text"
                id="search-input"
                placeholder="Suchbegriff eingeben"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
            />
            <SearchIcon className="search-icon" />
            {filteredStops.length > 0 && (
                <ul className="autocomplete-dropdown">
                    {filteredStops.map((stop, index) => (
                        <li key={index} onClick={() => handleSearch(stop)}>
                            {stop.name}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default Searchbar;
