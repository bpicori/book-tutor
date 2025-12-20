interface ActionButtonProps {
  icon: string;
  label: string;
  onClick: () => void;
}

export function ActionButton({ icon, label, onClick }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center justify-center w-9 h-9
        rounded-lg
        text-warm-off-white/90
        bg-white/5 backdrop-blur-sm
        border border-white/10
        shadow-[0_1px_2px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.1)]
        transition-all duration-200 ease-out
        hover:bg-white/15
        hover:text-white
        hover:border-white/20
        hover:shadow-[0_2px_8px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.15)]
        hover:scale-105
        active:scale-100 active:bg-white/10
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-1 focus-visible:ring-offset-muted-gray-text
      `.trim().replace(/\s+/g, ' ')}
      title={label}
    >
      <span className="material-symbols-outlined text-lg">{icon}</span>
    </button>
  );
}
