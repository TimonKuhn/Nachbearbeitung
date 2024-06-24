import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import ShareLink from './Sharelink';
import { Link, useLocation } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const key = "5cc87b12d7c5370001c1d6559e7fd9aab7a44ca1b7692b2adfeb2602"

const InfoPage = () => {
  const { trainId, name } = useParams();
  const [stations, setStations] = useState([]);
  const [startStation, setStartStation] = useState('');
  const [endStation, setEndStation] = useState('');
  const location = useLocation();
  const isInfoPage = location.pathname === '/InfoPage';
  const stationRefs = useRef([]);

  useEffect(() => {
    fetch(`http://10.175.23.153:8000/get_info/?train_id=${trainId}&key=${key}`)
      .then(response => response.json())
      .then(data => {
        console.log(data); // Log received data
        if (data.length > 0) {
          const stations = data[0].stations || [];
          setStations(stations);
          if (stations.length > 0) {
            setStartStation(stations[0].stationName);
            setEndStation(stations[stations.length - 1].stationName);
          }
        } else {
          setStations([]);
        }
      })
      .catch(error => console.error('Error fetching train data:', error));
  }, [trainId]);

  useEffect(() => {
    if (stations.length > 0) {
      const currentIndex = getCurrentStationIndex(stations);
      if (currentIndex !== -1) {
        setTimeout(() => {
          stationRefs.current[currentIndex]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 500);
      }
    }
  }, [stations]);

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
  };

  const getDelay = (aimedTime, actualTime) => {
    const aimedDate = new Date(aimedTime);
    const actualDate = new Date(actualTime);
    const delay = actualDate.getTime() - aimedDate.getTime();
    if (delay > 0) {
      return `+ ${Math.round(delay / 60000)} min`;
    } else if (delay < 0) {
      return `- ${Math.round(Math.abs(delay) / 60000)} min`;
    } else {
      return "+ 0 min";
    }
  };

  const getCurrentStationIndex = (stations) => {
    const now = new Date();
    for (let i = 0; i < stations.length; i++) {
      const station = stations[i];
      const arrivalTime = new Date(station.arrivalTime);
      const departureTime = new Date(station.departureTime);
      if (now >= arrivalTime && now <= departureTime) {
        return i;
      }
    }
    return -1;
  };

  const getCurrentPosition = (stations) => {
    const now = new Date();
    for (let i = 0; i < stations.length - 1; i++) {
      const currentStation = stations[i];
      const nextStation = stations[i + 1];
      const departureTime = new Date(currentStation.departureTime);
      const arrivalTime = new Date(nextStation.arrivalTime);
      if (now >= departureTime && now <= arrivalTime) {
        const totalDuration = arrivalTime - departureTime;
        const elapsed = now - departureTime;
        const progress = elapsed / totalDuration;
        return i + progress;
      }
    }
    return -1;
  };

  const renderStations = (stations) => {
    if (!stations || stations.length === 0) {
      return <p>Keine Haltestelleninformationen verfügbar.</p>;
    }

    const now = new Date();
    const currentPosition = getCurrentPosition(stations);

    return (
      <div style={{ position: 'relative', marginLeft: '20px' }}>
        <div style={{
          position: 'absolute',
          left: '0',
          top: '0',
          bottom: '0',
          width: '2px',
          backgroundColor: 'black',
          zIndex: '0'
        }}></div>
        {stations.map((station, index) => {
          const stationPassed = new Date(station.departureTime) < now;
          return (
            <div
              key={index}
              ref={el => stationRefs.current[index] = el}
              style={{
                position: 'relative',
                padding: '10px 0',
                display: 'flex',
                alignItems: 'center',
                color: stationPassed ? 'grey' : 'black'
              }}
            >
              <div style={{
                width: '10px',
                height: '10px',
                backgroundColor: stationPassed ? 'grey' : 'black',
                borderRadius: '50%',
                position: 'absolute',
                left: '-6px', // Adjust to center the point on the line
                zIndex: '1'
              }}></div>
              <div style={{ marginLeft: '20px' }}>
                <h3>{station.stationName}</h3>
                <p>
                  Ankunft: {formatTime(station.arrivalTime)} {getDelay(station.aimedArrivalTime, station.arrivalTime)}<br />
                  Abfahrt: {formatTime(station.departureTime)} {getDelay(station.aimedDepartureTime, station.departureTime)}
                </p>
              </div>
            </div>
          );
        })}
        {currentPosition !== -1 && (
          <div style={{
            position: 'absolute',
            left: '-8px', // Adjust to center the point on the line
            top: `${(currentPosition / (stations.length - 1)) * 100}%`,
            transform: 'translateY(-50%)',
            zIndex: '2'
          }}>
            <div style={{
              width: '12px',
              height: '12px',
              backgroundColor: 'red',
              borderRadius: '50%'
            }}></div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <h2>Fahrinformationen</h2>
      <p>{startStation} - {endStation}</p>
      <div id="station-container" style={{position: 'absolute', alignItems: 'center'}}>
        {renderStations(stations)}
      </div>
      <nav>
        <ul className="no-bullets">
          <li style={{ position: 'absolute', right: '10px', top: '10px', fontSize: 10 }}>
            <Link to="/" style={{ color: 'black' }}>
              <ArrowBackIcon size={20} />
            </Link>
          </li>
        </ul>
      </nav>
      <div style={{ position: 'absolute', top: '10%', right: '10px' }}>
        <ShareLink url={window.location.href} />
      </div>
    </div>
  );
};

export default InfoPage;
