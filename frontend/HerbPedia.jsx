import React, { useEffect, useRef, useState } from 'react';
import localPlantDetails from './plant_details.json';
import './herbpedia.css';

const HINDI_NAMES = {
  ashwagandha: 'अश्वगंधा', 'aloe-vera': 'घृतकुमारी (एलोवेरा)', neem: 'नीम', amla: 'आँवला', arjuna: 'अर्जुन',
  haritaki: 'हरड़', bibhitaki: 'बहेड़ा', shatavari: 'शतावरी', punarnava: 'पुनर्नवा', manjistha: 'मंजिष्ठा',
  sarpagandha: 'सर्पगंधा', 'safed-musli': 'सफ़ेद मूसली', vidanga: 'विडंग', gokshura: 'गोखरू', gudmar: 'गुड़मार',
  shankhpushpi: 'शंखपुष्पी', yashtimadhu: 'मुलेठी', chirata: 'चिरायता', kutki: 'कुटकी', daruharidra: 'दारुहल्दी',
  turmeric: 'हल्दी', ginger: 'अदरक', 'long-pepper': 'पीपली', 'black-pepper': 'काली मिर्च', cinnamon: 'दालचीनी',
  tejpat: 'तेजपत्ता', lodhra: 'लोध्र', bakuchi: 'बकुची', kantakari: 'कंटकारी', brihati: 'बड़ी कटेरी',
  eranda: 'अरंडी', nirgundi: 'निर्गुंडी', danti: 'दंती', chitrak: 'चित्रक', ativisha: 'अतिविषा', vacha: 'बच',
  jatamansi: 'जटामांसी', tagar: 'तगर', kapikacchu: 'कौंच', shalaparni: 'शालपर्णी', prishniparni: 'पृष्णिपर्णी',
  bilva: 'बेल', agnimantha: 'अग्निमंथ', gambhari: 'गम्भारी', shyonaka: 'श्योनाक', patala: 'पाटला', musta: 'नागरमोथा',
  atibala: 'अतिबला', bala: 'बला', nagabala: 'नागबला', vidarikand: 'विदारीकंद', sariva: 'सारिवा', ushira: 'खस',
  lajjalu: 'छुईमुई', arka: 'आक', saptaparna: 'सप्तपर्णी', karanja: 'करंज', bakul: 'मौलसरी', amaltas: 'अमलतास',
  palash: 'पलाश', khadira: 'खैर', shirish: 'सिरिस', jamun: 'जामुन', aparajita: 'अपराजिता', durva: 'दूब',
  bhumyamalaki: 'भुई आँवला', makoy: 'मकोय', kulanjan: 'कुलंजन', nagarmotha: 'नागरमोथा', kaladana: 'निषोथ',
  shal: 'साल', devadaru: 'देवदार', agaru: 'अगरु', bhojpatra: 'भोजपत्र', daruhaldi: 'दारुहल्दी', kutaja: 'कुटज',
  mustak: 'मुस्तक', rohitaka: 'रोहितक', 'palash-2': 'पलाश', shalmali: 'सेमल', aralu: 'अरदू', bakayan: 'बकायन',
  raktachandan: 'लाल चंदन', 'shatavari-wild': 'जंगली शतावरी', kusha: 'कुश', ikshu: 'गन्ना', priyangu: 'प्रियंगु',
  kumari: 'घृतकुमारी', karavira: 'कनेर', dhatura: 'धतूरा', aak: 'आक', kachnar: 'कचनार', varuna: 'वरुण',
  rohini: 'रोहिणी', 'neem-bark-tree': 'मलय नीम', pomegranate: 'अनार', guava: 'अमरूद', lemon: 'नींबू',
  'curry-leaf': 'करी पत्ता', lemongrass: 'नींबू घास', tulsi: 'तुलसी', amruthaballi: 'गिलोय (गुडूची)',
  ashoka: 'अशोक', 'asthma-weed': 'दूधी', 'balloon-vine': 'कपलफोड़ी', betel: 'पान', brahmi: 'ब्राह्मी',
  bhringraj: 'भृंगराज', 'caricature-plant': 'चित्रक', catharanthus: 'सदाबहार', drumstick: 'सहजन',
  'insulin-plant': 'इंसुलिन पौधा', kamakasturi: 'कस्तूरी तुलसी', kohlrabi: 'गांठ गोभी', 'malabar-nut': 'अडूसा',
  nelavembu: 'कालमेघ', 'arive-dantu': 'चौलाई', 'globe-amaranth': 'गेंदे जैसा अमरंथ', hibiscus: 'गुड़हल',
  koranda: 'करौंदा', 'malabar-spinach': 'पोई साग', mint: 'पुदीना', padri: 'पदरी', noni: 'नोनी',
  parijatha: 'हरसिंगार', thumbe: 'गुमा'
};

const POPULAR_ALIASES = {
  'aloe-vera': ['Aloe', 'Indian aloe'], amla: ['Indian gooseberry'], haritaki: ['Harad', 'Chebulic myrobalan'],
  bibhitaki: ['Baheda', 'Beleric myrobalan'], 'safed-musli': ['Safed musli'], yashtimadhu: ['Licorice', 'Mulethi'],
  turmeric: ['Haldi'], ginger: ['Adrak'], 'long-pepper': ['Pippali'], 'black-pepper': ['Peppercorn'],
  tejpat: ['Indian bay leaf'], eranda: ['Castor plant'], lajjalu: ['Touch-me-not'], durva: ['Bermuda grass', 'Doob'],
  bhumyamalaki: ['Stonebreaker'], palash: ['Flame of the forest'], jamun: ['Java plum', 'Indian blackberry'],
  aparajita: ['Butterfly pea'], devadaru: ['Deodar cedar'], agaru: ['Agarwood'], raktachandan: ['Red sandalwood'],
  'shatavari-wild': ['Wild asparagus'], kusha: ['Desert grass'], ikshu: ['Sugarcane'], karavira: ['Oleander'],
  dhatura: ['Thorn apple'], aak: ['Madar', 'Sodom apple'], kachnar: ['Mountain ebony'], pomegranate: ['Anar'],
  guava: ['Amrood'], lemon: ['Nimbu'], 'curry-leaf': ['Kadi patta'], lemongrass: ['Cochin grass'], tulsi: ['Holy basil'],
  amruthaballi: ['Guduchi', 'Giloy'], ashoka: ['Sita Ashok'], betel: ['Paan'], brahmi: ['Water hyssop'],
  bhringraj: ['False daisy'], catharanthus: ['Madagascar periwinkle'], drumstick: ['Moringa'],
  'insulin-plant': ['Spiral ginger'], 'malabar-nut': ['Vasaka'], nelavembu: ['King of bitters'],
  'arive-dantu': ['Green amaranth'], 'globe-amaranth': ['Bachelor button'], hibiscus: ['China rose'],
  koranda: ['Karonda'], 'malabar-spinach': ['Ceylon spinach'], mint: ['Spearmint'], noni: ['Indian mulberry'],
  parijatha: ['Night-flowering jasmine'], thumbe: ['Thumbai']
};

const LOCAL_ALIASES = {
  'aloe-vera': ['Gwarpatha', 'Ghritkumari'], turmeric: ['Haldi', 'Haridra'], ginger: ['Adrak', 'Sunthi'],
  'long-pepper': ['Pippali'], 'black-pepper': ['Kali mirch'], cinnamon: ['Dalchini'], tejpat: ['Tejpatta'],
  'bhojpatra': ['Bhojpatra'], lajjalu: ['Chhui-mui'], ushira: ['Khas'], durva: ['Doob'],
  'bhumyamalaki': ['Bhui amla'], palash: ['Dhak', 'Tesu'], jamun: ['Jamun'], aparajita: ['Aparajita'],
  devadaru: ['Devdar'], agaru: ['Agar'], 'raktachandan': ['Lal chandan'], kusha: ['Kush'], ikshu: ['Ganna'],
  karavira: ['Kaner'], dhatura: ['Dhatura'], aak: ['Aak', 'Madar'], pomegranate: ['Anar'], guava: ['Amrood'],
  lemon: ['Nimbu'], 'curry-leaf': ['Kadi patta'], tulsi: ['Tulsi'], amruthaballi: ['Giloy', 'Guduchi'],
  'asthma-weed': ['Dudhi'], betel: ['Paan'], brahmi: ['Brahmi'], catharanthus: ['Sadabahar'], drumstick: ['Sahjan'],
  'malabar-nut': ['Adusa'], nelavembu: ['Kalmegh'], 'arive-dantu': ['Chaulai'], hibiscus: ['Gudhal'],
  koranda: ['Karonda'], 'malabar-spinach': ['Poi saag'], mint: ['Pudina'], noni: ['Noni'],
  parijatha: ['Harsingar'], thumbe: ['Dronapushpi']
};

function getNames(plant) {
  const aliases = POPULAR_ALIASES[plant.id] || [];
  const localNames = plant.local_names?.length ? plant.local_names : LOCAL_ALIASES[plant.id] || [plant.name];
  const popularNames = plant.popular_names?.length ? plant.popular_names : [plant.name, ...aliases];
  return {
    hindi: plant.hindi_name || HINDI_NAMES[plant.id] || plant.name,
    local: localNames.join(' · '),
    popular: [...new Set(popularNames)].join(' · ')
  };
}

function PlantPhoto({ plant, compact = false }) {
  const [photo, setPhoto] = useState(null);
  const [visible, setVisible] = useState(false);
  const [photoUnavailable, setPhotoUnavailable] = useState(false);
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
    setPhoto(null);
    setPhotoUnavailable(false);
    const term = encodeURIComponent(plant.scientific_name);
    let cancelled = false;
    const findLicensedPhoto = async () => {
      for (const focus of ['leaf', '']) {
        for (const license of ['CC-BY', 'CC-BY-SA', 'CC0']) {
          const query = focus ? `&q=${focus}` : '';
          const endpoint = `https://api.inaturalist.org/v1/observations?taxon_name=${term}&quality_grade=research&photos=true&photo_license=${license}&per_page=1${query}`;
          try {
            const response = await fetch(endpoint);
            if (!response.ok) continue;
            const data = await response.json();
            const observation = data.results?.[0];
            const image = observation?.photos?.[0];
            if (image?.url) {
              if (!cancelled) setPhoto({
                url: image.url.replace('/square.', '/medium.'),
                page: observation.uri,
                artist: image.attribution?.replace(/<[^>]*>/g, '') || 'iNaturalist observer',
                license: image.license_code || license
              });
              return;
            }
          } catch {
            // Continue to the next openly licensed photo option.
          }
        }
      }
      // Some less common plants have no leaf-tagged, openly licensed
      // observation, but iNaturalist may still have a licensed taxon photo.
      try {
        const response = await fetch(`https://api.inaturalist.org/v1/taxa/autocomplete?q=${term}&per_page=1`);
        if (response.ok) {
          const [taxon] = await response.json();
          const image = taxon?.default_photo;
          if (image?.medium_url && image.license_code && !cancelled) {
            setPhoto({
              url: image.medium_url,
              page: `https://www.inaturalist.org/photos/${image.id}`,
              artist: image.attribution?.replace(/<[^>]*>/g, '') || 'iNaturalist observer',
              license: image.license_code
            });
            return;
          }
        }
      } catch {
        // The normal unavailable state below is shown when no licensed photo exists.
      }
      if (!cancelled) setPhotoUnavailable(true);
    };
    findLicensedPhoto();
    return () => { cancelled = true; };
  }, [plant.scientific_name, visible]);

  return (
    <div className={compact ? 'herb-photo compact' : 'herb-photo'} ref={photoRef}>
      {photo ? <>
        <img src={photo.url} alt={`${plant.name} leaf`} loading="lazy" onError={() => { setPhoto(null); setPhotoUnavailable(true); }} />
        {!compact && <a className="photo-credit" href={photo.page} target="_blank" rel="noreferrer">Photo: {photo.artist} · {photo.license}</a>}
      </> : <div className="photo-placeholder" aria-label={`Photo of ${plant.name} loading or unavailable`}>
        <span aria-hidden="true">{photoUnavailable ? '🌱' : '🌿'}</span>
        {!compact && <small>{photoUnavailable ? 'No openly licensed leaf photo found' : visible ? 'Real leaf photo loading…' : 'Real leaf photo'}</small>}
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
          const detailsById = new Map((localPlantDetails.plants || []).map((plant) => [plant.id, plant]));
          const plantList = (Array.isArray(data.plants) ? data.plants : []).map((plant) => ({
            ...detailsById.get(plant.id),
            ...plant,
            ...Object.fromEntries(['hindi_name', 'local_names', 'popular_names'].filter((key) => detailsById.get(plant.id)?.[key]).map((key) => [key, detailsById.get(plant.id)[key]]))
          })).slice().sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
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
      getNames(plant).hindi,
      getNames(plant).local,
      getNames(plant).popular,
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
        <p>Explore real field photos, botanical identities, Hindi names, and the local and popular names used for each plant.</p>
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

                    <div className="plant-names">
                      <p><strong>हिंदी नाम:</strong> {getNames(selectedPlant).hindi}</p>
                      <p><strong>स्थानीय नाम:</strong> {getNames(selectedPlant).local}</p>
                      <p><strong>Popular names:</strong> {getNames(selectedPlant).popular}</p>
                    </div>
                    {selectedPlant.plant_family && <p className="plant-family">Family: {selectedPlant.plant_family}</p>}
                    {selectedPlant.description && <p className="herb-description">{selectedPlant.description}</p>}
                  </div>
                </div>

                <div className="herb-detail-body">
                  <div className="detail-grid">
                    <DetailItem title="Medicinal properties" value={selectedPlant.medicine_properties} />
                    <DetailItem title="Use" value={selectedPlant.uses?.length ? selectedPlant.uses.join(' · ') : null} />
                    <DetailItem title="Benefits" value={selectedPlant.benefits} />
                    <DetailItem title="Parts commonly used" value={selectedPlant.parts_commonly_used?.length ? selectedPlant.parts_commonly_used.join(', ') : null} />
                    <DetailItem title="Leaf features" value={selectedPlant.leaf_features ? Object.entries(selectedPlant.leaf_features).map(([key, value]) => `${key}: ${value}`).join(' · ') : null} />
                    <DetailItem title="Growing" value={selectedPlant.growing} />
                  </div>

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
