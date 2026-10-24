/* Lead path: UTM capture into hidden fields and quote form validation. No network calls. */
(function () {
  var UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
  var HIDDEN_KEYS = UTM_KEYS.concat('landing_page');
  var STORE_KEY = 'ac_utm';
  var SERVICES = ['ceramic', 'reset', 'standard', 'addon', 'unsure'];

  function parseUtm(search) {
    var params = new URLSearchParams(search || '');
    var out = {};
    UTM_KEYS.forEach(function (k) {
      var v = (params.get(k) || '').trim().slice(0, 200);
      if (v) out[k] = v;
    });
    return out;
  }

  function readStored(storage) {
    try {
      var raw = storage && storage.getItem(STORE_KEY);
      var data = raw ? JSON.parse(raw) : null;
      return data && typeof data === 'object' ? data : null;
    } catch (e) {
      return null;
    }
  }

  // First touch in the session wins, unless the visitor arrives again with new UTM parameters.
  function rememberUtm(search, storage, path) {
    var utm = parseUtm(search);
    var stored = readStored(storage);
    var data;
    if (Object.keys(utm).length || !stored) {
      data = utm;
      data.landing_page = String(path || '').slice(0, 200);
      try { if (storage) storage.setItem(STORE_KEY, JSON.stringify(data)); } catch (e) { /* storage full or blocked */ }
    } else {
      data = stored;
    }
    return data;
  }

  function fillHidden(form, data) {
    HIDDEN_KEYS.forEach(function (k) {
      var field = form.elements[k];
      if (field) field.value = data[k] || '';
    });
  }

  function normalizePhone(value) {
    var digits = String(value || '').replace(/\D/g, '');
    if (digits.length === 11 && digits.charAt(0) === '1') digits = digits.slice(1);
    return digits.length === 10 ? digits : '';
  }

  function validate(values) {
    var errors = {};
    if (String(values.name || '').trim().length < 2) errors.name = 'Please enter your name.';
    if (!normalizePhone(values.phone)) errors.phone = 'Please enter a 10-digit phone number.';
    if (!values.vehicle) errors.vehicle = 'Please choose your vehicle type.';
    if (!values.service) errors.service = 'Please choose a service.';
    return errors;
  }

  function presetService(form, search) {
    var wanted = new URLSearchParams(search || '').get('service');
    if (wanted && SERVICES.indexOf(wanted) !== -1 && form.elements.service) form.elements.service.value = wanted;
  }

  function sessionStore() {
    try { return window.sessionStorage; } catch (e) { return null; }
  }

  function showErrors(form, errors) {
    ['name', 'phone', 'vehicle', 'service'].forEach(function (k) {
      var field = form.elements[k];
      var msg = document.getElementById(k + '-error');
      if (!field) return;
      if (errors[k]) {
        field.setAttribute('aria-invalid', 'true');
        if (msg) { msg.textContent = errors[k]; msg.hidden = false; }
      } else {
        field.removeAttribute('aria-invalid');
        if (msg) { msg.textContent = ''; msg.hidden = true; }
      }
    });
  }

  function initQuoteForm(form, opts) {
    opts = opts || {};
    var storage = 'storage' in opts ? opts.storage : sessionStore();
    var search = 'search' in opts ? opts.search : window.location.search;
    var path = opts.path || window.location.pathname;
    var go = opts.go || function (url) { window.location.assign(url); };

    fillHidden(form, rememberUtm(search, storage, path));
    presetService(form, search);

    form.addEventListener('submit', function (e) {
      // TODO-OWNER: connect the form to GHL. Until then nothing is sent anywhere.
      e.preventDefault();
      var values = {};
      ['name', 'phone', 'vehicle', 'service'].forEach(function (k) {
        values[k] = form.elements[k] ? form.elements[k].value : '';
      });
      var errors = validate(values);
      showErrors(form, errors);
      var first = Object.keys(errors)[0];
      if (first) {
        form.elements[first].focus();
        return;
      }
      go('thank-you.html');
    });
  }

  window.Lead = {
    UTM_KEYS: UTM_KEYS,
    parseUtm: parseUtm,
    rememberUtm: rememberUtm,
    fillHidden: fillHidden,
    normalizePhone: normalizePhone,
    validate: validate,
    presetService: presetService,
    initQuoteForm: initQuoteForm
  };

  // Every page records the first landing page and UTM; the quote page fills its hidden fields.
  var quoteForm = document.getElementById('quoteForm');
  if (quoteForm) initQuoteForm(quoteForm);
  else rememberUtm(window.location.search, sessionStore(), window.location.pathname);
})();
