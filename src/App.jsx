import React, { useState } from 'react';
import { BookOpen, Brain, Lightbulb, Sparkles, Loader2, Upload, X, RotateCcw, Coffee, MessageSquare, Mail, Info } from 'lucide-react';

export default function App() {
  const [input, setInput] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [questions, setQuestions] = useState(null);
  const [answers, setAnswers] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingAnswers, setLoadingAnswers] = useState(false);
  const [error, setError] = useState('');
  const [showInfo, setShowInfo] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [email, setEmail] = useState('');
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const dokLevels = [
    {
      level: 1,
      title: 'Doing Mathematics',
      description: 'Involves doing mathematics, not just locating numbers',
      color: 'bg-blue-50 border-blue-200',
      icon: BookOpen,
      iconColor: 'text-blue-600'
    },
    {
      level: 2,
      title: 'Modeling & Representing',
      description: 'Requires modeling, representing, or explaining a strategy',
      color: 'bg-green-50 border-green-200',
      icon: Brain,
      iconColor: 'text-green-600'
    },
    {
      level: 3,
      title: 'Reasoning & Justifying',
      description: 'Requires reasoning, justification, or decision-making',
      color: 'bg-orange-50 border-orange-200',
      icon: Lightbulb,
      iconColor: 'text-orange-600'
    },
    {
      level: 4,
      title: 'Generalizing & Creating',
      description: 'Involves generalizing, creating, or applying to new situations',
      color: 'bg-purple-50 border-purple-200',
      icon: Sparkles,
      iconColor: 'text-purple-600'
    }
  ];

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleReset = () => {
    setInput('');
    setGradeLevel('');
    setImageFile(null);
    setImagePreview(null);
    setQuestions(null);
    setAnswers(null);
    setError('');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setError('');
    } else if (file) {
      setError('Please upload an image file (PNG, JPG, etc.)');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const generateQuestions = async () => {
    if (!input.trim() && !imageFile) {
      setError('Please enter a math problem or upload an image to get started.');
      return;
    }

    setLoading(true);
    setError('');
    setQuestions(null);
    setAnswers(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input,
          gradeLevel,
          imageFile: imageFile ? await convertToBase64(imageFile) : null,
          imageType: imageFile?.type
        })
      });

      if (!response.ok) throw new Error('Failed to generate');
      
      const data = await response.json();
      setQuestions(data.questions);
    } catch (err) {
      setError('Failed to generate tasks. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generateAnswers = async () => {
    if (!questions) return;
    setLoadingAnswers(true);
    setError('');

    try {
      const response = await fetch('/api/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions, input })
      });

      if (!response.ok) throw new Error('Failed to generate answers');
      
      const data = await response.json();
      setAnswers(data.answers);
    } catch (err) {
      setError('Unable to generate answers. Please try again.');
      console.error(err);
    } finally {
      setLoadingAnswers(false);
    }
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      generateQuestions();
    }
  };

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    console.log('Email submitted:', email);
    setEmailSubmitted(true);
    setTimeout(() => {
      setShowEmailModal(false);
      setEmailSubmitted(false);
      setEmail('');
    }, 2000);
  };

  const downloadPDF = () => {
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Math Tasks - ${new Date().toLocaleDateString()}</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
        .header { text-align: center; border-bottom: 3px solid #4F46E5; padding-bottom: 20px; margin-bottom: 30px; }
        h1 { color: #4F46E5; }
        .task-card { margin-bottom: 30px; border: 2px solid #E5E7EB; border-radius: 8px; overflow: hidden; }
        .task-header { padding: 15px 20px; font-weight: bold; color: white; }
        .level-1 { background: #3B82F6; }
        .level-2 { background: #10B981; }
        .level-3 { background: #F59E0B; }
        .level-4 { background: #8B5CF6; }
        .task-content { padding: 20px; }
        .answer-section { background: #F9FAFB; padding: 15px; margin-top: 15px; border-top: 2px solid #E5E7EB; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📐 Math Task Builder</h1>
        <p>Generated: ${new Date().toLocaleString()}</p>
        ${gradeLevel ? `<p>Grade: ${gradeLevel}</p>` : ''}
    </div>
    
    ${[1,2,3,4].map(level => `
    <div class="task-card">
        <div class="task-header level-${level}">
            Level ${level}: ${dokLevels[level-1].title}
        </div>
        <div class="task-content">
            <p>${questions?.[`level${level}`] || ''}</p>
            ${answers?.[`level${level}`] ? `
            <div class="answer-section">
                <strong>Answer:</strong><br>
                ${answers[`level${level}`]}
            </div>` : ''}
        </div>
    </div>
    `).join('')}
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `math-tasks-${new Date().toISOString().split('T')[0]}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {isDragging && (
        <div className="fixed inset-0 bg-indigo-600 bg-opacity-90 z-40 flex items-center justify-center pointer-events-none">
          <div className="text-white text-center">
            <Upload className="w-20 h-20 mx-auto mb-4 animate-bounce" />
            <p className="text-3xl font-bold">Drop your image here</p>
          </div>
        </div>
      )}
      
      <div className="max-w-5xl mx-auto">
        <div className="fixed top-4 right-4 flex flex-col gap-2 z-50">
          <a href="https://ko-fi.com/creartstudiolab" target="_blank" rel="noopener noreferrer"
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-full shadow-lg transition-all flex items-center gap-2 font-medium">
            <Coffee className="w-4 h-4" />
            <span className="hidden sm:inline">Support</span>
          </a>
          <button onClick={() => window.open('https://forms.gle/oDbCe24e2t1v93mC8', '_blank')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full shadow-lg transition-all flex items-center gap-2 font-medium">
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Feedback</span>
          </button>
          <button onClick={() => window.open('https://forms.gle/HXBDSUURfmNdZpCB9', '_blank')}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full shadow-lg transition-all flex items-center gap-2 font-medium">
            <Mail className="w-4 h-4" />
            <span className="hidden sm:inline">Updates</span>
          </button>
        </div>

        {showEmailModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Get Updates</h3>
                  <p className="text-sm text-gray-600">Stay informed about new features</p>
                </div>
                <button onClick={() => setShowEmailModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              {!emailSubmitted ? (
                <form onSubmit={handleEmailSubmit}>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com" required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 mb-4" />
                  <button type="submit"
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg font-semibold">
                    Subscribe to Updates
                  </button>
                </form>
              ) : (
                <div className="text-center py-4">
                  <Mail className="w-12 h-12 mx-auto text-green-600 mb-2" />
                  <p className="text-lg font-semibold">Thank you!</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-3">
            <h1 className="text-5xl font-bold text-gray-900">Math Task Builder</h1>
            <button onClick={() => setShowInfo(!showInfo)} className="text-indigo-600 hover:text-indigo-700">
              <Info className="w-6 h-6" />
            </button>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Generate thinking-focused math tasks using Robert Kaplinsky's approach to cognitive demand
          </p>
          {showInfo && (
            <div className="mt-6 max-w-3xl mx-auto bg-blue-50 border-2 border-blue-200 rounded-lg p-6 text-left">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-600" />
                About Math Task Builder
              </h3>
              <p className="text-gray-700 mb-3">
                This tool generates 4 math tasks based on Robert Kaplinsky's cognitive demand framework.
              </p>
              <div className="space-y-2 text-sm text-gray-700">
                <p><strong>Level 1:</strong> Doing mathematics</p>
                <p><strong>Level 2:</strong> Modeling & representing</p>
                <p><strong>Level 3:</strong> Reasoning & justifying</p>
                <p><strong>Level 4:</strong> Generalizing & creating</p>
              </div>
              <button onClick={() => setShowInfo(false)}
                className="mt-4 text-blue-600 hover:text-blue-700 font-medium text-sm">
                Got it, close this
              </button>
            </div>
          )}
        </div>

        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-amber-50 border-l-4 border-amber-400 rounded-lg p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-600 mt-0.5" />
              <p className="text-sm text-gray-800">
                <strong>Created by Jose O'Donovan</strong> using Claude AI. AI-generated content may occasionally contain errors. Please review all tasks before classroom use.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-xl p-8 mb-8 max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
            <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">Grade Level:</label>
            <select value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)}
              className="w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm">
              <option value="">No specific grade level</option>
              <option value="K-2">K-2 (Kindergarten - Grade 2)</option>
              <option value="3-5">3-5 (Grades 3-5)</option>
              <option value="6-8">6-8 (Grades 6-8)</option>
              <option value="9-12">9-12 (Grades 9-12)</option>
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">Math Problem or Concept</label>
            <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={handleKeyPress}
              placeholder="Example: A bakery sells cupcakes for $3 each. If someone buys 5 cupcakes, how much do they pay?"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none" rows="4" />
            <p className="text-xs text-gray-500 mt-1">You can also try: "fractions" or "2x + 5 = 15" • Press Enter to generate</p>
          </div>

          <div className="mb-6">
            {!imagePreview ? (
              <div className="flex items-center gap-4">
                <input type="file" id="image-upload" accept="image/*" onChange={handleImageUpload} className="hidden" />
                <label htmlFor="image-upload"
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg cursor-pointer text-sm font-medium">
                  <Upload className="w-4 h-4" />
                  Upload Image
                </label>
                <span className="text-sm text-gray-500">or drag and drop an image anywhere</span>
              </div>
            ) : (
              <div className="relative inline-block">
                <img src={imagePreview} alt="Math problem" className="max-h-40 rounded-lg border-2 border-gray-300" />
                <button onClick={removeImage}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 shadow-md">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={generateQuestions} disabled={loading}
              className="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-400 flex items-center justify-center shadow-md">
              {loading ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Generating Tasks...</>
              ) : 'Generate Thinking Tasks'}
            </button>
            {(input.trim() || imageFile || questions) && (
              <button onClick={handleReset} disabled={loading}
                className="bg-gray-500 text-white py-3 px-5 rounded-lg font-semibold hover:bg-gray-600 disabled:bg-gray-400 flex items-center justify-center shadow-md">
                <RotateCcw className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {questions && (
          <>
            <div className="bg-white rounded-xl shadow-lg p-5 mb-6 max-w-4xl mx-auto">
              <div className="flex gap-3">
                <button onClick={generateAnswers} disabled={loadingAnswers || answers}
                  className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 flex items-center justify-center shadow-md">
                  {loadingAnswers ? (
                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Generating Answers...</>
                  ) : answers ? 'Answers Shown Below' : 'Show Answers & Solutions'}
                </button>
                <button onClick={downloadPDF}
                  className="bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 flex items-center shadow-md">
                  📄 Download Document
                </button>
              </div>
            </div>

            <div className="space-y-5 max-w-4xl mx-auto">
              {dokLevels.map((dok) => {
                const Icon = dok.icon;
                return (
                  <div key={dok.level} className={`${dok.color} border-2 rounded-xl p-6 hover:shadow-lg`}>
                    <div className="flex items-start gap-4">
                      <div className={`${dok.iconColor} bg-white p-2 rounded-lg shadow-sm`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                          Level {dok.level}: {dok.title}
                        </h3>
                        <p className="text-xs text-gray-600 mb-4 italic">{dok.description}</p>
                        <p className="text-gray-800 leading-relaxed">
                          {questions[`level${dok.level}`]}
                        </p>
                        {answers && answers[`level${dok.level}`] && (
                          <div className="mt-5 pt-5 border-t-2 border-gray-300">
                            <p className="text-sm font-bold text-gray-700 mb-2 uppercase">Answer & Solution:</p>
                            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                              {answers[`level${dok.level}`]}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
