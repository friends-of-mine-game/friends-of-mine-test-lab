(() => {
  const requested = new URLSearchParams(location.search).get('test') || 'socios-v1';
  const allowed = new Set(['socios-v1', 'smoke-test']);
  const id = allowed.has(requested) ? requested : 'socios-v1';
  document.write(`<script src="tests/${id}.js"><\/script>`);
})();
