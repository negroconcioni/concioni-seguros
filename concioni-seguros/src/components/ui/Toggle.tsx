type ToggleProps = {
  checked: boolean;
  onChange: (nextValue: boolean) => void;
  label: string;
};

function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-[#e2e0db] bg-[#f5f4f1] px-3 py-[10px]">
      <span className="text-sm text-[#1a1916]">{label}</span>
      <button
        type="button"
        className={`relative h-6 w-11 rounded-full transition ${
          checked ? "bg-[#1d4ed8]" : "bg-[#d0cdc7]"
        }`}
        onClick={() => onChange(!checked)}
        aria-checked={checked}
        role="switch"
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
            checked ? "left-5" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}

export default Toggle;
