import { useState, useRef } from "react";

function getToneDescription(tone: number) {
  if (tone <= 3) return "friendly and casual";
  if (tone <= 6) return "professional and neutral";
  return "very formal and businesslike";
}

export default function Home() {
  const [jobDescription, setJobDescription] = useState("");
  const [resume, setResume] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [reasonForApplying, setReasonForApplying] = useState("");
  const [tone, setTone] = useState(5);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<null | "up" | "down">(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jobFile, setJobFile] = useState<File | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  // 🟢 NEW: refs for file input reset
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const jobInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult("");
    setFeedback(null);

    const toneDescription = getToneDescription(tone);
    const formData = new FormData();

    formData.append("name", name);
    formData.append("email", email);
    formData.append("reasonForApplying", reasonForApplying);
    formData.append("toneDescription", toneDescription);
    formData.append("jobDescription", jobDescription);
    formData.append("resume", resume);

    if (resumeFile) formData.append("resumeFile", resumeFile);
    if (jobFile) formData.append("jobFile", jobFile);

    const response = await fetch("/api/generate", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    setResult(data.result);
    setLoading(false);
  }

  function handleCopy() {
    if (outputRef.current) {
      const text = outputRef.current.innerText;
      navigator.clipboard.writeText(text);
    }
  }

  function handleReset() {
    setJobDescription("");
    setResume("");
    setName("");
    setEmail("");
    setReasonForApplying("");
    setTone(5);
    setResult("");
    setFeedback(null);
    setResumeFile(null);
    setJobFile(null);

    // 🟢 NEW: clear file inputs in UI
    if (resumeInputRef.current) resumeInputRef.current.value = "";
    if (jobInputRef.current) jobInputRef.current.value = "";
  }

  function handleFeedback(type: "up" | "down") {
    setFeedback(type);
  }

  function handleResumeFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setResumeFile(e.target.files?.[0] ?? null);
  }

  function handleJobFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setJobFile(e.target.files?.[0] ?? null);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-xl bg-white shadow-2xl rounded-2xl p-8">
        <h1 className="text-3xl font-bold mb-3 tracking-tight">🎯 Job Tailor</h1>
        <p className="mb-6 text-gray-600">Generate a custom-tailored resume summary and cover letter using AI.</p>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1">Your Name:</label>
            <input
              className="w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Your Email:</label>
            <input
              className="w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* 🟢 USE ref HERE */}
          <div>
            <label className="block text-sm font-medium mb-1">Job Description:</label>
            <textarea
              className="w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400"
              rows={5}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              required={!jobFile}
              placeholder="Paste the job description here, or upload a PDF below"
            />
            <input
              ref={jobInputRef}
              type="file"
              accept="application/pdf"
              onChange={handleJobFileChange}
              className="mt-2"
            />
            {jobFile && <div className="text-xs text-green-700 mt-1">Job Description PDF: {jobFile.name}</div>}
          </div>

          {/* 🟢 USE ref HERE */}
          <div>
            <label className="block text-sm font-medium mb-1">Your Resume:</label>
            <textarea
              className="w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400"
              rows={5}
              value={resume}
              onChange={(e) => setResume(e.target.value)}
              required={!resumeFile}
              placeholder="Paste your resume here, or upload a PDF below"
            />
            <input
              ref={resumeInputRef}
              type="file"
              accept="application/pdf"
              onChange={handleResumeFileChange}
              className="mt-2"
            />
            {resumeFile && <div className="text-xs text-green-700 mt-1">Resume PDF: {resumeFile.name}</div>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Why do you want this job or company? (optional)</label>
            <textarea
              className="w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400"
              rows={2}
              value={reasonForApplying}
              onChange={(e) => setReasonForApplying(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Cover Letter Tone: {tone} / 10 ({getToneDescription(tone)})
            </label>
            <input
              type="range"
              min={0}
              max={10}
              value={tone}
              onChange={e => setTone(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
          </div>

          <div className="flex gap-4 mt-3">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-5 py-2 rounded-xl transition-transform active:scale-95 hover:bg-blue-700 shadow-md font-semibold"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin h-5 w-5 border-2 border-t-transparent border-white rounded-full" />
                  Generating...
                </span>
              ) : (
                "Generate"
              )}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="bg-gray-200 text-gray-800 px-5 py-2 rounded-xl hover:bg-gray-300 transition-transform active:scale-95"
            >
              Reset
            </button>
          </div>
        </form>

        {result && (
          <div className="mt-8 p-5 bg-gray-100 rounded-xl shadow flex flex-col gap-4">
            <h2 className="text-xl font-bold mb-2">📄 Output</h2>
            <div ref={outputRef} className="whitespace-pre-wrap break-words text-gray-800">
              <p>{result}</p>
            </div>
            <div className="flex gap-3 items-center">
              <button
                onClick={handleCopy}
                className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 transition-transform active:scale-95"
              >
                Copy to Clipboard
              </button>
              <span className="ml-2 text-gray-500">Feedback:</span>
              <button
                onClick={() => handleFeedback("up")}
                className={`transition-transform active:scale-95 ${feedback === "up" ? "bg-green-100" : "bg-gray-200"} px-3 py-1 rounded-lg text-xl`}
              >👍</button>
              <button
                onClick={() => handleFeedback("down")}
                className={`transition-transform active:scale-95 ${feedback === "down" ? "bg-red-100" : "bg-gray-200"} px-3 py-1 rounded-lg text-xl`}
              >👎</button>
              {feedback === "up" && <span className="text-green-700 ml-2">Thanks for your feedback! 😊</span>}
              {feedback === "down" && <span className="text-red-700 ml-2">Sorry to hear that! 😢</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}





