interface ActionButtonProps {
  icon: string;
  label: string;
  onClick: () => void;
}

export function ActionButton({ icon, label, onClick }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center w-9 h-9 rounded-md text-warm-off-white hover:bg-light-gray-text transition-colors"
      title={label}
    >
      <span className="material-symbols-outlined text-xl">{icon}</span>
    </button>
  );
}
