import React, { useState, useEffect, useCallback } from 'react';

const LS_KEYS = {
  QUESTIONS: "cbt_questions_v1",
  RESULTS: "cbt_results_v1",
  ACTIVE_EXAM: "cbt_active_exam_v1",
};

const StudentExam = ({ user, tenant }) => {
  const [questions, setQuestions] = useState([]);
  const [examTitle, setExamTitle] = useState('');
  const [answers, setAnswers] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0); // Time in seconds
  const [examStarted, setExamStarted] = useState(false);

  const handleSubmit = useCallback(() => {
    let correctAnswers = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.correctIndex) correctAnswers++;
    });

    const finalScore = correctAnswers;
    setScore(finalScore);
    setSubmitted(true);

    // Save result
    const result = {
      username: user.username,
      fullName: user.fullName || user.username,
      score: finalScore,
      total: questions.length,
      percent: Math.round((finalScore / questions.length) * 100),
      submittedAt: new Date().toISOString(),
      answers: answers,
      examTitle: examTitle,
      timeTaken: (questions.length * 60) - timeLeft, // Time taken in seconds
      tenant: tenant?.name || 'Unknown Institution'
    };

    try {
      const existingResults = JSON.parse(localStorage.getItem(LS_KEYS.RESULTS) || '[]');
      existingResults.push(result);
      localStorage.setItem(LS_KEYS.RESULTS, JSON.stringify(existingResults));
    } catch (error) {
      console.error('Error saving result:', error);
    }
  }, [questions, answers, user.username, user.fullName, examTitle, timeLeft, tenant?.name]);

  useEffect(() => {
    loadExamData();
  }, []);

  useEffect(() => {
    if (examStarted && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (examStarted && timeLeft === 0) {
      handleSubmit(); // Auto-submit when time runs out
    }
  }, [examStarted, timeLeft, handleSubmit]);

  const loadExamData = () => {
    try {
      const loadedQuestions = JSON.parse(localStorage.getItem(LS_KEYS.QUESTIONS) || '[]');
      const loadedExamTitle = localStorage.getItem(LS_KEYS.ACTIVE_EXAM) || 'Institution CBT – 12 Questions';
      
      if (loadedQuestions.length === 0) {
        setLoading(false);
        return;
      }

      setQuestions(loadedQuestions);
      setExamTitle(loadedExamTitle);
      setAnswers(new Array(loadedQuestions.length).fill(-1));
      setTimeLeft(loadedQuestions.length * 60); // 1 minute per question
      setLoading(false);
    } catch (error) {
      console.error('Error loading exam data:', error);
      setLoading(false);
    }
  };

  const startExam = () => {
    setExamStarted(true);
  };

  const onSelectAnswer = (questionIndex, optionIndex) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = optionIndex;
    setAnswers(newAnswers);
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const goToQuestion = (index) => {
    setCurrentQuestion(index);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading exam...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-2xl shadow p-8 text-center max-w-md">
          <div className="text-6xl mb-4">📝</div>
          <h2 className="text-2xl font-bold mb-2">No Active Exam</h2>
          <p className="text-gray-600 mb-4">There are no questions available for this exam.</p>
          <p className="text-sm text-gray-500">Please contact your administrator to set up the exam questions.</p>
        </div>
      </div>
    );
  }

  if (!examStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-2xl shadow p-8 text-center max-w-md">
          <div className="text-6xl mb-4">🎯</div>
          <h2 className="text-2xl font-bold mb-2">{examTitle}</h2>
          <div className="space-y-4 text-left mb-6">
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span>{questions.length} questions</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span>{formatTime(timeLeft)} time limit</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span>Multiple choice (A, B, C, D)</span>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Instructions:</strong> Read each question carefully and select the best answer. 
              You can review and change your answers before submitting. The exam will auto-submit when time runs out.
            </p>
          </div>
          <button
            onClick={startExam}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl hover:bg-blue-700 font-semibold text-lg"
          >
            Start Exam
          </button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-2xl shadow p-8 text-center max-w-md">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold mb-2">Exam Completed!</h2>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-2">Exam: <strong>{examTitle}</strong></p>
            <p className="text-2xl font-bold text-blue-600">
              Score: {score} / {questions.length}
            </p>
            <p className="text-lg text-gray-700">
              Percentage: {Math.round((score / questions.length) * 100)}%
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Time taken: {formatTime((questions.length * 60) - timeLeft)}
            </p>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Your result has been recorded. You may close this page.
          </p>
          <div className="text-xs text-gray-500">
            <p>Institution: {tenant?.name || 'Unknown'}</p>
            <p>Submitted: {new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">{examTitle}</h1>
              <p className="text-sm text-gray-600">
                Question {currentQuestion + 1} of {questions.length}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-red-600">
                {formatTime(timeLeft)}
              </div>
              <div className="text-xs text-gray-500">Time Remaining</div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex gap-1">
            {questions.map((_, index) => (
              <button
                key={index}
                onClick={() => goToQuestion(index)}
                className={`flex-1 h-2 rounded-full transition-colors ${
                  index === currentQuestion
                    ? 'bg-blue-600'
                    : answers[index] !== -1
                    ? 'bg-green-500'
                    : 'bg-gray-200'
                }`}
                title={`Question ${index + 1}${answers[index] !== -1 ? ' (Answered)' : ''}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-white rounded-2xl shadow p-8">
          <div className="flex items-start gap-3 mb-6">
            <span className="text-2xl font-bold bg-blue-100 text-blue-600 px-3 py-2 rounded-full">
              {currentQuestion + 1}
            </span>
            <div className="flex-1">
              <h3 className="text-xl font-medium leading-relaxed">{currentQ.text}</h3>
            </div>
          </div>

          <div className="space-y-3">
            {currentQ.options.map((option, optionIndex) => (
              <label
                key={optionIndex}
                className={`block border-2 rounded-xl p-4 cursor-pointer transition-all ${
                  answers[currentQuestion] === optionIndex
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name={`question-${currentQuestion}`}
                    checked={answers[currentQuestion] === optionIndex}
                    onChange={() => onSelectAnswer(currentQuestion, optionIndex)}
                    className="w-5 h-5 text-blue-600"
                  />
                  <span className="font-medium text-lg">
                    {String.fromCharCode(65 + optionIndex)}.
                  </span>
                  <span className="text-lg">{option}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-6">
          <button
            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0}
            className="px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <div className="text-sm text-gray-600">
            {answers.filter(a => a !== -1).length} of {questions.length} answered
          </div>

          {currentQuestion < questions.length - 1 ? (
            <button
              onClick={() => setCurrentQuestion(Math.min(questions.length - 1, currentQuestion + 1))}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold"
            >
              Submit Exam
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentExam;
