import React from 'react';
import { ExternalLink, Github, Smartphone, Globe, Zap, Heart, Star, Plus } from 'lucide-react';

const Projects = () => {
  const projects = [
    {
      title: "EcoTracker App",
      description: "A mobile app to track carbon footprint with AI recommendations 🌱",
      tech: ["React Native", "Node.js", "MongoDB", "TensorFlow"],
      image: "photo-1581091226825-a6a2a5aee158",
      icon: Smartphone,
      color: "from-green-500 to-emerald-500",
      category: "Mobile App"
    },
    {
      title: "Neural Art Generator",
      description: "AI-powered web platform for creating unique digital artwork 🎨",
      tech: ["React", "Python", "PyTorch", "AWS"],
      image: "photo-1461749280684-dccba630e2f6", 
      icon: Zap,
      color: "from-purple-500 to-pink-500",
      category: "Web App"
    },
    {
      title: "Social Impact Dashboard",
      description: "Analytics platform for non-profit organizations to track impact 📊",
      tech: ["Vue.js", "D3.js", "Express", "PostgreSQL"],
      image: "photo-1488590528505-98d2b5aba04b",
      icon: Heart,
      color: "from-blue-500 to-cyan-500", 
      category: "Dashboard"
    },
    {
      title: "Crypto Portfolio Tracker",
      description: "Real-time cryptocurrency portfolio management with alerts 💰",
      tech: ["Next.js", "TypeScript", "Redis", "WebSockets"],
      image: "photo-1487058792275-0ad4aaf24ca7",
      icon: Globe,
      color: "from-orange-500 to-yellow-500",
      category: "FinTech"
    }
  ];

  return (
    <section className="py-20 px-4 relative bg-gradient-to-br from-slate-100 via-purple-50 to-pink-50 overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 text-blue-400 animate-pulse">
          <Star size={20} fill="currentColor" />
        </div>
        <div className="absolute top-40 right-20 text-green-400 animate-bounce">
          <Plus size={24} strokeWidth={3} />
        </div>
        <div className="absolute bottom-32 left-20 text-purple-400 animate-pulse">
          <Star size={16} fill="currentColor" />
        </div>
        <div className="absolute bottom-20 right-10 text-orange-400 animate-bounce">
          <Plus size={20} strokeWidth={3} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-6xl md:text-7xl font-black text-blue-600 mb-4 transform -rotate-1 hover:rotate-0 transition-transform duration-300">
            Featured
          </h2>
          <h2 className="text-6xl md:text-7xl font-black text-purple-600 -mt-4 ml-8 transform rotate-2 hover:rotate-0 transition-transform duration-300">
            Projects 🚀
          </h2>
          <div className="bg-yellow-300 inline-block px-6 py-3 rounded-full mt-6 transform rotate-1 hover:rotate-0 transition-transform duration-300">
            <p className="text-gray-800 font-bold text-lg">
              Showcasing innovative solutions and creative implementations ✨
            </p>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          {projects.map((project, index) => (
            <div
              key={index}
              className="group relative bg-white rounded-3xl overflow-hidden hover:scale-105 transition-all duration-500 shadow-xl border-4 border-blue-200 hover:border-purple-300"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={`https://images.unsplash.com/${project.image}?auto=format&fit=crop&w=800&h=400`}
                  alt={project.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${project.color} opacity-60 group-hover:opacity-40 transition-opacity duration-500`}></div>
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-white/90 text-gray-800 text-sm rounded-full backdrop-blur-sm font-bold">
                    {project.category}
                  </span>
                </div>
                <div className="absolute top-4 right-4">
                  <div className={`w-12 h-12 bg-gradient-to-r ${project.color} rounded-full flex items-center justify-center transform rotate-12 hover:rotate-0 transition-transform duration-300`}>
                    <project.icon className="text-white" size={24} />
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-gradient-to-br from-white to-blue-50">
                <h3 className="text-2xl font-black text-gray-800 mb-3 group-hover:text-blue-600 transition-colors duration-300">
                  {project.title}
                </h3>
                <p className="text-gray-700 mb-4 leading-relaxed font-medium">
                  {project.description}
                </p>
                
                <div className="flex flex-wrap gap-2 mb-6">
                  {project.tech.map((tech, techIndex) => (
                    <span
                      key={techIndex}
                      className="px-3 py-1 bg-gradient-to-r from-blue-100 to-purple-100 text-gray-800 text-sm rounded-full border-2 border-blue-200 hover:border-purple-300 transition-colors duration-300 font-semibold"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
                
                <div className="flex space-x-4">
                  <button className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full hover:scale-105 transition-transform duration-300 font-bold shadow-lg">
                    <ExternalLink size={16} />
                    <span>Live Demo</span>
                  </button>
                  <button className="flex items-center space-x-2 px-6 py-3 border-2 border-gray-400 text-gray-700 rounded-full hover:bg-gray-100 hover:scale-105 transition-all duration-300 font-bold">
                    <Github size={16} />
                    <span>Code</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Projects;