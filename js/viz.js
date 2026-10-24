/* Ceramic visualizer v1: an illustration only. Client-side, no network, no external assets. */
(function () {
  // Side views in a 400x150 box; wheels sit at y=126.
  var BODIES = {
    sedan: {
      label: 'Sedan',
      body: 'M20 120V98Q22 86 40 84L110 78L150 50Q158 44 172 44H250Q264 44 274 52L310 78L360 84Q380 88 382 100V120Q382 126 376 126H330A26 26 0 0 0 278 126H134A26 26 0 0 0 82 126H26Q20 126 20 120Z',
      glass: 'M122 80L154 54Q160 50 170 50H208V80Z M216 50H248Q260 50 268 56L298 80H216Z',
      wheels: [108, 304]
    },
    suv: {
      label: 'SUV',
      body: 'M18 120V90Q20 80 34 78L80 74L110 36Q114 30 124 30H330Q344 30 350 40L366 74Q382 78 382 92V120Q382 126 376 126H334A26 26 0 0 0 282 126H132A26 26 0 0 0 80 126H24Q18 126 18 120Z',
      glass: 'M92 74L116 40H200V74Z M208 40H280V74H208Z M288 40H340L356 74H288Z',
      wheels: [106, 308]
    },
    truck: {
      label: 'Truck',
      body: 'M16 120V92Q18 82 32 80L84 76L116 38Q120 32 130 32H196Q206 32 206 42V76H384V120Q384 126 378 126H340A26 26 0 0 0 288 126H132A26 26 0 0 0 80 126H22Q16 126 16 120Z',
      glass: 'M98 76L122 42H160V76Z M166 42H196V76H166Z',
      wheels: [106, 314]
    },
    coupe: {
      label: 'Coupe',
      body: 'M20 120V100Q22 90 40 88L120 82L170 56Q178 52 190 52H240Q252 52 262 60L320 84L362 88Q380 92 382 104V120Q382 126 376 126H330A26 26 0 0 0 278 126H134A26 26 0 0 0 82 126H26Q20 126 20 120Z',
      glass: 'M136 82L174 60Q180 57 190 57H232V82Z M240 57Q252 57 260 64L296 84H240Z',
      wheels: [108, 304]
    },
    van: {
      label: 'Van',
      body: 'M16 120V82Q18 70 30 64L66 30Q72 24 84 24H370Q384 24 384 38V120Q384 126 378 126H338A26 26 0 0 0 286 126H130A26 26 0 0 0 78 126H22Q16 126 16 120Z',
      glass: 'M40 64L72 34H120V64Z M130 34H230V64H130Z',
      wheels: [104, 312]
    }
  };

  var COLORS = {
    black: { label: 'Black', hex: '#15171a' },
    gray: { label: 'Gray', hex: '#4b5158' },
    silver: { label: 'Silver', hex: '#a7adb4' },
    white: { label: 'White', hex: '#e8e9eb' },
    red: { label: 'Red', hex: '#b0122b' },
    blue: { label: 'Blue', hex: '#1d3f86' }
  };

  var LAYERS = ['swirls', 'scratches', 'faded'];

  function initialState() {
    return { body: 'sedan', color: 'black', layers: { swirls: true, scratches: true, faded: true }, split: 50 };
  }

  function clampSplit(value, fallback) {
    var n = parseFloat(value);
    if (!isFinite(n)) return fallback;
    return Math.min(100, Math.max(0, Math.round(n)));
  }

  function copy(state) {
    return { body: state.body, color: state.color, layers: Object.assign({}, state.layers), split: state.split };
  }

  function reduce(state, action) {
    var next;
    switch (action && action.type) {
      case 'body':
        if (!Object.prototype.hasOwnProperty.call(BODIES, action.value)) return state;
        next = copy(state); next.body = action.value; return next;
      case 'color':
        if (!Object.prototype.hasOwnProperty.call(COLORS, action.value)) return state;
        next = copy(state); next.color = action.value; return next;
      case 'layer':
        if (LAYERS.indexOf(action.value) === -1) return state;
        next = copy(state); next.layers[action.value] = !!action.on; return next;
      case 'split':
        next = copy(state); next.split = clampSplit(action.value, state.split); return next;
      default:
        return state;
    }
  }

  function setAll(root, selector, attr, value) {
    root.querySelectorAll(selector).forEach(function (el) { el.setAttribute(attr, value); });
  }

  function render(root, state) {
    var body = BODIES[state.body];
    root.style.setProperty('--paint', COLORS[state.color].hex);
    root.style.setProperty('--split', state.split + '%');
    setAll(root, '.js-body', 'd', body.body);
    setAll(root, '.js-glass', 'd', body.glass);
    root.querySelectorAll('svg').forEach(function (svg) {
      svg.querySelectorAll('.js-wheel').forEach(function (w, i) { w.setAttribute('cx', String(body.wheels[i % 2])); });
    });
    LAYERS.forEach(function (name) {
      root.querySelectorAll('[data-layer="' + name + '"]').forEach(function (g) {
        if (state.layers[name]) g.removeAttribute('hidden'); else g.setAttribute('hidden', '');
      });
      var box = root.querySelector('input[name="viz-layer"][value="' + name + '"]');
      if (box) box.checked = !!state.layers[name];
    });
    var bodyRadio = root.querySelector('input[name="viz-body"][value="' + state.body + '"]');
    if (bodyRadio) bodyRadio.checked = true;
    var colorRadio = root.querySelector('input[name="viz-color"][value="' + state.color + '"]');
    if (colorRadio) colorRadio.checked = true;
    var range = root.querySelector('.js-split');
    if (range) {
      range.value = String(state.split);
      range.setAttribute('aria-valuetext', 'Before ' + state.split + '%, after ' + (100 - state.split) + '%');
    }
  }

  function init(root) {
    var state = initialState();
    render(root, state);
    function dispatch(action) {
      var next = reduce(state, action);
      if (next !== state) { state = next; render(root, state); }
    }
    root.addEventListener('input', function (e) {
      if (e.target.classList.contains('js-split')) dispatch({ type: 'split', value: e.target.value });
    });
    root.addEventListener('change', function (e) {
      var t = e.target;
      if (t.name === 'viz-body') dispatch({ type: 'body', value: t.value });
      else if (t.name === 'viz-color') dispatch({ type: 'color', value: t.value });
      else if (t.name === 'viz-layer') dispatch({ type: 'layer', value: t.value, on: t.checked });
    });
    return { getState: function () { return state; } };
  }

  window.CeramicViz = {
    BODIES: BODIES, COLORS: COLORS, LAYERS: LAYERS,
    initialState: initialState, reduce: reduce, render: render, init: init
  };

  document.querySelectorAll('[data-viz]').forEach(init);
})();
