import React, { useEffect, useRef, useState } from 'react';
import api from '../services/api';
import './BotLogPanel.css';

const levelColors = {
  INFO: '#4ade80',
  WARN: '#facc15',
  ERROR: '#f87171',
};

function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString('fr-FR', { hour12: false }) + '.' + d.getMilliseconds().toString().padStart(3, '0');
}

export default function BotLogPanel({ botId }) {
  const [logs, setLogs] = useState([]);
  const [levelFilter, setLevelFilter] = useState({ INFO: true, WARN: true, ERROR: true });
  const [eventFilter, setEventFilter] = useState('');
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);
  const bottomRef = useRef(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    const base = api.defaults.baseURL.replace(/\/api$/, '');
    const wsUrl = base.replace(/^http/, 'ws') + `/ws/bots/${botId}/logs`;
    let ws;
    let es;
    try {
      ws = new WebSocket(wsUrl);
      ws.onmessage = e => setLogs(prev => [...prev, JSON.parse(e.data)]);
      ws.onerror = () => {
        ws.close();
        es = new EventSource(`${api.defaults.baseURL}/bots/${botId}/logs/stream`);
        es.onmessage = e => setLogs(prev => [...prev, JSON.parse(e.data)]);
      };
    } catch (err) {
      es = new EventSource(`${api.defaults.baseURL}/bots/${botId}/logs/stream`);
      es.onmessage = e => setLogs(prev => [...prev, JSON.parse(e.data)]);
    }
    return () => {
      ws && ws.close();
      es && es.close();
    };
  }, [botId]);

  useEffect(() => {
    if (autoScroll) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 5;
    setAutoScroll(atBottom);
  };

  const filteredLogs = logs.filter(l =>
    levelFilter[l.level] &&
    (!eventFilter || l.event === eventFilter) &&
    l.message.toLowerCase().includes(search.toLowerCase())
  );

  const events = Array.from(new Set(logs.map(l => l.event)));

  return (
    <div>
      <div className="controls">
        {['INFO','WARN','ERROR'].map(l => (
          <label key={l}>
            <input type="checkbox" checked={levelFilter[l]} onChange={e => setLevelFilter({...levelFilter, [l]: e.target.checked})} /> {l}
          </label>
        ))}
        <select value={eventFilter} onChange={e => setEventFilter(e.target.value)}>
          <option value="">All events</option>
          {events.map(ev => <option key={ev} value={ev}>{ev}</option>)}
        </select>
        <input placeholder="Rechercher" value={search} onChange={e => setSearch(e.target.value)} />
        <button onClick={() => setLogs([])}>Vider les logs</button>
      </div>
      <div className="log-panel" ref={containerRef} onScroll={handleScroll}>
        {filteredLogs.map((log, idx) => (
          <div key={idx} className="log-line" style={{ color: levelColors[log.level] }}>
            [{formatTime(log.ts)}] [{log.level}] <span className="badge">{log.event}</span> {log.message}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}