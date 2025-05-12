import { useState } from "react";
import TabBar from "./components/TabBar";
import SearchBar from "./components/SearchBar";
import PackageManager from "./components/PackageManager";
import { POWER_EAGLE_PATH } from "./modMgr/utils";
import ModHost from "./components/ModHost";

interface Tab {
  id: string;
  title: string;
  isBuiltin?: boolean;
}

function App() {
  console.log(POWER_EAGLE_PATH)
  const [tabs, setTabs] = useState<Tab[]>([
    { id: "search", title: "Search", isBuiltin: true },
    { id: "packages", title: "Package Manager", isBuiltin: true },
  ]);
  const [activeTab, setActiveTab] = useState<string>("search");

  const handleTabSelect = (tabId: string) => {
    setTabs(prev => {
      const exists = prev.some(t => t.id === tabId);
      if (!exists) {
        return [...prev, { id: tabId, title: tabId }];
      }
      return prev;
    });
    setActiveTab(tabId);
  };

  const handleTabClose = (tabId: string) => {
    setTabs(tabs.filter(tab => tab.id !== tabId));
    if (activeTab === tabId) {
      setActiveTab(tabs[0].id);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "search":
        return (
          <div className="flex-1 flex items-center justify-center p-4">
            <SearchBar tabs={tabs} onTabSelect={handleTabSelect} />
          </div>
        );
      case "packages":
        return (
          <div className="flex-1">
            <PackageManager />
          </div>
        );
      default:
        return (
          <div className="flex-1">
            <ModHost name={activeTab} />
          </div>
        );
    }
  };

  return (
    <div className="w-full h-screen flex flex-col bg-base-100">
      <TabBar
        tabs={tabs}
        activeTab={activeTab}
        onTabSelect={handleTabSelect}
        onTabClose={handleTabClose}
      />
      {renderTabContent()}
    </div>
  );
}

export default App;
