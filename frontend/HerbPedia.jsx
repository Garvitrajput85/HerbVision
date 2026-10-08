import React, { useEffect, useRef, useState } from 'react';
import './herbpedia.css';

function PlantPhoto({ plant }) {
  const [photo, setPhoto] = useState(null);
  const [visible, setVisible] = useState(false);
  const photoRef = useRef(null);

  useEffect(() => {
    const node = photoRef.current;
    if (!node || !('IntersectionObserver' in window)) {
      setVisible(true);
      return undefined;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: '180px' });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return undefined;
    const term = encodeURIComponent(`filetype:bitmap ${plant.scientific_name} plant`);
    const endpoint = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${term}&gsrnamespace=6&gsrlimit=1&prop=imageinfo&iiprop=url%7Cextmetadata&iiurlwidth=720&format=json&origin=*`;
    let cancelled = false;
    fetch(endpoint)
      .then((response) => {
        if (!response.ok) throw new Error('No image found');
        return response.json();
      })
      .then((data) => {
        const image = Object.values(data.query?.pages || {})[0]?.imageinfo?.[0];
        if (!cancelled && image?.thumburl) {
          setPhoto({
            url: image.thumburl,
            page: image.descriptionurl,
            artist: image.extmetadata?.Artist?.value?.replace(/<[^>]*>/g, '') || 'Wikimedia Commons contributor',
            license: image.extmetadata?.LicenseShortName?.value || 'See file page'
          });
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [plant.scientific_name, visible]);

  return (
    <div className="herb-photo" ref={photoRef}>
      {photo ? <>
        <img src={photo.url} alt={`${plant.name} plant`} loading="lazy" />
        <a className="photo-credit" href={photo.page} target="_blank" rel="noreferrer">Photo: {photo.artist} · {photo.license}</a>
      </> : <div className="photo-placeholder" aria-label={`Photo of ${plant.name} loading or unavailable`}>
        <span aria-hidden="true">{plant.icon || '🌿'}</span>
        <small>{visible ? 'Plant photo loading…' : 'Plant photo'}</small>
      </div>}
    </div>
  );
}

function Detail({ title, value }) {
  return <div className="herb-detail"><h3>{title}</h3><p>{value}</p></div>;
}

function HerbPedia() {
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/plants')
      .then((response) => {
        if (!response.ok) throw new Error(`Plant API returned ${response.status}`);
        return response.json();
      })
      .then((data) => {
        if (!data.success) throw new Error(data.message || 'Could not load plants');
        if (!cancelled) setPlants(Array.isArray(data.plants) ? data.plants : []);
      })
      .catch((fetchError) => {
        if (!cancelled) setError(fetchError.message || 'Could not load plants from the server.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <main className="herbpedia-page">
      <header className="herbpedia-nav">
        <a className="herbpedia-brand" href="#home">🌿 HerbVision</a>
        <a href="#home" className="herbpedia-home-link">← Back to Home</a>
      </header>
      <section className="herbpedia-intro">
        <span className="herbpedia-eyebrow">HERBVISION PLANT LIBRARY</span>
        <h1>HerbPedia</h1>
        <p>Explore the plant list with botanical names and images. More verified plant details can be added as reliable information is collected.</p>
        <span className="plant-count">{loading ? 'Loading plant profiles…' : `${plants.length} plant profiles`}</span>
      </section>
      {error && <p role="alert" className="herb-load-error">Could not load plant profiles: {error}</p>}
      {!loading && !error && plants.length === 0 && <p>No plant profiles are available yet.</p>}
      <section className="herb-grid" aria-label="Plant profiles" aria-busy={loading}>
        {plants.map((plant, index) => (
          <article className="herb-card" key={`${plant.id}-${index}`}>
            <PlantPhoto plant={plant} />
            <div className="herb-card-content">
              <div className="herb-title-row">
                <span className="herb-icon" aria-hidden="true">{plant.icon || '🌿'}</span>
                <div><h2>{plant.name}</h2><p className="scientific-name"><em>{plant.scientific_name}</em></p></div>
              </div>
              {plant.plant_family && <p className="plant-family">Family: {plant.plant_family}</p>}
              {plant.description && <p className="herb-description">{plant.description}</p>}
              {plant.medicine_properties && <Detail title="Medicinal properties" value={plant.medicine_properties} />}
              {plant.uses?.length > 0 && <Detail title="Uses" value={plant.uses.join(' · ')} />}
              {plant.benefits && <Detail title="Benefits" value={plant.benefits} />}
              {plant.parts_commonly_used?.length > 0 && <Detail title="Parts commonly used" value={plant.parts_commonly_used.join(', ')} />}
              {plant.leaf_features && <Detail title="Leaf features" value={Object.entries(plant.leaf_features).map(([key, value]) => `${key}: ${value}`).join(' · ')} />}
              {plant.growing && <Detail title="Growing" value={plant.growing} />}
              {plant.note && <p className="herb-note"><strong>Note:</strong> {plant.note}</p>}
              {!plant.medicine_properties && !plant.uses?.length && !plant.benefits && !plant.growing && (
                <p className="herb-note">Uses and growing details were not included in the supplied list; this profile currently shows the provided botanical identification.</p>
              )}
            </div>
          </article>
        ))}
      </section>
      <p className="herbpedia-disclaimer">Educational information only. Verify plant identification with an expert and consult a qualified health professional before medicinal use.</p>
      <footer className="herbpedia-footer"><a href="#home">🌿 HerbVision</a><span>Learn about plants. Use knowledge responsibly.</span></footer>
    </main>
  );
}

export default HerbPedia;
