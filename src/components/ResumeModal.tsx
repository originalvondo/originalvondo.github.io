import React, { useState } from 'react';
import { X, Download, FileText, Image, Printer } from 'lucide-react';

interface ResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ResumeModal: React.FC<ResumeModalProps> = ({ isOpen, onClose }) => {
  const [selectedFormat, setSelectedFormat] = useState('pdf');

  if (!isOpen) return null;

  const handleDownload = () => {
    console.log(`Downloading resume in ${selectedFormat} format`);
    // In a real app, this would trigger the actual download
  };

  const formats = [
    { value: 'pdf', label: 'PDF', icon: FileText, color: 'text-red-500' },
    { value: 'png', label: 'PNG', icon: Image, color: 'text-green-500' },
    { value: 'jpg', label: 'JPG', icon: Image, color: 'text-blue-500' },
    { value: 'print', label: 'Print', icon: Printer, color: 'text-purple-500' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full mx-4 max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-100 p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Resume</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Resume Content */}
        <div className="p-8 max-h-[70vh] overflow-y-auto bg-pink-50">
          {/* Resume Paper */}
          <div className="bg-white max-w-3xl mx-auto shadow-lg" style={{ aspectRatio: '8.5/11' }}>
            {/* Header Section */}
            <div className="bg-gray-200 p-6 border-2 border-black">
              <div className="flex justify-between items-start">
                <div className="bg-white px-4 py-2 border border-black rounded-full">
                  <span className="text-sm font-medium">HANOI, VIETNAM</span>
                </div>
                <div className="text-center flex-1 mx-4">
                  <h1 className="text-3xl font-black tracking-wider">RESUMÉ</h1>
                  <div className="flex justify-center space-x-2 mt-1">
                    <span className="text-2xl">✦</span>
                    <span className="text-2xl">✦</span>
                  </div>
                </div>
                <div className="bg-white p-3 border-2 border-black rounded-full">
                  <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-green-400">
                    <span className="text-xs font-bold text-center leading-tight">FOR HIRE<br/>WITH FOR</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mt-4 text-center">
                <div className="bg-white px-3 py-1 border border-black">
                  <span className="text-sm font-medium">FULL STACK DEVELOPER</span>
                </div>
                <div className="bg-white px-3 py-1 border border-black">
                  <span className="text-sm font-medium">FULL STACK DEVELOPER</span>
                </div>
                <div className="bg-white px-3 py-1 border border-black">
                  <span className="text-sm font-medium">FULL STACK DEVELOPER</span>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="p-6 grid grid-cols-3 gap-6">
              {/* Left Column - Photo and Intro */}
              <div className="space-y-4">
                <div className="relative">
                  <div className="w-32 h-32 bg-yellow-400 rounded-full p-1">
                    <div className="w-full h-full bg-green-400 rounded-full p-1">
                      <img
                        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&h=300"
                        alt="Tanvirul Islam"
                        className="w-full h-full rounded-full object-cover"
                      />
                    </div>
                  </div>
                  <div className="absolute -top-2 -right-2 text-yellow-400 text-2xl">✦</div>
                  <div className="absolute -bottom-2 -left-2 text-yellow-400 text-2xl">✦</div>
                </div>

                <div className="bg-yellow-100 p-4 rounded-lg">
                  <h2 className="text-2xl font-black text-green-600 mb-2" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                    Hi there,
                  </h2>
                  <p className="text-sm leading-relaxed">
                    My name is Tanvirul Islam, you may call me Tanvirul. I'm a 
                    passionate Full Stack Developer based in Hanoi, Vietnam.
                  </p>
                  <p className="text-sm leading-relaxed mt-2">
                    As an experienced developer with over 3 years in the 
                    industry, I specialize in creating modern web applications 
                    for e-commerce and social media, events, and SaaS platforms.
                  </p>
                  <p className="text-sm leading-relaxed mt-2">
                    I am highly motivated, constantly seeking new skills and in-
                    spiration to improve my craft, and eager to take on new 
                    challenges to advance my career.
                  </p>
                </div>

                {/* Contact */}
                <div className="bg-green-600 text-white p-3 rounded-lg">
                  <h3 className="text-lg font-black mb-2">CONTACT</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="bg-yellow-400 p-1 rounded">
                        <span className="text-xs">📱</span>
                      </div>
                      <span className="text-sm">(+84) 968 616 280</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="bg-yellow-400 p-1 rounded">
                        <span className="text-xs">✉️</span>
                      </div>
                      <span className="text-sm">tanvirul98@gmail.com</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="bg-yellow-400 p-1 rounded">
                        <span className="text-xs">🔗</span>
                      </div>
                      <span className="text-sm">be.net/tanvirul98</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="bg-yellow-400 p-1 rounded">
                        <span className="text-xs">📍</span>
                      </div>
                      <span className="text-sm">Thanh Xuan, Hanoi</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Columns - Experience and Skills */}
              <div className="col-span-2 space-y-6">
                {/* Education and Technical Skills Row */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Education */}
                  <div>
                    <div className="bg-green-600 text-white px-4 py-2 rounded-lg mb-3">
                      <h3 className="text-sm font-black">EDUCATION</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-2">
                        <div className="bg-yellow-400 px-2 py-1 rounded text-xs font-bold">2020</div>
                        <div>
                          <div className="font-bold text-sm">COMPUTER SCIENCE UNIVERSITY</div>
                          <div className="text-xs">7-month Specialization Course</div>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <div className="bg-yellow-400 px-2 py-1 rounded text-xs font-bold">2019</div>
                        <div>
                          <div className="font-bold text-sm">NATIONAL TECHNOLOGY UNIVERSITY</div>
                          <div className="text-xs">International Computer Science</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Technical Skills */}
                  <div>
                    <div className="bg-green-600 text-white px-4 py-2 rounded-lg mb-3">
                      <h3 className="text-sm font-black">TECHNICAL SKILLS</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-blue-600 text-white p-2 rounded text-center text-xs font-bold">React</div>
                      <div className="bg-orange-500 text-white p-2 rounded text-center text-xs font-bold">Node.js</div>
                      <div className="bg-blue-400 text-white p-2 rounded text-center text-xs font-bold">TypeScript</div>
                      <div className="bg-green-500 text-white p-2 rounded text-center text-xs font-bold">MongoDB</div>
                      <div className="bg-red-500 text-white p-2 rounded text-center text-xs font-bold">Python</div>
                    </div>
                  </div>
                </div>

                {/* Experience and Personal Skills Row */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Experience */}
                  <div>
                    <div className="bg-green-600 text-white px-4 py-2 rounded-lg mb-3">
                      <h3 className="text-sm font-black">EXPERIENCE</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-2">
                        <div className="bg-yellow-400 px-2 py-1 rounded text-xs font-bold">2023</div>
                        <div>
                          <div className="font-bold text-sm">TECH STARTUP COMPANY</div>
                          <div className="text-xs">Senior Full Stack Developer</div>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <div className="bg-yellow-400 px-2 py-1 rounded text-xs font-bold">2022</div>
                        <div>
                          <div className="font-bold text-sm">FREELANCE DEVELOPER</div>
                          <div className="text-xs">Full Stack Development</div>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <div className="bg-yellow-400 px-2 py-1 rounded text-xs font-bold">2021</div>
                        <div>
                          <div className="font-bold text-sm">JUNIOR DEVELOPER</div>
                          <div className="text-xs">Web Development Intern</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Personal Skills */}
                  <div>
                    <div className="bg-green-600 text-white px-4 py-2 rounded-lg mb-3">
                      <h3 className="text-sm font-black">PERSONAL SKILLS</h3>
                    </div>
                    <div className="space-y-2">
                      <div className="bg-teal-400 text-white px-3 py-1 rounded-full text-xs font-bold inline-block mr-2">
                        RESPONSIBILITY
                      </div>
                      <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold inline-block mr-2">
                        TEAMWORK
                      </div>
                      <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold inline-block mr-2">
                        TIME MANAGEMENT
                      </div>
                      <div className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold inline-block">
                        COMMUNICATION
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Download Section */}
        <div className="bg-gray-50 p-4 border-t">
          <div className="flex justify-center space-x-4 mb-4">
            {formats.map(({ value, label, icon: Icon, color }) => (
              <button
                key={value}
                onClick={() => setSelectedFormat(value)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  selectedFormat === value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <Icon className={`${color} mx-auto mb-1`} size={20} />
                <p className="text-xs font-medium">{label}</p>
              </button>
            ))}
          </div>

          <button
            onClick={handleDownload}
            className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
          >
            <Download size={20} />
            Download Resume as {selectedFormat.toUpperCase()}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResumeModal;