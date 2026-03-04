/**
 * Map module — initializes Leaflet map with color-coded pins for locations.
 */
const MapView = {
  map: null,
  markers: [],

  PIN_COLORS: {
    'Approved':          '#22c55e',
    'Rejected':          '#ef4444',
    'Contacted':         '#ffc55e',
    'Expired':           '#8b5cf6',
    'Not Yet Contacted': '#6b7280',
  },

  init(containerId, options = {}) {
    const center = options.center || [39.8283, -98.5795]; // Center of US
    const zoom = options.zoom || 4;

    this.map = L.map(containerId).setView(center, zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(this.map);

    return this;
  },

  /** Add locations as colored circle markers with popups */
  addLocations(locations) {
    this.clearMarkers();

    const bounds = [];

    locations.forEach((loc) => {
      if (!loc.lat || !loc.lng) return;

      const color = this.PIN_COLORS[loc.status] || '#6b7280';
      const marker = L.circleMarker([loc.lat, loc.lng], {
        radius: 9,
        fillColor: color,
        color: '#fff',
        weight: 2,
        fillOpacity: 0.9,
      });

      marker.bindPopup(`
        <div class="popup-name">${this.escapeHtml(loc.name)}</div>
        <div class="popup-type">${this.escapeHtml(loc.type)}</div>
        <span class="status-badge ${this.statusClass(loc.status)}" style="font-size:0.7rem;">${this.escapeHtml(loc.status)}</span>
        <div style="margin-top:0.5rem;">
          <a href="location.html?id=${loc.id}">View Details</a>
        </div>
      `);

      marker.addTo(this.map);
      this.markers.push(marker);
      bounds.push([loc.lat, loc.lng]);
    });

    // Fit map to show all markers
    if (bounds.length > 0) {
      this.map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
    }
  },

  clearMarkers() {
    this.markers.forEach((m) => m.remove());
    this.markers = [];
  },

  statusClass(status) {
    return (status || '').toLowerCase().replace(/\s+/g, '-');
  },

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  },
};
