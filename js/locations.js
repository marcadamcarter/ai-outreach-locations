/**
 * Locations module — fetches, filters, and renders the location list + map.
 */
const Locations = {
  allLocations: [],
  filtered: [],

  async load() {
    try {
      const res = await fetch('/.netlify/functions/locations-list');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      this.allLocations = data.locations || [];
      this.filtered = [...this.allLocations];
      this.populateFilters();
      this.render();
      this.updateMap();
    } catch (err) {
      console.error('Failed to load locations:', err);
      document.getElementById('location-list').innerHTML =
        '<div class="empty-state"><h3>Unable to load locations</h3><p>Please try again later.</p></div>';
    }
  },

  populateFilters() {
    // Populate city filter with unique cities
    const cities = [...new Set(this.allLocations.map((l) => l.city).filter(Boolean))].sort();
    const citySelect = document.getElementById('filter-city');
    if (citySelect) {
      cities.forEach((city) => {
        const opt = document.createElement('option');
        opt.value = city;
        opt.textContent = city;
        citySelect.appendChild(opt);
      });
    }
  },

  applyFilters() {
    const status = document.getElementById('filter-status')?.value || '';
    const type = document.getElementById('filter-type')?.value || '';
    const city = document.getElementById('filter-city')?.value || '';

    this.filtered = this.allLocations.filter((loc) => {
      if (status && loc.status !== status) return false;
      if (type && loc.type !== type) return false;
      if (city && loc.city !== city) return false;
      return true;
    });

    this.render();
    this.updateMap();
  },

  render() {
    const container = document.getElementById('location-list');
    const countEl = document.getElementById('filter-count');
    if (!container) return;

    if (countEl) {
      countEl.textContent = this.filtered.length + ' location' + (this.filtered.length !== 1 ? 's' : '');
    }

    if (this.filtered.length === 0) {
      container.innerHTML = '<div class="empty-state"><h3>No locations found</h3><p>Try adjusting your filters or scout a new location.</p></div>';
      return;
    }

    container.innerHTML = this.filtered.map((loc) => `
      <a href="location.html?id=${loc.id}" class="location-card">
        <div class="card-header">
          <div class="card-name">${this.escapeHtml(loc.name)}</div>
          <span class="status-badge ${this.statusClass(loc.status)}">${this.escapeHtml(loc.status)}</span>
        </div>
        <div class="card-meta">${this.escapeHtml(loc.city)}${loc.state ? ', ' + this.escapeHtml(loc.state) : ''}</div>
        <div class="card-type">${this.escapeHtml(loc.type)}${loc.footTraffic ? ' &middot; ' + this.escapeHtml(loc.footTraffic) + ' traffic' : ''}</div>
      </a>
    `).join('');
  },

  updateMap() {
    if (typeof MapView !== 'undefined' && MapView.map) {
      MapView.addLocations(this.filtered);
    }
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
