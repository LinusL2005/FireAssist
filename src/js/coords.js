'use strict';
/* Koordinatenumrechnung nach WGS84 (Grad):
   - UTM / ETRS89 (Zone 32 und 33, auch mit vorangestellter Zonennummer "32xxxxxx")
   - Gauß-Krüger / DHDN (Potsdam-Datum, Bessel), Datumsübergang mit 7-Parameter-Helmert (Genauigkeit ca. 3 m) */

const ELLIPSOID = {
  GRS80: { a: 6378137, f: 1 / 298.257222101 },
  WGS84: { a: 6378137, f: 1 / 298.257223563 },
  BESSEL: { a: 6377397.155, f: 1 / 299.1528128 },
};

/* Inverse transversale Mercatorprojektion (Reihenentwicklung nach Snyder) */
function tmInverse(E, N, ell, lon0Deg, k0, FE, FN) {
  const a = ell.a, e2 = ell.f * (2 - ell.f), ep2 = e2 / (1 - e2);
  const M = (N - FN) / k0;
  const mu = M / (a * (1 - e2 / 4 - 3 * e2 * e2 / 64 - 5 * e2 ** 3 / 256));
  const e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));
  const phi1 = mu
    + (3 * e1 / 2 - 27 * e1 ** 3 / 32) * Math.sin(2 * mu)
    + (21 * e1 ** 2 / 16 - 55 * e1 ** 4 / 32) * Math.sin(4 * mu)
    + (151 * e1 ** 3 / 96) * Math.sin(6 * mu)
    + (1097 * e1 ** 4 / 512) * Math.sin(8 * mu);
  const sin1 = Math.sin(phi1), cos1 = Math.cos(phi1), tan1 = Math.tan(phi1);
  const C1 = ep2 * cos1 * cos1, T1 = tan1 * tan1;
  const N1 = a / Math.sqrt(1 - e2 * sin1 * sin1);
  const R1 = a * (1 - e2) / Math.pow(1 - e2 * sin1 * sin1, 1.5);
  const D = (E - FE) / (N1 * k0);
  const lat = phi1 - (N1 * tan1 / R1) * (D * D / 2
    - (5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * ep2) * D ** 4 / 24
    + (61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * ep2 - 3 * C1 * C1) * D ** 6 / 720);
  const lon = lon0Deg * RAD + (D - (1 + 2 * T1 + C1) * D ** 3 / 6
    + (5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * ep2 + 24 * T1 * T1) * D ** 5 / 120) / cos1;
  return [lat / RAD, lon / RAD];
}

function geoToEcef(latD, lonD, ell) {
  const e2 = ell.f * (2 - ell.f), p = latD * RAD, l = lonD * RAD;
  const N = ell.a / Math.sqrt(1 - e2 * Math.sin(p) ** 2);
  return [N * Math.cos(p) * Math.cos(l), N * Math.cos(p) * Math.sin(l), N * (1 - e2) * Math.sin(p)];
}

function ecefToGeo(X, Y, Z, ell) {
  const e2 = ell.f * (2 - ell.f), p = Math.hypot(X, Y);
  let phi = Math.atan2(Z, p * (1 - e2)), h = 0;
  for (let i = 0; i < 6; i++) {
    const N = ell.a / Math.sqrt(1 - e2 * Math.sin(phi) ** 2);
    h = p / Math.cos(phi) - N;
    phi = Math.atan2(Z, p * (1 - e2 * N / (N + h)));
  }
  return [phi / RAD, Math.atan2(Y, X) / RAD];
}

/* DHDN -> WGS84, Deutschland gesamt (EPSG:1777, Position Vector) */
function dhdnToWgs84(latD, lonD) {
  const as = Math.PI / 648000;
  const tx = 598.1, ty = 73.7, tz = 418.2, rx = 0.202 * as, ry = 0.045 * as, rz = -2.455 * as, s = 6.7e-6;
  const [X, Y, Z] = geoToEcef(latD, lonD, ELLIPSOID.BESSEL);
  const X2 = tx + (1 + s) * (X - rz * Y + ry * Z);
  const Y2 = ty + (1 + s) * (rz * X + Y - rx * Z);
  const Z2 = tz + (1 + s) * (-ry * X + rx * Y + Z);
  return ecefToGeo(X2, Y2, Z2, ELLIPSOID.WGS84);
}

function utmToWgs84(E, N, zone) {
  if (E >= 1e7) { zone = Math.floor(E / 1e6); E = E % 1e6; }
  return tmInverse(E, N, ELLIPSOID.GRS80, zone * 6 - 183, 0.9996, 500000, 0);
}

function gkToWgs84(R, H) {
  const zone = Math.floor(R / 1e6);
  const [lat, lon] = tmInverse(R, H, ELLIPSOID.BESSEL, zone * 3, 1, zone * 1e6 + 500000, 0);
  return dhdnToWgs84(lat, lon);
}

const CRS_OPTIONS = [
  { key: 'auto', label: 'Automatisch erkennen' },
  { key: 'wgs84', label: 'WGS84 – Grad (z. B. 50,5515 / 9,6755)' },
  { key: 'utm32', label: 'UTM Zone 32 (ETRS89)' },
  { key: 'utm33', label: 'UTM Zone 33 (ETRS89)' },
  { key: 'gk', label: 'Gauß-Krüger (DHDN)' },
];

/* Rät das Koordinatensystem anhand von Beispielwerten (y = Breite/Hochwert, x = Länge/Rechtswert) */
function detectCrs(samples) {
  const ok = samples.filter(([y, x]) => Number.isFinite(y) && Number.isFinite(x));
  if (!ok.length) return { crs: 'wgs84', swap: false };
  const med = arr => arr.slice().sort((a, b) => a - b)[Math.floor(arr.length / 2)];
  let y = med(ok.map(p => p[0])), x = med(ok.map(p => p[1]));
  let swap = false;
  const test = (yy, xx) => {
    if (Math.abs(yy) <= 90 && Math.abs(xx) <= 180) return 'wgs84';
    if (yy > 5.0e6 && yy < 6.2e6) {
      if (xx >= 1e6 && xx < 6e6) return 'gk';
      if (xx >= 32e6 && xx < 34e6) return xx >= 33e6 ? 'utm33' : 'utm32';
      if (xx > 1e5 && xx < 1e6) return 'utm32';
    }
    return null;
  };
  let crs = test(y, x);
  if (crs && crs !== 'wgs84') return { crs, swap: false };
  if (!crs) {
    const c2 = test(x, y);
    if (c2) return { crs: c2, swap: true };
    return { crs: 'wgs84', swap: false };
  }
  /* WGS84: in Mitteleuropa ist die Breite (45–56) größer als die Länge (5–17) */
  if (y < 20 && x > 40 && x < 60) swap = true;
  return { crs: 'wgs84', swap };
}

/* Liefert [lat, lon] in WGS84 oder null */
function toWgs84(y, x, crs) {
  if (!Number.isFinite(y) || !Number.isFinite(x)) return null;
  let r;
  if (crs === 'wgs84') r = [y, x];
  else if (crs === 'utm32') r = utmToWgs84(x, y, 32);
  else if (crs === 'utm33') r = utmToWgs84(x, y, 33);
  else if (crs === 'gk') r = gkToWgs84(x, y);
  else return null;
  if (!r || !Number.isFinite(r[0]) || !Number.isFinite(r[1])) return null;
  if (Math.abs(r[0]) > 90 || Math.abs(r[1]) > 180) return null;
  if (r[0] === 0 && r[1] === 0) return null;
  return r;
}
