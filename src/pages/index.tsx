import React from 'react';
import Hero from '../components/Hero';
import Education from '../components/Education';
import Projects from '../components/Projects';
import Contact from '../components/Contact';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-purple-50 to-pink-50">
      <Hero />
      <Education />
      <Projects />
      <Contact />
    </div>
  );
};

export default Index;
