/* Minimal test harness: failures go to console.error, the summary is written into the page. */
(function () {
  var passed = 0, failed = 0;
  function show(text, bad) {
    var li = document.createElement('li');
    li.textContent = text;
    if (bad) li.style.color = '#b00020';
    document.getElementById('results').appendChild(li);
  }
  window.test = function (name, fn) {
    try {
      fn();
      passed++;
      show('PASS ' + name, false);
    } catch (e) {
      failed++;
      show('FAIL ' + name + ': ' + e.message, true);
      console.error('FAIL ' + name + ': ' + e.message);
    }
  };
  window.eq = function (actual, expected, msg) {
    var a = JSON.stringify(actual), b = JSON.stringify(expected);
    if (a !== b) throw new Error((msg || 'not equal') + ' (got ' + a + ', expected ' + b + ')');
  };
  window.ok = function (value, msg) {
    if (!value) throw new Error(msg || 'expected truthy');
  };
  window.done = function () {
    var s = document.getElementById('summary');
    s.textContent = passed + ' passed, ' + failed + ' failed';
    s.dataset.failed = String(failed);
    if (!failed) console.log('all ' + passed + ' tests passed');
  };
})();
