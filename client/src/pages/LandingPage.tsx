import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  return (
    <div className="landing-container">
      <div className="landing-header">
        <svg className="app-icon" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
          <g transform="translate(48, 48) scale(6)">
            <path d="M11.19,2.25C10.93,2.25 10.67,2.31 10.42,2.4L3.06,5.45C2.04,5.87 1.55,7.04 1.97,8.05L6.93,20C7.24,20.77 7.97,21.23 8.74,21.25C9,21.25 9.27,21.22 9.53,21.1L16.9,18.05C17.65,17.74 18.11,17 18.13,16.25C18.14,16 18.09,15.71 18,15.45L13,3.5C12.71,2.73 11.97,2.26 11.19,2.25M14.67,2.25L18.12,10.6V4.25A2,2 0 0,0 16.12,2.25M20.13,3.79V12.82L22.56,6.96C22.97,5.94 22.5,4.78 21.47,4.36M11.19,4.22L16.17,16.24L8.78,19.3L3.8,7.29" />
          </g>
        </svg>
        <h1 className="landing-title">Flashcards</h1>
      </div>
      <div className="landing-content">
        <h2 className="landing-subtitle">Master Your Knowledge with Spaced Repetition</h2>
        <p className="landing-description">
          Transform the way you learn with our intelligent flashcard system. Create personalized study decks, track your
          progress, and leverage spaced repetition algorithms to maximize retention and minimize study time.
        </p>

        <Link to="/auth" className="get-started-btn">
          Get Started - It's Free
        </Link>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📚</div>
            <h3>Smart Organization</h3>
            <p>Organize your cards into folders and categories for better structure</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🧠</div>
            <h3>Spaced Repetition</h3>
            <p>Our algorithm shows you cards just when you're about to forget them</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Progress Tracking</h3>
            <p>Monitor your learning progress with detailed statistics and insights</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
