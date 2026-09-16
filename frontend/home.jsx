import React, { useState, useRef, useEffect } from 'react';
import './home.css';

const HomePage = () => {
  const [activeTab, setActiveTab] = useState('upload');
  const [uploadedImage, setUploadedImage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [recentSearches, setRecentSearches] = useState([]);
  const [plantDatabase, setPlantDatabase] = useState([
    { id: 1, name: 'Tulsi (Holy Basil)', uses: 'Immunity, respiratory health' },
    { id: 2, name: 'Neem', uses: 'Skin care, antibacterial' },
    { id: 3, name: 'Aloe Vera', uses: 'Healing, skin regeneration' },
    { id: 4, name: 'Ginger', uses: 'Digestion, inflammation' },
    { id: 5, name: 'Mint', uses: 'Digestion, fresh breath' },
    { id: 6, name: 'Turmeric', uses: 'Anti-inflammatory, antioxidant' },
  ]);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Mock plant analysis data
  const mockAnalysisData = {
    'tulsi': {
      name: 'Tulsi (Holy Basil)',
      confidence: '95%',
      uses: ['Boosts immunity', 'Relieves stress', 'Improves respiratory health', 'Anti-inflammatory'],
      benefits: 'Known as the "Queen of Herbs", Tulsi is rich in antioxidants and has been used in Ayurvedic medicine for centuries.',
      growing: 'Grows well in warm, sunny locations. Water regularly and ensure good drainage.',
      icon: '🌿'
    },
    'neem': {
      name: 'Neem',
      confidence: '92%',
      uses: ['Skin purification', 'Antibacterial properties', 'Dental health', 'Detoxification'],
      benefits: 'Neem is a powerful herb with natural antibiotic properties, excellent for skin and oral health.',
      growing: 'Prefers warm climate. Can tolerate drought. Needs full sunlight.',
      icon: '🍃'
    },
    'aloe': {
      name: 'Aloe Vera',
      confidence: '98%',
      uses: ['Skin healing', 'Burn relief', 'Digestive health', 'Hydration'],
      benefits: 'The gel inside leaves is rich in compounds that support skin health and healing.',
      growing: 'Succulents that thrive in dry conditions. Water sparingly. Needs bright light.',
      icon: '💚'
    }
  };

  // Handle manual image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target.result);
        setAnalysisResults(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
        setActiveTab('camera');
      }
    } catch (err) {
      alert('Unable to access camera. Please check permissions.');
      console.error(err);
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      setCameraActive(false);
    }
  };

  // Capture photo from camera
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0);
      setUploadedImage(canvasRef.current.toDataURL('image/jpeg'));
      setAnalysisResults(null);
      stopCamera();
    }
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Add to recent searches
      setRecentSearches([searchQuery, ...recentSearches.slice(0, 4)]);
      performSearch(searchQuery);
    }
  };

  // Perform search
  const performSearch = (query) => {
    const lowerQuery = query.toLowerCase();
    const results = plantDatabase.filter(plant => 
      plant.name.toLowerCase().includes(lowerQuery) || 
      plant.uses.toLowerCase().includes(lowerQuery)
    );
    
    if (results.length > 0) {
      const plant = results[0];
      setAnalysisResults({
        name: plant.name,
        confidence: '89%',
        uses: plant.uses.split(', '),
        benefits: `${plant.name} is a powerful medicinal herb with multiple health benefits.`,
        growing: 'This herb can be grown in your garden or in pots for easy access.',
        icon: plant.icon
      });
    }
  };

  // Handle analyze button
  const handleAnalyze = () => {
    if (uploadedImage) {
      setAnalyzing(true);
      
      // Simulate API call with mock data
      setTimeout(() => {
        const randomKey = Object.keys(mockAnalysisData)[Math.floor(Math.random() * Object.keys(mockAnalysisData).length)];
        setAnalysisResults(mockAnalysisData[randomKey]);
        setAnalyzing(false);
        setActiveTab('results');
      }, 2000);
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('authToken');
    // In a real app, redirect to login page
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
            <li><a href="#about">About</a></li>
            <li><a href="#herbpedia">HerbPedia</a></li>
            <li><a href="#services">Services</a></li>
            <li><a href="#contact">Contact</a></li>
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
            onClick={() => {
              if (cameraActive) {
                stopCamera();
              } else {
                startCamera();
              }
            }}
          >
            <span className="btn-icon">📷</span>
            <span className="btn-text">{cameraActive ? 'Stop Camera' : 'Open Camera'}</span>
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
                          handleAnalyze();
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
            <div className="tab-content">
              <div className="camera-container">
                <video
                  ref={videoRef}
                  className="camera-feed"
                  autoPlay
                  playsInline
                  muted
                />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                {cameraActive && (
                  <button className="capture-btn" onClick={capturePhoto}>
                    📸 Capture
                  </button>
                )}
              </div>
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

                      <div className="result-section">
                        <h4>Uses & Benefits:</h4>
                        <ul className="uses-list">
                          {analysisResults.uses.map((use, idx) => (
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
                  ) : (
                    <div className="results-placeholder">
                      <button className="analyze-btn" onClick={handleAnalyze}>
                        🔬 Analyze Plant
                      </button>
                      <p>Click "Analyze Plant" to get detailed information about this plant</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Featured Plants Section */}
      <section className="featured-plants">
        <h2>Featured Medicinal Plants</h2>
        <div className="plants-grid">
          {plantDatabase.map(plant => (
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
      <section className="features-section">
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


// import React, { useRef, useState } from 'react';
// import './home.css';

// // const plants = [
// //   ['Tulsi (Holy Basil)', 'Immunity, respiratory health', '🌿'],
// //   ['Neem', 'Skin care, antibacterial', '🍃'],
// //   ['Aloe Vera', 'Healing, skin regeneration', '💚'],
// //   ['Ginger', 'Digestion, inflammation', '🫚'],
// //   ['Mint', 'Digestion, fresh breath', '🌱'],
// //   ['Turmeric', 'Anti-inflammatory, antioxidant', '🌼']
// // ];

// // const info = {
// //   tulsi: ['Tulsi (Holy Basil)', '95%', ['Boosts immunity','Relieves stress','Improves respiratory health','Anti-inflammatory'], '🌿'],
// //   neem: ['Neem', '92%', ['Skin purification','Antibacterial properties','Dental health','Detoxification'], '🍃'],
// //   aloe: ['Aloe Vera', '98%', ['Skin healing','Burn relief','Digestive health','Hydration'], '💚']
// // };

// const features = [
//   ['🤖','AI-Powered Recognition','Advanced machine learning identifies plants with high accuracy'],
//   ['📚','Comprehensive Database','Access detailed information about thousands of herbs and plants'],
//   ['⚡','Instant Results','Get results in seconds using our optimized AI model'],
//   ['📱','Mobile Friendly','Works seamlessly on all devices with camera support']
// ];

// export default function HomePage() {
//   const [tab,setTab] = useState('upload'), [image,setImage] = useState(null);
//   const [query,setQuery] = useState(''), [camera,setCamera] = useState(false);
//   const [loading,setLoading] = useState(false), [result,setResult] = useState(null);
//   const [recent,setRecent] = useState([]);

//   const video = useRef(), canvas = useRef(), file = useRef();

//   const stopCamera = () => {
//     video.current?.srcObject?.getTracks().forEach(t => t.stop());
//     if(video.current) video.current.srcObject = null;
//     setCamera(false);
//   };

//   const startCamera = async () => {
//     try {
//       video.current.srcObject = await navigator.mediaDevices.getUserMedia({
//         video:{facingMode:'environment'}
//       });
//       setCamera(true); setTab('camera');
//     } catch(e) {
//       alert('Unable to access camera. Please check permissions.');
//     }
//   };

//   const upload = e => {
//     const f = e.target.files?.[0];
//     if(!f) return;
//     const r = new FileReader();
//     r.onload = e => { setImage(e.target.result); setResult(null); };
//     r.readAsDataURL(f);
//   };

//   const capture = () => {
//     const v = video.current, c = canvas.current;
//     c.width = v.videoWidth; c.height = v.videoHeight;
//     c.getContext('2d').drawImage(v,0,0);
//     setImage(c.toDataURL('image/jpeg'));
//     stopCamera(); setTab('results'); setResult(null);
//   };

//   const search = q => {
//     const p = plants.find(x =>
//       x[0].toLowerCase().includes(q.toLowerCase()) ||
//       x[1].toLowerCase().includes(q.toLowerCase())
//     );
//     if(!p) return;
//     setResult({
//       name:p[0], confidence:'89%', uses:p[1].split(', '),
//       benefits:`${p[0]} is a medicinal herb with multiple health benefits.`,
//       growing:'This herb can be grown in gardens or pots for easy access.',
//       icon:p[2]
//     });
//     setTab('results');
//   };

//   const submitSearch = e => {
//     e.preventDefault();
//     if(!query.trim()) return;
//     setRecent(r => [query,...r.filter(x => x !== query)].slice(0,5));
//     search(query);
//   };

//   const analyze = () => {
//     if(!image) return;
//     setLoading(true); setTab('results');
//     setTimeout(() => {
//       const keys = Object.keys(info), p = info[keys[Math.floor(Math.random()*keys.length)]];
//       setResult({
//         name:p[0], confidence:p[1], uses:p[2], icon:p[3],
//         benefits:`${p[0]} is rich in natural compounds and has been traditionally used for various health benefits.`,
//         growing:'Grows well with proper sunlight, watering and good drainage.'
//       });
//       setLoading(false);
//     },1500);
//   };

//   const reset = () => { setImage(null); setResult(null); setTab('upload'); };

//   return <div className="home-page">

//     <nav className="navbar">
//       <div className="nav-container">
//         <div className="logo"><h1>🌿 HerbVisionAI</h1></div>
//         <ul className="nav-links">
//           {['About','HerbPedia','Services','Contact'].map(x =>
//             <li key={x}><a href={`#${x.toLowerCase()}`}>{x}</a></li>
//           )}
//         </ul>
//         <button className="logout-btn" onClick={() => {
//           localStorage.removeItem('authToken');
//           sessionStorage.removeItem('authToken');
//         }}>Logout</button>
//       </div>
//     </nav>

//     <section className="hero-section">
//       <div className="hero-content">
//         <h2>Identify Herbs & Plants Instantly</h2>
//         <p>Use AI-powered plant recognition to identify herbs and learn about their properties</p>

//         <form className="search-form" onSubmit={submitSearch}>
//           <input className="search-input"
//             placeholder="Search herbs, plants, or diseases..."
//             value={query} onChange={e => setQuery(e.target.value)}
//           />
//           <button className="search-btn">🔍 Search</button>
//         </form>

//         {recent.length > 0 &&
//           <div className="recent-searches">
//             <p>Recent:</p>
//             {recent.map(x =>
//               <button key={x} className="search-tag"
//                 onClick={() => {setQuery(x);search(x)}}>{x}</button>
//             )}
//           </div>
//         }
//       </div>
//     </section>

//     <section className="action-section">
//       <div className="action-buttons">
//         <button className={`action-btn camera-btn ${camera?'active':''}`}
//           onClick={camera ? stopCamera : startCamera}>
//           📷 <span className="btn-text">{camera?'Stop Camera':'Open Camera'}</span>
//         </button>

//         <button className="action-btn upload-btn" onClick={() => file.current?.click()}>
//           📁 <span className="btn-text">Upload Image</span>
//         </button>

//         <input ref={file} type="file" accept="image/*" hidden onChange={upload}/>
//       </div>
//     </section>

//     <section className="tabs-section">
//       <div className="tabs-container">

//         <div className="tabs-header">
//           {[
//             ['upload','📤 Upload Image'],
//             ['camera','📷 Camera'],
//             ['results','✓ Results']
//           ].map(([id,label]) =>
//             <button key={id}
//               className={`tab-btn ${tab===id?'active':''}`}
//               disabled={id==='results' && !image && !result}
//               onClick={() => id==='camera' ? startCamera() : (stopCamera(),setTab(id))}>
//               {label}
//             </button>
//           )}
//         </div>

//         {tab==='upload' &&
//           <div className="tab-content">
//             <div className="upload-area">
//               <div className="upload-box" onClick={() => file.current?.click()}>
//                 <div className="upload-icon">🖼️</div>
//                 <h3>Upload Plant Image</h3>
//                 <p>Click to select an image or drag and drop</p>
//                 {image && <>
//                   <img src={image} alt="Uploaded" className="preview-image"/>
//                   <button className="analyze-btn-small"
//                     onClick={e => {e.stopPropagation();analyze()}}>
//                     🔬 Analyze This Image
//                   </button>
//                 </>}
//               </div>
//             </div>
//           </div>
//         }

//         {tab==='camera' &&
//           <div className="tab-content">
//             <div className="camera-container">
//               <video ref={video} className="camera-feed" autoPlay playsInline muted/>
//               <canvas ref={canvas} hidden/>
//               {camera && <button className="capture-btn" onClick={capture}>📸 Capture</button>}
//             </div>
//           </div>
//         }

//         {tab==='results' && (image || result) &&
//           <div className="tab-content">
//             <div className="results-container">

//               <div className="results-image">
//                 {image && <img src={image} alt="Analysis"/>}
//               </div>

//               <div className="results-info">
//                 {loading ? <div className="analyzing-state">
//                   <div className="spinner"/>
//                   <p>Analyzing plant...</p>
//                 </div> : result ? <>

//                   <div className="result-header">
//                     <span className="plant-icon">{result.icon}</span>
//                     <h3>{result.name}</h3>
//                     <span className="confidence">Confidence: {result.confidence}</span>
//                   </div>

//                   <div className="result-section">
//                     <h4>Uses & Benefits:</h4>
//                     <ul className="uses-list">
//                       {result.uses.map((x,i) => <li key={i}>✓ {x}</li>)}
//                     </ul>
//                   </div>

//                   <div className="result-section">
//                     <h4>About:</h4><p>{result.benefits}</p>
//                   </div>

//                   <div className="result-section">
//                     <h4>Growing Tips:</h4><p>{result.growing}</p>
//                   </div>

//                   <div className="action-buttons-result">
//                     <button className="action-btn" onClick={reset}>📁 Upload Another</button>
//                     <button className="action-btn" onClick={() => {
//                       reset(); startCamera();
//                     }}>📷 Take Photo</button>
//                   </div>

//                 </> : <div className="results-placeholder">
//                   <button className="analyze-btn" onClick={analyze}>🔬 Analyze Plant</button>
//                   <p>Click "Analyze Plant" to get detailed information about this plant</p>
//                 </div>}
//               </div>
//             </div>
//           </div>
//         }

//       </div>
//     </section>

//     <section className="featured-plants">
//       <h2>Featured Medicinal Plants</h2>
//       <div className="plants-grid">
//         {plants.map(([name,uses,icon],i) =>
//           <div key={i} className="plant-card"
//             onClick={() => {setQuery(name);search(name);window.scrollTo({top:0,behavior:'smooth'})}}>
//             <div className="plant-icon-large">{icon}</div>
//             <h3>{name}</h3><p>{uses}</p>
//           </div>
//         )}
//       </div>
//     </section>

//     <section className="features-section">
//       <h2>Why Choose HerbVisionAI?</h2>
//       <div className="features-grid">
//         {features.map(([icon,title,text]) =>
//           <div className="feature-card" key={title}>
//             <div className="feature-icon">{icon}</div>
//             <h3>{title}</h3><p>{text}</p>
//           </div>
//         )}
//       </div>
//     </section>

//     <footer className="footer">
//       <p>&copy; 2026 HerbVisionAI. All rights reserved.</p>
//       <div className="footer-links">
//         {['Privacy','Terms','Support'].map(x => <a key={x} href={`#${x.toLowerCase()}`}>{x}</a>)}
//       </div>
//     </footer>

//   </div>;
// }