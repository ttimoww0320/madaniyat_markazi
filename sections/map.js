/* =============================================
   ИНТЕРАКТИВНАЯ КАРТА — sections/map.js
   Реальная граница Юнусабада + 5 секторов внутри неё (turf.js)
   ============================================= */
(function () {

  const CLR_DEFAULT = '#2563a8';
  const CLR_HOVER   = '#1d4f8a';
  const CLR_ACTIVE  = '#1A3C6E';

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
          <polygon points="0 0, 10 3.5, 0 7" fill="#C8A84B"/>
        </marker>
      </defs>
    </svg>

    <div id="map-panel" class="map-panel">
      <div class="map-panel-placeholder">
        <div class="map-panel-icon">🗺</div>
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
      el.setAttribute('stroke', '#C8A84B');
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

    /* Золотой контур района */
    L.geoJSON(districtFeature, {
      style: { color: '#C8A84B', weight: 3, fillOpacity: 0, interactive: false }
    }).addTo(map);

    /* Затемнение всего снаружи района */
    try {
      const rings = toLeafletRings(districtFeature.geometry);
      if (rings) {
        L.polygon([[90,-180],[90,180],[-90,180],[-90,-180]], {
          holes: rings,
          color: 'none', fillColor: '#05102a', fillOpacity: 0.65, interactive: false,
        }).addTo(map);
      }
    } catch (e) {}

    /* Нарезаем район на 5 секторов через turf.js */
    drawSectors(map, districtFeature, data);

    /* Центрируем карту по границам района */
    map.fitBounds(L.geoJSON(districtFeature).getBounds(), { padding: [24, 24] });

    _leafletMap = map;
  }

  /* ── Нарезка на 5 секторов внутри границы ── */
  function drawSectors(map, districtFeature, data) {
    const bbox = turf.bbox(districtFeature);  // [minLng, minLat, maxLng, maxLat]
    const [minLng, minLat, maxLng, maxLat] = bbox;

    const midLng  = (minLng + maxLng) / 2;
    const lat1    = minLat + (maxLat - minLat) * 0.36;  // нижняя треть
    const lat2    = minLat + (maxLat - minLat) * 0.64;  // верхняя треть

    /* 5 прямоугольников которые делят bounding box района */
    const boxes = [
      turf.bboxPolygon([minLng, lat2,   midLng, maxLat]),  // 1 — северо-запад
      turf.bboxPolygon([midLng, lat2,   maxLng, maxLat]),  // 2 — северо-восток
      turf.bboxPolygon([minLng, lat1,   maxLng, lat2  ]),  // 3 — центр
      turf.bboxPolygon([minLng, minLat, midLng, lat1  ]),  // 4 — юго-запад
      turf.bboxPolygon([midLng, minLat, maxLng, lat1  ]),  // 5 — юго-восток
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
            background:rgba(26,60,110,0.92);color:#fff;
            font-size:14px;font-weight:700;
            width:30px;height:30px;border-radius:50%;
            display:flex;align-items:center;justify-content:center;
            border:2px solid #C8A84B;pointer-events:none;">${sectorId}</div>`,
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
    const photo = m.leader.photo
      ? `<img src="${esc(m.leader.photo)}" class="map-leader-photo" alt="${esc(m.leader.name)}">`
      : `<div class="map-leader-photo map-leader-photo--empty">👤</div>`;
    return `
      <div class="map-leader-card">
        ${photo}
        <div class="map-leader-info">
          <div class="map-leader-mahalla">${esc(window.tData(m.name))}</div>
          <div class="map-leader-name">${esc(m.leader.name)}</div>
          <div class="map-leader-phone">📞 ${esc(m.leader.phone)}</div>
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
