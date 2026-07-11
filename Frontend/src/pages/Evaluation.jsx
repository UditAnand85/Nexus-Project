import { useState, useRef, useEffect } from "react";
import StageTracker from "../components/StageTracker";
import { uploadEvaluationVideo } from "../api/apiClient";

const QUESTIONS = [
  {
    id: "q1",
    text: "If a project has 4 phases and each takes 20% longer than the last, and phase 1 takes 5 days, how long is phase 3?",
    options: ["6.2 days", "7.2 days", "8.6 days"],
  },
  {
    id: "q2",
    text: "Which of these is NOT a valid way to reduce coupling between two services?",
    options: ["Shared database tables", "Well-defined API contracts", "Async messaging"],
  },
];

export default function Evaluation({ student }) {
  const [stageIndex, setStageIndex] = useState(1); // 0 resume(done) 1 video 2 aptitude 3 final
  const [permissionError, setPermissionError] = useState(null);
  const [recording, setRecording] = useState(false);
  const [videoDone, setVideoDone] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [stream, setStream] = useState(null);
  const [answers, setAnswers] = useState({});
  const [quizDone, setQuizDone] = useState(false);
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [stream]);

  const startRecording = async () => {
    setPermissionError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
      chunksRef.current = [];
      const recorder = new MediaRecorder(mediaStream);
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = async () => {
        mediaStream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        setUploadingVideo(true);
        setUploadError(null);
        try {
          if (student?.student_id) {
            await uploadEvaluationVideo(student.student_id, blob);
          }
          setVideoDone(true);
          setStageIndex(2);
        } catch (err) {
          setUploadError(err.message || "Couldn't upload your video. Please try recording again.");
        } finally {
          setUploadingVideo(false);
        }
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);

      // auto-stop after 60s
      setTimeout(() => {
        if (recorder.state === "recording") recorder.stop();
        setRecording(false);
      }, 60000);
    } catch (err) {
      setPermissionError(
        "Camera or microphone access was denied or unavailable. Please allow permissions in your browser and try again, or use a different device."
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
  };

  const answerQuestion = (qid, opt) => setAnswers((a) => ({ ...a, [qid]: opt }));

  const submitQuiz = () => {
    setQuizDone(true);
    setStageIndex(3);
  };

  return (
    <div className="max-w-[1080px] mx-auto px-8 py-12 pb-24">
      <span className="font-mono text-xs uppercase tracking-wider text-inksoft block mb-3.5">
        Application received
      </span>
      <h1 className="text-[30px] font-medium">Thanks{student ? `, ${student.full_name.split(" ")[0]}` : ""} — here's what happens next.</h1>
      <p className="text-inksoft max-w-[560px] mt-3">
        Once the application window closes, every resume is screened. If you're shortlisted, you'll get an
        email to complete the two steps below.
      </p>

      <StageTracker currentIndex={stageIndex} />

      {!videoDone && (
        <div className="bg-panel border border-line p-10 text-center">
          <span className="font-mono text-xs uppercase tracking-wider text-inksoft block mb-5">
            Stage 1 · Video introduction
          </span>

          <video
            ref={videoRef}
            muted
            className={`w-[280px] h-[210px] mx-auto mb-5 bg-ink rounded-sm object-cover ${
              stream ? "block" : "hidden"
            }`}
          />

          {!stream && (
            <div className="w-[120px] h-[120px] rounded-full border-2 border-ink mx-auto mb-6 flex items-center justify-center font-mono text-xs">
              {recording ? "● REC" : "camera"}
            </div>
          )}

          <p className="text-inksoft text-sm mb-5">
            Record a 60-second self-introduction. One take, then submit. We only ask for camera and
            microphone access for this step — nothing is uploaded until you finish recording.
          </p>

          {permissionError && (
            <p className="text-stop text-sm mb-4 max-w-[420px] mx-auto">{permissionError}</p>
          )}
          {uploadError && (
            <p className="text-stop text-sm mb-4 max-w-[420px] mx-auto">{uploadError}</p>
          )}

          {uploadingVideo ? (
            <p className="font-mono text-xs text-inksoft">Uploading your video…</p>
          ) : !recording ? (
            <button onClick={startRecording} className="btn-primary">Start recording</button>
          ) : (
            <button onClick={stopRecording} className="btn-ghost border-stop text-stop">Stop recording</button>
          )}
        </div>
      )}

      {videoDone && !quizDone && (
        <div className="bg-panel border border-line p-10 mt-6 text-left">
          <span className="font-mono text-xs uppercase tracking-wider text-inksoft block mb-5">
            Stage 2 · Aptitude test — 15 questions (2 shown)
          </span>
          {QUESTIONS.map((q, i) => (
            <div key={q.id} className="border-b border-line py-5">
              <p className="font-medium mb-3">{i + 1}. {q.text}</p>
              {q.options.map((opt) => (
                <label key={opt} className="flex items-center gap-2.5 py-1.5 text-sm text-inksoft cursor-pointer">
                  <input
                    type="radio"
                    name={q.id}
                    checked={answers[q.id] === opt}
                    onChange={() => answerQuestion(q.id, opt)}
                  />
                  {opt}
                </label>
              ))}
            </div>
          ))}
          <button onClick={submitQuiz} className="btn-primary mt-4">Submit test</button>
        </div>
      )}

      {quizDone && (
        <div className="bg-panel border border-line p-10 text-center mt-6">
          <span className="font-mono text-xs uppercase tracking-wider text-inksoft block mb-5">
            All stages complete
          </span>
          <h3 className="text-xl mb-2.5">You're done. We'll email you either way.</h3>
          <p className="text-inksoft text-sm">
            Final decisions go out after the recruiter reviews the ranked list.
          </p>
        </div>
      )}
    </div>
  );
}
