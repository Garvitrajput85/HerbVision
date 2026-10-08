import React, { useEffect, useRef, useState } from 'react';
import './herbpedia.css';

function PlantPhoto({ plant, compact = false }) {
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
    <div className={compact ? 'herb-photo compact' : 'herb-photo'} ref={photoRef}>
      {photo ? <>
        <img src={photo.url} alt={`${plant.name} plant`} loading="lazy" />
        {!compact && <a className="photo-credit" href={photo.page} target="_blank" rel="noreferrer">Photo: {photo.artist} · {photo.license}</a>}
      </> : <div className="photo-placeholder" aria-label={`Photo of ${plant.name} loading or unavailable`}>
        <span aria-hidden="true">{plant.icon || '🌿'}</span>
        {!compact && <small>{visible ? 'Plant photo loading…' : 'Plant photo'}</small>}
      </div>}
    </div>
  );
}

function DetailItem({ title, value }) {
  if (!value) return null;
  return <div className="herb-detail-item"><h3>{title}</h3><p>{value}</p></div>;
}

function HerbPedia() {
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlantId, setSelectedPlantId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/plants')
      .then((response) => {
        if (!response.ok) throw new Error(`Plant API returned ${response.status}`);
        return response.json();
      })
      .then((data) => {
        if (!data.success) throw new Error(data.message || 'Could not load plants');
        if (!cancelled) {
          const plantList = Array.isArray(data.plants) ? data.plants : [];
          setPlants(plantList);
          setSelectedPlantId(plantList[0]?.id || null);
        }
      })
      .catch((fetchError) => {
        if (!cancelled) setError(fetchError.message || 'Could not load plants from the server.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredPlants = plants.filter((plant) => {
    if (!normalizedSearch) return true;
    const searchableText = [
      plant.name,
      plant.scientific_name,
      plant.plant_family,
      plant.note,
      ...(plant.uses || []),
      ...(plant.parts_commonly_used || [])
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return searchableText.includes(normalizedSearch);
  });

  useEffect(() => {
    if (!filteredPlants.length) return;
    const isSelectedVisible = filteredPlants.some((plant) => plant.id === selectedPlantId);
    if (!isSelectedVisible) {
      setSelectedPlantId(filteredPlants[0].id);
    }
  }, [filteredPlants, selectedPlantId]);

  const selectedPlant = filteredPlants.find((plant) => plant.id === selectedPlantId) || filteredPlants[0] || null;

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

      {!loading && !error && (
        <section className="herbpedia-layout" aria-label="Plant library">
          <aside className="herb-list-panel">
            <div className="herb-search-box">
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search plant name..."
                aria-label="Search plant name"
              />
              <span className="search-results-count">{filteredPlants.length}</span>
            </div>

            <div className="herb-list" aria-live="polite">
              {filteredPlants.length > 0 ? filteredPlants.map((plant) => (
                <button
                  type="button"
                  key={plant.id}
                  className={`herb-list-item ${selectedPlant && selectedPlant.id === plant.id ? 'selected' : ''}`}
                  onClick={() => setSelectedPlantId(plant.id)}
                >
                  <PlantPhoto plant={plant} compact />
                  <span className="herb-list-copy">
                    <strong>{plant.name}</strong>
                    <small>{plant.scientific_name}</small>
                  </span>
                </button>
              )) : (
                <div className="herb-empty-state">No plant matched your search.</div>
              )}
            </div>
          </aside>

          <section className="herb-detail-panel" aria-live="polite">
            {selectedPlant ? (
              <>
                <div className="detail-top-row">
                  <div className="detail-image-wrap">
                    <PlantPhoto plant={selectedPlant} />
                  </div>

                  <div className="detail-summary">
                    <div className="detail-heading">
                      <span className="detail-icon" aria-hidden="true">{selectedPlant.icon || '🌿'}</span>
                      <div>
                        <h2>{selectedPlant.name}</h2>
                        <p className="scientific-name"><em>{selectedPlant.scientific_name}</em></p>
                      </div>
                    </div>

                    {selectedPlant.plant_family && <p className="plant-family">Family: {selectedPlant.plant_family}</p>}
                    {selectedPlant.description && <p className="herb-description">{selectedPlant.description}</p>}
                  </div>
                </div>

                <div className="herb-detail-body">
                  <div className="detail-grid">
                    <DetailItem title="Medicinal properties" value={selectedPlant.medicine_properties} />
                    <DetailItem title="Uses" value={selectedPlant.uses?.length ? selectedPlant.uses.join(' · ') : null} />
                    <DetailItem title="Benefits" value={selectedPlant.benefits} />
                    <DetailItem title="Parts commonly used" value={selectedPlant.parts_commonly_used?.length ? selectedPlant.parts_commonly_used.join(', ') : null} />
                    <DetailItem title="Leaf features" value={selectedPlant.leaf_features ? Object.entries(selectedPlant.leaf_features).map(([key, value]) => `${key}: ${value}`).join(' · ') : null} />
                    <DetailItem title="Growing" value={selectedPlant.growing} />
                  </div>

                  {selectedPlant.note && <p className="herb-note"><strong>Note:</strong> {selectedPlant.note}</p>}
                  {!selectedPlant.medicine_properties && !selectedPlant.uses?.length && !selectedPlant.benefits && !selectedPlant.growing && (
                    <p className="herb-note">Uses and growing details were not included in the supplied list; this profile currently shows the provided botanical identification.</p>
                  )}
                </div>
              </>
            ) : (
              <div className="herb-empty-detail">Select a plant from the list to view details.</div>
            )}
          </section>
        </section>
      )}

      <p className="herbpedia-disclaimer">Educational information only. Verify plant identification with an expert and consult a qualified health professional before medicinal use.</p>
      <footer className="herbpedia-footer"><a href="#home">🌿 HerbVision</a><span>Learn about plants. Use knowledge responsibly.</span></footer>
    </main>
  );
}

export default HerbPedia;
