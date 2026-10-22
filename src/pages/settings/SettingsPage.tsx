import { memo, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ROUTES,
  resolveSettingsTab,
  type SettingsTabId,
} from "../../constants";
import { Page, PageHeader } from "../../components/layout/Page";
import { SettingsNav } from "../../components/settings/SettingsNav";
import { TypographyPanel } from "../../components/settings/panels/TypographyPanel";
import { AppearancePanel } from "../../components/settings/panels/AppearancePanel";
import { GuideSettingsPanel } from "../../components/settings/panels/GuideSettingsPanel";
import { VoicePanel } from "../../components/settings/panels/VoicePanel";
import { DataPanel } from "../../components/settings/panels/DataPanel";
import { CloudPanel } from "../../components/settings/panels/CloudPanel";

function Panel({ tab }: { tab: SettingsTabId }) {
  switch (tab) {
    case "typography":
      return <TypographyPanel />;
    case "appearance":
      return <AppearancePanel />;
    case "guide":
      return <GuideSettingsPanel />;
    case "voice":
      return <VoicePanel />;
    case "data":
      return <DataPanel />;
    case "cloud":
      return <CloudPanel />;
  }
}

export const SettingsPage = memo(function SettingsPage() {
  const navigate = useNavigate();
  const { tab } = useParams<{ tab?: string }>();
  const activeTab = resolveSettingsTab(tab);

  useEffect(() => {
    if (tab && tab !== activeTab) {
      navigate(ROUTES.settings(activeTab), { replace: true });
    }
  }, [tab, activeTab, navigate]);

  const handleSelect = (next: SettingsTabId) => {
    navigate(ROUTES.settings(next));
  };

  return (
    <Page>
      <PageHeader
        eyebrow="Settings"
        title="The page, your way."
        lead="Type, paper, and the guide behind it. Changes apply to the reader immediately."
      />
      <div className="settings-shell">
        <SettingsNav active={activeTab} onSelect={handleSelect} />
        <div className="settings-panels">
          <section className="set-panel is-active">
            <Panel tab={activeTab} />
          </section>
        </div>
      </div>
    </Page>
  );
});
