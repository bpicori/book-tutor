interface ActionButtonProps {
  icon: string;
  label: string;
  onClick: () => void;
}

export function ActionButton({ icon, label, onClick }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center w-9 h-9 rounded-md text-warm-off-white hover:bg-light-gray-text transition-all duration-200 ease-out shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-green focus-visible:ring-offset-2"
      title={label}
    >
      <span className="material-symbols-outlined text-xl">{icon}</span>
    </button>
  );
}
