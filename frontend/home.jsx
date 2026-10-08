import React, { useState, useRef, useEffect } from 'react';
import './home.css';

const HomePage = () => {
  const [activeTab, setActiveTab] = useState('upload');
  const [uploadedImage, setUploadedImage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [plantSearchResults, setPlantSearchResults] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [analysisError, setAnalysisError] = useState('');
  const [recentSearches, setRecentSearches] = useState([]);
  const [plantDatabase, setPlantDatabase] = useState([]);
  const featuredPlants = [
    { id: 'tulsi', name: 'Tulsi (Holy Basil)', uses: 'Immunity, respiratory health', icon: '🌿' },
    { id: 'neem', name: 'Neem', uses: 'Skin care, antibacterial', icon: '🌿' },
    { id: 'aloe-vera', name: 'Aloe Vera', uses: 'Healing, skin regeneration', icon: '🌿' },
    { id: 'ginger', name: 'Ginger', uses: 'Digestion, inflammation', icon: '🌿' },
    { id: 'mint', name: 'Mint', uses: 'Digestion, fresh breath', icon: '🌿' },
    { id: 'turmeric', name: 'Turmeric', uses: 'Anti-inflammatory, antioxidant', icon: '🌿' },
  ];
  
  const videoRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/plants')
      .then((response) => {
        if (!response.ok) throw new Error(`Plant API returned ${response.status}`);
        return response.json();
      })
      .then((data) => {
        if (!data.success) throw new Error(data.message || 'Could not load plants');
        if (!cancelled) setPlantDatabase(Array.isArray(data.plants) ? data.plants : []);
      })
      .catch((error) => {
        console.error('Could not load plant profiles from backend:', error);
      });
    return () => { cancelled = true; };
  }, []);

  // Handle manual image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target.result);
        setAnalysisResults(null);
        setAnalysisError('');
      };
      reader.readAsDataURL(file);
    }
  };

  // Start camera
  const startCamera = async () => {
    const isLocalhost = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);

    if (!window.isSecureContext && !isLocalhost) {
      alert('Camera access requires a secure connection. Please use localhost or HTTPS, then try again.');
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('This browser does not support camera access. Try Chrome or Edge.');
      return;
    }

    try {
      setActiveTab('camera');

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' }
        },
        audio: false
      });

      cameraStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }

      setCameraActive(true);
    } catch (error) {
      console.error('Camera error:', error);
      setCameraActive(false);

      const message =
        error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError'
          ? 'Camera permission was denied. Please click the lock icon in the address bar, allow Camera access, then refresh the page.'
          : error?.name === 'NotFoundError'
            ? 'No camera was found on this device.'
            : 'Unable to access camera. Please check your browser camera permissions.';

      alert(message);
    }
  };

  // Stop camera
  const stopCamera = () => {
    const stream = cameraStreamRef.current || videoRef.current?.srcObject;

    if (stream && typeof stream.getTracks === 'function') {
      const tracks = stream.getTracks();

      tracks.forEach((track) => {
        track.stop();
      });

      cameraStreamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }

    setCameraActive(false);
  };

  useEffect(() => {
    const video = videoRef.current;
    const stream = cameraStreamRef.current;

    if (cameraActive && video && stream) {
      video.srcObject = stream;
      video.play().catch((error) => {
        console.error('Unable to start camera playback:', error);
      });
    }
  }, [cameraActive]);

  useEffect(() => {
    if (activeTab === 'camera') {
      setTimeout(() => {
        const cameraSection = document.getElementById('camera-section');

        if (cameraSection) {
          cameraSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }, 100);
    }
  }, [activeTab]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Capture photo from camera
  const capturePhoto = () => {

  if (videoRef.current && canvasRef.current) {

    const video = videoRef.current;
    const canvas = canvasRef.current;

    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    context.drawImage(
      video,
      0,
      0,
      canvas.width,
      canvas.height
    );

    const imageData =
      canvas.toDataURL('image/jpeg', 0.9);

    setUploadedImage(imageData);
    setAnalysisResults(null);
    setAnalysisError('');

    stopCamera();

    // Move to results tab
    setActiveTab('results');
  }
};
  const sendImageToBackend = async () => {

  if (!uploadedImage) {
    alert('Please capture or upload an image first.');
    return;
  }

  try {

    setAnalyzing(true);
    setAnalysisError('');
    setActiveTab('results');

    // Re-encode uploads and camera captures at a bounded size. Phone photos
    // can otherwise be tens of megapixels and exhaust OpenCV while decoding.
    const source = await createImageBitmap(await (await fetch(uploadedImage)).blob());
    const maxDimension = 1600;
    const scale = Math.min(1, maxDimension / Math.max(source.width, source.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(source.width * scale));
    canvas.height = Math.max(1, Math.round(source.height * scale));
    canvas.getContext('2d').drawImage(source, 0, 0, canvas.width, canvas.height);
    source.close();
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob((value) => value ? resolve(value) : reject(new Error('Could not prepare this image. Try another photo.')), 'image/jpeg', 0.82);
    });

    // Create FormData
    const formData = new FormData();

    formData.append(
      'image',
      blob,
      'herb.jpg'
    );

    // Send image to Python Flask
    const backendResponse = await fetch('/api/analyze', { method: 'POST', body: formData });

    // Read as text first so an empty response or a Flask/Vite error page
    // does not hide the actual HTTP response behind a JSON parse exception.
    const responseText = await backendResponse.text();
    let data;

    try {
      data = responseText ? JSON.parse(responseText) : null;
    } catch {
      throw new Error(
        `Backend returned a non-JSON response (HTTP ${backendResponse.status}). ` +
        `Response: ${responseText.slice(0, 300) || '(empty)'}. Check the Flask terminal and confirm it is running on port 5001.`
      );
    }

    if (!data) {
      throw new Error(
        `Backend returned an empty response (HTTP ${backendResponse.status}). ` +
        'The Flask server returned no error details. Check its terminal for the traceback and confirm it is the backend started from this project.'
      );
    }

    if (!backendResponse.ok || !data.success) {

      throw new Error(
        data.message || 'Analysis failed'
      );
    }

    // Set result received from Python
    setAnalysisResults(
      data.result
    );

  } catch (error) {

    console.error(
      'Backend error:',
      error
    );

    setAnalysisError(error.message || 'Unable to connect to HerbVisionAI backend.');

  } finally {

    setAnalyzing(false);
  }
};

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    setRecentSearches((searches) => [query, ...searches.filter((item) => item.toLowerCase() !== query.toLowerCase())].slice(0, 5));
    performSearch(query);
  };

  // Search the same profiles displayed on the HerbPedia page.
  const performSearch = (query) => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const matches = plantDatabase.filter((plant) => {
      const searchableText = [
        plant.name,
        plant.scientific_name,
        plant.plant_family,
        plant.description,
        plant.medicine_properties,
        plant.benefits,
        plant.growing,
        ...(plant.uses || []),
        ...(plant.parts_commonly_used || []),
        ...Object.values(plant.leaf_features || {})
      ].filter(Boolean).join(' ').toLocaleLowerCase();
      return searchableText.includes(normalizedQuery);
    });
    setPlantSearchResults(matches);
    setAnalysisResults(null);
    setAnalysisError('');
  };

  const downloadPlantInfo = (plant) => {
    const lines = [
      plant.name,
      plant.scientific_name ? `Scientific name: ${plant.scientific_name}` : null,
      plant.plant_family ? `Plant family: ${plant.plant_family}` : null,
      plant.description ? `Description: ${plant.description}` : null,
      plant.medicine_properties ? `Medicinal properties: ${plant.medicine_properties}` : null,
      plant.uses?.length ? `Uses: ${plant.uses.join('; ')}` : null,
      plant.benefits ? `Benefits: ${plant.benefits}` : null,
      plant.parts_commonly_used?.length ? `Parts commonly used: ${plant.parts_commonly_used.join(', ')}` : null,
      plant.leaf_features ? `Leaf features: ${Object.entries(plant.leaf_features).map(([key, value]) => `${key}: ${value}`).join('; ')}` : null,
      plant.growing ? `Growing: ${plant.growing}` : null,
      plant.note ? `Note: ${plant.note}` : null,
      '',
      'Educational information only. Verify plant identification with an expert.'
    ].filter((line) => line !== null);
    const file = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(plant.id || plant.name).toLowerCase().replace(/[^a-z0-9]+/g, '-')}-plant-info.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('authToken');
    // In a real app, redirect to login page
  };

  const handleAnalyze = () => {
    if (uploadedImage) {
      setAnalyzing(true);

      setTimeout(() => {
        const randomKey =
          Object.keys(mockAnalysisData)[
            Math.floor(
              Math.random() *
              Object.keys(mockAnalysisData).length
            )
          ];

        setAnalysisResults(
          mockAnalysisData[randomKey]
        );

        setAnalyzing(false);
        setActiveTab('results');

      }, 2000);
    }
  };

  return (
    <div className="home-page">
      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="logo">
            <h1>🌿 HerbVisionAI</h1>
          </div>

          <ul className="nav-links">
            <li><a href="#about-page">About</a></li>
            <li><a href="#herbpedia-page">HerbPedia</a></li>
            <li><a href="#services">Services</a></li>
            <li><a href="#contact-page">Contact</a></li>
          </ul>

          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h2>Identify Herbs & Plants Instantly</h2>
          <p>Use AI-powered plant recognition to identify herbs and learn about their properties</p>

          {/* Search Bar */}
          <form className="search-form" onSubmit={handleSearch}>
            <input
              type="text"
              className="search-input"
              placeholder="Search herbs, plants, or diseases..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="search-btn">🔍 Search</button>
          </form>

          {plantSearchResults !== null && (
            <section className="plant-search-results" aria-live="polite" aria-label="Plant search results">
              <h3>{plantSearchResults.length ? `${plantSearchResults.length} HerbPedia result${plantSearchResults.length === 1 ? '' : 's'}` : 'No plants found'}</h3>
              {plantSearchResults.length === 0 ? (
                <p>Try a plant name, botanical name, use, or plant feature.</p>
              ) : plantSearchResults.map((plant) => (
                <article className="plant-search-result" key={plant.id}>
                  <div className="plant-search-result-heading">
                    <span aria-hidden="true">{plant.icon || '🌿'}</span>
                    <div>
                      <h4>{plant.name}</h4>
                      {plant.scientific_name && <p><em>{plant.scientific_name}</em></p>}
                    </div>
                  </div>
                  {plant.plant_family && <p><strong>Family:</strong> {plant.plant_family}</p>}
                  {plant.description && <p>{plant.description}</p>}
                  {plant.medicine_properties && <p><strong>Properties:</strong> {plant.medicine_properties}</p>}
                  {plant.uses?.length > 0 && <p><strong>Uses:</strong> {plant.uses.join(' · ')}</p>}
                  {plant.benefits && <p><strong>Benefits:</strong> {plant.benefits}</p>}
                  {plant.parts_commonly_used?.length > 0 && <p><strong>Parts used:</strong> {plant.parts_commonly_used.join(', ')}</p>}
                  {plant.leaf_features && <p><strong>Leaf features:</strong> {Object.entries(plant.leaf_features).map(([key, value]) => `${key}: ${value}`).join(' · ')}</p>}
                  {plant.growing && <p><strong>Growing:</strong> {plant.growing}</p>}
                  {plant.note && <p><strong>Note:</strong> {plant.note}</p>}
                  <button className="plant-info-download" type="button" onClick={() => downloadPlantInfo(plant)}>
                    ⬇ Download information
                  </button>
                </article>
              ))}
            </section>
          )}

          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div className="recent-searches">
              <p>Recent: </p>
              {recentSearches.map((search, idx) => (
                <button
                  key={idx}
                  className="search-tag"
                  onClick={() => {
                    setSearchQuery(search);
                    performSearch(search);
                  }}
                >
                  {search}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Action Buttons */}
      <section className="action-section">
        <div className="action-buttons">
          <button
            className={`action-btn camera-btn ${cameraActive ? 'active' : ''}`}
            onClick={startCamera}
          >
            <span className="btn-icon">📷</span>
            <span className="btn-text">Open Camera</span>
          </button>

          <button
            className="action-btn upload-btn"
            onClick={() => fileInputRef.current?.click()}
          >
            <span className="btn-icon">📁</span>
            <span className="btn-text">Upload Image</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={{ display: 'none' }}
          />
        </div>
      </section>

      {/* Tabs Section */}
      <section className="tabs-section">
        <div className="tabs-container">
          <div className="tabs-header">
            <button
              className={`tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('upload');
                stopCamera();
              }}
            >
              📤 Upload Image
            </button>
            <button
              className={`tab-btn ${activeTab === 'camera' ? 'active' : ''}`}
              onClick={() => {
                if (!cameraActive) startCamera();
                setActiveTab('camera');
              }}
            >
              📷 Camera
            </button>
            <button
              className={`tab-btn ${activeTab === 'results' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('results');
                stopCamera();
              }}
              disabled={!uploadedImage && !analysisResults}
            >
              ✓ Results
            </button>
          </div>

          {/* Upload Tab */}
          {activeTab === 'upload' && (
            <div className="tab-content">
              <div className="upload-area">
                <div className="upload-box" onClick={() => fileInputRef.current?.click()}>
                  <div className="upload-icon">🖼️</div>
                  <h3>Upload Plant Image</h3>
                  <p>Click to select an image or drag and drop</p>
                  {uploadedImage && (
                    <>
                      <img src={uploadedImage} alt="Uploaded" className="preview-image" />
                      <button 
  className="analyze-btn-small"
  onClick={(e) => {
    e.stopPropagation();
    sendImageToBackend();
  }}
>
  🔬 Analyze This Image
</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Camera Tab */}
          {activeTab === 'camera' && (
            <div id="camera-section" className="tab-content camera-content">
              <div className="camera-preview">
                {cameraActive ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="camera-video"
                  />
                ) : (
                  <div className="camera-placeholder">
                    <div className="camera-icon">📷</div>
                    <h3>Camera is Off</h3>
                    <p>Click Open Camera to start your camera.</p>
                  </div>
                )}
                <canvas ref={canvasRef} style={{ display: 'none' }} />
              </div>
              {cameraActive && (
                <div className="camera-controls">
                  <button
                    className="capture-btn"
                    onClick={capturePhoto}
                  >
                    📸 Capture Photo
                  </button>

                  <button
                    className="stop-camera-btn"
                    onClick={stopCamera}
                  >
                    🔴 Turn Off Camera
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Results Tab */}
          {activeTab === 'results' && (uploadedImage || analysisResults) && (
            <div className="tab-content">
              <div className="results-container">
                <div className="results-image">
                  {uploadedImage && <img src={uploadedImage} alt="Analysis" />}
                </div>
                <div className="results-info">
                  {analyzing ? (
                    <div className="analyzing-state">
                      <div className="spinner"></div>
                      <p>Analyzing plant...</p>
                    </div>
                  ) : analysisResults ? (
                    <>
                      <div className="result-header">
                        <span className="plant-icon">{analysisResults.icon}</span>
                        <h3>{analysisResults.name}</h3>
                        <span className="confidence">Confidence: {analysisResults.confidence}</span>
                      </div>

                      {(analysisResults.scientific_name || analysisResults.plant_family) && (
                        <div className="result-section">
                          <h4>Plant Details:</h4>
                          {analysisResults.scientific_name && (
                            <p><strong>Scientific Name:</strong> <em>{analysisResults.scientific_name}</em></p>
                          )}
                          {analysisResults.plant_family && (
                            <p><strong>Plant Family:</strong> {analysisResults.plant_family}</p>
                          )}
                        </div>
                      )}

                      {analysisResults.description && (
                        <div className="result-section">
                          <h4>Description:</h4>
                          <p>{analysisResults.description}</p>
                        </div>
                      )}

                      {analysisResults.medicine_properties && (
                        <div className="result-section">
                          <h4>Medicinal Properties:</h4>
                          <p>{analysisResults.medicine_properties}</p>
                        </div>
                      )}

                      <div className="result-section">
                        <h4>Uses & Benefits:</h4>
                        <ul className="uses-list">
                          {(analysisResults.uses || []).map((use, idx) => (
                            <li key={idx}>✓ {use}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="result-section">
                        <h4>About:</h4>
                        <p>{analysisResults.benefits}</p>
                      </div>

                      <div className="result-section">
                        <h4>Growing Tips:</h4>
                        <p>{analysisResults.growing}</p>
                      </div>

                      {analysisResults.parts_commonly_used?.length > 0 && (
                        <div className="result-section">
                          <h4>Part Commonly Used in Medicine:</h4>
                          <p>{analysisResults.parts_commonly_used.join(', ')}</p>
                        </div>
                      )}

                      {analysisResults.leaf_features && (
                        <div className="result-section">
                          <h4>Leaf Features:</h4>
                          <p>
                            {Object.entries(analysisResults.leaf_features)
                              .map(([label, value]) => `${label}: ${value}`)
                              .join(' • ')}
                          </p>
                        </div>
                      )}

                      {analysisResults.note && (
                        <div className="result-section">
                          <h4>Note:</h4>
                          <p>{analysisResults.note}</p>
                        </div>
                      )}

                      <div className="action-buttons-result">
                        <button className="action-btn" onClick={() => {
                          setUploadedImage(null);
                          setAnalysisResults(null);
                          setActiveTab('upload');
                        }}>
                          📁 Upload Another
                        </button>
                        <button className="action-btn" onClick={() => {
                          setUploadedImage(null);
                          setAnalysisResults(null);
                          startCamera();
                          setActiveTab('camera');
                        }}>
                          📷 Take Photo
                        </button>
                      </div>
                    </>
                  ) : analysisError ? (
                    <div className="results-placeholder" role="alert">
                      <div className="plant-icon-large" aria-hidden="true">🍃</div>
                      <h3>Image not matched</h3>
                      <p>{analysisError}</p>
                      <p>Photo matching needs a trained plant classifier. The app will not guess Tulsi.</p>
                    </div>
                  ) : (
                    <div className="results-placeholder">
                      <button className="analyze-btn" onClick={sendImageToBackend} disabled={analyzing}>
                        <span className="analyze-btn-icon" aria-hidden="true">🌿</span>
                        <span className="analyze-btn-copy">
                          <span className="analyze-btn-title">Analyze Plant</span>
                          <span className="analyze-btn-subtitle">Discover its details</span>
                        </span>
                        <span className="analyze-btn-arrow" aria-hidden="true">→</span>
                      </button>
                      <p>Get medicinal uses, leaf details, and growing tips</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Featured Plants Section */}
      <section className="featured-plants" id="herbpedia">
        <h2>Featured Medicinal Plants</h2>
        <div className="plants-grid">
          {featuredPlants.map(plant => (
            <div 
              key={plant.id} 
              className="plant-card"
              onClick={() => {
                setSearchQuery(plant.name);
                performSearch(plant.name);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              <div className="plant-icon-large">{plant.icon}</div>
              <h3>{plant.name}</h3>
              <p>{plant.uses}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section" id="services">
        <h2>Why Choose HerbVisionAI?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🤖</div>
            <h3>AI-Powered Recognition</h3>
            <p>Advanced machine learning identifies plants with high accuracy</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📚</div>
            <h3>Comprehensive Database</h3>
            <p>Access detailed information about thousands of herbs and plants</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Instant Results</h3>
            <p>Get results in seconds using our optimized AI model</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📱</div>
            <h3>Mobile Friendly</h3>
            <p>Works seamlessly on all devices with camera support</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>&copy; 2026 HerbVisionAI. All rights reserved.</p>
        <div className="footer-links">
          <a href="#privacy">Privacy</a>
          <a href="#terms">Terms</a>
          <a href="#support">Support</a>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
