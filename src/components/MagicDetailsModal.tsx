import { FaMale, FaFemale } from "react-icons/fa";

interface MagicDetailsModalProps {
  open: boolean;
  gender: string;
  age: string;
  model: string | null;
  modelOptions: string[];
  minAge: number;
  maxAge: number;
  onClose: () => void;
  onGenderChange: (gender: "male" | "female") => void;
  onAgeChange: (age: string) => void;
  onModelChange: (modelName: string | null) => void;
  onDone: () => void;
}

// Heavy details modal UI, lazy-loaded from MagicMaker
const MagicDetailsModal = ({
  open,
  gender,
  age,
  model,
  modelOptions,
  minAge,
  maxAge,
  onClose,
  onGenderChange,
  onAgeChange,
  onModelChange,
  onDone,
}: MagicDetailsModalProps) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-2xl glass text-white rounded-3xl border border-white/10 p-8 shadow-[0_0_40px_rgba(112,0,255,0.2)]">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/45 font-bold mb-1">Character Setup</p>
            <h3 className="text-2xl font-bold tracking-tight">Select Character Details</h3>
          </div>
          <button
            className="text-white/70 hover:text-white transition-colors rounded-lg hover:bg-white/10 p-2"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="space-y-6">
          {/* Gender Selection */}
          <div>
            <label className="block text-sm font-medium text-white/90 mb-3">Select Gender</label>
            <div className="flex gap-4">
              <button
                className={`flex-1 flex flex-col items-center justify-center px-4 py-5 rounded-2xl border-2 transition-all backdrop-blur-sm ${
                  gender === "male"
                    ? "bg-[#00f2ff]/15 border-[#00f2ff] text-[#00f2ff] scale-105 shadow-[0_0_20px_rgba(0,242,255,0.25)]"
                    : "bg-white/5 border-white/20 text-white/60 hover:bg-white/10 hover:scale-105"
                }`}
                onClick={() => onGenderChange("male")}
                type="button"
              >
                <FaMale className="text-3xl mb-2" />
                <span className="text-sm font-medium">Boy</span>
              </button>
              <button
                className={`flex-1 flex flex-col items-center justify-center px-4 py-5 rounded-2xl border-2 transition-all backdrop-blur-sm ${
                  gender === "female"
                    ? "bg-[#7000ff]/20 border-[#7000ff] text-[#c6a0ff] scale-105 shadow-[0_0_20px_rgba(112,0,255,0.3)]"
                    : "bg-white/5 border-white/20 text-white/60 hover:bg-white/10 hover:scale-105"
                }`}
                onClick={() => onGenderChange("female")}
                type="button"
              >
                <FaFemale className="text-3xl mb-2" />
                <span className="text-sm font-medium">Girl</span>
              </button>
            </div>
          </div>

          {/* Age Selection */}
          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">Age (years)</label>
            <input
              type="number"
              value={age}
              onChange={(e) => {
                let val = parseInt(e.target.value.replace(/[^\d]/g, ""), 10);
                if (Number.isNaN(val)) {
                  onAgeChange("");
                  return;
                }
                if (val < minAge) val = minAge;
                if (val > maxAge) val = maxAge;
                onAgeChange(String(val));
              }}
              min={minAge}
              max={maxAge}
              className="w-full border border-white/20 bg-white/5 backdrop-blur-sm text-white rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-[#00f2ff]/45 focus:border-[#00f2ff]/50 transition-all shadow-inner"
              placeholder={`Enter age (${minAge}-${maxAge})`}
              maxLength={2}
              inputMode="numeric"
            />
            <div className="text-xs text-white/50 mt-1">
              Ages {minAge} to {maxAge} only
            </div>
          </div>

          {/* Model Selection */}
          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">Choose Character</label>
            <select
              value={model || ""}
              onChange={(e) => {
                const selectedName = e.target.value;
                onModelChange(selectedName || null);
              }}
              disabled={!gender}
              className="w-full border border-white/20 bg-white/5 backdrop-blur-sm text-white rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#7000ff]/45 focus:border-[#7000ff]/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-inner"
            >
              <option value="">{!gender ? "Select gender first" : "Choose a character"}</option>
              {modelOptions.map((characterName) => (
                <option key={characterName} value={characterName} className="bg-[#09090f] text-white">
                  {characterName}
                </option>
              ))}
            </select>
            {!gender && <div className="text-xs text-white/50 mt-2">Please select gender first</div>}
          </div>

          {/* Done Button */}
          <div className="flex justify-end gap-3 pt-6">
            <button
              className="glass hover:bg-white/10 text-white border border-white/10 rounded-xl px-6 py-3 text-[11px] uppercase tracking-widest font-bold transition-all hover:scale-105 backdrop-blur-sm"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="relative group bg-gradient-action text-white font-bold rounded-xl px-8 py-3 text-[11px] uppercase tracking-widest transition-all hover:opacity-95 hover:scale-105 shadow-[0_0_20px_rgba(112,0,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 overflow-hidden"
              onClick={onDone}
              disabled={!gender || !age || !model}
            >
              <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative">Done</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MagicDetailsModal;

