interface LoadingSpinnerProps {
  message?: string;
  fullScreen?: boolean;
}

export function LoadingSpinner({ message, fullScreen }: LoadingSpinnerProps) {
  const content = (
    <div className="flex flex-col items-center gap-4">
      <div className="w-8 h-8 border-3 border-forest-green border-t-transparent rounded-full animate-spin" />
      {message && <span className="text-muted-gray-text">{message}</span>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-warm-off-white">
        {content}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl px-6 py-4 shadow-lg flex items-center gap-3">
        <div className="w-5 h-5 border-2 border-forest-green border-t-transparent rounded-full animate-spin" />
        {message && <span className="text-muted-gray-text">{message}</span>}
      </div>
    </div>
  );
}
