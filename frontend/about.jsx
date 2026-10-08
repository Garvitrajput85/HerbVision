import React from 'react';
import './project-pages.css';
import aboutImage from './img/bchome.jpg';

function AboutPage() {
  return (
    <main className="project-page">
      <header className="project-page-nav">
        <a className="project-brand" href="#home">🌿 HerbVision</a>
        <a className="project-back" href="#home">← Back to Home</a>
      </header>

      <section className="project-hero about-hero">
        <div className="project-hero-copy">
          <span className="project-eyebrow">ABOUT THE PROJECT</span>
          <h1>HerbVision</h1>
          <p className="project-lead">An AI-assisted way to identify medicinal plants and learn about their traditional uses.</p>
        </div>
        <img src={aboutImage} alt="Green plants growing in a natural setting" />
      </section>

      <section className="project-content">
        <article className="project-copy-card">
          <span className="project-eyebrow">THE IDEA</span>
          <h2>About this project</h2>
          <p>HerbVision is a plant-learning project that brings image-based herb exploration and easy-to-read plant information together. A user can take or upload a plant photo and explore information such as its name, characteristics, traditional uses, and growing tips.</p>
          <p>It is designed as an educational starting point. Image results and traditional knowledge should be checked with reliable references or a qualified expert before making health decisions.</p>
        </article>

        <article className="project-copy-card benefit-card">
          <span className="project-eyebrow">WHY IT CAN HELP</span>
          <h2>Usefulness and community benefits</h2>
          <ul className="project-benefits">
            <li><span>🌱</span><div><strong>Make plant learning easier</strong><p>Students and curious users can explore medicinal plants through a familiar photo-based experience.</p></div></li>
            <li><span>📚</span><div><strong>Support awareness of traditional knowledge</strong><p>Clear, accessible information can encourage people to learn about local herbs and the cultures connected to them.</p></div></li>
            <li><span>🌍</span><div><strong>Encourage biodiversity awareness</strong><p>Learning to notice and value plants can support conversations about protecting local plant life and habitats.</p></div></li>
            <li><span>💡</span><div><strong>Build digital learning skills</strong><p>The project demonstrates how AI and technology can make educational resources more approachable.</p></div></li>
          </ul>
        </article>
      </section>

      <footer className="project-page-footer"><a href="#home">🌿 HerbVision</a><span>Explore, learn, and verify responsibly.</span></footer>
    </main>
  );
}

export default AboutPage;
