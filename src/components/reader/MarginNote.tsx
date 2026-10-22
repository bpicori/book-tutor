interface MarginNoteProps {
  percent: number;
  onAsk: () => void;
}

export function MarginNote({ percent, onAsk }: MarginNoteProps) {
  return (
    <aside className="margin-note" aria-label="Reading progress and guide">
      <p className="mn-progress">
        {percent}
        <span>%</span>
      </p>
      <p className="mn-label">of the book</p>
      <div className="mn-rule" />
      <p className="mn-note">A quiet margin for the things you want to ask.</p>
      <button type="button" className="mn-link" onClick={onAsk}>
        Ask about this chapter <span aria-hidden="true">→</span>
      </button>
    </aside>
  );
}
