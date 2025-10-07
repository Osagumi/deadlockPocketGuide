// elementos DOM
const cards = document.querySelectorAll('.icon-card');
const tipSection = document.getElementById('tip-section');
const tipName = document.getElementById('tip-name');
const tipList = document.getElementById('tip-list');
const counterList = document.getElementById('counter-list');
const tipImage = document.getElementById('tip-image');
const tipNameImage = document.getElementById('tip-name-image'); // <-- añadido

let charactersData = {}; // mapa name -> { tips:[], counters:[] }

// intenta cargar JSON desde varias rutas comunes
async function fetchJSONWithFallback() {
  const tries = [
    'personajes/deadlock_characters.json', // ruta si index.html está raíz
    '../personajes/deadlock_characters.json', // si script está en /js/
    './personajes/deadlock_characters.json'
  ];

  for (const path of tries) {
    try {
      const res = await fetch(path);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      console.log('JSON cargado desde', path);
      return data;
    } catch (err) {
      console.warn('No se pudo cargar JSON desde', path, err.message);
      // probar siguiente ruta
    }
  }
  throw new Error('No se pudo cargar el JSON desde ninguna ruta probada.');
}

function normalizeData(raw) {
  const map = {};
  if (!raw) return map;

  // Si raw.characters es array estandarizado
  if (Array.isArray(raw.characters)) {
    raw.characters.forEach(entry => {
      if (!entry) return;
      // caso: { "Abrams": { ... } }
      const keys = Object.keys(entry);
      if (keys.length === 1 && typeof entry[keys[0]] === 'object' && !entry.name) {
        const name = keys[0];
        const info = entry[name] || {};
        map[name] = {
          tips: Array.isArray(info.tips) ? info.tips : [],
          counters: Array.isArray(info.counters) ? info.counters : []
        };
        return;
      }

      // caso: { "name": "Cronos", "tips": [], "counters": [] }
      if (entry.name) {
        map[entry.name] = {
          tips: Array.isArray(entry.tips) ? entry.tips : [],
          counters: Array.isArray(entry.counters) ? entry.counters : []
        };
        return;
      }

      // caso generic fallback: try to find a string key whose value looks like info
      for (const k of keys) {
        if (typeof entry[k] === 'object') {
          map[k] = {
            tips: Array.isArray(entry[k].tips) ? entry[k].tips : [],
            counters: Array.isArray(entry[k].counters) ? entry[k].counters : []
          };
          break;
        }
      }
    });
  } else {
    // si el JSON no tiene characters, intentar interpretar raw como mapa
    Object.keys(raw).forEach(k => {
      const v = raw[k];
      if (v && typeof v === 'object') {
        // si ya es { name:..., tips:... } o { Abr: {...} }
        if (v.name) {
          map[v.name] = {
            tips: Array.isArray(v.tips) ? v.tips : [],
            counters: Array.isArray(v.counters) ? v.counters : []
          };
        } else {
          map[k] = {
            tips: Array.isArray(v.tips) ? v.tips : [],
            counters: Array.isArray(v.counters) ? v.counters : []
          };
        }
      }
    });
  }
  return map;
}

// utilidad para generar nombres de archivo seguros
function slugifyName(name) {
  if (!name) return '';
  return name
    .toString()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

(async function init() {
  try {
    const raw = await fetchJSONWithFallback();
    charactersData = normalizeData(raw);
    console.log('charactersData keys:', Object.keys(charactersData).length);
  } catch (err) {
    console.error(err);
    // opcional: mostrar aviso al usuario
  }
})();

// listener click en iconos
cards.forEach(card => {
  card.addEventListener('click', () => {
    const name = card.dataset.name;
    const portrait = card.dataset.portrait || card.dataset.img || '';

    // mostrar sección
    tipSection.style.display = 'flex';

    // actualizar render (si existe)
    if (portrait) tipImage.src = portrait;

    // ----- AÑADIDO: cargar imagen del nombre -----
    if (tipNameImage) {
      const slug = slugifyName(name);
      const namePath = slug ? `img/${slug}_name.png` : '';
      tipNameImage.style.display = 'none';
      tipNameImage.onerror = () => { tipNameImage.style.display = 'none'; };
      tipNameImage.onload  = () => { tipNameImage.style.display = 'block'; };
      if (namePath) tipNameImage.src = namePath;
    }
    // --------------------------------------------

    // nombre (texto, opcional)

    // limpiar
    tipList.innerHTML = '';
    counterList.innerHTML = '';

    // poblar desde charactersData (si existe)
    const info = charactersData[name];
    if (info) {
      // tips
      if (Array.isArray(info.tips) && info.tips.length) {
        info.tips.forEach(t => {
          const li = document.createElement('li');
          li.textContent = t;
          tipList.appendChild(li);
        });
      } else {
        tipList.innerHTML = '<li><em>Sin tips.</em></li>';
      }

      // counters
      if (Array.isArray(info.counters) && info.counters.length) {
        info.counters.forEach(c => {
          const li = document.createElement('li');
          li.textContent = c;
          counterList.appendChild(li);
        });
      } else {
        counterList.innerHTML = '<li><em>Sin counters.</em></li>';
      }
    } else {
      tipList.innerHTML = '<li>No hay información disponible.</li>';
      counterList.innerHTML = '<li>No hay información disponible.</li>';
    }

    tipSection.scrollIntoView({ behavior: 'smooth' });
  });
});
