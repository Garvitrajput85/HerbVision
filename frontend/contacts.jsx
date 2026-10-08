import React from 'react';
import './project-pages.css';

const students = ['Garvit Rajput', 'Harsh Gill', 'Harshit Saini', 'Hariprakash Rana'];

function ContactsPage() {
  return (
    <main className="project-page contact-page">
      <header className="project-page-nav">
        <a className="project-brand" href="#home">🌿 HerbVision</a>
        <a className="project-back" href="#home">← Back to Home</a>
      </header>

      <section className="contact-intro">
        <span className="project-eyebrow">THE PEOPLE BEHIND THE PROJECT</span>
        <h1>HerbVision</h1>
        <p className="project-lead">An AI-assisted platform for exploring and learning about medicinal plants.</p>
      </section>

      <section className="team-layout" aria-label="Project team and institution">
        <article className="team-card students-card">
          <div className="team-card-icon" aria-hidden="true">👩‍🎓</div>
          <span className="project-eyebrow">PROJECT BY</span>
          <h2>Students</h2>
          <ol className="student-list">
            {students.map((student, index) => <li key={student}><span>0{index + 1}</span>{student}</li>)}
          </ol>
        </article>
        <article className="team-card">
          <div className="team-card-icon" aria-hidden="true">🧑‍🏫</div>
          <span className="project-eyebrow">PROJECT GUIDE</span>
          <h2>Mr. Vikas Kumar Mittal</h2>
          <p>Project Guide</p>
        </article>
        <article className="team-card college-card">
          <div className="team-card-icon" aria-hidden="true">🏛️</div>
          <span className="project-eyebrow">COLLEGE & UNIVERSITY</span>
          <h2>MIT College</h2>
          <p>Affiliated with AKTU University</p>
        </article>
      </section>

      <footer className="project-page-footer"><a href="#home">🌿 HerbVision</a><span>Made as an educational project.</span></footer>
    </main>
  );
}

export default ContactsPage;
