import { Icon } from "../ui/Icon";
import { useLocation } from "react-router-dom";
import { useNavigation } from "../../hooks/useNavigation";
import type { IconName } from "../ui/Icon";

interface RailItem {
  id: "library" | "vocabulary" | "settings";
  label: string;
  icon: IconName;
}

const ITEMS: RailItem[] = [
  { id: "library", label: "Library", icon: "library" },
  { id: "vocabulary", label: "Lexicon", icon: "lexicon" },
  { id: "settings", label: "Settings", icon: "settings" },
];

export function Rail() {
  const { pathname } = useLocation();
  const { goToLibrary, goToVocabulary, goToSettings } = useNavigation();

  const active = pathname.startsWith("/vocabulary")
    ? "vocabulary"
    : pathname.startsWith("/settings")
      ? "settings"
      : "library";

  const handleNavigate = (id: RailItem["id"]) => {
    if (id === "library") goToLibrary();
    else if (id === "vocabulary") goToVocabulary();
    else goToSettings();
  };

  return (
    <aside className="rail">
      <button
        type="button"
        className="rail-mark"
        aria-label="Book Tutor — library"
        title="Book Tutor"
        onClick={() => goToLibrary()}
      >
        <Icon name="brandBook" size={21} />
      </button>
      <nav className="rail-nav" aria-label="Primary">
        {ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`rail-item${active === item.id ? " is-active" : ""}`}
            aria-label={item.label}
            aria-current={active === item.id ? "page" : undefined}
            title={item.label}
            onClick={() => handleNavigate(item.id)}
          >
            <Icon name={item.icon} size={18} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="rail-foot" title="Your books stay in this browser">
        <span className="rail-dot" aria-hidden="true" />
        <span>Local</span>
      </div>
    </aside>
  );
}
