import React, { useEffect, useMemo, useState } from 'react';
import { getNames } from './HerbPedia';
import './admin.css';

const emptyPlant = {
  id: '', name: '', scientific_name: '', hindi_name: '', plant_family: '', description: '',
  medicine_properties: '', uses: '', benefits: '', parts_commonly_used: '', growing: '',
  local_names: '', popular_names: ''
};

const listFields = ['uses', 'parts_commonly_used', 'local_names', 'popular_names'];

function toForm(plant) {
  const names = getNames(plant);
  return Object.fromEntries(Object.keys(emptyPlant).map((key) => {
    if (key === 'hindi_name') return [key, plant[key] || names.hindi];
    if (key === 'local_names' || key === 'popular_names') {
      const values = plant[key]?.length ? plant[key] : names[key === 'local_names' ? 'local' : 'popular'].split(' · ');
      return [key, values.join('\n')];
    }
    if (listFields.includes(key)) return [key, (plant[key] || []).join('\n')];
    return [key, plant[key] || ''];
  }));
}

function AdminPanel() {
  const [token, setToken] = useState(() => sessionStorage.getItem('herbvision-admin-token') || '');
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [plants, setPlants] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [form, setForm] = useState(emptyPlant);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [filter, setFilter] = useState('');

  const request = async (url, options = {}, key = token) => {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Token': key,
        ...(options.headers || {})
      }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || `Request failed (${response.status})`);
    return data;
  };

  const loadPlants = async (key = token) => {
    setLoading(true);
    setError('');
    try {
      const data = await request('/api/admin/plants', {}, key);
      setPlants(data.plants || []);
      setAuthorized(true);
      setToken(key);
      sessionStorage.setItem('herbvision-admin-token', key);
      return true;
    } catch (loadError) {
      setAuthorized(false);
      setError(loadError.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedToken = sessionStorage.getItem('herbvision-admin-token');
    if (savedToken) loadPlants(savedToken);
  }, []);

  const filteredPlants = useMemo(() => {
    const query = filter.trim().toLowerCase();
    return plants.filter((plant) => !query || `${plant.name} ${plant.scientific_name} ${plant.id}`.toLowerCase().includes(query));
  }, [filter, plants]);

  const choosePlant = (plant) => {
    setSelectedId(plant.id);
    setEditing(true);
    setForm(toForm(plant));
    setError('');
    setNotice('');
  };

  const startNew = () => {
    setSelectedId('');
    setEditing(false);
    setForm(emptyPlant);
    setError('');
    setNotice('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');
    const payload = { ...form };
    listFields.forEach((key) => {
      payload[key] = form[key].split(/[\n,]/).map((item) => item.trim()).filter(Boolean);
    });
    try {
      const url = editing ? `/api/admin/plants/${encodeURIComponent(selectedId)}` : '/api/admin/plants';
      const data = await request(url, { method: editing ? 'PUT' : 'POST', body: JSON.stringify(payload) });
      await loadPlants();
      setSelectedId(data.plant.id);
      setEditing(true);
      setForm(toForm(data.plant));
      setNotice(editing ? 'Plant profile updated.' : 'Plant profile added.');
    } catch (saveError) {
      setError(saveError.message);
    }
  };

  const deletePlant = async (plant) => {
    if (!window.confirm(`Delete ${plant.name} from the plant catalog?`)) return;
    setError('');
    setNotice('');
    try {
      await request(`/api/admin/plants/${encodeURIComponent(plant.id)}`, { method: 'DELETE' });
      await loadPlants();
      startNew();
      setNotice(`${plant.name} deleted.`);
    } catch (deleteError) {
      setError(deleteError.message);
    }
  };

  const signOut = () => {
    sessionStorage.removeItem('herbvision-admin-token');
    setToken('');
    setAuthorized(false);
    setPlants([]);
    setError('');
    setNotice('');
  };

  return (
    <main className="admin-page">
      <header className="admin-header">
        <a href="#home" className="admin-brand">🌿 HerbVisionAI</a>
        <div className="admin-header-actions">
          {authorized && <button type="button" className="admin-signout" onClick={signOut}>Lock admin</button>}
          <a href="#home" className="admin-back">← Back to Home</a>
        </div>
      </header>

      <section className="admin-intro">
        <span className="admin-eyebrow">HERBVISIONAI CONTROL CENTER</span>
        <h1>Admin Panel</h1>
        <p>Manage plant profiles shown in HerbPedia and plant search.</p>
      </section>

      {!authorized ? (
        <form className="admin-login-card" onSubmit={(event) => { event.preventDefault(); loadPlants(token); }}>
          <h2>Admin access</h2>
          {/* <p>Enter the admin key configured in <code>backend/.env</code>.</p> */}
          <label htmlFor="admin-token">Admin key</label>
          <input id="admin-token" type="password" value={token} onChange={(event) => setToken(event.target.value)} autoComplete="current-password" required />
          {error && <p className="admin-message error" role="alert">{error}</p>}
          <button className="admin-primary" type="submit" disabled={loading}>{loading ? 'Checking…' : 'Open admin panel'}</button>
        </form>
      ) : (
        <section className="admin-workspace">
          <aside className="admin-plant-list">
            <div className="admin-list-heading">
              <div><strong>{plants.length}</strong><span> plant profiles</span></div>
              <button type="button" className="admin-primary compact-button" onClick={startNew}>＋ Add plant</button>
            </div>
            <input className="admin-filter" type="search" placeholder="Find a plant…" value={filter} onChange={(event) => setFilter(event.target.value)} />
            <div className="admin-plant-items">
              {filteredPlants.map((plant) => (
                <div key={plant.id} className={`admin-plant-row ${plant.id === selectedId ? 'active' : ''}`}>
                  <button type="button" className="admin-plant-select" onClick={() => choosePlant(plant)}>
                    <strong>{plant.name}</strong><small>{plant.scientific_name}</small>
                  </button>
                  <button type="button" className="admin-delete-icon" aria-label={`Delete ${plant.name}`} title="Delete plant" onClick={() => deletePlant(plant)}>×</button>
                </div>
              ))}
              {!filteredPlants.length && <p className="admin-empty">No matching plants.</p>}
            </div>
          </aside>

          <form className="admin-editor" onSubmit={handleSubmit}>
            <div className="admin-editor-heading">
              <div><h2>{editing ? 'Edit plant profile' : 'Add a plant'}</h2><p>Required fields are plant ID, name, and scientific name.</p></div>
              {editing && <button type="button" className="admin-danger" onClick={() => deletePlant(plants.find((plant) => plant.id === selectedId))}>Delete plant</button>}
            </div>
            <div className="admin-form-grid">
              <label>Plant ID<input value={form.id} disabled={editing} onChange={(event) => setForm({ ...form, id: event.target.value })} placeholder="example-plant" required /></label>
              <label>Plant name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label>
              <label>Scientific name<input value={form.scientific_name} onChange={(event) => setForm({ ...form, scientific_name: event.target.value })} required /></label>
              <label>Hindi name<input value={form.hindi_name} onChange={(event) => setForm({ ...form, hindi_name: event.target.value })} /></label>
              <label>Plant family<input value={form.plant_family} onChange={(event) => setForm({ ...form, plant_family: event.target.value })} /></label>
              <label>Local names<textarea rows="2" value={form.local_names} onChange={(event) => setForm({ ...form, local_names: event.target.value })} placeholder="One name per line" /></label>
              <label>Popular names<textarea rows="2" value={form.popular_names} onChange={(event) => setForm({ ...form, popular_names: event.target.value })} placeholder="One name per line" /></label>
              <label>Description<textarea rows="3" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
              <label>Medicinal properties<textarea rows="3" value={form.medicine_properties} onChange={(event) => setForm({ ...form, medicine_properties: event.target.value })} /></label>
              <label>Use<textarea rows="3" value={form.uses} onChange={(event) => setForm({ ...form, uses: event.target.value })} placeholder="One use per line" /></label>
              <label>Benefits<textarea rows="3" value={form.benefits} onChange={(event) => setForm({ ...form, benefits: event.target.value })} /></label>
              <label>Parts commonly used<textarea rows="2" value={form.parts_commonly_used} onChange={(event) => setForm({ ...form, parts_commonly_used: event.target.value })} placeholder="One part per line" /></label>
              <label>Growing<textarea rows="3" value={form.growing} onChange={(event) => setForm({ ...form, growing: event.target.value })} /></label>
            </div>
            {error && <p className="admin-message error" role="alert">{error}</p>}
            {notice && <p className="admin-message success" role="status">{notice}</p>}
            <div className="admin-save-row">
              <button className="admin-primary" type="submit">{editing ? 'Save changes' : 'Add plant profile'}</button>
              <button className="admin-secondary" type="button" onClick={startNew}>Clear form</button>
            </div>
          </form>
        </section>
      )}
    </main>
  );
}

export default AdminPanel;
