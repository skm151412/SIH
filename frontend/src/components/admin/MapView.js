import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import HeatmapLayer from 'react-leaflet-heatmap-layer';
import axios from 'axios';
import { Icon } from 'leaflet';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import 'leaflet/dist/leaflet.css';
import 'react-leaflet-markercluster/dist/styles.min.css';
import './MapView.css';

// Define custom icons for different statuses
const icons = {
  SUBMITTED: new Icon({
    iconUrl: '/icons/marker-submitted.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  }),
  IN_PROGRESS: new Icon({
    iconUrl: '/icons/marker-in-progress.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  }),
  RESOLVED: new Icon({
    iconUrl: '/icons/marker-resolved.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  }),
  ESCALATED: new Icon({
    iconUrl: '/icons/marker-escalated.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  }),
  default: new Icon({
    iconUrl: '/icons/marker-default.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  }),
};

// Component to update map bounds when they change
const BoundsUpdater = ({ onBoundsChange }) => {
  const map = useMap();
  
  useEffect(() => {
    if (!map) return;
    
    const updateBounds = () => {
      const bounds = map.getBounds();
      onBoundsChange({
        minLat: bounds.getSouth(),
        maxLat: bounds.getNorth(),
        minLng: bounds.getWest(),
        maxLng: bounds.getEast(),
      });
    };
    
    // Initial bounds
    updateBounds();
    
    // Update bounds when map moves
    map.on('moveend', updateBounds);
    
    return () => {
      map.off('moveend', updateBounds);
    };
  }, [map, onBoundsChange]);
  
  return null;
};

const MapView = () => {
  const [complaints, setComplaints] = useState([]);
  const [viewType, setViewType] = useState('cluster'); // 'cluster' or 'heatmap'
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [bounds, setBounds] = useState(null);
  const [categories, setCategories] = useState([]);
  const [statuses, setStatuses] = useState(['SUBMITTED', 'IN_PROGRESS', 'RESOLVED', 'ESCALATED']);
  const fetchTimeoutRef = useRef(null);
  
  // Initial map center and zoom
  const mapCenter = [20.5937, 78.9629]; // Center of India
  const mapZoom = 5;
  
  // Fetch complaint data with filters
  const fetchComplaints = async () => {
    if (!bounds) return;
    
    // Clear previous timeout to prevent multiple concurrent requests
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }
    
    // Add a small delay to prevent excessive API calls during map movement
    fetchTimeoutRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        
        // Format dates for API
        const formatDate = (date) => {
          return date ? date.toISOString() : null;
        };
        
        const { data } = await axios.get('/admin/complaints/mapdata', {
          params: {
            minLat: bounds.minLat,
            maxLat: bounds.maxLat,
            minLng: bounds.minLng,
            maxLng: bounds.maxLng,
            category: category || null,
            status: status || null,
            startDate: formatDate(startDate),
            endDate: formatDate(endDate),
          },
        });
        
        setComplaints(data);
        
        // Extract unique categories
        const uniqueCategories = [...new Set(data.map(item => item.category))];
        if (uniqueCategories.length > 0) {
          setCategories(uniqueCategories);
        }
      } catch (error) {
        console.error('Error fetching complaint map data:', error);
      } finally {
        setLoading(false);
      }
    }, 300);
  };
  
  // Fetch data when bounds or filters change
  useEffect(() => {
    fetchComplaints();
  }, [bounds, category, status, startDate, endDate]);
  
  // Format heatmap data
  const heatmapData = complaints.map(complaint => ({
    lat: complaint.latitude,
    lng: complaint.longitude,
    // Add intensity based on recency or severity
    intensity: complaint.status === 'SUBMITTED' ? 0.8 : 
               complaint.status === 'IN_PROGRESS' ? 0.6 :
               complaint.status === 'ESCALATED' ? 0.9 : 0.3,
  }));
  
  return (
    <div className="map-container">
      <div className="map-controls">
        <h2>Complaint Visualization</h2>
        
        <div className="view-toggle">
          <button 
            className={viewType === 'cluster' ? 'active' : ''}
            onClick={() => setViewType('cluster')}
          >
            Cluster View
          </button>
          <button 
            className={viewType === 'heatmap' ? 'active' : ''}
            onClick={() => setViewType('heatmap')}
          >
            Heatmap View
          </button>
        </div>
        
        <div className="filters">
          <div className="filter-item">
            <label>Category:</label>
            <select 
              value={category} 
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-item">
            <label>Status:</label>
            <select 
              value={status} 
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              {statuses.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-item date-filter">
            <label>Start Date:</label>
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              selectsStart
              startDate={startDate}
              endDate={endDate}
              dateFormat="yyyy-MM-dd"
              placeholderText="From"
              isClearable
            />
          </div>
          
          <div className="filter-item date-filter">
            <label>End Date:</label>
            <DatePicker
              selected={endDate}
              onChange={(date) => setEndDate(date)}
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              minDate={startDate}
              dateFormat="yyyy-MM-dd"
              placeholderText="To"
              isClearable
            />
          </div>
        </div>
        
        {loading && <div className="loading-indicator">Loading data...</div>}
        <div className="stats">
          <span>Complaints: {complaints.length}</span>
        </div>
      </div>
      
      <div className="map-view">
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <ZoomControl position="bottomright" />
          
          <BoundsUpdater onBoundsChange={setBounds} />
          
          {/* Conditionally render heatmap or clusters */}
          {viewType === 'heatmap' ? (
            <HeatmapLayer
              points={heatmapData}
              longitudeExtractor={m => m.lng}
              latitudeExtractor={m => m.lat}
              intensityExtractor={m => m.intensity}
              radius={20}
              max={1.0}
              minOpacity={0.3}
            />
          ) : (
            <MarkerClusterGroup>
              {complaints.map(complaint => (
                <Marker
                  key={complaint.id}
                  position={[complaint.latitude, complaint.longitude]}
                  icon={icons[complaint.status] || icons.default}
                >
                  <Popup>
                    <div className="popup-content">
                      <h3>{complaint.title}</h3>
                      <p><strong>Category:</strong> {complaint.category}</p>
                      <p><strong>Status:</strong> {complaint.status}</p>
                      <p><strong>Created:</strong> {new Date(complaint.createdAt).toLocaleDateString()}</p>
                      <a href={`/admin/complaints/${complaint.id}`} target="_blank" rel="noopener noreferrer">
                        View Details
                      </a>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MarkerClusterGroup>
          )}
        </MapContainer>
      </div>
    </div>
  );
};

export default MapView;