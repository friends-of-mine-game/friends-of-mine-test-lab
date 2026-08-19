(() => {
  const T = window.FOM_TEST;
  const key = `fom-test-lab:${T.id}:${T.version}`;
  const formLoadedAt = Date.now();
  let i = 0;
  let responses = {};
  let startedAt;

  const $ = id => document.getElementById(id);
  const show = id => ['start', 'quiz', 'done'].forEach(x => $(x).classList.toggle('hidden', x !== id));

  $('title').textContent = T.title;
  $('intro').textContent = T.intro;

  const read = () => {
    try {
      return JSON.parse(localStorage.getItem(key) || 'null');
    } catch {
      return null;
    }
  };

  const persist = () => localStorage.setItem(key, JSON.stringify({
    test_id: T.id,
    version: T.version,
    participant: $('participant').value.trim() || null,
    started_at: startedAt,
    current_question: i,
    responses
  }));

  const draft = read();
  if (draft?.responses && Object.keys(draft.responses).length) {
    responses = draft.responses;
    startedAt = draft.started_at;
    i = Math.min(Number(draft.current_question) || 0, T.questions.length - 1);
    $('participant').value = draft.participant || '';
    $('draftNotice').textContent = `Hay un borrador guardado con ${Object.keys(responses).length} respuestas.`;
    $('draftNotice').classList.remove('hidden');
    $('resetDraft').classList.remove('hidden');
    $('begin').textContent = 'Continuar';
  }

  $('participant').oninput = () => {
    if (startedAt) persist();
  };

  $('begin').onclick = () => {
    if (!startedAt) startedAt = new Date().toISOString();
    persist();
    show('quiz');
    render();
  };

  $('resetDraft').onclick = () => {
    localStorage.removeItem(key);
    location.reload();
  };

  function save(q, field, value) {
    responses[q.id] = { ...(responses[q.id] || {}), [field]: value };
    persist();
  }

  function render() {
    const q = T.questions[i];
    $('progressText').textContent = `${i + 1} de ${T.questions.length}`;
    $('progressBar').style.width = `${(i + 1) / T.questions.length * 100}%`;
    $('section').textContent = q.section || '';
    $('question').textContent = q.text;
    $('context').textContent = q.context || '';
    $('answers').innerHTML = '';
    $('confidence').innerHTML = '';
    $('whyWrap').classList.toggle('hidden', !q.why);
    $('why').value = responses[q.id]?.why || '';

    if (q.type === 'open') {
      const ta = document.createElement('textarea');
      ta.className = 'open';
      ta.placeholder = 'Escribe tu respuesta';
      ta.value = responses[q.id]?.value || '';
      ta.oninput = () => save(q, 'value', ta.value);
      $('answers').appendChild(ta);
    } else {
      q.options.forEach(o => {
        const label = document.createElement('label');
        label.className = 'option';
        const input = document.createElement('input');
        input.type = q.type === 'multi' ? 'checkbox' : 'radio';
        input.name = q.id;
        input.value = o.id;
        const old = responses[q.id]?.value;
        input.checked = Array.isArray(old) ? old.includes(o.id) : old === o.id;
        input.onchange = () => {
          if (q.type === 'multi') {
            const values = [...document.querySelectorAll(`input[name="${q.id}"]:checked`)].map(x => x.value);
            if (q.max && values.length > q.max) {
              input.checked = false;
              return;
            }
            save(q, 'value', values);
          } else {
            save(q, 'value', input.value);
          }
        };
        label.append(input, document.createTextNode(`${o.id}. ${o.text}`));
        $('answers').appendChild(label);
      });
    }

    for (let value = 1; value <= 5; value++) {
      const label = document.createElement('label');
      label.className = 'confidence-option';
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = `confidence-${q.id}`;
      input.value = String(value);
      input.checked = responses[q.id]?.confidence === value;
      input.onchange = () => save(q, 'confidence', value);
      label.append(input, document.createTextNode(String(value)));
      $('confidence').appendChild(label);
    }

    $('back').disabled = i === 0;
    $('next').textContent = i === T.questions.length - 1 ? 'Terminar' : 'Siguiente';
    persist();
  }

  $('why').oninput = () => save(T.questions[i], 'why', $('why').value);
  $('back').onclick = () => {
    if (i > 0) {
      i--;
      persist();
      render();
    }
  };

  $('next').onclick = async () => {
    const q = T.questions[i];
    const r = responses[q.id];
    if (!r || r.value === '' || (Array.isArray(r.value) && !r.value.length)) {
      alert('Responde antes de continuar.');
      return;
    }
    if (!r.confidence) {
      alert('Indica tu confianza de 1 a 5.');
      return;
    }
    if (q.why && !$('why').value.trim()) {
      alert('Añade una frase explicando por qué.');
      return;
    }

    if (i < T.questions.length - 1) {
      i++;
      persist();
      render();
    } else {
      persist();
      show('done');
      await saveRemote();
    }
  };

  const payload = () => ({
    test_id: T.id,
    version: T.version,
    participant: $('participant').value.trim() || null,
    started_at: startedAt,
    completed_at: new Date().toISOString(),
    responses
  });

  async function saveRemote() {
    const accessKey = window.FOM_CONFIG?.splitFormsAccessKey || '';
    $('retrySave').classList.add('hidden');

    if (!accessKey) {
      $('saveMessage').textContent = 'Guardado automático pendiente de activar.';
      $('remoteStatus').textContent = 'El test sigue guardado en este navegador y puedes descargar el JSON.';
      return;
    }

    $('saveMessage').textContent = 'Guardando respuesta…';
    $('remoteStatus').textContent = '';

    const answer = payload();
    const submission = {
      access_key: accessKey,
      subject: `Friends of Mine · ${answer.test_id} · ${answer.participant || 'anónimo'}`,
      botcheck: '',
      form_loaded_at: formLoadedAt,
      test_id: answer.test_id,
      version: answer.version,
      participant: answer.participant || 'anónimo',
      started_at: answer.started_at,
      completed_at: answer.completed_at,
      response_json: JSON.stringify(answer)
    };

    try {
      const response = await fetch('https://splitforms.com/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(submission)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.success === false) {
        throw new Error(result.message || `HTTP ${response.status}`);
      }
      $('saveMessage').textContent = 'Respuesta enviada correctamente.';
      $('remoteStatus').textContent = 'Ya está disponible en el buzón de resultados.';
      localStorage.setItem(`${key}:submitted`, new Date().toISOString());
    } catch (error) {
      $('saveMessage').textContent = 'No se pudo enviar automáticamente.';
      $('remoteStatus').textContent = 'Tu respuesta sigue guardada en este navegador. Puedes reintentar o descargar el JSON.';
      $('retrySave').classList.remove('hidden');
      console.error(error);
    }
  }

  $('retrySave').onclick = saveRemote;
  $('download').onclick = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(payload(), null, 2)], { type: 'application/json' }));
    a.download = `${T.id}-${$('participant').value.trim() || 'anonimo'}-${Date.now()}.json`;
    a.click();
  };
  $('preview').onclick = () => {
    const preview = $('jsonPreview');
    preview.textContent = JSON.stringify(payload(), null, 2);
    preview.classList.toggle('hidden');
    $('preview').textContent = preview.classList.contains('hidden') ? 'Ver JSON' : 'Ocultar JSON';
  };
})();
