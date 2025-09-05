import React, { useState, useEffect } from 'react';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell } from 'docx';
import mammoth from 'mammoth';
import dataService from '../services/dataService';
import ExamManagement from './ExamManagement';

// Helper function to generate unique IDs (compatible with older browsers)
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

// Excel parsing function
const parseQuestionsFromExcel = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(data);
        
        const worksheet = workbook.worksheets[0];
        if (!worksheet) {
          throw new Error('No worksheet found in Excel file');
        }
        
        const questions = [];
        const rows = worksheet.getRows();
        
        // Skip header row (row 1) and process data rows
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row) continue;
          
          // Get cell values - adjust column indices based on your Excel format
          const questionText = row.getCell(1)?.value?.toString()?.trim();
          const optionA = row.getCell(2)?.value?.toString()?.trim();
          const optionB = row.getCell(3)?.value?.toString()?.trim();
          const optionC = row.getCell(4)?.value?.toString()?.trim();
          const optionD = row.getCell(5)?.value?.toString()?.trim();
          const correctAnswer = row.getCell(6)?.value?.toString()?.trim();
          const explanation = row.getCell(7)?.value?.toString()?.trim();
          
          // Skip empty rows
          if (!questionText) continue;
          
          // Validate required fields
          if (!optionA || !optionB || !optionC || !optionD || !correctAnswer) {
            console.warn(`Skipping row ${i + 1}: Missing required fields`);
            continue;
          }
          
          // Determine correct answer index
          let correctIndex = -1;
          const correctAnswerUpper = correctAnswer.toUpperCase();
          if (correctAnswerUpper === 'A' || correctAnswerUpper === '1') correctIndex = 0;
          else if (correctAnswerUpper === 'B' || correctAnswerUpper === '2') correctIndex = 1;
          else if (correctAnswerUpper === 'C' || correctAnswerUpper === '3') correctIndex = 2;
          else if (correctAnswerUpper === 'D' || correctAnswerUpper === '4') correctIndex = 3;
          
          if (correctIndex === -1) {
            console.warn(`Skipping row ${i + 1}: Invalid correct answer format`);
            continue;
          }
          
          const question = {
            id: generateId(),
            text: questionText,
            options: [optionA, optionB, optionC, optionD],
            correctAnswer: correctIndex,
            explanation: explanation || '',
            examId: null // Will be set when saving
          };
          
          questions.push(question);
        }
        
        if (questions.length === 0) {
          throw new Error('No valid questions found in Excel file. Please check the format.');
        }
        
        resolve(questions);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read Excel file'));
    reader.readAsArrayBuffer(file);
  });
};

// Markdown parsing function
const parseQuestionsFromMarkdown = (markdown) => {
  const questions = [];
  const lines = markdown.split('\n');
  let currentQuestion = null;
  let currentOptions = [];
  let currentCorrectAnswer = null;
  let currentExplanation = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Question line (starts with number or Q)
    if (/^\d+\.|^Q\d*\.?/i.test(line)) {
      // Save previous question if exists
      if (currentQuestion && currentOptions.length >= 2 && currentCorrectAnswer !== null) {
        questions.push({
          id: generateId(),
          text: currentQuestion,
          options: currentOptions,
          correctAnswer: currentCorrectAnswer,
          explanation: currentExplanation,
          examId: null
        });
      }
      
      // Start new question
      currentQuestion = line.replace(/^\d+\.|^Q\d*\.?\s*/i, '').trim();
      currentOptions = [];
      currentCorrectAnswer = null;
      currentExplanation = '';
    }
    // Option line (starts with a), b), c), d) or A), B), C), D)
    else if (/^[a-dA-D]\)/.test(line)) {
      const optionText = line.replace(/^[a-dA-D]\)\s*/, '').trim();
      currentOptions.push(optionText);
    }
    // Correct answer line
    else if (/^correct|^answer|^ans/i.test(line)) {
      const answerMatch = line.match(/[a-dA-D]/);
      if (answerMatch) {
        const answer = answerMatch[0].toUpperCase();
        currentCorrectAnswer = answer === 'A' ? 0 : answer === 'B' ? 1 : answer === 'C' ? 2 : 3;
      }
    }
    // Explanation line
    else if (/^explanation|^explain/i.test(line)) {
      currentExplanation = line.replace(/^explanation|^explain\s*:?\s*/i, '').trim();
    }
  }
  
  // Save last question
  if (currentQuestion && currentOptions.length >= 2 && currentCorrectAnswer !== null) {
    questions.push({
      id: generateId(),
      text: currentQuestion,
      options: currentOptions,
      correctAnswer: currentCorrectAnswer,
      explanation: currentExplanation,
      examId: null
    });
  }
  
  return questions;
};

// eslint-disable-next-line no-unused-vars
const LS_KEYS = {
  EXAMS: "cbt_exams_v1",
  QUESTIONS: "cbt_questions_v1",
  RESULTS: "cbt_results_v1",
  ACTIVE_EXAM: "cbt_active_exam_v1",
  USERS: "cbt_users_v1",
  STUDENT_REGISTRATIONS: "cbt_student_registrations_v1",
  SHARED_DATA: "cbt_shared_data_v1"
};

const CBTAdminPanel = ({ user, institution, onLogout }) => {
  const [activeTab, setActiveTab] = useState("exams");
  const [exams, setExams] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [results, setResults] = useState([]);
  const [importError, setImportError] = useState("");
  const [showCreateExam, setShowCreateExam] = useState(false);
  const [showEditExam, setShowEditExam] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [loading, setLoading] = useState(true);



  const loadExams = React.useCallback(async () => {
    try {
      const data = await dataService.loadExams();
      const list = Array.isArray(data) ? data : [];
      return institution?.slug ? list.filter(e => e.institutionSlug === institution.slug) : list;
    } catch (error) {
      console.error('Error loading exams:', error);
      return [];
    }
  }, [institution?.slug]);

  const saveExams = React.useCallback(async (examsData) => {
    try {
      return await dataService.saveExams(examsData);
    } catch (error) {
      console.error('Error saving exams:', error);
      return false;
    }
  }, []);

  // Removed unused loadQuestions to satisfy CI ESLint

  const loadResults = React.useCallback(async () => {
    try {
      const data = await dataService.loadResults();
      const list = Array.isArray(data) ? data : [];
      return institution?.slug ? list.filter(r => r.institutionSlug === institution.slug) : list;
    } catch (error) {
      console.error('Error loading results:', error);
      return [];
    }
  }, [institution?.slug]);

  // When the selected exam changes, load its own stored questions (or empty)
  useEffect(() => {
    if (!selectedExam) { setQuestions([]); return; }
    try {
      const raw = localStorage.getItem(`cbt_questions_${selectedExam.id}`);
      const q = raw ? JSON.parse(raw) : [];
      setQuestions(Array.isArray(q) ? q : []);
    } catch {
      setQuestions([]);
    }
  }, [selectedExam]);

  // Auto-activation/deactivation effect
  useEffect(() => {
    if (!exams || exams.length === 0) return;

    const interval = setInterval(async () => {
      const now = new Date();
      let changed = false;
      const nextExams = exams.map(exam => {
        const start = exam.startDate ? new Date(exam.startDate) : null;
        const end = exam.endDate ? new Date(exam.endDate) : null;
        // Only auto-toggle if schedule dates exist
        if (start || end) {
          // Auto-activate when within window
          if (start && (!end || now <= end) && now >= start) {
            if (!exam.isActive) { changed = true; return { ...exam, isActive: true }; }
          }
          // Auto-deactivate if ended
          if (end && now > end) {
            if (exam.isActive) { changed = true; return { ...exam, isActive: false }; }
          }
        }
        return exam;
      });
      if (changed) {
        await saveExams(nextExams);
        setExams(nextExams);
      }
    }, 30 * 1000); // check every 30s

    return () => clearInterval(interval);
  }, [exams, saveExams]);

  // Initialize data effect - must come after function definitions
  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        const [examsData, resultsData] = await Promise.all([
          loadExams(),
          loadResults()
        ]);
        setExams(examsData || []);
        // Don't load general questions here - questions are exam-specific
        setQuestions([]);
        setResults(resultsData || []);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    initializeData();
  }, [loadExams, loadResults]);

  // eslint-disable-next-line no-unused-vars
  const saveResults = async (resultsData) => {
    try {
      return await dataService.saveResults(resultsData);
    } catch (error) {
      console.error('Error saving results:', error);
      return false;
    }
  };

  const handleFileUpload = async (file) => {
    setImportError("");
    try {
      const fileExtension = file.name.toLowerCase().split('.').pop();
      
      if (fileExtension === 'docx') {
        const arrayBuffer = await file.arrayBuffer();
        const { value: markdown } = await mammoth.convertToMarkdown({ arrayBuffer });
        
        const parsed = parseQuestionsFromMarkdown(markdown);
        if (parsed.length === 0) {
          throw new Error("No questions found. Please check the document format.");
        }
        
        setQuestions(parsed);
        if (selectedExam) {
          saveQuestionsForExam(selectedExam.id, parsed);
          updateExamQuestionCount(selectedExam.id, parsed.length);
        }
        setImportError(`Successfully imported ${parsed.length} questions!`);
        setTimeout(() => setImportError(""), 3000);
      } else if (fileExtension === 'xlsx') {
        console.log('🔍 Starting Excel import for file:', file.name);
        const parsed = await parseQuestionsFromExcel(file);
        console.log('🔍 Parsed questions:', parsed);
        
        if (parsed.length === 0) {
          throw new Error("No questions found. Please check the Excel format.");
        }
        
        setQuestions(parsed);
        if (selectedExam) {
          console.log('🔍 Saving questions for exam:', selectedExam.id);
          saveQuestionsForExam(selectedExam.id, parsed);
          updateExamQuestionCount(selectedExam.id, parsed.length);
        } else {
          console.warn('⚠️ No exam selected - questions imported but not saved to exam');
        }
        setImportError(`Successfully imported ${parsed.length} questions!`);
        setTimeout(() => setImportError(""), 3000);
      } else {
        throw new Error("Unsupported file format. Please upload a .docx or .xlsx file.");
      }
    } catch (e) {
      console.error("Upload error:", e);
      setImportError(e.message || "Failed to import file");
    }
  };

  const updateExamQuestionCount = async (examId, count) => {
    try {
      const updatedExams = exams.map(ex => 
        ex.id === examId ? { ...ex, questionCount: count } : ex
      );
      setExams(updatedExams);
      await saveExams(updatedExams);
    } catch (error) {
      console.error('Error updating exam question count:', error);
    }
  };

  const saveQuestionsForExam = async (examId, questionsData) => {
    try {
      // Save questions with exam ID
      const questionsWithExamId = questionsData.map(q => ({ ...q, examId }));
      await dataService.saveQuestions(questionsWithExamId);
      
      // Also save exam info for student access
      const exam = exams.find(e => e.id === examId);
      if (exam) {
        localStorage.setItem(LS_KEYS.ACTIVE_EXAM, exam.title);
        localStorage.setItem('cbt_exam_duration', exam.duration.toString());
        localStorage.setItem('cbt_exam_info', JSON.stringify({
          id: exam.id,
          title: exam.title,
          duration: exam.duration,
          passingScore: exam.passingScore
        }));
      }
    } catch (error) {
      console.error('Error saving questions for exam:', error);
    }
  };

  const exportResultsToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Results');
    
    worksheet.columns = [
      { header: 'Username', key: 'username', width: 15 },
      { header: 'Exam Title', key: 'examTitle', width: 20 },
      { header: 'Score', key: 'score', width: 10 },
      { header: 'Total', key: 'total', width: 10 },
      { header: 'Percent', key: 'percent', width: 10 },
      { header: 'Submitted At', key: 'submittedAt', width: 20 },
      { header: 'Answers', key: 'answers', width: 30 }
    ];

    worksheet.addRows(results.map(r => ({
      username: r.username,
      examTitle: r.examTitle,
      score: r.score,
      total: r.total,
      percent: r.percent,
      submittedAt: new Date(r.submittedAt).toLocaleString(),
      answers: r.answers.join(", ")
    })));
    
    const excelBuffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${institution?.name || 'Institution'}_CBT_Results.xlsx`);
  };

  const exportResultsToWord = async () => {
    const rows = [
      new TableRow({
        children: ["Username", "Exam Title", "Score", "Total", "Percent", "Submitted At", "Answers"].map(h => 
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] }) ] })
        )
      }),
      ...results.map(r => new TableRow({
        children: [r.username, r.examTitle, String(r.score), String(r.total), String(r.percent), r.submittedAt, r.answers.join(", ")]
          .map(t => new TableCell({ children: [new Paragraph(String(t))] }))
      }))
    ];
    
    const doc = new Document({
      sections: [{
        properties: {}, 
        children: [
          new Paragraph({ children: [new TextRun({ text: "CBT Results", bold: true, size: 28 }) ] }),
          new Paragraph(" "),
          new Table({ rows })
        ]
      }]
    });
    
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${institution?.name || 'Institution'}_CBT_Results.docx`);
  };

  const handleCreateExam = async (examData) => {
    try {
      let updatedExams;
      
      if (examData.id) {
        // Update existing exam
        updatedExams = exams.map(exam => 
          exam.id === examData.id 
            ? { ...exam, ...examData, updatedAt: new Date().toISOString() }
            : exam
        );
      } else {
        // Create new exam
      const newExam = {
        id: generateId(),
        ...examData,
        createdAt: new Date().toISOString(),
        questionCount: 0,
          institutionSlug: institution?.slug || 'default'
      };
        updatedExams = [...exams, newExam];
        setSelectedExam(newExam);
        setQuestions([]); // ensure fresh questions list for a new exam
        setActiveTab("questions");
      }
      
      await saveExams(updatedExams);
      setExams(updatedExams);
      setShowCreateExam(false);
    } catch (error) {
      console.error('Error creating/updating exam:', error);
    }
  };

  const handleActivateExam = async (examId) => {
    try {
      const updatedExams = exams.map(exam => {
        if (exam.id !== examId) return exam;
        const now = new Date();
        const start = exam.startDate ? new Date(exam.startDate) : null;
        const end = exam.endDate ? new Date(exam.endDate) : null;
        // If trying to activate, show confirmation if outside window
        if (!exam.isActive) {
          const beforeWindow = start && now < start;
          const afterWindow = end && now > end;
          if (beforeWindow || afterWindow) {
            const msg = beforeWindow
              ? "This exam is scheduled in the future. Activate now anyway?"
              : "This exam is past its end time. Activate anyway?";
            if (!window.confirm(msg)) {
              return exam; // keep as is
            }
          }
        }
        return { ...exam, isActive: !exam.isActive };
      });
      await saveExams(updatedExams);
      setExams(updatedExams);
    } catch (error) {
      console.error('Error activating exam:', error);
    }
  };

  const handleDeleteExam = async (examId) => {
    if (window.confirm("Are you sure you want to delete this exam? This action cannot be undone.")) {
      try {
        const updatedExams = exams.filter(ex => ex.id !== examId);
        await saveExams(updatedExams);
        setExams(updatedExams);
        if (selectedExam?.id === examId) {
          setSelectedExam(null);
        }
      } catch (error) {
        console.error('Error deleting exam:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading CBT system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto w-full px-3 sm:px-8 py-4 sm:py-8">
        {/* Admin Panel Header */}
        <div className="bg-white rounded-xl border p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">CBT Admin Panel</h2>
              <p className="text-gray-600">Manage exams, questions, and student results</p>
              {activeTab === "questions" && selectedExam && (
                <div className="mt-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                  📝 Currently viewing questions for: <span className="font-semibold">{selectedExam.title}</span>
                </div>
              )}
            </div>
            <div className="text-sm text-gray-500">
              Logged in as: <span className="font-medium">{user.fullName || user.username}</span>
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                Role: {user.role}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation - Updated with debugging */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl mb-8">
          {(() => {
            const allTabs = [
            { id: "exams", label: "📋 Exam Management", icon: "📋", adminOnly: false },
              { id: "create-exam", label: "➕ Create Exam", icon: "➕", adminOnly: true },
            { id: "questions", label: "❓ Questions", icon: "❓", adminOnly: false },
            { id: "results", label: "📊 Results", icon: "📊", adminOnly: false },
            { id: "students", label: "👥 Students", icon: "👥", adminOnly: true },
            { id: "settings", label: "⚙️ Settings", icon: "⚙️", adminOnly: true },
            { id: "advanced-exams", label: "🔧 Advanced Exams", icon: "🔧", adminOnly: true }
            ];
            
            console.log('🔍 DEBUG: User object:', user);
            console.log('🔍 DEBUG: User role:', user?.role);
            console.log('🔍 DEBUG: All tabs:', allTabs.map(t => ({ id: t.id, adminOnly: t.adminOnly })));
            
            const isAdmin = user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'managed_admin';
            console.log('🔍 DEBUG: Is admin?', isAdmin);
            
            const visibleTabs = allTabs.filter(tab => {
              const shouldShow = !tab.adminOnly || isAdmin;
              console.log(`🔍 Tab ${tab.id}: adminOnly=${tab.adminOnly}, shouldShow=${shouldShow}`);
              return shouldShow;
            });
            
            console.log('🔍 DEBUG: Visible tabs:', visibleTabs.map(t => t.id));
            
            return visibleTabs;
          })().map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "exams" && (
          <ExamsTab 
            exams={exams}
            onCreateExam={() => setShowCreateExam(true)}
            onActivateExam={handleActivateExam}
            onDeleteExam={handleDeleteExam}
            onSelectExam={setSelectedExam}
            selectedExam={selectedExam}
            onEditExam={() => setShowEditExam(true)}
            user={user}
            onViewQuestions={() => setActiveTab("questions")}
          />
        )}

        {activeTab === "create-exam" && (
          <CreateExamTab 
            exams={exams}
            onCreateExam={handleCreateExam}
            onActivateExam={handleActivateExam}
            onDeleteExam={handleDeleteExam}
            onSelectExam={setSelectedExam}
            selectedExam={selectedExam}
            user={user}
            institution={institution}
            onViewQuestions={() => setActiveTab("questions")}
          />
        )}

        {activeTab === "advanced-exams" && (
          <ExamManagement 
            user={user}
            onBack={() => setActiveTab("exams")}
          />
        )}

        {activeTab === "questions" && (
          <QuestionsTab 
            selectedExam={selectedExam}
            questions={questions}
            setQuestions={setQuestions}
            onFileUpload={handleFileUpload}
            importError={importError}
            onBackToExams={() => setActiveTab("exams")}
            institution={institution}
            user={user}
          />
        )}

        {activeTab === "results" && (
          <ResultsTab 
            results={results}
            onExportExcel={exportResultsToExcel}
            onExportWord={exportResultsToWord}
            onBackToExams={() => setActiveTab("exams")}
            user={user}
          />
        )}

        {activeTab === "students" && (user.role === 'admin' || user.role === 'super_admin' || user.role === 'managed_admin') && (
          <StudentsTab 
            onBackToExams={() => setActiveTab("exams")}
            institution={institution}
            user={user}
          />
        )}

        {activeTab === "settings" && (user.role === 'admin' || user.role === 'super_admin' || user.role === 'managed_admin') && (
          <SettingsTab 
            onBackToExams={() => setActiveTab("exams")}
            institution={institution}
            user={user}
          />
        )}

        {/* Modals */}
        {showCreateExam && (
          <CreateExamModal 
            onClose={() => setShowCreateExam(false)} 
            onCreate={handleCreateExam} 
          />
        )}

        {showEditExam && selectedExam && (
          <EditExamModal 
            exam={selectedExam}
            onClose={() => setShowEditExam(false)}
            onUpdate={(updatedExam) => {
              const updatedExams = exams.map(ex => 
                ex.id === selectedExam.id ? updatedExam : ex
              );
              setExams(updatedExams);
              saveExams(updatedExams);
              setSelectedExam(updatedExam);
              setShowEditExam(false);
            }}
          />
        )}
      </main>
    </div>
  );
};

// Helper Components
function ExamsTab({ exams, onCreateExam, onActivateExam, onDeleteExam, onSelectExam, selectedExam, onEditExam, user, onViewQuestions }) {
  const isAdmin = user.role === 'admin' || user.role === 'super_admin' || user.role === 'managed_admin';
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Available Exams</h3>
          <p className="text-sm text-gray-600">
            {isAdmin ? 'Create and manage exam events for students' : 'Available exams for you to take'}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={onCreateExam}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
          >
            + Create New Exam
          </button>
        )}
      </div>

      {exams.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>{isAdmin ? 'No exams created yet.' : 'No exams available yet.'}</p>
          <p className="text-sm mt-2">{isAdmin ? 'Create your first exam to get started.' : 'Please check back later or contact your administrator.'}</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {exams.map(exam => {
            const now = new Date();
            const start = exam.startDate ? new Date(exam.startDate) : null;
            const end = exam.endDate ? new Date(exam.endDate) : null;
            const isScheduled = start && now < start;
            const isOngoing = start && end && now >= start && now <= end;
            const isEnded = end && now > end;
            return (
              <div key={exam.id} className={`border rounded-xl p-4 transition-all ${
                selectedExam?.id === exam.id 
                  ? 'bg-blue-50 border-blue-300 shadow-md' 
                  : 'bg-white hover:shadow-sm'
              }`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg">{exam.title}</h4>
                    <p className="text-sm text-gray-600">{exam.description}</p>
                    <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-500 items-center">
                      <span>Questions: {exam.questionCount || 0}</span>
                      <span>Duration: {exam.duration} minutes</span>
                      {start && (<span>Starts: {start.toLocaleString()}</span>)}
                      {end && (<span>Ends: {end.toLocaleString()}</span>)}
                      <span>Created: {new Date(exam.createdAt).toLocaleDateString()}</span>
                      {isScheduled && <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Scheduled</span>}
                      {isOngoing && <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Ongoing</span>}
                      {isEnded && <span className="px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">Ended</span>}
                    </div>
                  </div>
                    <div className="flex gap-2">
                    {/* View Questions Button - Available to all users */}
                    <button
                      onClick={() => {
                        onSelectExam(exam);
                        if (onViewQuestions) onViewQuestions();
                      }}
                      className={`px-3 py-1 rounded-lg text-xs ${
                        selectedExam?.id === exam.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {selectedExam?.id === exam.id ? '👁️ Viewing Questions' : '📝 View Questions'}
                    </button>
                    
                    {/* Admin-only buttons */}
                    {isAdmin && (
                      <>
                      <button
                        onClick={() => onActivateExam(exam.id)}
                        className={`px-3 py-1 rounded-lg text-xs ${
                          exam.isActive 
                            ? "bg-orange-600 text-white hover:bg-orange-700" 
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                      >
                        {exam.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        onClick={() => onEditExam()}
                        className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDeleteExam(exam.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs hover:bg-red-700"
                      >
                        Delete
                      </button>
                      </>
                  )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function QuestionsTab({ selectedExam, questions, setQuestions, onFileUpload, importError, onBackToExams, institution, user }) {
  const isAdmin = user.role === 'admin' || user.role === 'super_admin' || user.role === 'managed_admin';
  
  if (!selectedExam) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-6xl mb-4">📋</div>
        <h3 className="text-xl font-semibold mb-2">No Exam Selected</h3>
        <p className="text-gray-600 mb-4">
          {isAdmin 
            ? 'To manage questions, please select an exam from the Exam Management tab.'
            : 'To view questions, please select an exam from the Exam Management tab.'
          }
        </p>
        <button
          onClick={onBackToExams}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium"
        >
          ← Go to Exam Management
        </button>
        <div className="mt-6 text-sm text-gray-500">
          💡 Tip: Click the "📝 View Questions" button on any exam to see its questions
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Exam Context Header */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-blue-900">📝 Questions for: {selectedExam.title}</h3>
            <p className="text-sm text-blue-700 mt-1">{selectedExam.description || 'No description provided'}</p>
            <div className="flex flex-wrap gap-4 mt-2 text-xs text-blue-600">
              <span>📊 Questions: {questions.length}</span>
              <span>⏱️ Duration: {selectedExam.duration} minutes</span>
              <span>📅 Created: {new Date(selectedExam.createdAt).toLocaleDateString()}</span>
              {selectedExam.isActive && <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700">🟢 Active</span>}
            </div>
        </div>
        <button
          onClick={onBackToExams}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
        >
          ← Back to Exams
        </button>
        </div>
      </div>

      {isAdmin && (
        <div className="bg-white rounded-xl border p-6">
          <div className="flex flex-wrap gap-3 mb-6">
            <button onClick={async () => {
              const workbook = new ExcelJS.Workbook();
              const worksheet = workbook.addWorksheet('Questions');
              
              // Add headers with better formatting
              worksheet.columns = [
                { header: 'Question', key: 'question', width: 40 },
                { header: 'Option A', key: 'optionA', width: 20 },
                { header: 'Option B', key: 'optionB', width: 20 },
                { header: 'Option C', key: 'optionC', width: 20 },
                { header: 'Option D', key: 'optionD', width: 20 },
                { header: 'Correct Answer', key: 'answer', width: 15 },
                { header: 'Explanation (Optional)', key: 'explanation', width: 30 }
              ];
              
              // Style the header row
              const headerRow = worksheet.getRow(1);
              headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
              headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '366092' } };
              
              // Add sample questions
              const sampleQuestions = [
                {
                  question: 'What is the capital of Nigeria?',
                  optionA: 'Lagos',
                  optionB: 'Abuja',
                  optionC: 'Kano',
                  optionD: 'Port Harcourt',
                  answer: 'B',
                  explanation: 'Abuja became the capital of Nigeria in 1991, replacing Lagos.'
                },
                {
                  question: 'Which programming language is primarily used for web development?',
                  optionA: 'Python',
                  optionB: 'JavaScript',
                  optionC: 'C++',
                  optionD: 'Java',
                  answer: 'B',
                  explanation: 'JavaScript is the primary language for frontend web development.'
                },
                {
                  question: 'What does HTML stand for?',
                  optionA: 'HyperText Markup Language',
                  optionB: 'High Tech Modern Language',
                  optionC: 'Home Tool Markup Language',
                  optionD: 'Hyperlink and Text Markup Language',
                  answer: 'A',
                  explanation: 'HTML stands for HyperText Markup Language, used for creating web pages.'
                }
              ];
              
              sampleQuestions.forEach(q => worksheet.addRow(q));
              
              // Add instructions
              worksheet.addRow([]);
              worksheet.addRow(['INSTRUCTIONS:']);
              worksheet.addRow(['1. Fill in your questions in the format shown above']);
              worksheet.addRow(['2. Correct Answer should be A, B, C, or D']);
              worksheet.addRow(['3. Explanation is optional but recommended']);
              worksheet.addRow(['4. Save as .xlsx format before uploading']);
              worksheet.addRow(['5. Each student will get randomized questions from this pool']);
              
              const excelBuffer = await workbook.xlsx.writeBuffer();
              const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
              saveAs(blob, `CBT_Questions_Template_${selectedExam.title.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`);
            }} className="px-4 py-2 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700 flex items-center gap-2">
              📊 Download Excel Template
            </button>
            
            <button onClick={async () => {
              const doc = new Document({
                sections: [{ 
                  properties: {}, 
                  children: [
                    new Paragraph({ 
                      children: [new TextRun({ text: 'CBT Questions Template', bold: true, size: 28 })] 
                    }),
                  new Paragraph(' '),
                    new Paragraph({ 
                      children: [new TextRun({ text: 'Instructions:', bold: true, size: 20 })] 
                    }),
                    new Paragraph('1. Follow the format below for each question'),
                    new Paragraph('2. Use A, B, C, D for correct answers'),
                    new Paragraph('3. Save as .docx format before uploading'),
                    new Paragraph('4. Each student will get randomized questions'),
                    new Paragraph(' '),
                    new Paragraph({ 
                      children: [new TextRun({ text: 'Sample Questions:', bold: true, size: 20 })] 
                    }),
                    new Paragraph(' '),
                    new Paragraph('1) What is the capital of Nigeria?'),
                    new Paragraph('A) Lagos'),
                    new Paragraph('B) Abuja'),
                    new Paragraph('C) Kano'),
                    new Paragraph('D) Port Harcourt'),
                  new Paragraph('Answer: B'),
                    new Paragraph('Explanation: Abuja became the capital of Nigeria in 1991.'),
                  new Paragraph(' '),
                    new Paragraph('2) Which programming language is primarily used for web development?'),
                    new Paragraph('A) Python'),
                    new Paragraph('B) JavaScript'),
                    new Paragraph('C) C++'),
                    new Paragraph('D) Java'),
                    new Paragraph('Answer: B'),
                    new Paragraph('Explanation: JavaScript is the primary language for frontend web development.'),
                  ] 
                }]
              });
              const blob = await Packer.toBlob(doc);
              saveAs(blob, `CBT_Questions_Template_${selectedExam.title.replace(/[^a-zA-Z0-9]/g, '_')}.docx`);
            }} className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2">
              📄 Download Word Template
            </button>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <span className="text-yellow-600 text-xl">⚠️</span>
              <div>
                <h4 className="font-semibold text-yellow-800 mb-1">Randomization Notice</h4>
                <p className="text-sm text-yellow-700">
                  Each student will receive a randomized set of questions from your uploaded pool. 
                  This ensures fairness and prevents cheating by giving different question orders to different students.
                </p>
              </div>
            </div>
          </div>
          
          <h4 className="font-semibold mb-4">Upload Questions</h4>
          <div className="border-2 border-dashed border-blue-300 rounded-xl p-6 text-center bg-blue-50">
            <div className="text-4xl mb-3">📁</div>
            <p className="text-lg font-semibold text-gray-700 mb-2">Upload Your Questions</p>
            <p className="text-sm text-gray-600 mb-4">
              Drag and drop a .docx or .xlsx file here, or click to browse
            </p>
            <p className="text-xs text-gray-500 mb-4">
              Supported formats: Excel (.xlsx) or Word (.docx) | Max file size: 10MB
            </p>
            <input 
              type="file" 
              accept=".docx,.xlsx" 
              onChange={e => { if (e.target.files && e.target.files[0]) onFileUpload(e.target.files[0]); }}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {importError && (
              <div className={`mt-3 p-3 rounded-lg text-sm ${
                importError.includes('Successfully') ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'
              }`}>
                {importError}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border p-6">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-semibold text-lg">📋 Exam Questions ({questions.length})</h4>
          {questions.length > 0 && (
            <div className="text-sm text-gray-500">
              Total Points: {questions.length} | Time per question: ~{Math.ceil(selectedExam.duration / questions.length)} min
            </div>
          )}
        </div>
        
        {questions.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-blue-600">🔄</span>
              <p className="text-sm text-blue-700">
                <strong>Randomization Active:</strong> Each student will receive questions in a different random order, 
                with answer options also randomized to ensure fairness and prevent cheating.
              </p>
            </div>
          </div>
        )}
        
        {questions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-4">❓</div>
            <p className="text-lg font-medium mb-2">No questions yet for this exam</p>
            <p className="text-sm text-gray-600 mb-4">
              {isAdmin 
                ? 'Upload a question file to get started. Students will see these questions when they take the exam.'
                : 'Questions will be available when the exam starts.'
              }
            </p>
            {isAdmin && (
              <div className="text-xs text-blue-600">
                💡 Tip: Use the upload section above to add questions from Word or Excel files
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((q, i) => (
              <div key={q.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-sm font-bold bg-blue-100 text-blue-700 px-3 py-1 rounded-full min-w-[2rem] text-center">
                    {i + 1}
                  </span>
                  <p className="flex-1 text-gray-800 leading-relaxed">{q.text}</p>
                </div>
                <div className="grid sm:grid-cols-2 gap-3 ml-12">
                  {q.options.map((opt, oi) => (
                    <div key={oi} className={`text-sm p-3 rounded-lg border ${
                      oi === q.correctIndex 
                        ? 'bg-green-50 border-green-200 text-green-800' 
                        : 'bg-gray-50 border-gray-200 text-gray-700'
                    }`}>
                      <span className="font-medium">{String.fromCharCode(65 + oi)}.</span> {opt}
                      {oi === q.correctIndex && (
                        <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✓ Correct Answer
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ResultsTab({ results, onExportExcel, onExportWord, onBackToExams, user }) {
  const isAdmin = user.role === 'admin' || user.role === 'super_admin' || user.role === 'managed_admin';
  const total = results.length;
  const avgPercent = total ? Math.round(results.reduce((s, r) => s + (r.percent || 0), 0) / total) : 0;
  const best = total ? Math.max(...results.map(r => r.percent || 0)) : 0;
  const worst = total ? Math.min(...results.map(r => r.percent || 0)) : 0;
  const passRate = total ? Math.round((results.filter(r => (r.percent || 0) >= 50).length / total) * 100) : 0;

  const distribution = [0, 0, 0, 0, 0]; // 0-19,20-39,40-59,60-79,80-100
  results.forEach(r => {
    const p = r.percent || 0;
    if (p < 20) distribution[0]++; else if (p < 40) distribution[1]++; else if (p < 60) distribution[2]++; else if (p < 80) distribution[3]++; else distribution[4]++;
  });

  return (
    <div className="space-y-6">
      {isAdmin && (
        <div className="bg-white rounded-xl border p-4">
          <h4 className="font-semibold mb-3">Analytics</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
            <div className="p-3 rounded-lg bg-gray-50"><div className="text-gray-500">Submissions</div><div className="font-semibold text-gray-800">{total}</div></div>
            <div className="p-3 rounded-lg bg-gray-50"><div className="text-gray-500">Avg %</div><div className="font-semibold text-gray-800">{avgPercent}%</div></div>
            <div className="p-3 rounded-lg bg-gray-50"><div className="text-gray-500">Best %</div><div className="font-semibold text-gray-800">{best}%</div></div>
            <div className="p-3 rounded-lg bg-gray-50"><div className="text-gray-500">Worst %</div><div className="font-semibold text-gray-800">{worst}%</div></div>
            <div className="p-3 rounded-lg bg-gray-50"><div className="text-gray-500">Pass Rate</div><div className="font-semibold text-gray-800">{passRate}%</div></div>
          </div>
          <div className="mt-4 text-xs text-gray-600 flex flex-wrap gap-4">
            <div>0-19%: {distribution[0]}</div>
            <div>20-39%: {distribution[1]}</div>
            <div>40-59%: {distribution[2]}</div>
            <div>60-79%: {distribution[3]}</div>
            <div>80-100%: {distribution[4]}</div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Exam Results</h3>
        <div className="flex gap-2">
          {isAdmin && (
            <>
              <button onClick={onExportExcel} className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700">
                Export to Excel
              </button>
              <button onClick={onExportWord} className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700">
                Export to Word
              </button>
            </>
          )}
          <button
            onClick={onBackToExams}
            className="px-4 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 text-sm"
          >
            ← Back to Exams
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exam</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percent</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
            </tr>
          </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
              {results
                .filter(result => isAdmin || result.username === user.username)
                .map((result, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{result.username}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{result.examTitle}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{result.score}/{result.total}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{result.percent}%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(result.submittedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              {results.filter(result => isAdmin || result.username === user.username).length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">No results yet</td>
                </tr>
              )}
            </tbody>
        </table>
      </div>
    </div>
  );
}

// local student status helpers
function getStudentStatusMap() {
  try {
    return JSON.parse(localStorage.getItem('cbt_student_status_v1') || '{}');
  } catch { return {}; }
}
function setStudentStatus(username, status) {
  const map = getStudentStatusMap();
  map[username] = status; // 'active' | 'suspended'
  localStorage.setItem('cbt_student_status_v1', JSON.stringify(map));
}
function getStudentStatus(username) {
  const map = getStudentStatusMap();
  return map[username] || 'active';
}

function StudentsTab({ onBackToExams, institution, user }) {
  // eslint-disable-next-line no-unused-vars
  const isAdmin = user.role === 'admin' || user.role === 'super_admin' || user.role === 'managed_admin';
  
  // Load actual registered students from localStorage or API
  const raw = localStorage.getItem('cbt_student_registrations_v1');
  const allStudents = raw ? JSON.parse(raw) : [];
  
  // Filter students by institution if needed
  const students = allStudents.filter(s => !institution?.slug || s.institutionSlug === institution.slug);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Student Management</h3>
        <button
          onClick={onBackToExams}
          className="px-4 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 text-sm"
        >
          ← Back to Exams
        </button>
      </div>
      
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="min-w-full">
                      <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Full Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {students.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">No students registered yet</td></tr>
            )}
            {students.map(s => {
              const status = getStudentStatus(s.username);
              return (
                <tr key={s.username}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{s.username}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{s.fullName || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{s.email || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${status==='active' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>{status}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-right">
                    {status === 'active' ? (
                      <button onClick={() => { setStudentStatus(s.username, 'suspended'); window.alert('Student suspended'); }} className="px-3 py-1 rounded-lg bg-orange-600 text-white hover:bg-orange-700 mr-2">Suspend</button>
                    ) : (
                      <button onClick={() => { setStudentStatus(s.username, 'active'); window.alert('Student activated'); }} className="px-3 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 mr-2">Activate</button>
                    )}
                    <button onClick={() => { if(window.confirm('Remove this student data locally?')) { setStudentStatus(s.username, 'active'); /* reset */ } }} className="px-3 py-1 rounded-lg bg-red-600 text-white hover:bg-red-700">Remove</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SettingsTab({ onBackToExams, institution, user }) {
  // eslint-disable-next-line no-unused-vars
  const isAdmin = user.role === 'admin' || user.role === 'super_admin' || user.role === 'managed_admin';
  const isSuperAdmin = user.role === 'super_admin' || user.role === 'managed_admin';
  
  const [logoModalOpen, setLogoModalOpen] = useState(false);
  const [selectedLogoFile, setSelectedLogoFile] = useState(null);
  const [logoUrlInput, setLogoUrlInput] = useState('');
  // refined logo upload state
  const [logoUrl, setLogoUrl] = useState('');
  const [logoError, setLogoError] = useState('');
  const [adminsModalOpen, setAdminsModalOpen] = useState(false);
  const [studentsModalOpen, setStudentsModalOpen] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const updateLogo = async (logoUrl) => {
    try {
      // Validate the logo URL format
      if (!logoUrl) {
        throw new Error('Logo URL is required');
      }

      // Check if it's a data URL or valid image URL
      const isDataUrl = logoUrl.startsWith('data:image/');
      const isValidUrl = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(logoUrl);
      
      if (!isDataUrl && !isValidUrl) {
        throw new Error('Invalid logo format. Must be a valid image URL or uploaded image.');
      }

      // Use the correct endpoint for admin users
      const endpoint = isSuperAdmin 
        ? `/api/tenants/${institution.slug}/logo`
        : `/api/tenants/${institution.slug}/logo/update`;

      const response = await fetch(`https://cbt-rew7.onrender.com${endpoint}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          // Only add Authorization for multi-tenant admin endpoint
          ...(isSuperAdmin && { 'Authorization': `Bearer ${localStorage.getItem('multi_tenant_admin_token')}` })
        },
        body: JSON.stringify({ 
          logo_url: logoUrl 
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      await response.json();
      
        showToast('Logo updated successfully!', 'success');
        // Clear the form
        setSelectedLogoFile(null);
        setLogoUrl('');
        setLogoUrlInput('');
        setLogoModalOpen(false);
    } catch (error) {
      console.error('Logo update failed:', error);
      setLogoError(error.message);
      showToast(`Logo update failed: ${error.message}`, 'error');
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: 'success' }), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">System Settings</h3>
        <button
          onClick={onBackToExams}
          className="px-4 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 text-sm"
        >
          ← Back to Exams
        </button>
      </div>
      
      {toast.message && (
        <div className={`p-3 rounded-lg text-sm ${toast.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {toast.message}
        </div>
      )}
      
      <div className="bg-white rounded-xl border p-6">
        <h4 className="font-semibold mb-4">Institution Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Institution Name</label>
            <p className="mt-1 text-sm text-gray-900">{institution?.name || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Institution Slug</label>
            <p className="mt-1 text-sm text-gray-900">{institution?.slug || 'N/A'}</p>
          </div>
        </div>
        
        {isSuperAdmin && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h5 className="font-semibold mb-4">Administrative Actions</h5>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setLogoModalOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                Change Logo
              </button>
              <button
                onClick={() => setAdminsModalOpen(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
              >
                Manage Admins
              </button>
              <button
                onClick={() => setStudentsModalOpen(true)}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm"
              >
                Manage Students
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Logo Update Modal */}
      {logoModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <div>
              <h3 className="text-lg font-bold">Update Institution Logo</h3>
                <p className="text-sm text-gray-600 mt-1">Upload an image file or provide a URL</p>
              </div>
              <button
                onClick={() => {
                  setLogoModalOpen(false);
                  setSelectedLogoFile(null);
                  setLogoUrlInput('');
                }}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {/* File Upload Section - Primary Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="text-indigo-600 font-semibold">📁 Upload Logo File</span>
                  <span className="text-xs text-gray-500 ml-2">(Recommended)</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      // Validate file type
                      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
                      if (!allowedTypes.includes(file.type)) {
                        showToast('Please select a valid image file (JPEG, PNG, GIF, or WebP)', 'error');
                        return;
                      }
                      
                      // Validate file size (max 5MB)
                      if (file.size > 5 * 1024 * 1024) {
                        showToast('File size must be less than 5MB', 'error');
                        return;
                      }
                      
                      setSelectedLogoFile(file);
                      setLogoUrlInput(''); // Clear URL input when file is selected
                      
                      // Create data URL for preview
                      const reader = new FileReader();
                      reader.onload = function(e) {
                        setLogoUrl(e.target.result);
                      };
                      reader.onerror = function() {
                        showToast('Failed to read the selected file', 'error');
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full px-3 py-2 border-2 border-dashed border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 hover:border-indigo-400 transition-colors"
                />
                <p className="text-xs text-gray-500 mt-1">Supported formats: JPEG, PNG, GIF, WebP (Max 5MB)</p>
              </div>

              {/* File Preview */}
              {(selectedLogoFile || logoUrl || logoUrlInput) && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  {selectedLogoFile && (
                    <p className="text-sm text-gray-600 mb-2">Selected file: {selectedLogoFile.name}</p>
                  )}
                  <div className="flex items-center gap-2">
                    <img
                      src={logoUrl || logoUrlInput}
                      alt="Logo preview"
                      className="w-16 h-16 object-contain border rounded"
                      crossOrigin="anonymous"
                    />
                    {selectedLogoFile && (
                      <button
                        onClick={() => {
                          setSelectedLogoFile(null);
                          setLogoUrl('');
                          const fileInput = document.querySelector('input[type="file"]');
                          if (fileInput) fileInput.value = '';
                        }}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        Remove file
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Divider - Less prominent */}
              <div className="text-center">
                <div className="inline-flex items-center text-xs text-gray-400">
                  <div className="flex-1 h-px bg-gray-300"></div>
                  <span className="px-3">or use URL</span>
                  <div className="flex-1 h-px bg-gray-300"></div>
                </div>
              </div>

              {/* URL Input Section - Secondary Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="text-gray-600">🔗 Logo URL</span>
                  <span className="text-xs text-gray-500 ml-2">(Alternative)</span>
                </label>
                <input
                  type="text"
                  value={logoUrlInput}
                  placeholder="Enter logo URL (https://...)"
                  onChange={(e) => {
                    const url = e.target.value;
                    setLogoUrlInput(url);
                    setSelectedLogoFile(null);
                    setLogoError('');

                    // Validate URL format if it's not empty
                    if (url && !url.startsWith('data:image/')) {
                      const urlPattern = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i;
                      if (!urlPattern.test(url)) {
                        setLogoError('Please enter a valid image URL ending with .jpg, .jpeg, .png, .gif, or .webp');
                      } else {
                        setLogoError('');
                      }
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50"
                />
              </div>

              {/* Error Display */}
              {logoError && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
                  {logoError}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => {
                    setLogoModalOpen(false);
                    setSelectedLogoFile(null);
                    setLogoUrlInput('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (selectedLogoFile) {
                      // Validate file type
                      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
                      if (!allowedTypes.includes(selectedLogoFile.type)) {
                        showToast('Please select a valid image file (JPEG, PNG, GIF, or WebP)', 'error');
                        return;
                      }
                      
                      // Validate file size (max 5MB)
                      if (selectedLogoFile.size > 5 * 1024 * 1024) {
                        showToast('File size must be less than 5MB', 'error');
                        return;
                      }
                      
                      // Convert file to data URL for now
                      // In a production environment, you'd upload to a cloud storage service first
                      const reader = new FileReader();
                      reader.onload = function(e) {
                        updateLogo(e.target.result);
                      };
                      reader.onerror = function() {
                        showToast('Failed to read the selected file', 'error');
                      };
                      reader.readAsDataURL(selectedLogoFile);
                    } else {
                      // Use URL input if no file selected
                      const url = logoUrlInput.trim();
                      if (!url) {
                        showToast('Please select a file or enter a valid URL', 'error');
                        return;
                      }
                      
                      if (!/^https?:\/\//i.test(url)) {
                        showToast('Please enter a valid URL starting with http:// or https://', 'error');
                        return;
                      }
                      
                      // Validate URL format
                      const urlPattern = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i;
                      if (!urlPattern.test(url)) {
                        showToast('Please enter a valid image URL (JPG, PNG, GIF, WebP, or SVG)', 'error');
                        return;
                      }
                      
                      updateLogo(url);
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Update Logo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manage Admins Modal */}
      {adminsModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Manage Admins</h3>
              <button onClick={() => setAdminsModalOpen(false)} className="text-gray-500 hover:text-gray-700 text-xl">×</button>
            </div>
            <div className="text-center text-gray-500 py-8">
              <p>Admin management functionality will be implemented here.</p>
              <p className="text-sm mt-2">This will allow you to create, suspend, and manage admin accounts.</p>
            </div>
          </div>
        </div>
      )}

      {/* Manage Students Modal */}
      {studentsModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Manage Students</h3>
              <button onClick={() => setStudentsModalOpen(false)} className="text-gray-500 hover:text-gray-700 text-xl">×</button>
            </div>
            <div className="text-center text-gray-500 py-8">
              <p>Student management functionality will be implemented here.</p>
              <p className="text-sm mt-2">This will allow you to view, suspend, and manage student accounts.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Modal Components
function CreateExamModal({ onClose, onCreate }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    duration: 60,
    questionCount: 12,
    startDate: "",
    endDate: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    onCreate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md mx-4 w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Create New Exam</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">×</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Exam Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="e.g., Midterm Exam - Biology 101"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Brief description of the exam"
              rows="3"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})}
                className="w-full border rounded-lg px-3 py-2"
                min="15"
                max="300"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Question Count</label>
              <input
                type="number"
                value={formData.questionCount}
                onChange={(e) => setFormData({...formData, questionCount: parseInt(e.target.value)})}
                className="w-full border rounded-lg px-3 py-2"
                min="1"
                max="100"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date/Time</label>
              <input
                type="datetime-local"
                value={formData.startDate}
                onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date/Time</label>
              <input
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
          </div>
          
          <div className="flex gap-2 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Create Exam
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditExamModal({ exam, onClose, onUpdate }) {
  const [formData, setFormData] = useState({
    title: exam.title,
    description: exam.description,
    duration: exam.duration,
    questionCount: exam.questionCount,
    startDate: exam.startDate || "",
    endDate: exam.endDate || ""
  });

  const clearSchedule = () => {
    setFormData({ ...formData, startDate: "", endDate: "" });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    onUpdate({...exam, ...formData});
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md mx-4 w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Edit Exam</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">×</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Exam Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full border rounded-lg px-3 py-2"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full border rounded-lg px-3 py-2"
              rows="3"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})}
                className="w-full border rounded-lg px-3 py-2"
                min="15"
                max="300"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Question Count</label>
              <input
                type="number"
                value={formData.questionCount}
                onChange={(e) => setFormData({...formData, questionCount: parseInt(e.target.value)})}
                className="w-full border rounded-lg px-3 py-2"
                min="1"
                max="100"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date/Time</label>
              <input
                type="datetime-local"
                value={formData.startDate}
                onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date/Time</label>
              <input
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
          </div>
          <div className="flex justify-between items-center">
            <button type="button" onClick={clearSchedule} className="text-sm text-gray-600 hover:text-gray-800">Clear schedule</button>
          </div>
          
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Update Exam
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Utility Functions
function saveQuestionsForExam(examId, questions) {
  localStorage.setItem(`cbt_questions_${examId}`, JSON.stringify(questions));
}


function parseQuestionsFromMarkdown(md) {
  const text = md.replace(/\r/g, "").trim();
  const questions = [];
  
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  let currentQuestion = null;
  let currentOptions = [];
  let currentAnswer = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    const questionPatterns = [
      /^(\d+)\s*[.)]?\s*(.+)$/,
      /^[Qq](\d*)\s*[.)]?\s*(.+)$/,
      /^Question\s*(\d+)\s*[.:-]?\s*(.+)$/i,
    ];
    
    let questionMatch = null;
    for (const pattern of questionPatterns) {
      questionMatch = line.match(pattern);
      if (questionMatch) break;
    }
    
    if (questionMatch) {
      if (currentQuestion && currentOptions.length === 4 && currentAnswer !== null) {
        const question = createQuestionObject(currentQuestion, currentOptions, currentAnswer);
        if (question) questions.push(question);
      }
      
      currentQuestion = questionMatch[2] || questionMatch[1];
      currentOptions = [];
      currentAnswer = null;
      continue;
    }
    
    const answerPatterns = [
      /^[Aa]nswer\s*[:-]?\s*([A-Da-d1-4])/i,
      /^[Cc]orrect\s*[:-]?\s*([A-Da-d1-4])/i,
      /^\s*([A-Da-d1-4])\s*$/,
    ];
    
    let answerMatch = null;
    for (const pattern of answerPatterns) {
      answerMatch = line.match(pattern);
      if (answerMatch) break;
    }
    
    if (answerMatch && currentQuestion) {
      currentAnswer = answerMatch[1].toUpperCase();
      if (currentOptions.length === 4) {
        const question = createQuestionObject(currentQuestion, currentOptions, currentAnswer);
        if (question) questions.push(question);
        currentQuestion = null;
        currentOptions = [];
        currentAnswer = null;
      }
      continue;
    }
    
    const optionPatterns = [
      /^([A-Da-d])\s*[.)]?\s*(.+)$/,
      /^([1-4])\s*[.)]?\s*(.+)$/,
    ];
    
    let optionMatch = null;
    for (const pattern of optionPatterns) {
      optionMatch = line.match(pattern);
      if (optionMatch) break;
    }
    
    if (optionMatch && currentQuestion && currentOptions.length < 4) {
      let optionLetter = optionMatch[1].toUpperCase();
      const optionText = optionMatch[2].trim();
      
      if (optionLetter === '1') optionLetter = 'A';
      else if (optionLetter === '2') optionLetter = 'B';
      else if (optionLetter === '3') optionLetter = 'C';
      else if (optionLetter === '4') optionLetter = 'D';
      
      currentOptions.push({ letter: optionLetter, text: optionText });
      
      if (currentOptions.length === 4 && currentAnswer) {
        const question = createQuestionObject(currentQuestion, currentOptions, currentAnswer);
        if (question) questions.push(question);
        currentQuestion = null;
        currentOptions = [];
        currentAnswer = null;
      }
      continue;
    }
  }
  
  if (currentQuestion && currentOptions.length === 4 && currentAnswer !== null) {
    const question = createQuestionObject(currentQuestion, currentOptions, currentAnswer);
    if (question) questions.push(question);
  }
  
  return questions;
}

function createQuestionObject(questionText, options, correctAnswer) {
  if (!questionText || options.length !== 4 || !correctAnswer) return null;
  
  const answerIndex = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 }[correctAnswer];
  if (answerIndex === undefined) return null;
  
  const sortedOptions = ['A', 'B', 'C', 'D'].map(letter => {
    const option = options.find(opt => opt.letter === letter);
    return option ? option.text : '';
  });
  
  if (sortedOptions.some(opt => !opt)) return null;
  
  return {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2),
    text: questionText.trim(),
    options: sortedOptions,
    correctIndex: answerIndex
  };
}

async function parseQuestionsFromExcel(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);
    
    const worksheet = workbook.getWorksheet('Questions'); // Assuming worksheet name is 'Questions'
    if (!worksheet) throw new Error('No worksheet named "Questions" found in Excel file');
    
    const questions = [];
    let rowNumber = 2; // Start from row 2 to skip header

    while (true) {
      const row = worksheet.getRow(rowNumber);
      if (!row) break;

      const questionText = row.getCell(1).value;
      const optionA = row.getCell(2).value;
      const optionB = row.getCell(3).value;
      const optionC = row.getCell(4).value;
      const optionD = row.getCell(5).value;
      const correctAnswer = row.getCell(6).value;

      if (!questionText || !optionA || !optionB || !optionC || !optionD || !correctAnswer) {
        rowNumber++;
        continue;
      }

      const answerIndex = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 }[correctAnswer.toString().toUpperCase()];
      if (answerIndex === undefined) {
        rowNumber++;
        continue;
      }
      
      questions.push({
        id: Date.now().toString(36) + Math.random().toString(36).substr(2),
        text: questionText.toString().trim(),
        options: [optionA.toString().trim(), optionB.toString().trim(), optionC.toString().trim(), optionD.toString().trim()],
        correctIndex: answerIndex
      });
      rowNumber++;
    }
    
    return questions;
  } catch (error) {
    console.error('Error parsing Excel file:', error);
    throw new Error('Failed to parse Excel file. Please check the format.');
  }
}

// Create Exam Management Tab Component
function CreateExamTab({ exams, onCreateExam, onActivateExam, onDeleteExam, onSelectExam, selectedExam, user, institution, onViewQuestions }) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: 60,
    questionCount: 0,
    startDate: '',
    endDate: '',
    passingScore: 50,
    isActive: false
  });

  const handleCreateNew = () => {
    setFormData({
      title: '',
      description: '',
      duration: 60,
      questionCount: 0,
      startDate: '',
      endDate: '',
      passingScore: 50,
      isActive: false
    });
    setShowCreateForm(true);
  };

  const handleEdit = (exam) => {
    setEditingExam(exam);
    setFormData({
      title: exam.title,
      description: exam.description || '',
      duration: exam.duration || 60,
      questionCount: exam.questionCount || 0,
      startDate: exam.startDate || '',
      endDate: exam.endDate || '',
      passingScore: exam.passingScore || 50,
      isActive: exam.isActive || false
    });
    setShowEditForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const examData = {
      ...formData,
      institutionSlug: institution?.slug
    };

    if (showEditForm && editingExam) {
      // Update existing exam
      const updatedExam = { ...editingExam, ...examData };
      onCreateExam(updatedExam);
      setShowEditForm(false);
      setEditingExam(null);
    } else {
      // Create new exam
      onCreateExam(examData);
      setShowCreateForm(false);
    }
  };

  const handleMoveToQuestions = (exam) => {
    onSelectExam(exam);
    onViewQuestions();
  };

  const getExamStatus = (exam) => {
    if (!exam.isActive) return { status: 'Inactive', color: 'bg-gray-100 text-gray-700' };
    
    const now = new Date();
    const start = exam.startDate ? new Date(exam.startDate) : null;
    const end = exam.endDate ? new Date(exam.endDate) : null;
    
    if (start && now < start) return { status: 'Scheduled', color: 'bg-blue-100 text-blue-700' };
    if (end && now > end) return { status: 'Expired', color: 'bg-red-100 text-red-700' };
    return { status: 'Active', color: 'bg-green-100 text-green-700' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Create & Manage Exams</h3>
          <p className="text-sm text-gray-600">Create new exams, set schedules, and manage activation</p>
        </div>
        <button
          onClick={handleCreateNew}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <span>➕</span>
          Create New Exam
        </button>
      </div>

      {/* Exams List */}
      <div className="bg-white rounded-xl border overflow-hidden">
        {exams.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Exams Created Yet</h3>
            <p className="text-gray-600 mb-6">Start by creating your first exam</p>
            <button
              onClick={handleCreateNew}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-lg"
            >
              Create Your First Exam
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {exams.map((exam) => {
              const statusInfo = getExamStatus(exam);
              return (
                <div key={exam.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-semibold text-gray-900">{exam.title}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                          {statusInfo.status}
                        </span>
                      </div>
                      
                      {exam.description && (
                        <p className="text-gray-600 mb-3">{exam.description}</p>
                      )}
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500">
                        <div>
                          <span className="font-medium">Duration:</span> {exam.duration} min
                        </div>
                        <div>
                          <span className="font-medium">Questions:</span> {exam.questionCount || 0}
                        </div>
                        <div>
                          <span className="font-medium">Passing Score:</span> {exam.passingScore || 50}%
                        </div>
                        <div>
                          <span className="font-medium">Created:</span> {new Date(exam.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      
                      {(exam.startDate || exam.endDate) && (
                        <div className="mt-2 text-sm text-gray-500">
                          <span className="font-medium">Schedule:</span>
                          {exam.startDate && ` ${new Date(exam.startDate).toLocaleString()}`}
                          {exam.startDate && exam.endDate && ' - '}
                          {exam.endDate && new Date(exam.endDate).toLocaleString()}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => onActivateExam(exam.id)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium ${
                          exam.isActive 
                            ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {exam.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      
                      <button
                        onClick={() => handleEdit(exam)}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm font-medium"
                      >
                        Edit
                      </button>
                      
                      <button
                        onClick={() => handleMoveToQuestions(exam)}
                        className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 text-sm font-medium"
                      >
                        Questions
                      </button>
                      
                      <button
                        onClick={() => onDeleteExam(exam.id)}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Exam Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl mx-4 w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Create New Exam</h3>
              <button 
                onClick={() => setShowCreateForm(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Exam Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Midterm Exam - Biology 101"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Brief description of the exam"
                  rows="3"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes) *</label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="15"
                    max="300"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Passing Score (%)</label>
                  <input
                    type="number"
                    value={formData.passingScore}
                    onChange={(e) => setFormData({...formData, passingScore: parseInt(e.target.value)})}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date/Time</label>
                  <input
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date/Time</label>
                  <input
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  Activate exam immediately after creation
                </label>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Exam
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Exam Modal */}
      {showEditForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl mx-4 w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Edit Exam</h3>
              <button 
                onClick={() => setShowEditForm(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Exam Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes) *</label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="15"
                    max="300"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Passing Score (%)</label>
                  <input
                    type="number"
                    value={formData.passingScore}
                    onChange={(e) => setFormData({...formData, passingScore: parseInt(e.target.value)})}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date/Time</label>
                  <input
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date/Time</label>
                  <input
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="editIsActive" className="text-sm font-medium text-gray-700">
                  Exam is active
                </label>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Update Exam
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


export default CBTAdminPanel;
