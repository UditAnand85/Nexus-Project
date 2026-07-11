import { EVAL_STAGES } from "../constants/roles";

export default function StageTracker({ currentIndex }) {
  return (
    <div className="flex my-8 mb-11">
      {EVAL_STAGES.map((stage, i) => {
        const done = i < currentIndex;
        const current = i === currentIndex;
        return (
          <div key={stage.key} className="flex-1 text-center relative pb-3.5">
            {i > 0 && (
              <div
                className={`absolute top-[5px] left-[-50%] w-full h-0.5 ${
                  i <= currentIndex ? "bg-go" : "bg-line"
                }`}
              />
            )}
            <div
              className={`relative z-10 w-[11px] h-[11px] rounded-full mx-auto mb-2 border-2 border-paper ${
                done ? "bg-go" : current ? "bg-ink" : "bg-line"
              }`}
            />
            <label className="font-mono text-[11px] text-inksoft whitespace-pre-line">{stage.label}</label>
          </div>
        );
      })}
    </div>
  );
}
