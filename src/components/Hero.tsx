import React, { useState } from 'react';
import { Download, Github, Linkedin, Mail, Star, Sparkles, Plus, X, Link } from 'lucide-react';
import ResumeModal from './ResumeModal';
import heroImage from '../Assets/Tanvir.jpg'
import { link } from 'fs';

const Hero = () => {
  const [showResumeModal, setShowResumeModal] = useState(false);

  const handleDownloadResume = () => {
    setShowResumeModal(true);
  };

  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-100 via-purple-50 to-pink-50">
      {/* Decorative Elements */}
      <div className="absolute inset-0">
        {/* Stars and decorative shapes */}
        <div className="absolute top-20 left-20 text-blue-500 animate-pulse">
          <Star size={24} fill="currentColor" />
        </div>
        <div className="absolute top-32 left-32 text-blue-400 animate-bounce">
          <Star size={16} fill="currentColor" />
        </div>
        <div className="absolute top-40 left-16 text-blue-600 animate-pulse" style={{ animationDelay: '1s' }}>
          <Star size={12} fill="currentColor" />
        </div>
        
        {/* Top right decorative elements */}
        <div className="absolute top-16 right-20 text-green-500 animate-bounce">
          <Sparkles size={20} />
        </div>
        <div className="absolute top-24 right-32 text-green-400 animate-pulse">
          <Sparkles size={16} />
        </div>
        <div className="absolute top-32 right-16 text-green-600 animate-bounce" style={{ animationDelay: '0.5s' }}>
          <Sparkles size={12} />
        </div>

        {/* Bottom decorative elements */}
        <div className="absolute bottom-32 right-24 text-red-500 animate-pulse">
          <Star size={20} fill="currentColor" />
        </div>
        <div className="absolute bottom-40 right-32 text-red-400 animate-bounce">
          <Star size={16} fill="currentColor" />
        </div>
        <div className="absolute bottom-28 right-16 text-red-600 animate-pulse" style={{ animationDelay: '1.5s' }}>
          <Star size={14} fill="currentColor" />
        </div>

        {/* Left side decorative elements */}
        <div className="absolute bottom-40 left-16 text-purple-500 animate-bounce">
          <Plus size={24} strokeWidth={3} />
        </div>
        <div className="absolute bottom-52 left-24 text-orange-500 animate-pulse">
          <X size={20} strokeWidth={3} />
        </div>

        {/* Curved lines */}
        <svg className="absolute top-1/3 left-10 w-32 h-32 text-green-400 opacity-60" viewBox="0 0 100 100">
          <path d="M20,50 Q50,20 80,50" stroke="currentColor" strokeWidth="2" fill="none" className="animate-pulse"/>
        </svg>
        
        <svg className="absolute bottom-1/4 right-10 w-24 h-24 text-red-400 opacity-60" viewBox="0 0 100 100">
          <path d="M20,30 Q50,60 80,30" stroke="currentColor" strokeWidth="3" fill="none" className="animate-bounce"/>
        </svg>
      </div>

      <div className="relative z-10 text-center px-4 max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center justify-center gap-12">
          {/* Left side - Name and content */}
          <div className="flex-1 animate-fade-in">
            {/* Main name title */}
            <div className="mb-8">
              <h1 className="text-6xl md:text-8xl font-black text-blue-600 mb-2 transform -rotate-2 hover:rotate-0 transition-transform duration-300">
                Tanvirul
              </h1>
              <h1 className="text-6xl md:text-8xl font-black text-blue-600 -mt-4 ml-8 transform rotate-1 hover:rotate-0 transition-transform duration-300">
                Islam
              </h1>
            </div>

            {/* Hello section */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 mb-8 border-4 border-blue-200 shadow-lg transform hover:scale-105 transition-transform duration-300">
              <h2 className="text-4xl md:text-5xl font-black text-blue-600 mb-4 transform -rotate-1">
                Hello! 👋
              </h2>
              <p className="text-gray-700 text-lg leading-relaxed mb-6">
                I'm Tanvirul, a 20 y/o student from Bangladesh. With a creative and knowledge-hungry mind, I have expertise in many different fields like Graphics Designing, Software Development, Creative Art, Video Editing and Animations. ✨
              </p>
              
              {/* Download Resume Button */}
              <button 
                onClick={handleDownloadResume}
                className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-8 py-4 rounded-full transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl mb-6 flex items-center gap-2 mx-auto"
              >
                <Download size={20} />
                Download Resume 📄
              </button>

              {/* Social Links */}
              <div className="flex justify-center space-x-6">
                {[
                  { icon: Github, label: 'GitHub', color: 'text-gray-600 hover:text-gray-800', bg: 'hover:bg-gray-100', link: 'https://github.com/originalvondo'},
                  { icon: Linkedin, label: 'LinkedIn', color: 'text-blue-600 hover:text-blue-800', bg: 'hover:bg-blue-50', link: 'https://www.linkedin.com/in/tanvrul/'},
                  { icon: Mail, label: 'Email', color: 'text-red-500 hover:text-red-700', bg: 'hover:bg-red-50', link: 'mailto:tanvirul.tanim1502@gmail.com'}
                ].map(({ icon: Icon, label, color, bg, link }, index) => (
                  <a
                    key={label}
                    href={link}
                    className={`${color} ${bg} p-3 rounded-full transition-all duration-300 hover:scale-125 transform animate-bounce border-2 border-transparent hover:border-current`}
                    style={{ animationDelay: `${index * 0.2}s` }}
                    target='_blank'
                    rel='noopener noreferrer'
                  >
                    <Icon size={24} />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Right side - Pinterest style photo frame */}
          <div className="flex-shrink-0 animate-slide-in-right">
            <div className="relative">
              {/* Photo frame with Pinterest aesthetic */}
              <div className="bg-white p-4 rounded-2xl shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500 border-4 border-white">
                <div className="relative overflow-hidden rounded-xl">
                  <img
                    src={heroImage}
                    alt="Tanvirul Islam"
                    className="w-80 h-96 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>
                {/* Decorative tape effect */}
                <div className="absolute -top-2 left-8 w-16 h-8 bg-yellow-200 opacity-80 transform -rotate-12 rounded-sm shadow-md"></div>
                <div className="absolute -top-2 right-8 w-16 h-8 bg-pink-200 opacity-80 transform rotate-12 rounded-sm shadow-md"></div>
              </div>
              
              {/* Floating decorative elements */}
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-yellow-400 rounded-full animate-bounce"></div>
              <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-pink-400 rounded-full animate-pulse"></div>
              <div className="absolute top-1/2 -left-8 text-blue-500 animate-spin">
                <Star size={20} fill="currentColor" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Resume Modal */}
      <ResumeModal 
        isOpen={showResumeModal} 
        onClose={() => setShowResumeModal(false)} 
      />
    </section>
  );
};

export default Hero;