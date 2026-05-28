import { useState, useRef, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'https://salud-app-backend.onrender.com';

export default function Asistente({ usuarioId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function enviar() {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/asistente`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, usuario_id: usuarioId }),
      });
      const data = await response.json();
      const assistantMsg = { role: 'assistant', content: data.text };
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