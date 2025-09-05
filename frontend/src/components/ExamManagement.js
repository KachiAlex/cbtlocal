import React, { useState, useEffect } from 'react';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import mammoth from 'mammoth';
import dataService from '../services/dataService';

// Helper function to generate unique IDs
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

const ExamManagement = ({ user, onBack }) => {
  const [exams, setExams] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [showCreateExam, setShowCreateExam] = useState(false);
  const [showQuestions, setShowQuestions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [importError, setImportError] = useState("");
  const [importSuccess, setImportSuccess] = useState("");

  // Form states for creating/editing exams
  const [examForm, setExamForm] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    duration: 60, // minutes
    totalQuestions: 0,
    passingScore: 50
  });

  // Form states for creating questions
  const [questionForm, setQuestionForm] = useState({
    text: '',
    options: ['', '', '', ''],
    correctIndex: 0,
    explanation: ''
  });

  // Load exams on component mount
  useEffect(() => {
    loadExams();
  }, []);

  // Load questions when exam is selected
  useEffect(() => {
    if (selectedExam) {
      loadQuestionsForExam(selectedExam.id);
    }
  }, [selectedExam]);

  const loadExams = async () => {
    try {
      setLoading(true);
      const examsData = await dataService.loadExams();
      setExams(Array.isArray(examsData) ? examsData : []);
    } catch (error) {
      console.error('Error loading exams:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadQuestionsForExam = async (examId) => {
    try {
      const questionsData = await dataService.loadQuestionsForExam(examId);
      setQuestions(Array.isArray(questionsData) ? questionsData : []);
    } catch (error) {
      console.error('Error loading questions:', error);
      setQuestions([]);
    }
  };

  const saveExam = async (examData) => {
    try {
      const updatedExams = [...exams];
      if (examData.id) {
        // Update existing exam
        const index = updatedExams.findIndex(e => e.id === examData.id);
        if (index !== -1) {
          updatedExams[index] = { ...updatedExams[index], ...examData };
        }
      } else {
        // Create new exam
        const newExam = {
          ...examData,
          id: generateId(),
          createdAt: new Date().toISOString(),
          isActive: false,
          questionCount: 0
        };
        updatedExams.push(newExam);
      }
      
      await dataService.saveExams(updatedExams);
      setExams(updatedExams);
      return true;
    } catch (error) {
      console.error('Error saving exam:', error);
      return false;
    }
  };

  const saveQuestionsForExam = async (examId, questionsData) => {
    try {
      await dataService.saveQuestionsForExam(examId, questionsData);
      // Update exam question count
      const updatedExams = exams.map(exam => 
        exam.id === examId ? { ...exam, questionCount: questionsData.length } : exam
      );
      await dataService.saveExams(updatedExams);
      setExams(updatedExams);
      return true;
    } catch (error) {
      console.error('Error saving questions:', error);
      return false;
    }
  };

  const handleCreateExam = async (e) => {
    e.preventDefault();
    const success = await saveExam(examForm);
    if (success) {
      setShowCreateExam(false);
      setExamForm({
        title: '',
        description: '',
        startDate: '',
        endDate: '',
        duration: 60,
        totalQuestions: 0,
        passingScore: 50
      });
    }
  };

  const handleCreateQuestion = async (e) => {
    e.preventDefault();
    if (!selectedExam) return;

    const newQuestion = {
      id: generateId(),
      examId: selectedExam.id,
      ...questionForm
    };

    const updatedQuestions = [...questions, newQuestion];
    const success = await saveQuestionsForExam(selectedExam.id, updatedQuestions);
    
    if (success) {
      setQuestions(updatedQuestions);
      setQuestionForm({
        text: '',
        options: ['', '', '', ''],
        correctIndex: 0,
        explanation: ''
      });
    }
  };

  const handleFileUpload = async (file) => {
    setImportError("");
    setImportSuccess("");
    
    try {
      const fileExtension = file.name.toLowerCase().split('.').pop();
      
      if (fileExtension === 'docx') {
        const arrayBuffer = await file.arrayBuffer();
        const { value: markdown } = await mammoth.convertToMarkdown({ arrayBuffer });
        const parsed = parseQuestionsFromMarkdown(markdown);
        
        if (parsed.length === 0) {
          throw new Error("No questions found. Please check the document format.");
        }
        
        if (selectedExam) {
          await saveQuestionsForExam(selectedExam.id, parsed);
          setQuestions(parsed);
          setImportSuccess(`Successfully imported ${parsed.length} questions!`);
        }
      } else if (fileExtension === 'xlsx') {
        const parsed = await parseQuestionsFromExcel(file);
        
        if (parsed.length === 0) {
          throw new Error("No questions found. Please check the Excel format.");
        }
        
        if (selectedExam) {
          await saveQuestionsForExam(selectedExam.id, parsed);
          setQuestions(parsed);
          setImportSuccess(`Successfully imported ${parsed.length} questions!`);
        }
      } else {
        throw new Error("Unsupported file format. Please upload a .docx or .xlsx file.");
      }
      
      setTimeout(() => setImportSuccess(""), 3000);
    } catch (error) {
      console.error("Upload error:", error);
      setImportError(error.message || "Failed to import file");
      setTimeout(() => setImportError(""), 5000);
    }
  };

  const parseQuestionsFromMarkdown = (markdown) => {
    const questions = [];
    const lines = markdown.split('\n');
    let currentQuestion = null;
    let optionIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith('**') && line.endsWith('**')) {
        // This is a question
        if (currentQuestion) {
          questions.push(currentQuestion);
        }
        currentQuestion = {
          id: generateId(),
          examId: selectedExam?.id,
          text: line.replace(/\*\*/g, ''),
          options: [],
          correctIndex: 0,
          explanation: ''
        };
        optionIndex = 0;
      } else if (line.startsWith('-') && currentQuestion && optionIndex < 4) {
        // This is an option
        const optionText = line.substring(1).trim();
        currentQuestion.options[optionIndex] = optionText;
        optionIndex++;
      } else if (line.startsWith('**Correct:**') && currentQuestion) {
        // This indicates the correct answer
        const correctText = line.replace('**Correct:**', '').trim();
        const correctIndex = currentQuestion.options.findIndex(opt => 
          opt.toLowerCase() === correctText.toLowerCase()
        );
        if (correctIndex !== -1) {
          currentQuestion.correctIndex = correctIndex;
        }
      }
    }
    
    if (currentQuestion && currentQuestion.options.length > 0) {
      questions.push(currentQuestion);
    }
    
    return questions;
  };

  const parseQuestionsFromExcel = async (file) => {
    const workbook = new ExcelJS.Workbook();
    const arrayBuffer = await file.arrayBuffer();
    await workbook.xlsx.load(arrayBuffer);
    
    const worksheet = workbook.getWorksheet(1);
    const questions = [];
    
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header row
      
      const questionText = row.getCell(1).value;
      const optionA = row.getCell(2).value;
      const optionB = row.getCell(3).value;
      const optionC = row.getCell(4).value;
      const optionD = row.getCell(5).value;
      const correctAnswer = row.getCell(6).value;
      
      if (questionText && optionA && optionB && optionC && optionD && correctAnswer) {
        const options = [optionA, optionB, optionC, optionD];
        const correctIndex = options.findIndex(opt => 
          opt.toString().toLowerCase() === correctAnswer.toString().toLowerCase()
        );
        
        if (correctIndex !== -1) {
          questions.push({
            id: generateId(),
            examId: selectedExam?.id,
            text: questionText.toString(),
            options: options.map(opt => opt.toString()),
            correctIndex: correctIndex,
            explanation: ''
          });
        }
      }
    });
    
    return questions;
  };

  const downloadSampleExcel = () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Questions Template');
    
    worksheet.columns = [
      { header: 'Question Text', key: 'question', width: 40 },
      { header: 'Option A', key: 'optionA', width: 20 },
      { header: 'Option B', key: 'optionB', width: 20 },
      { header: 'Option C', key: 'optionC', width: 20 },
      { header: 'Option D', key: 'optionD', width: 20 },
      { header: 'Correct Answer', key: 'correct', width: 20 }
    ];
    
    // Add sample questions
    worksheet.addRows([
      {
        question: 'What is the capital of France?',
        optionA: 'London',
        optionB: 'Paris',
        optionC: 'Berlin',
        optionD: 'Madrid',
        correct: 'Paris'
      },
      {
        question: 'Which planet is closest to the Sun?',
        optionA: 'Venus',
        optionB: 'Earth',
        optionC: 'Mercury',
        optionD: 'Mars',
        correct: 'Mercury'
      }
    ]);
    
    workbook.xlsx.writeBuffer().then(buffer => {
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      saveAs(blob, 'Questions_Template.xlsx');
    });
  };

  const downloadSampleWord = () => {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: 'Questions Template', bold: true, size: 24 })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Use this format for your questions:', size: 14 })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: '**What is the capital of France?**', bold: true })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: '- London' })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: '- Paris' })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: '- Berlin' })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: '- Madrid' })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: '**Correct:** Paris', bold: true })
            ]
          })
        ]
      }]
    });
    
    Packer.toBlob(doc).then(blob => {
      saveAs(blob, 'Questions_Template.docx');
    });
  };

  const deleteExam = async (examId) => {
    if (window.confirm('Are you sure you want to delete this exam? This will also delete all associated questions.')) {
      try {
        const updatedExams = exams.filter(e => e.id !== examId);
        await dataService.saveExams(updatedExams);
        setExams(updatedExams);
        
        if (selectedExam?.id === examId) {
          setSelectedExam(null);
          setQuestions([]);
          setShowQuestions(false);
        }
      } catch (error) {
        console.error('Error deleting exam:', error);
      }
    }
  };

  const deleteQuestion = async (questionId) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      try {
        const updatedQuestions = questions.filter(q => q.id !== questionId);
        await saveQuestionsForExam(selectedExam.id, updatedQuestions);
        setQuestions(updatedQuestions);
      } catch (error) {
        console.error('Error deleting question:', error);
      }
    }
  };

  const toggleExamStatus = async (examId) => {
    try {
      const updatedExams = exams.map(exam => 
        exam.id === examId ? { ...exam, isActive: !exam.isActive } : exam
      );
      await dataService.saveExams(updatedExams);
      setExams(updatedExams);
    } catch (error) {
      console.error('Error toggling exam status:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (showCreateExam) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Create New Exam</h2>
            <button
              onClick={() => setShowCreateExam(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              ✕ Close
            </button>
          </div>
          
          <form onSubmit={handleCreateExam} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exam Title *
                </label>
                <input
                  type="text"
                  required
                  value={examForm.title}
                  onChange={(e) => setExamForm({...examForm, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter exam title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (minutes) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={examForm.duration}
                  onChange={(e) => setExamForm({...examForm, duration: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="datetime-local"
                  value={examForm.startDate}
                  onChange={(e) => setExamForm({...examForm, startDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="datetime-local"
                  value={examForm.endDate}
                  onChange={(e) => setExamForm({...examForm, endDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Passing Score (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={examForm.passingScore}
                  onChange={(e) => setExamForm({...examForm, passingScore: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={examForm.description}
                onChange={(e) => setExamForm({...examForm, description: e.target.value})}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter exam description"
              />
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setShowCreateExam(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create Exam
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (showQuestions && selectedExam) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Questions for: {selectedExam.title}</h2>
              <p className="text-gray-600">Total Questions: {questions.length}</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowQuestions(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                ← Back to Exams
              </button>
            </div>
          </div>

          {/* File Upload Section */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Import Questions</h3>
            <div className="flex flex-wrap gap-3 items-center">
              <input
                type="file"
                accept=".xlsx,.docx"
                onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0])}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <button
                onClick={downloadSampleExcel}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                📥 Excel Template
              </button>
              <button
                onClick={downloadSampleWord}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                📥 Word Template
              </button>
            </div>
            
            {importError && (
              <div className="mt-3 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {importError}
              </div>
            )}
            
            {importSuccess && (
              <div className="mt-3 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                {importSuccess}
              </div>
            )}
          </div>

          {/* Create Question Form */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Add New Question</h3>
            <form onSubmit={handleCreateQuestion} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question Text *
                </label>
                <textarea
                  required
                  value={questionForm.text}
                  onChange={(e) => setQuestionForm({...questionForm, text: e.target.value})}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your question here"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {questionForm.options.map((option, index) => (
                  <div key={index}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Option {String.fromCharCode(65 + index)} *
                    </label>
                    <input
                      type="text"
                      required
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...questionForm.options];
                        newOptions[index] = e.target.value;
                        setQuestionForm({...questionForm, options: newOptions});
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={`Option ${String.fromCharCode(65 + index)}`}
                    />
                  </div>
                ))}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Correct Answer *
                </label>
                <select
                  required
                  value={questionForm.correctIndex}
                  onChange={(e) => setQuestionForm({...questionForm, correctIndex: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {questionForm.options.map((option, index) => (
                    <option key={index} value={index}>
                      {String.fromCharCode(65 + index)}: {option || `Option ${String.fromCharCode(65 + index)}`}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Explanation (Optional)
                </label>
                <textarea
                  value={questionForm.explanation}
                  onChange={(e) => setQuestionForm({...questionForm, explanation: e.target.value})}
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Explain why this answer is correct"
                />
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add Question
                </button>
              </div>
            </form>
          </div>

          {/* Questions List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Current Questions</h3>
            {questions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No questions added yet. Add questions manually or import from a file.
              </div>
            ) : (
              questions.map((question, index) => (
                <div key={question.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-semibold">Question {index + 1}</h4>
                    <button
                      onClick={() => deleteQuestion(question.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                  
                  <p className="mb-3">{question.text}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                    {question.options.map((option, optIndex) => (
                      <div
                        key={optIndex}
                        className={`p-2 rounded ${
                          optIndex === question.correctIndex
                            ? 'bg-green-100 border border-green-300'
                            : 'bg-gray-50 border border-gray-200'
                        }`}
                      >
                        <span className="font-medium">
                          {String.fromCharCode(65 + optIndex)}:
                        </span> {option}
                        {optIndex === question.correctIndex && (
                          <span className="ml-2 text-green-600">✓ Correct</span>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {question.explanation && (
                    <div className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
                      <strong>Explanation:</strong> {question.explanation}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // Main exams list view
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Exam Management</h2>
            <p className="text-gray-600">Create and manage exams for your institution</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onBack}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              ← Back
            </button>
            <button
              onClick={() => setShowCreateExam(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              ➕ Create New Exam
            </button>
          </div>
        </div>

        {exams.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Exams Created Yet</h3>
            <p className="text-gray-600 mb-6">Start by creating your first exam</p>
            <button
              onClick={() => setShowCreateExam(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-lg"
            >
              Create Your First Exam
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {exams.map((exam) => (
              <div key={exam.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{exam.title}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        exam.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {exam.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    {exam.description && (
                      <p className="text-gray-600 mb-2">{exam.description}</p>
                    )}
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Duration:</span> {exam.duration} min
                      </div>
                      <div>
                        <span className="font-medium">Questions:</span> {exam.questionCount || 0}
                      </div>
                      <div>
                        <span className="font-medium">Passing Score:</span> {exam.passingScore}%
                      </div>
                      <div>
                        <span className="font-medium">Status:</span> {exam.isActive ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                    
                    {(exam.startDate || exam.endDate) && (
                      <div className="mt-2 text-sm text-gray-600">
                        {exam.startDate && (
                          <span className="mr-4">
                            <span className="font-medium">Start:</span> {new Date(exam.startDate).toLocaleString()}
                          </span>
                        )}
                        {exam.endDate && (
                          <span>
                            <span className="font-medium">End:</span> {new Date(exam.endDate).toLocaleString()}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col space-y-2 ml-4">
                    <button
                      onClick={() => {
                        setSelectedExam(exam);
                        setShowQuestions(true);
                      }}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      📝 Questions
                    </button>
                    
                    <button
                      onClick={() => toggleExamStatus(exam.id)}
                      className={`px-3 py-1 text-sm rounded ${
                        exam.isActive
                          ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {exam.isActive ? '⏸️ Deactivate' : '▶️ Activate'}
                    </button>
                    
                    <button
                      onClick={() => deleteExam(exam.id)}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamManagement;