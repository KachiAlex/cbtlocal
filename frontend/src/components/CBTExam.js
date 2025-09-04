import React, { useState, useEffect } from 'react';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell } from 'docx';
import mammoth from 'mammoth';

// Helper function to generate unique IDs (compatible with older browsers)
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

// Types
/** @typedef {{id:string, text:string, options:string[], correctIndex:number}} Question */
/** @typedef {{username:string, score:number, total:number, percent:number, submittedAt:string, answers:number[], examTitle:string}} Result */

const LS_KEYS = {
  QUESTIONS: "cbt_questions_v1",
  RESULTS: "cbt_results_v1",
  ACTIVE_EXAM: "cbt_active_exam_v1",
};

const DEFAULT_EXAM_TITLE = "Institution CBT – 12 Questions";

const CBTExam = ({ user, tenant }) => {
  const [examTitle, setExamTitle] = useState(localStorage.getItem(LS_KEYS.ACTIVE_EXAM) || DEFAULT_EXAM_TITLE);
  const [questions, setQuestions] = useState(loadQuestions());
  const [results, setResults] = useState(loadResults());
  const [importError, setImportError] = useState("");
  const [activeTab, setActiveTab] = useState('questions'); // 'questions', 'results', 'settings'

  useEffect(() => {
    localStorage.setItem(LS_KEYS.ACTIVE_EXAM, examTitle);
  }, [examTitle]);

  useEffect(() => {
    localStorage.setItem(LS_KEYS.QUESTIONS, JSON.stringify(questions));
  }, [questions]);

  useEffect(() => {
    localStorage.setItem(LS_KEYS.RESULTS, JSON.stringify(results));
  }, [results]);

  const handleDocxUpload = async (file) => {
    setImportError("");
    try {
      const arrayBuffer = await file.arrayBuffer();
      const { value: markdown } = await mammoth.convertToMarkdown({ arrayBuffer });
      const parsed = parseQuestionsFromMarkdown(markdown);
      if (parsed.length === 0) throw new Error("No questions found. Ensure .docx uses the specified format.");
      const take12 = parsed.slice(0, 12);
      setQuestions(take12);
    } catch (e) {
      setImportError(e.message || "Failed to import .docx");
    }
  };

  // Function to add a blank question (available for future use)
  // eslint-disable-next-line no-unused-vars
  const addBlankQuestion = () => {
    setQuestions(q => [...q, {
      id: generateId(),
      text: "New question text",
      options: ["Option A", "Option B", "Option C", "Option D"],
      correctIndex: 0
    }].slice(0, 12));
  };

  const exportResultsToExcel = () => {
    const wsData = [["Username", "Exam Title", "Score", "Total", "Percent", "Submitted At", "Answers"]];
    for (const r of results) {
      wsData.push([r.username, r.examTitle, r.score, r.total, r.percent, r.submittedAt, r.answers.join(", ")]);
    }
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Results");
    ws.columns = [
      { header: "Username", key: "username", width: 15 },
      { header: "Exam Title", key: "examTitle", width: 20 },
      { header: "Score", key: "score", width: 10 },
      { header: "Total", key: "total", width: 10 },
      { header: "Percent", key: "percent", width: 10 },
      { header: "Submitted At", key: "submittedAt", width: 25 },
      { header: "Answers", key: "answers", width: 20 }
    ];
    ws.addRows(wsData);
    wb.xlsx.writeBuffer().then(buffer => {
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      saveAs(blob, `${tenant?.name || 'Institution'}_CBT_Results.xlsx`);
    });
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
        properties: {}, children: [
          new Paragraph({ children: [new TextRun({ text: "CBT Results", bold: true, size: 28 }) ] }),
          new Paragraph(" "),
          new Table({ rows })
        ]
      }]
    });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${tenant?.name || 'Institution'}_CBT_Results.docx`);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow p-6">
        <h1 className="text-2xl font-bold mb-2">🏥 {tenant?.name || 'Institution'} CBT System</h1>
        <p className="text-gray-600">Computer-Based Test Management System</p>
        
        {/* Tab Navigation */}
        <div className="mt-6 flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('questions')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'questions'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            Questions ({questions.length}/12)
          </button>
          <button
            onClick={() => setActiveTab('results')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'results'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            Results ({results.length})
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'settings'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            Settings
          </button>
        </div>
      </div>

      {/* Questions Tab */}
      {activeTab === 'questions' && (
        <>
          <Section title="Upload Questions from Microsoft Word (.docx)">
            <UploadDocx onFile={handleDocxUpload} />
            {importError && <div className="text-red-600 text-sm mt-2">{importError}</div>}
            <FormatHelp />
          </Section>

          <Section title={`Questions (${questions.length}/12)`}>
            <QuestionsEditor questions={questions} setQuestions={setQuestions} />
          </Section>
        </>
      )}

      {/* Results Tab */}
      {activeTab === 'results' && (
        <Section title="Results">
          <ResultsTable results={results} setResults={setResults} />
          <div className="flex flex-wrap gap-3 mt-4">
            <button onClick={exportResultsToExcel} className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700">
              Export to Excel (.xlsx)
            </button>
            <button onClick={exportResultsToWord} className="px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700">
              Export to Word (.docx)
            </button>
          </div>
        </Section>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <Section title="Exam Settings">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Exam Title</label>
              <input 
                value={examTitle} 
                onChange={e => setExamTitle(e.target.value)} 
                className="w-full border rounded-xl px-3 py-2"
              />
            </div>
            <div className="text-sm text-gray-600 self-end">
              Exactly 12 questions are delivered to students. If more are uploaded, only the first 12 are used.
            </div>
          </div>
        </Section>
      )}
    </div>
  );
};

// Helper Components
function Section({ title, children }) {
  return (
    <section className="bg-white rounded-2xl shadow p-6">
      <h3 className="text-lg font-bold mb-4">{title}</h3>
      {children}
    </section>
  );
}

function UploadDocx({ onFile }) {
  return (
    <div className="border-2 border-dashed rounded-2xl p-6 text-center">
      <p className="mb-3">Upload a <b>.docx</b> file with your questions.</p>
      <input 
        type="file" 
        accept=".docx" 
        onChange={e => { 
          if (e.target.files && e.target.files[0]) onFile(e.target.files[0]); 
        }}
      />
    </div>
  );
}

function FormatHelp() {
  return (
    <details className="mt-4 text-sm cursor-pointer">
      <summary className="font-semibold">.docx Question Format (example)</summary>
      <div className="mt-2 bg-gray-50 border rounded-xl p-3">
        <pre className="whitespace-pre-wrap text-xs">{`Use the following pattern per question in your Word document (.docx):

1) What is the normal adult resting heart rate?
A) 10-20 bpm
B) 30-40 bpm
C) 60-100 bpm
D) 120-160 bpm
Answer: C

2) Which vitamin is primarily synthesized by sunlight exposure?
A) Vitamin A
B) Vitamin C
C) Vitamin D
D) Vitamin K
Answer: C

- Questions must have A) .. D) options (4 options) and an Answer: letter.
- The system will import the FIRST 12 questions.
`}</pre>
      </div>
    </details>
  );
}

function QuestionsEditor({ questions, setQuestions }) {
  const updateQ = (i, patch) => {
    setQuestions(questions.map((q, idx) => idx === i ? { ...q, ...patch } : q));
  };
  const removeQ = (i) => setQuestions(questions.filter((_, idx) => idx !== i));
  const add = () => setQuestions((qs) => [...qs, {
    id: generateId(),
    text: "New question text",
    options: ["Option A", "Option B", "Option C", "Option D"],
    correctIndex: 0
  }].slice(0, 12));

  return (
    <div className="space-y-4">
      {questions.map((q, i) => (
        <div key={q.id} className="border rounded-xl p-4">
          <div className="flex items-start gap-2">
            <span className="text-sm font-bold bg-gray-100 px-2 py-1 rounded">{i + 1}</span>
            <textarea 
              className="w-full border rounded-xl p-2" 
              value={q.text} 
              onChange={e => updateQ(i, { text: e.target.value })} 
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-3 mt-3">
            {q.options.map((opt, oi) => (
              <div key={oi} className="flex gap-2 items-center">
                <input 
                  className="w-full border rounded-xl p-2" 
                  value={opt} 
                  onChange={e => {
                    const newOpts = [...q.options]; 
                    newOpts[oi] = e.target.value; 
                    updateQ(i, { options: newOpts });
                  }} 
                />
                <label className="text-xs flex items-center gap-1">
                  <input 
                    type="radio" 
                    name={`q-${q.id}`} 
                    checked={q.correctIndex === oi} 
                    onChange={() => updateQ(i, { correctIndex: oi })}
                  />
                  Correct
                </label>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={() => removeQ(i)} className="px-3 py-1.5 bg-red-600 text-white rounded-xl text-sm">
              Remove
            </button>
          </div>
        </div>
      ))}
      {questions.length < 12 && (
        <button onClick={add} className="px-4 py-2 rounded-xl bg-emerald-600 text-white">
          Add Question
        </button>
      )}
    </div>
  );
}

function ResultsTable({ results, setResults }) {
  const clear = () => {
    if (window.confirm("Clear all results?")) {
      setResults([]);
    }
  };
  
  return (
    <div>
      <div className="overflow-auto border rounded-xl">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              {["Username", "Exam Title", "Score", "Total", "Percent", "Submitted At", "Answers"].map(h => (
                <th key={h} className="text-left p-2 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.map((r, idx) => (
              <tr key={idx} className="border-t">
                <td className="p-2">{r.username}</td>
                <td className="p-2">{r.examTitle}</td>
                <td className="p-2">{r.score}</td>
                <td className="p-2">{r.total}</td>
                <td className="p-2">{r.percent}%</td>
                <td className="p-2">{new Date(r.submittedAt).toLocaleString()}</td>
                <td className="p-2">{r.answers.join(", ")}</td>
              </tr>
            ))}
            {results.length === 0 && (
              <tr><td colSpan={7} className="p-3 text-center text-gray-500">No results yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex gap-2">
        <button onClick={clear} className="px-3 py-1.5 rounded-xl bg-red-600 text-white">
          Clear Results
        </button>
      </div>
    </div>
  );
}

// Utils
function loadQuestions() {
  const raw = localStorage.getItem(LS_KEYS.QUESTIONS);
  if (!raw) return [];
  try {
    const q = JSON.parse(raw);
    return Array.isArray(q) ? q : [];
  } catch { return []; }
}

function loadResults() {
  const raw = localStorage.getItem(LS_KEYS.RESULTS);
  if (!raw) return [];
  try {
    const r = JSON.parse(raw);
    return Array.isArray(r) ? r : [];
  } catch { return []; }
}

// Parse .docx converted markdown with pattern:
// n) Question text\nA) option\nB) option\nC) option\nD) option\nAnswer: X
function parseQuestionsFromMarkdown(md) {
  // Split into blocks for potential future use
  // eslint-disable-next-line no-unused-vars
  const blocks = md.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean);
  const out = [];

  // Join into a single string to allow regex spanning blocks
  const text = md.replace(/\r/g, "");
  const qRegex = /(\d+)\)\s*([^\n]+)\nA\)\s*([^\n]+)\nB\)\s*([^\n]+)\nC\)\s*([^\n]+)\nD\)\s*([^\n]+)\nAnswer:\s*([ABCD])/g;
  let m;
  while ((m = qRegex.exec(text)) !== null) {
    const [, , qText, A, B, C, D, ans] = m;
    const idx = { A: 0, B: 1, C: 2, D: 3 }[ans];
    out.push({
      id: generateId(),
      text: qText.trim(),
      options: [A, B, C, D].map(s => s.trim()),
      correctIndex: idx,
    });
  }
  return out;
}

export default CBTExam;
