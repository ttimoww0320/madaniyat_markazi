/* =============================================
   ИНТЕРАКТИВНАЯ КАРТА — sections/map.js
   Реальная граница Юнусабада + 5 секторов внутри неё (turf.js)
   ============================================= */
(function () {

  const CLR_DEFAULT = '#0E67B3';
  const CLR_HOVER   = '#0A5292';
  const CLR_ACTIVE  = '#0B2E4F';

  let _leafletMap  = null;
  let _layers      = {};   // sectorId → L.geoJSON layer
  let _centroids   = {};   // sectorId → {lat, lng}
  let _activeId    = null;

  /* ── HTML секции ── */
  window.renderMap = function (data) {
    return `
<section class="section section-gray map-section" id="map">
  <div class="section-header">
    <h2 class="section-title">${window.t('sections.map')}</h2>
    <p class="section-subtitle">${window.t('sections.mapSubtitle')}</p>
  </div>

  <div class="map-layout" style="position:relative;">
    <div class="map-svg-wrap">
      <div id="leaflet-map" style="width:100%;height:100%;min-height:460px;"></div>
    </div>

    <!-- SVG-стрелка поверх layout -->
    <svg id="map-connector-svg"
      style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:999;overflow:visible;">
      <defs>
        <marker id="map-arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#0E67B3"/>
        </marker>
      </defs>
    </svg>

    <div id="map-panel" class="map-panel">
      <div class="map-panel-placeholder">
        <div class="map-panel-icon"><svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 20l-6-3V4l6 3 6-3 6 3v13l-6-3-6 3z"/><path d="M9 4v13M15 7v13"/></svg></div>
        <p>${window.t('sections.mapPlaceholder')}</p>
      </div>
    </div>
  </div>
</section>`;
  };

  /* ── Вызов после вставки HTML ── */
  window._mapAfterRender = async function (data) {
    window._mapData = data;
    await _initLeaflet(data);
  };

  /* ── Рисуем стрелку от центра сектора к заголовку панели ── */
  function drawConnector(sectorId) {
    const svg = document.getElementById('map-connector-svg');
    const mapEl = document.getElementById('leaflet-map');
    if (!svg || !mapEl || !_leafletMap || !_centroids[sectorId]) return;

    // Небольшая задержка чтобы панель успела отрисоваться
    requestAnimationFrame(() => {
      const layoutRect = svg.parentElement.getBoundingClientRect();
      const mapRect    = mapEl.getBoundingClientRect();

      // Пиксели центра сектора на экране
      const pt = _leafletMap.latLngToContainerPoint(_centroids[sectorId]);
      const startX = (mapRect.left - layoutRect.left) + pt.x;
      const startY = (mapRect.top  - layoutRect.top)  + pt.y;

      // Цель: середина заголовка панели
      const header = document.querySelector('#map-panel .map-panel-header');
      if (!header) return;
      const headerRect = header.getBoundingClientRect();
      const endX = mapRect.right - layoutRect.left;   // правый край карты
      const endY = headerRect.top - layoutRect.top + headerRect.height / 2;

      // Стрелка через промежуточную точку (изгиб)
      const midX = endX - 20;
      const path = `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;

      // Обновляем SVG (оставляем defs с маркером)
      const existing = svg.querySelector('path.connector-line');
      if (existing) existing.remove();

      const el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      el.setAttribute('class', 'connector-line');
      el.setAttribute('d', path);
      el.setAttribute('fill', 'none');
      el.setAttribute('stroke', '#0E67B3');
      el.setAttribute('stroke-width', '2');
      el.setAttribute('stroke-dasharray', '7,4');
      el.setAttribute('marker-end', 'url(#map-arrow)');
      el.style.animation = 'connectorDraw 0.4s ease';
      svg.appendChild(el);
    });
  }

  function clearConnector() {
    const el = document.querySelector('#map-connector-svg .connector-line');
    if (el) el.remove();
  }

  /* ── Инициализация ── */
  async function _initLeaflet(data) {
    if (_leafletMap) { _leafletMap.remove(); _leafletMap = null; _layers = {}; _activeId = null; }

    const map = L.map('leaflet-map', {
      center: [41.342, 69.318],
      zoom: 13,
      zoomControl: true,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);

    /* Загружаем реальную границу района */
    let districtFeature = null;
    try { districtFeature = await fetchDistrictBoundary(); } catch (e) {}

    if (!districtFeature) return;

    /* Контур района */
    L.geoJSON(districtFeature, {
      style: { color: '#0E67B3', weight: 3, fillOpacity: 0, interactive: false }
    }).addTo(map);

    /* Затемнение всего снаружи района */
    try {
      const rings = toLeafletRings(districtFeature.geometry);
      if (rings) {
        L.polygon([[90,-180],[90,180],[-90,180],[-90,-180]], {
          holes: rings,
          color: 'none', fillColor: '#0B2E4F', fillOpacity: 0.55, interactive: false,
        }).addTo(map);
      }
    } catch (e) {}

    /* Нарезаем район на 5 секторов через turf.js */
    drawSectors(map, districtFeature, data);

    /* Центрируем карту по границам района */
    map.fitBounds(L.geoJSON(districtFeature).getBounds(), { padding: [24, 24] });

    _leafletMap = map;

    /* По умолчанию сразу открываем сектор №1 — Культурный центр №23 */
    selectSector(1, data);
  }

  /* ── Нарезка на 4 сектора внутри границы (по числу домов культуры) ── */
  function drawSectors(map, districtFeature, data) {
    const bbox = turf.bbox(districtFeature);  // [minLng, minLat, maxLng, maxLat]
    const [minLng, minLat, maxLng, maxLat] = bbox;

    const midLng = (minLng + maxLng) / 2;
    const midLat = (minLat + maxLat) / 2;

    /* 4 прямоугольника-квадранта, которые делят bounding box района */
    const boxes = [
      turf.bboxPolygon([minLng, midLat, midLng, maxLat]),  // 1 — северо-запад
      turf.bboxPolygon([midLng, midLat, maxLng, maxLat]),  // 2 — северо-восток
      turf.bboxPolygon([minLng, minLat, midLng, midLat]),  // 3 — юго-запад
      turf.bboxPolygon([midLng, minLat, maxLng, midLat]),  // 4 — юго-восток
    ];

    boxes.forEach((box, i) => {
      const sectorId = i + 1;

      /* Пересечение прямоугольника с реальной границей района */
      let sectorFeature;
      try {
        sectorFeature = turf.intersect(
          turf.feature(districtFeature.geometry),
          box
        );
      } catch (e) { return; }
      if (!sectorFeature) return;

      /* Рисуем сектор */
      const layer = L.geoJSON(sectorFeature, {
        style: {
          color: '#fff', weight: 2,
          fillColor: CLR_DEFAULT, fillOpacity: 0.52,
        }
      }).addTo(map);

      /* Центроид сектора — нужен для стрелки */
      const center = layer.getBounds().getCenter();
      _centroids[sectorId] = center;
      L.marker(center, {
        icon: L.divIcon({
          className: '',
          html: `<div style="
            background:rgba(14,103,179,0.92);color:#fff;
            font-size:14px;font-weight:700;
            width:30px;height:30px;border-radius:50%;
            display:flex;align-items:center;justify-content:center;
            border:2px solid #0A5292;pointer-events:none;">${sectorId}</div>`,
          iconSize: [30, 30], iconAnchor: [15, 15],
        }),
        interactive: false,
      }).addTo(map);

      layer.on('mouseover', () => {
        if (_activeId !== sectorId)
          layer.setStyle({ fillColor: CLR_HOVER, fillOpacity: 0.70 });
      });
      layer.on('mouseout', () => {
        if (_activeId !== sectorId)
          layer.setStyle({ fillColor: CLR_DEFAULT, fillOpacity: 0.52 });
      });
      layer.on('click', () => selectSector(sectorId, data));

      _layers[sectorId] = layer;
    });
  }

  /* ── Клик по сектору ── */
  function selectSector(id, data) {
    const sector = data.sectors.find(s => s.id === id);
    if (!sector) return;
    const sectorName = window.tData(sector.name);

    /* Сброс всех */
    Object.values(_layers).forEach(l =>
      l.setStyle({ fillColor: CLR_DEFAULT, fillOpacity: 0.52 })
    );

    /* Подсветка выбранного */
    if (_layers[id]) _layers[id].setStyle({ fillColor: CLR_ACTIVE, fillOpacity: 0.78 });
    _activeId = id;

    /* Панель справа */
    const panel = document.getElementById('map-panel');
    if (!panel) return;

    const cards = sector.mahallas.map(m => leaderCard(m)).join('');
    panel.innerHTML = `
      <div class="map-panel-header">
        <div class="map-panel-num">${Number(id)}</div>
        <div class="map-panel-name">${window.escapeHtml(sectorName)}</div>
      </div>
      <div class="map-panel-leaders">${cards}</div>`;

    /* Стрелка от сектора к заголовку */
    drawConnector(id);
  }

  /* ── Карточка МФЙ ── */
  function leaderCard(m) {
    const esc = window.escapeHtml;
    const personIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/></svg>`;
    const photo = m.leader.photo
      ? `<img src="${esc(m.leader.photo)}" class="map-leader-photo" alt="${esc(m.leader.name)}" onerror="window.imgFallback(this,'person')">`
      : `<div class="map-leader-photo map-leader-photo--empty">${personIcon}</div>`;
    const phoneIcon = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>`;
    return `
      <div class="map-leader-card">
        ${photo}
        <div class="map-leader-info">
          <div class="map-leader-mahalla">${esc(window.tData(m.name))}</div>
          <div class="map-leader-name">${esc(m.leader.name)}</div>
          <div class="map-leader-phone">${phoneIcon} ${esc(m.leader.phone)}</div>
        </div>
      </div>`;
  }

  /* ── Nominatim: граница района ── */
  async function fetchDistrictBoundary() {
    const params = new URLSearchParams({
      q: 'Yunusobod tumani, Toshkent, Uzbekistan',
      format: 'geojson',
      polygon_geojson: '1',
      limit: '3',
    });
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?${params}`,
      { headers: { 'Accept-Language': 'ru,uz' } }
    );
    const json = await res.json();
    return json.features?.find(f =>
      f.geometry?.type === 'Polygon' || f.geometry?.type === 'MultiPolygon'
    ) || json.features?.[0] || null;
  }

  /* ── GeoJSON [lng,lat] → Leaflet [lat,lng] для маски ── */
  function toLeafletRings(geometry) {
    const flip = ring => ring.map(([lng, lat]) => [lat, lng]);
    if (geometry.type === 'Polygon') return geometry.coordinates.map(flip);
    if (geometry.type === 'MultiPolygon') {
      const biggest = geometry.coordinates.reduce((a, b) =>
        a[0].length >= b[0].length ? a : b
      );
      return biggest.map(flip);
    }
    return null;
  }

})();
