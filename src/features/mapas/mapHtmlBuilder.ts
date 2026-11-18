import { TrechoColheita } from './trechosStorage';

export type MapLayerType = 'osm' | 'satellite' | 'terrain';

export interface MapTileConfig {
  url: string;
  maxZ: number;
  label: string;
}

export const MAP_TILE_SERVERS: Record<MapLayerType, MapTileConfig> = {
  osm: {
    url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    maxZ: 20,
    label: 'Padrão',
  },
  satellite: {
    url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    maxZ: 20,
    label: 'Satélite',
  },
  terrain: {
    url: 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
    maxZ: 20,
    label: 'Terreno',
  },
};

export interface MapApontamentoPin {
  id: string;
  latitude: number;
  longitude: number;
  litros: number;
  dataIso: string;
}

export interface MapHtmlParams {
  layer: MapLayerType;
  userLat: number;
  userLng: number;
  trechoAtivo: TrechoColheita | null;
  historicoTrechos: TrechoColheita[];
  trechoFocadoId?: string | null;
  apontamentos: MapApontamentoPin[];
}

function escapeHtmlJson(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

/**
 * Gera página HTML5 interativa para o mapa da lavoura via @expo/dom-webview.
 * Online: usa Leaflet + camadas Satélite/Padrão/Terreno sem depender de Google Maps SDK Key nativa.
 * Offline: ativa automaticamente uma grade SVG proporcional de coordenadas GPS (nunca tela cinza).
 */
export function gerarHtmlMapaLavoura(params: MapHtmlParams): string {
  const payloadJson = escapeHtmlJson({
    layer: params.layer,
    tiles: MAP_TILE_SERVERS,
    userLat: params.userLat,
    userLng: params.userLng,
    trechoAtivo: params.trechoAtivo,
    historicoTrechos: params.historicoTrechos,
    trechoFocadoId: params.trechoFocadoId || null,
    apontamentos: params.apontamentos,
  });

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>SafraCafé - Mapa da Lavoura</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #132a1e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    #map { width: 100%; height: 100%; display: none; }
    #offline-canvas {
      width: 100%; height: 100%; display: flex; flex-direction: column;
      background: radial-gradient(circle at top right, #1b4332 0%, #0f2419 100%);
      color: #ecfdf5;
    }
    .offline-banner {
      padding: 10px 14px; background: rgba(16, 185, 129, 0.16);
      border-bottom: 1px solid rgba(16, 185, 129, 0.35);
      font-size: 12px; font-weight: 700; display: flex; justify-content: space-between; align-items: center;
    }
    .offline-svg-wrap { flex: 1; position: relative; overflow: hidden; }
    svg { width: 100%; height: 100%; display: block; }
    .dot-pin {
      width: 18px; height: 18px; border-radius: 50%;
      border: 3px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.45);
    }
    .dot-pulse {
      width: 22px; height: 22px; border-radius: 50%;
      border: 3px solid #ffffff; background: #16a34a;
      box-shadow: 0 0 0 6px rgba(22,163,74,0.32), 0 2px 8px rgba(0,0,0,0.45);
    }
    .leaflet-popup-content-wrapper { border-radius: 12px; }
    .popup-title { font-weight: 800; color: #1b4332; font-size: 13px; margin-bottom: 2px; }
    .popup-sub { color: #374151; font-size: 12px; }
    .popup-coord { color: #6b7280; font-size: 11px; margin-top: 3px; }
  </style>
</head>
<body>
  <div id="offline-canvas">
    <div class="offline-banner">
      <span id="offline-status">📡 Carregando mapa da lavoura...</span>
      <span id="offline-count"></span>
    </div>
    <div class="offline-svg-wrap" id="offline-svg-wrap"></div>
  </div>
  <div id="map"></div>

  <script>
    window.__SAFRACAFE_DATA__ = ${payloadJson};

    function renderOfflineSvg(statusText) {
      var data = window.__SAFRACAFE_DATA__;
      var offlineEl = document.getElementById('offline-canvas');
      var mapEl = document.getElementById('map');
      mapEl.style.display = 'none';
      offlineEl.style.display = 'flex';
      document.getElementById('offline-status').textContent = statusText || '🧭 Modo Offline — Grade de Coordenadas GPS';

      var points = [];
      points.push({ lat: data.userLat, lng: data.userLng, color: '#2563eb', label: 'Você' });

      if (data.trechoAtivo) {
        points.push({ lat: data.trechoAtivo.inicioLat, lng: data.trechoAtivo.inicioLng, color: '#16a34a', label: 'ATIVO: ' + data.trechoAtivo.talhao });
      }
      data.historicoTrechos.forEach(function (t) {
        points.push({ lat: t.inicioLat, lng: t.inicioLng, color: '#10b981', label: 'Início ' + t.talhao });
        if (typeof t.fimLat === 'number' && typeof t.fimLng === 'number') {
          points.push({ lat: t.fimLat, lng: t.fimLng, color: '#dc2626', label: 'Fim (' + (t.distanciaMetros || 0) + 'm)' });
        }
      });
      data.apontamentos.forEach(function (a, i) {
        points.push({ lat: a.latitude, lng: a.longitude, color: '#0284c7', label: 'Balaio #' + (i + 1) + ' (' + a.litros + 'L)' });
      });

      document.getElementById('offline-count').textContent = points.length + ' pts';

      var minLat = points[0].lat, maxLat = points[0].lat;
      var minLng = points[0].lng, maxLng = points[0].lng;
      points.forEach(function (p) {
        if (p.lat < minLat) minLat = p.lat;
        if (p.lat > maxLat) maxLat = p.lat;
        if (p.lng < minLng) minLng = p.lng;
        if (p.lng > maxLng) maxLng = p.lng;
      });

      var padLat = Math.max((maxLat - minLat) * 0.25, 0.0008);
      var padLng = Math.max((maxLng - minLng) * 0.25, 0.0008);
      minLat -= padLat; maxLat += padLat;
      minLng -= padLng; maxLng += padLng;

      function proj(lat, lng) {
        var x = 40 + ((lng - minLng) / (maxLng - minLng || 1)) * 320;
        var y = 40 + ((maxLat - lat) / (maxLat - minLat || 1)) * 420;
        return { x: x.toFixed(1), y: y.toFixed(1) };
      }

      var grid = '';
      for (var i = 0; i <= 8; i++) {
        var gx = 40 + i * 40;
        var gy = 40 + i * 52.5;
        grid += '<line x1="' + gx + '" y1="20" x2="' + gx + '" y2="480" stroke="rgba(167,243,208,0.12)" stroke-width="1"/>';
        grid += '<line x1="20" y1="' + gy + '" x2="380" y2="' + gy + '" stroke="rgba(167,243,208,0.12)" stroke-width="1"/>';
      }

      var lines = '';
      data.historicoTrechos.forEach(function (t) {
        if (typeof t.fimLat === 'number' && typeof t.fimLng === 'number') {
          var p1 = proj(t.inicioLat, t.inicioLng);
          var p2 = proj(t.fimLat, t.fimLng);
          var stroke = (data.trechoFocadoId === t.id) ? '#f59e0b' : '#10b981';
          lines += '<line x1="' + p1.x + '" y1="' + p1.y + '" x2="' + p2.x + '" y2="' + p2.y + '" stroke="' + stroke + '" stroke-width="4" stroke-linecap="round"/>';
        }
      });

      var circles = '';
      points.forEach(function (p) {
        var pt = proj(p.lat, p.lng);
        circles += '<circle cx="' + pt.x + '" cy="' + pt.y + '" r="7" fill="' + p.color + '" stroke="#fff" stroke-width="2.5"/>';
        circles += '<text x="' + (parseFloat(pt.x) + 10) + '" y="' + (parseFloat(pt.y) + 4) + '" fill="#ecfdf5" font-size="11" font-weight="700">' + p.label.replace(/[<>&]/g, '') + '</text>';
      });

      document.getElementById('offline-svg-wrap').innerHTML =
        '<svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid meet">' + grid + lines + circles + '</svg>';
    }

    renderOfflineSvg('📡 Conectando aos mapas de satélite...');
  </script>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" onload="initLeafletMap()" onerror="renderOfflineSvg('🧭 Modo Offline — Grade de Coordenadas GPS')"></script>
  <script>
    var leafletMap = null;
    var activeTileLayer = null;
    var allLatLngs = [];

    function esc(s) {
      return String(s || '').replace(/[<>&"']/g, '');
    }

    function makeIcon(bg, isPulse) {
      return L.divIcon({
        className: '',
        html: '<div class="' + (isPulse ? 'dot-pulse' : 'dot-pin') + '" style="background:' + bg + ';"></div>',
        iconSize: isPulse ? [22, 22] : [18, 18],
        iconAnchor: isPulse ? [11, 11] : [9, 9],
      });
    }

    function initLeafletMap() {
      if (typeof L === 'undefined') {
        renderOfflineSvg('🧭 Modo Offline — Grade de Coordenadas GPS');
        return;
      }
      var data = window.__SAFRACAFE_DATA__;
      document.getElementById('offline-canvas').style.display = 'none';
      document.getElementById('map').style.display = 'block';

      leafletMap = L.map('map', { zoomControl: true, attributionControl: false }).setView([data.userLat, data.userLng], 17);

      window.setLayer(data.layer);
      allLatLngs = [];

      // Marcador posição GPS atual
      L.marker([data.userLat, data.userLng], { icon: makeIcon('#2563eb', false) })
        .addTo(leafletMap)
        .bindPopup('<div class="popup-title">📍 Sua Posição Atual</div><div class="popup-coord">' + data.userLat.toFixed(5) + ', ' + data.userLng.toFixed(5) + '</div>');

      // Trecho ativo
      if (data.trechoAtivo) {
        var ativoPos = [data.trechoAtivo.inicioLat, data.trechoAtivo.inicioLng];
        allLatLngs.push(ativoPos);
        L.marker(ativoPos, { icon: makeIcon('#16a34a', true) })
          .addTo(leafletMap)
          .bindPopup('<div class="popup-title">🟢 INÍCIO ATIVO: ' + esc(data.trechoAtivo.talhao) + '</div><div class="popup-sub">Colhedor: ' + esc(data.trechoAtivo.trabalhadorNome) + '</div>');
      }

      var focusedCoords = null;

      // Trechos concluídos
      data.historicoTrechos.forEach(function (t) {
        var pInicio = [t.inicioLat, t.inicioLng];
        allLatLngs.push(pInicio);
        L.marker(pInicio, { icon: makeIcon('#10b981', false) })
          .addTo(leafletMap)
          .bindPopup('<div class="popup-title">🟢 Início: ' + esc(t.talhao) + '</div><div class="popup-sub">' + esc(t.trabalhadorNome) + '</div>');

        if (typeof t.fimLat === 'number' && typeof t.fimLng === 'number') {
          var pFim = [t.fimLat, t.fimLng];
          allLatLngs.push(pFim);
          L.marker(pFim, { icon: makeIcon('#dc2626', false) })
            .addTo(leafletMap)
            .bindPopup('<div class="popup-title">🏁 Fim: ' + esc(t.talhao) + ' (' + (t.distanciaMetros || 0) + 'm)</div><div class="popup-sub">' + esc(t.trabalhadorNome) + '</div>');

          var isFocado = data.trechoFocadoId === t.id;
          L.polyline([pInicio, pFim], {
            color: isFocado ? '#f59e0b' : '#10b981',
            weight: isFocado ? 6 : 4,
            opacity: 0.92,
          }).addTo(leafletMap);

          if (isFocado) {
            focusedCoords = [pInicio, pFim];
          }
        } else if (data.trechoFocadoId === t.id) {
          focusedCoords = [pInicio];
        }
      });

      // Balaios colhidos
      data.apontamentos.forEach(function (a, index) {
        var pos = [a.latitude, a.longitude];
        allLatLngs.push(pos);
        L.marker(pos, { icon: makeIcon('#0284c7', false) })
          .addTo(leafletMap)
          .bindPopup('<div class="popup-title">☕ Balaio #' + (index + 1) + ' (' + a.litros + 'L)</div><div class="popup-coord">' + a.latitude.toFixed(5) + ', ' + a.longitude.toFixed(5) + '</div>');
      });

      setTimeout(function () {
        leafletMap.invalidateSize();
        if (focusedCoords && focusedCoords.length === 2) {
          leafletMap.fitBounds(focusedCoords, { padding: [70, 70], maxZoom: 18 });
        } else if (focusedCoords && focusedCoords.length === 1) {
          leafletMap.setView(focusedCoords[0], 18);
        } else {
          window.fitAll();
        }
      }, 150);
    }

    window.setLayer = function (layerName) {
      if (!leafletMap) return;
      var cfg = window.__SAFRACAFE_DATA__.tiles[layerName] || window.__SAFRACAFE_DATA__.tiles.satellite;
      if (activeTileLayer) leafletMap.removeLayer(activeTileLayer);
      activeTileLayer = L.tileLayer(cfg.url, { maxZoom: cfg.maxZ || 20 }).addTo(leafletMap);
    };

    window.fitAll = function () {
      if (!leafletMap) return;
      if (allLatLngs.length >= 2) {
        leafletMap.fitBounds(allLatLngs, { padding: [60, 60], maxZoom: 18 });
      } else if (allLatLngs.length === 1) {
        leafletMap.setView(allLatLngs[0], 17);
      } else {
        var d = window.__SAFRACAFE_DATA__;
        leafletMap.setView([d.userLat, d.userLng], 17);
      }
    };

    window.focusLocation = function (lat, lng, zoom) {
      if (!leafletMap) return;
      leafletMap.setView([lat, lng], zoom || 18, { animate: true });
    };

    setTimeout(function () {
      if (typeof L === 'undefined') {
        renderOfflineSvg('🧭 Modo Offline — Grade de Coordenadas GPS');
      }
    }, 3500);
  </script>
</body>
</html>`;
}
