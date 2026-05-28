import { useState, useRef, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'https://salud-app-backend.onrender.com';
const ANTHROPIC_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

export default function Asistente({ usuarioId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [contexto, setContexto] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    cargarContexto();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function cargarContexto() {
    try {
      const [turnos, medicinas, condiciones] = await Promise.all([
        fetch(`${API_URL}/turnos?usuario_id=${usuarioId}`).then(r => r.json()),
        fetch(`${API_URL}/medicinas?usuario_id=${usuarioId}`).then(r => r.json()),
        fetch(`${API_URL}/condiciones?usuario_id=${usuarioId}`).then(r => r.json()),
      ]);
      setContexto({ turnos, medicinas, condiciones });
    } catch (e) {
      console.error('Error cargando contexto:', e);
    }
  }

  function buildSystemPrompt() {
    if (!contexto) return 'Sos un asistente de salud personal. Respondé en español, de forma clara y empática.';
    return `Sos un asistente de salud personal. Respondé en español, de forma clara y empática.
No reemplazás a un médico — siempre recomendá consultar un profesional ante dudas serias.

Datos actuales del paciente:

TURNOS MÉDICOS:
${contexto.turnos?.length ? contexto.turnos.map(t => `- ${t.especialidad} con ${t.medico} el ${t.fecha} a las ${t.hora}`).join('\n') : 'Sin turnos registrados'}

MEDICAMENTOS:
${contexto.medicinas?.length ? contexto.medicinas.map(m => `- ${m.nombre} ${m.dosis} cada ${m.frecuencia_horas}hs`).join('\n') : 'Sin medicamentos registrados'}

CONDICIONES MÉDICAS:
${contexto.condiciones?.length ? contexto.condiciones.map(c => `- ${c.nombre}: ${c.descripcion || 'sin descripción'}`).join('\n') : 'Sin condiciones registradas'}`;
  }

  async function enviar() {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-client-side-keys-allowed': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1024,
          system: buildSystemPrompt(),
          messages: newMessages,
        }),
      });

      const data = await response.json();
      const assistantMsg = { role: 'assistant', content: data.content[0].text };
      setMessages([...newMessages, assistantMsg]);
    } catch (e) {
      setMessages([...newMessages, { role: 'assistant', content: 'Error al conectar con el asistente.' }]);
    }
    setLoading(false);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 600, gap: 12 }}>
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, padding: '8px 0' }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: '#aaa', marginTop: 40 }}>
            <p style={{ fontSize: 32 }}>🤖</p>
            <p>Hola, soy tu asistente de salud. Puedo ayudarte con tus turnos, medicamentos y condiciones médicas.</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{
            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
            background: m.role === 'user' ? '#2d7a4f' : '#2a2a2a',
            color: '#fff',
            padding: '10px 14px',
            borderRadius: 12,
            maxWidth: '75%',
            whiteSpace: 'pre-wrap',
            lineHeight: 1.5,
          }}>
            {m.content}
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: 'flex-start', background: '#2a2a2a', color: '#aaa', padding: '10px 14px', borderRadius: 12 }}>
            Escribiendo...
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <input
          className="form-input"
          style={{ flex: 1 }}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && enviar()}
          placeholder="Preguntame sobre tu salud..."
        />
        <button className="btn btn-primary" onClick={enviar} disabled={loading}>
          Enviar
        </button>
      </div>
    </div>
  );
}