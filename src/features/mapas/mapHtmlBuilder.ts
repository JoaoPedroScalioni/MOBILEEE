import { TrechoColheita } from './trechosStorage';

export type MapLayerType = 'osm' | 'satellite' | 'terrain';

export interface MapTileConfig {
  url: string;
  fallbackUrl: string;
  maxZ: number;
  label: string;
}

export const MAP_TILE_SERVERS: Record<MapLayerType, MapTileConfig> = {
  osm: {
    url: 'https://mt1.google.com/vt/lyrs=m&hl=pt-BR&gl=BR&x={x}&y={y}&z={z}',
    fallbackUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    maxZ: 19,
    label: 'Padrão',
  },
  satellite: {
    url: 'https://mt1.google.com/vt/lyrs=y&hl=pt-BR&gl=BR&x={x}&y={y}&z={z}',
    fallbackUrl:
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    maxZ: 19,
    label: 'Satélite',
  },
  terrain: {
    url: 'https://mt1.google.com/vt/lyrs=p&hl=pt-BR&gl=BR&x={x}&y={y}&z={z}',
    fallbackUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    maxZ: 18,
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
 * Gera mapa interativo estilo Google Maps 100% autônomo (zero dependências de CDN externo):
 * - Carrega tiles reais do Google Maps (Satélite Híbrido, Padrão e Terreno) com fallback Esri/OSM;
 * - Suporta arraste com o dedo, pinça (pinch-to-zoom), duplo clique, botões + / - e popups ao tocar;
 * - Caso esteja offline, exibe fundo de grade topográfica mantendo rotas, pins e distâncias visíveis.
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
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; user-select: none; }
    html, body {
      width: 100%; height: 100%; overflow: hidden;
      background: #1b2838;
      font-family: -apple-system, BlinkMacSystemFont, 'Roboto', 'Segoe UI', sans-serif;
      touch-action: none;
    }
    #viewport {
      position: relative; width: 100%; height: 100%; overflow: hidden;
      background-color: #16261e;
      background-image:
        linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px);
      background-size: 40px 40px;
    }
    #tiles-layer, #vector-layer, #markers-layer {
      position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none;
    }
    #markers-layer { pointer-events: auto; }
    .map-tile {
      position: absolute; display: block; border: 0; pointer-events: none;
      opacity: 0; transition: opacity 0.16s ease-out;
    }
    .map-tile.loaded { opacity: 1; }
    .pin-wrap {
      position: absolute; transform: translate(-50%, -100%);
      cursor: pointer; z-index: 10; pointer-events: auto;
    }
    .pin-user {
      position: absolute; transform: translate(-50%, -50%);
      width: 34px; height: 34px; border-radius: 50%;
      background: rgba(37, 99, 235, 0.22);
      display: flex; align-items: center; justify-content: center;
      pointer-events: auto; z-index: 9;
    }
    .pin-user-dot {
      width: 15px; height: 15px; border-radius: 50%;
      background: #2563eb; border: 3px solid #ffffff;
      box-shadow: 0 2px 6px rgba(0,0,0,0.45);
    }
    .pin-badge {
      position: absolute; transform: translate(-50%, -50%);
      background: rgba(15, 23, 42, 0.88); color: #fff;
      font-size: 11px; font-weight: 800; padding: 3px 8px;
      border-radius: 12px; border: 1.5px solid #10b981;
      white-space: nowrap; pointer-events: none; z-index: 8;
      box-shadow: 0 2px 6px rgba(0,0,0,0.35);
    }
    .zoom-controls {
      position: absolute; left: 14px; top: 108px; z-index: 30;
      display: flex; flex-direction: column;
      background: rgba(255,255,255,0.96); border-radius: 12px;
      box-shadow: 0 3px 12px rgba(0,0,0,0.28); overflow: hidden;
    }
    .zoom-btn {
      width: 42px; height: 42px; border: 0; background: transparent;
      font-size: 22px; font-weight: 700; color: #1b4332; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
    }
    .zoom-btn:active { background: #e2e8f0; }
    .zoom-sep { height: 1px; background: #e2e8f0; }
    #net-badge {
      position: absolute; top: 108px; left: 68px; z-index: 30;
      background: rgba(15, 23, 42, 0.85); color: #f8fafc;
      padding: 6px 11px; border-radius: 999px; font-size: 11px; font-weight: 700;
      display: none; align-items: center; gap: 6px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }
    #info-card {
      position: absolute; top: 108px; right: 74px; left: 68px;
      background: #ffffff; border-radius: 14px; padding: 12px 14px;
      box-shadow: 0 6px 20px rgba(0,0,0,0.32); z-index: 40;
      display: none; border-left: 4px solid #1b4332;
    }
    .info-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
    .info-title { font-size: 14px; font-weight: 800; color: #1b4332; }
    .info-close {
      border: 0; background: #f1f5f9; color: #475569; font-weight: 800;
      width: 24px; height: 24px; border-radius: 12px; cursor: pointer; font-size: 12px;
    }
    .info-sub { font-size: 12px; color: #334155; margin-top: 4px; font-weight: 600; }
    .info-coord { font-size: 11px; color: #64748b; margin-top: 3px; }
    #google-watermark {
      position: absolute; left: 12px; bottom: 138px; z-index: 20;
      font-size: 10px; font-weight: 700; color: rgba(255,255,255,0.82);
      text-shadow: 0 1px 3px rgba(0,0,0,0.85); pointer-events: none;
    }
  </style>
</head>
<body>
  <div id="viewport">
    <div id="tiles-layer"></div>
    <svg id="vector-layer"></svg>
    <div id="markers-layer"></div>

    <div class="zoom-controls">
      <button class="zoom-btn" id="btn-zoom-in" aria-label="Aproximar">+</button>
      <div class="zoom-sep"></div>
      <button class="zoom-btn" id="btn-zoom-out" aria-label="Afastar">−</button>
    </div>

    <div id="net-badge">🧭 Grade Offline (sem sinal para satélite)</div>

    <div id="info-card">
      <div class="info-header">
        <div class="info-title" id="info-title"></div>
        <button class="info-close" id="info-close">✕</button>
      </div>
      <div class="info-sub" id="info-sub"></div>
      <div class="info-coord" id="info-coord"></div>
    </div>

    <div id="google-watermark">SafraCafé • Google Tiles / GPS</div>
  </div>

  <script>
    (function () {
      var data = ${payloadJson};
      var viewport = document.getElementById('viewport');
      var tilesLayer = document.getElementById('tiles-layer');
      var vectorLayer = document.getElementById('vector-layer');
      var markersLayer = document.getElementById('markers-layer');
      var netBadge = document.getElementById('net-badge');
      var infoCard = document.getElementById('info-card');
      var infoTitle = document.getElementById('info-title');
      var infoSub = document.getElementById('info-sub');
      var infoCoord = document.getElementById('info-coord');

      var currentLayer = data.layer || 'satellite';
      var centerLat = data.userLat;
      var centerLng = data.userLng;
      var zoom = 17;
      var minZoom = 4;
      var maxZoom = 19;

      var tileCache = {};
      var loadedCount = 0;
      var failedCount = 0;

      function esc(s) {
        return String(s || '').replace(/[<>&"']/g, '');
      }

      function latLngToWorld(lat, lng, z) {
        var scale = 256 * Math.pow(2, z);
        var x = ((lng + 180) / 360) * scale;
        var sinLat = Math.sin((lat * Math.PI) / 180);
        sinLat = Math.max(-0.9999, Math.min(0.9999, sinLat));
        var y = (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale;
        return { x: x, y: y };
      }

      function worldToLatLng(wx, wy, z) {
        var scale = 256 * Math.pow(2, z);
        var lng = (wx / scale) * 360 - 180;
        var n = Math.PI - (2 * Math.PI * wy) / scale;
        var lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
        return { lat: Math.max(-85, Math.min(85, lat)), lng: lng };
      }

      function buildPinSvg(fillColor, innerText) {
        return (
          '<svg width="32" height="40" viewBox="0 0 32 40">' +
          '<path d="M16 1C8.3 1 2 7.3 2 15c0 9.8 14 24 14 24s14-14.2 14-24C30 7.3 23.7 1 16 1z" fill="' +
          fillColor + '" stroke="#ffffff" stroke-width="2.5"/>' +
          '<circle cx="16" cy="14" r="6" fill="#ffffff"/>' +
          (innerText ? '<text x="16" y="17.5" text-anchor="middle" font-size="9" font-weight="800" fill="' + fillColor + '">' + esc(innerText) + '</text>' : '') +
          '</svg>'
        );
      }

      function showInfo(title, sub, lat, lng) {
        infoTitle.textContent = title;
        infoSub.textContent = sub;
        infoCoord.textContent = 'GPS: ' + lat.toFixed(5) + ', ' + lng.toFixed(5);
        infoCard.style.display = 'block';
      }

      document.getElementById('info-close').addEventListener('click', function (e) {
        e.stopPropagation();
        infoCard.style.display = 'none';
      });

      function buildMarkersList() {
        var list = [];
        if (data.trechoAtivo) {
          list.push({
            id: 'ativo',
            lat: data.trechoAtivo.inicioLat,
            lng: data.trechoAtivo.inicioLng,
            color: '#16a34a',
            badge: '▶',
            title: '🟢 Início Ativo: ' + data.trechoAtivo.talhao,
            sub: 'Colhedor: ' + data.trechoAtivo.trabalhadorNome + ' • Em andamento',
          });
        }
        data.historicoTrechos.forEach(function (t) {
          list.push({
            id: t.id + '-ini',
            lat: t.inicioLat,
            lng: t.inicioLng,
            color: '#10b981',
            badge: 'I',
            title: '🟢 Início: ' + t.talhao,
            sub: t.trabalhadorNome,
          });
          if (typeof t.fimLat === 'number' && typeof t.fimLng === 'number') {
            list.push({
              id: t.id + '-fim',
              lat: t.fimLat,
              lng: t.fimLng,
              color: '#dc2626',
              badge: 'F',
              title: '🏁 Fim: ' + t.talhao + ' (' + (t.distanciaMetros || 0) + 'm)',
              sub: t.trabalhadorNome,
            });
          }
        });
        data.apontamentos.forEach(function (a, idx) {
          list.push({
            id: a.id,
            lat: a.latitude,
            lng: a.longitude,
            color: '#0284c7',
            badge: String(idx + 1),
            title: '☕ Balaio #' + (idx + 1) + ' (' + a.litros + 'L)',
            sub: 'Registrado na lavoura',
          });
        });
        return list;
      }

      var markersData = buildMarkersList();

      function resolveTileUrl(layerName, tx, ty, tz, useFallback) {
        var cfg = data.tiles[layerName] || data.tiles.satellite;
        var hostIdx = Math.abs(tx + ty) % 4;
        var tpl = useFallback ? cfg.fallbackUrl : cfg.url.replace('mt1.google.com', 'mt' + hostIdx + '.google.com');
        return tpl
          .replace('{z}', String(tz))
          .replace('{x}', String(tx))
          .replace('{y}', String(ty));
      }

      function render() {
        var W = viewport.clientWidth || window.innerWidth || 360;
        var H = viewport.clientHeight || window.innerHeight || 640;

        var tz = Math.max(minZoom, Math.min(maxZoom, Math.round(zoom)));
        var tileScale = Math.pow(2, zoom - tz);
        var centerPx = latLngToWorld(centerLat, centerLng, tz);

        var halfW = (W / 2) / tileScale;
        var halfH = (H / 2) / tileScale;
        var numTiles = Math.pow(2, tz);

        var minTx = Math.floor((centerPx.x - halfW) / 256);
        var maxTx = Math.floor((centerPx.x + halfW) / 256);
        var minTy = Math.max(0, Math.floor((centerPx.y - halfH) / 256));
        var maxTy = Math.min(numTiles - 1, Math.floor((centerPx.y + halfH) / 256));

        var neededKeys = {};
        var sizePx = 256 * tileScale + 0.9;

        for (var tx = minTx; tx <= maxTx; tx++) {
          var wrappedTx = ((tx % numTiles) + numTiles) % numTiles;
          for (var ty = minTy; ty <= maxTy; ty++) {
            var key = currentLayer + ':' + tz + ':' + tx + ':' + ty;
            neededKeys[key] = true;

            var left = W / 2 + (tx * 256 - centerPx.x) * tileScale;
            var top = H / 2 + (ty * 256 - centerPx.y) * tileScale;

            var img = tileCache[key];
            if (!img) {
              img = document.createElement('img');
              img.className = 'map-tile';
              img.setAttribute('data-fallback', '0');
              (function (tileImg, lx, ly, lz, ln) {
                tileImg.onload = function () {
                  tileImg.classList.add('loaded');
                  loadedCount++;
                  netBadge.style.display = 'none';
                };
                tileImg.onerror = function () {
                  if (tileImg.getAttribute('data-fallback') === '0') {
                    tileImg.setAttribute('data-fallback', '1');
                    tileImg.src = resolveTileUrl(ln, lx, ly, lz, true);
                  } else {
                    failedCount++;
                    if (loadedCount === 0 && failedCount >= 3) {
                      netBadge.style.display = 'flex';
                    }
                  }
                };
              })(img, wrappedTx, ty, tz, currentLayer);

              img.src = resolveTileUrl(currentLayer, wrappedTx, ty, tz, false);
              tileCache[key] = img;
              tilesLayer.appendChild(img);
            }

            img.style.left = left.toFixed(1) + 'px';
            img.style.top = top.toFixed(1) + 'px';
            img.style.width = sizePx.toFixed(1) + 'px';
            img.style.height = sizePx.toFixed(1) + 'px';
          }
        }

        Object.keys(tileCache).forEach(function (k) {
          if (!neededKeys[k]) {
            var el = tileCache[k];
            if (el.parentNode) el.parentNode.removeChild(el);
            delete tileCache[k];
          }
        });

        function toScreen(lat, lng) {
          var p = latLngToWorld(lat, lng, tz);
          return {
            x: W / 2 + (p.x - centerPx.x) * tileScale,
            y: H / 2 + (p.y - centerPx.y) * tileScale,
          };
        }

        // Linhas dos trechos (SVG)
        var svgHtml = '';
        var markerHtml = '';

        data.historicoTrechos.forEach(function (t) {
          if (typeof t.fimLat === 'number' && typeof t.fimLng === 'number') {
            var s1 = toScreen(t.inicioLat, t.inicioLng);
            var s2 = toScreen(t.fimLat, t.fimLng);
            var isFocado = data.trechoFocadoId === t.id;
            var stroke = isFocado ? '#f59e0b' : '#10b981';
            svgHtml += '<line x1="' + s1.x.toFixed(1) + '" y1="' + s1.y.toFixed(1) + '" x2="' + s2.x.toFixed(1) + '" y2="' + s2.y.toFixed(1) + '" stroke="rgba(0,0,0,0.45)" stroke-width="' + (isFocado ? 9 : 7) + '" stroke-linecap="round"/>';
            svgHtml += '<line x1="' + s1.x.toFixed(1) + '" y1="' + s1.y.toFixed(1) + '" x2="' + s2.x.toFixed(1) + '" y2="' + s2.y.toFixed(1) + '" stroke="' + stroke + '" stroke-width="' + (isFocado ? 5 : 4) + '" stroke-linecap="round"/>';

            var midX = (s1.x + s2.x) / 2;
            var midY = (s1.y + s2.y) / 2;
            markerHtml += '<div class="pin-badge" style="left:' + midX.toFixed(1) + 'px;top:' + midY.toFixed(1) + 'px;">' + esc(t.talhao) + ' • ' + (t.distanciaMetros || 0) + 'm</div>';
          }
        });

        vectorLayer.innerHTML = svgHtml;

        // Marcador GPS do usuário
        var uPos = toScreen(data.userLat, data.userLng);
        markerHtml += '<div class="pin-user" data-idx="-1" style="left:' + uPos.x.toFixed(1) + 'px;top:' + uPos.y.toFixed(1) + 'px;"><div class="pin-user-dot"></div></div>';

        // Marcadores de pontos e balaios
        markersData.forEach(function (m, idx) {
          var pos = toScreen(m.lat, m.lng);
          markerHtml += '<div class="pin-wrap" data-idx="' + idx + '" style="left:' + pos.x.toFixed(1) + 'px;top:' + pos.y.toFixed(1) + 'px;">' + buildPinSvg(m.color, m.badge) + '</div>';
        });

        markersLayer.innerHTML = markerHtml;
      }

      markersLayer.addEventListener('click', function (e) {
        var el = e.target;
        while (el && el !== markersLayer) {
          if (el.getAttribute && el.getAttribute('data-idx') !== null) {
            var idx = parseInt(el.getAttribute('data-idx'), 10);
            if (idx === -1) {
              showInfo('📍 Sua Posição Atual', 'Localização capturada pelo GPS do aparelho', data.userLat, data.userLng);
            } else if (markersData[idx]) {
              var m = markersData[idx];
              showInfo(m.title, m.sub, m.lat, m.lng);
            }
            return;
          }
          el = el.parentNode;
        }
      });

      function fitCoordinates(coords) {
        if (!coords || coords.length === 0) {
          centerLat = data.userLat;
          centerLng = data.userLng;
          zoom = 17;
          render();
          return;
        }
        if (coords.length === 1) {
          centerLat = coords[0][0];
          centerLng = coords[0][1];
          zoom = 18;
          render();
          return;
        }
        var minLat = coords[0][0], maxLat = coords[0][0];
        var minLng = coords[0][1], maxLng = coords[0][1];
        coords.forEach(function (c) {
          if (c[0] < minLat) minLat = c[0];
          if (c[0] > maxLat) maxLat = c[0];
          if (c[1] < minLng) minLng = c[1];
          if (c[1] > maxLng) maxLng = c[1];
        });
        centerLat = (minLat + maxLat) / 2;
        centerLng = (minLng + maxLng) / 2;

        var W = (viewport.clientWidth || window.innerWidth || 360) * 0.72;
        var H = (viewport.clientHeight || window.innerHeight || 640) * 0.56;
        for (var z = 18; z >= 4; z--) {
          var p1 = latLngToWorld(maxLat, minLng, z);
          var p2 = latLngToWorld(minLat, maxLng, z);
          if (Math.abs(p2.x - p1.x) <= W && Math.abs(p2.y - p1.y) <= H) {
            zoom = z;
            break;
          }
        }
        render();
      }

      // Controles de toque (arraste + pinça + duplo toque)
      var dragging = false;
      var lastX = 0;
      var lastY = 0;
      var pinchDist = 0;
      var lastTapTime = 0;

      function touchDist(t1, t2) {
        var dx = t1.clientX - t2.clientX;
        var dy = t1.clientY - t2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
      }

      viewport.addEventListener('touchstart', function (e) {
        if (e.touches.length === 1) {
          var now = Date.now();
          if (now - lastTapTime < 280) {
            zoom = Math.min(maxZoom, zoom + 1);
            render();
            lastTapTime = 0;
            return;
          }
          lastTapTime = now;
          dragging = true;
          lastX = e.touches[0].clientX;
          lastY = e.touches[0].clientY;
        } else if (e.touches.length === 2) {
          dragging = false;
          pinchDist = touchDist(e.touches[0], e.touches[1]);
        }
      }, { passive: true });

      viewport.addEventListener('touchmove', function (e) {
        if (e.touches.length === 1 && dragging) {
          var x = e.touches[0].clientX;
          var y = e.touches[0].clientY;
          var dx = x - lastX;
          var dy = y - lastY;
          lastX = x;
          lastY = y;

          var cp = latLngToWorld(centerLat, centerLng, zoom);
          var nc = worldToLatLng(cp.x - dx, cp.y - dy, zoom);
          centerLat = nc.lat;
          centerLng = nc.lng;
          render();
        } else if (e.touches.length === 2 && pinchDist > 0) {
          var d = touchDist(e.touches[0], e.touches[1]);
          var deltaZ = Math.log(d / pinchDist) / Math.LN2;
          pinchDist = d;
          zoom = Math.max(minZoom, Math.min(maxZoom, zoom + deltaZ));
          render();
        }
      }, { passive: true });

      viewport.addEventListener('touchend', function () {
        dragging = false;
        pinchDist = 0;
      }, { passive: true });

      viewport.addEventListener('mousedown', function (e) {
        dragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
      });
      window.addEventListener('mousemove', function (e) {
        if (!dragging) return;
        var dx = e.clientX - lastX;
        var dy = e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;
        var cp = latLngToWorld(centerLat, centerLng, zoom);
        var nc = worldToLatLng(cp.x - dx, cp.y - dy, zoom);
        centerLat = nc.lat;
        centerLng = nc.lng;
        render();
      });
      window.addEventListener('mouseup', function () { dragging = false; });

      document.getElementById('btn-zoom-in').addEventListener('click', function () {
        zoom = Math.min(maxZoom, Math.round(zoom) + 1);
        render();
      });
      document.getElementById('btn-zoom-out').addEventListener('click', function () {
        zoom = Math.max(minZoom, Math.round(zoom) - 1);
        render();
      });

      window.setLayer = function (layerName) {
        currentLayer = layerName || 'satellite';
        loadedCount = 0;
        failedCount = 0;
        Object.keys(tileCache).forEach(function (k) {
          var el = tileCache[k];
          if (el.parentNode) el.parentNode.removeChild(el);
          delete tileCache[k];
        });
        render();
      };

      window.fitAll = function () {
        var all = [];
        if (data.trechoAtivo) all.push([data.trechoAtivo.inicioLat, data.trechoAtivo.inicioLng]);
        data.historicoTrechos.forEach(function (t) {
          all.push([t.inicioLat, t.inicioLng]);
          if (typeof t.fimLat === 'number' && typeof t.fimLng === 'number') {
            all.push([t.fimLat, t.fimLng]);
          }
        });
        data.apontamentos.forEach(function (a) {
          all.push([a.latitude, a.longitude]);
        });
        if (all.length === 0) all.push([data.userLat, data.userLng]);
        fitCoordinates(all);
      };

      window.focusLocation = function (lat, lng, targetZoom) {
        centerLat = lat;
        centerLng = lng;
        if (typeof targetZoom === 'number') zoom = targetZoom;
        render();
      };

      window.addEventListener('resize', render);

      // Enquadramento inicial inteligente: trecho focado > todos os pontos
      var focused = null;
      if (data.trechoFocadoId) {
        data.historicoTrechos.forEach(function (t) {
          if (t.id === data.trechoFocadoId) {
            focused = [[t.inicioLat, t.inicioLng]];
            if (typeof t.fimLat === 'number' && typeof t.fimLng === 'number') {
              focused.push([t.fimLat, t.fimLng]);
            }
          }
        });
        if (!focused && data.trechoAtivo && data.trechoAtivo.id === data.trechoFocadoId) {
          focused = [[data.trechoAtivo.inicioLat, data.trechoAtivo.inicioLng]];
        }
      }

      if (focused) {
        fitCoordinates(focused);
      } else {
        window.fitAll();
      }
    })();
  </script>
</body>
</html>`;
}
