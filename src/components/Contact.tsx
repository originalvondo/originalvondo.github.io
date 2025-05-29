import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, Heart, Coffee, Code, Star, Plus } from 'lucide-react';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Handle form submission here
  };

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
        <svg className="absolute top-1/4 right-1/4 w-24 h-24 text-pink-400 opacity-60" viewBox="0 0 100 100">
          <path d="M20,50 Q50,20 80,50" stroke="currentColor" strokeWidth="2" fill="none" className="animate-pulse"/>
        </svg>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-6xl md:text-7xl font-black text-blue-600 mb-4 transform -rotate-1 hover:rotate-0 transition-transform duration-300">
            Let's
          </h2>
          <h2 className="text-6xl md:text-7xl font-black text-purple-600 -mt-4 ml-8 transform rotate-2 hover:rotate-0 transition-transform duration-300">
            Connect! 🤝
          </h2>
          <div className="bg-yellow-300 inline-block px-6 py-3 rounded-full mt-6 transform rotate-1 hover:rotate-0 transition-transform duration-300">
            <p className="text-gray-800 font-bold text-lg">
              Ready to bring your ideas to life? Let's create something amazing together! ✨
            </p>
          </div>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div className="space-y-8">
            <div className="bg-white rounded-2xl p-8 border-4 border-blue-200 shadow-lg transform hover:scale-105 transition-transform duration-300">
              <h3 className="text-2xl font-black text-gray-800 mb-6 flex items-center bg-gradient-to-r from-pink-400 to-red-400 bg-clip-text text-transparent">
                <Heart className="text-red-400 mr-3" size={24} />
                Get In Touch
              </h3>
              
              <div className="space-y-6">
                {[
                  { icon: Mail, label: 'Email', value: 'tanvirul.tanim1502@gmail.com', color: 'bg-blue-400', bgColor: 'bg-blue-100' },
                  { icon: Phone, label: 'Phone', value: '01606731752', color: 'bg-green-400', bgColor: 'bg-green-100' },
                  { icon: MapPin, label: 'Location', value: 'Chittagong, Bangladesh', color: 'bg-purple-400', bgColor: 'bg-purple-100' }
                ].map(({ icon: Icon, label, value, color, bgColor }, index) => (
                  <div 
                    key={label}
                    className={`flex items-center space-x-4 p-4 ${bgColor} rounded-xl hover:scale-105 transition-transform duration-300 border-2 border-transparent hover:border-current`}
                  >
                    <div className={`w-12 h-12 ${color} rounded-full flex items-center justify-center transform rotate-12 hover:rotate-0 transition-transform duration-300`}>
                      <Icon className="text-white" size={20} />
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm font-bold">{label}</p>
                      <p className="text-gray-800 font-black text-lg">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-yellow-200 to-orange-200 rounded-2xl p-8 border-4 border-yellow-400 shadow-lg transform hover:scale-105 transition-transform duration-300">
              <h4 className="text-xl font-black text-gray-800 mb-4 flex items-center">
                <Coffee className="text-yellow-600 mr-3" size={20} />
                Fun Facts About Me 🎉
              </h4>
              <ul className="space-y-3 text-gray-800">
                <li className="flex items-center font-semibold">
                  <Code className="text-green-500 mr-3" size={16} />
                  I've written over 100k lines of code ⌨️
                </li>
                <li className="flex items-center font-semibold">
                  <Coffee className="text-yellow-600 mr-3" size={16} />
                  Powered by coffee and curiosity ☕
                </li>
                <li className="flex items-center font-semibold">
                  <Heart className="text-red-500 mr-3" size={16} />
                  Love solving complex problems 🧩
                </li>
              </ul>
            </div>
          </div>
          
          {/* Contact Form */}
          <div className="bg-white rounded-2xl p-8 border-4 border-purple-200 shadow-lg transform hover:scale-105 transition-transform duration-300">
            <h3 className="text-2xl font-black text-gray-800 mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Send Message 📧</h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-gray-800 mb-2 font-bold">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-blue-50 border-2 border-blue-200 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all duration-300 font-medium"
                  placeholder="Your awesome name"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-800 mb-2 font-bold">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-green-50 border-2 border-green-200 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all duration-300 font-medium"
                  placeholder="your.email@example.com"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-800 mb-2 font-bold">Message</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows={6}
                  className="w-full px-4 py-3 bg-yellow-50 border-2 border-yellow-200 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all duration-300 resize-none font-medium"
                  placeholder="Tell me about your project ideas..."
                  required
                />
              </div>
              
              <button
                type="submit"
                className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-black text-lg hover:scale-105 transform transition-all duration-300 hover:shadow-lg flex items-center justify-center space-x-2 border-4 border-purple-300"
              >
                <Send size={20} />
                <span>Send Message 🚀</span>
              </button>
            </form>
          </div>
        </div>
        
        {/* Footer */}
        <div className="text-center mt-16 pt-8 border-t-4 border-blue-200">
          <div className="bg-pink-200 inline-block px-6 py-3 rounded-full transform rotate-1 hover:rotate-0 transition-transform duration-300 border-4 border-pink-300">
            <p className="text-gray-800 mb-2 font-bold">
              Hope you had a great time on my Portfolio website <Heart className="inline text-red-500" size={16} /> If you see me in real life, do invite me for a cup of tea ☕
            </p>
          </div>
          <p className="text-gray-600 text-sm mt-4 font-semibold">
            © 2024 Tanvirul Portfolio. All rights reserved.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Contact;