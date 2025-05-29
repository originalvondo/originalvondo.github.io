import React from 'react';
import { GraduationCap, Award, BookOpen, Calendar, Star, Sparkles } from 'lucide-react';

const Education = () => {
  const educationData = [
    {
      degree: "Master of Computer Science",
      school: "Stanford University",
      year: "2020-2022",
      gpa: "3.9/4.0",
      description: "Specialized in Machine Learning and Web Technologies 🤖",
      icon: GraduationCap,
      color: "bg-blue-500",
      textColor: "text-blue-600"
    },
    {
      degree: "Bachelor of Software Engineering",
      school: "MIT",
      year: "2016-2020",
      gpa: "3.8/4.0", 
      description: "Focus on Full Stack Development and UI/UX Design 💻",
      icon: BookOpen,
      color: "bg-green-500",
      textColor: "text-green-600"
    },
    {
      degree: "Certified AWS Solutions Architect",
      school: "Amazon Web Services",
      year: "2023",
      gpa: "Professional",
      description: "Cloud architecture and scalable systems design ☁️",
      icon: Award,
      color: "bg-orange-500",
      textColor: "text-orange-600"
    }
  ];

  return (
    <section className="py-20 px-4 relative bg-gradient-to-b from-purple-50 to-blue-50">
      {/* Decorative elements */}
      <div className="absolute top-10 left-10 text-purple-400 animate-pulse">
        <Star size={20} fill="currentColor" />
      </div>
      <div className="absolute top-20 right-20 text-blue-400 animate-bounce">
        <Sparkles size={24} />
      </div>
      <div className="absolute bottom-10 left-20 text-green-400 animate-pulse">
        <Star size={16} fill="currentColor" />
      </div>

      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-black text-blue-600 mb-4 transform -rotate-1 hover:rotate-0 transition-transform duration-300">
            EDUCATION 🎓
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto font-medium">
            Building knowledge through continuous learning and growth
          </p>
        </div>
        
        <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-8">
          {educationData.map((edu, index) => (
            <div
              key={index}
              className="group relative bg-white rounded-3xl p-8 hover:shadow-2xl transition-all duration-500 hover:scale-105 border-4 border-gray-200 hover:border-current"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <div className="relative z-10">
                <div className={`w-16 h-16 ${edu.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 transform -rotate-3 group-hover:rotate-0`}>
                  <edu.icon className="text-white" size={24} />
                </div>
                
                <h3 className={`text-xl font-bold ${edu.textColor} mb-2 group-hover:scale-105 transition-all duration-300`}>
                  {edu.degree}
                </h3>
                
                <div className="flex items-center text-purple-600 mb-2 font-semibold">
                  <Calendar size={16} className="mr-2" />
                  <span>{edu.year}</span>
                </div>
                
                <p className="text-gray-600 mb-3 font-medium">{edu.school}</p>
                <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full inline-block text-sm font-bold mb-4">
                  GPA: {edu.gpa}
                </div>
                <p className="text-gray-700 leading-relaxed">{edu.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Education;