import { Link } from "react-router-dom";
import { useStore } from "../../store/useStore";
import { useCurrentChapter } from "../../hooks/useCurrentChapter";
import { ROUTES } from "../../constants";
import { isSampleBook } from "../../demo";
import { Icon } from "../ui/Icon";
import { GuideAsk } from "./GuideAsk";
import { GuidePreview } from "./GuidePreview";

export function GuidePanel() {
  const open = useStore((state) => state.isAiSidebarOpen);
  const activeTab = useStore((state) => state.activeAiTab);
  const currentBookId = useStore((state) => state.currentBookId);
  const setOpen = useStore((state) => state.setAiSidebarOpen);
  const setActiveTab = useStore((state) => state.setActiveAiTab);
  const { chapterLabel } = useCurrentChapter();

  return (
    <aside className="guide" aria-hidden={!open} inert={!open}>
      <div className="guide-head">
        <div>
          <p className="eyebrow">Reading guide</p>
          <h2>{chapterLabel}</h2>
        </div>
        <button
          type="button"
          className="icon-close"
          onClick={() => setOpen(false)}
          aria-label="Close reading guide"
        >
          <Icon name="close" size={18} />
        </button>
      </div>

      <div className="guide-tabs" role="tablist" aria-label="Guide mode">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "preview"}
          className={`guide-tab${activeTab === "preview" ? " is-on" : ""}`}
          onClick={() => setActiveTab("preview")}
        >
          Preview
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "ask"}
          className={`guide-tab${activeTab === "ask" ? " is-on" : ""}`}
          onClick={() => setActiveTab("ask")}
        >
          Ask
        </button>
      </div>

      <div className="guide-body">
        {activeTab === "preview" ? <GuidePreview /> : <GuideAsk />}
      </div>

      {isSampleBook(currentBookId) && (
        <p className="guide-demo" role="note">
          Sample book · answers are pre-written.
          <Link to={ROUTES.settings("guide")}>Connect a model</Link>
        </p>
      )}
    </aside>
  );
}
