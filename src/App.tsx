import { useState, useEffect } from "react";
import TabBar from "./components/TabBar";
import SearchBar from "./components/SearchBar";
import PackageManager from "./components/PackageManager";
import { POWER_EAGLE_PATH } from "./modMgr/utils";
import { localMgr, TabHistoryItem } from "./modMgr/localMgr";
import ModHost from "./components/ModHost";

interface Tab {
  id: string;
  title: string;
  isBuiltin?: boolean;
}

function App() {
  console.log(POWER_EAGLE_PATH);
  const [tabs, setTabs] = useState<Tab[]>([
    { id: "search", title: "Search", isBuiltin: true },
    { id: "packages", title: "Package Manager", isBuiltin: true },
  ]);
  const [activeTab, setActiveTab] = useState<string>("search");
  const [recentTabs, setRecentTabs] = useState<TabHistoryItem[]>([]);

  useEffect(() => {
    // Initial load of tab history
    setRecentTabs(localMgr.getTabHistory());

    // Subscribe to tab history changes
    const handleTabHistoryChange = (history: TabHistoryItem[]) => {
      setRecentTabs(history);
    };

    localMgr.on('tabHistoryChanged', handleTabHistoryChange);

    return () => {
      localMgr.off('tabHistoryChanged', handleTabHistoryChange);
    };
  }, []);

  const handleTabSelect = (tabId: string) => {
    setTabs((prev) => {
      const exists = prev.some((t) => t.id === tabId);
      if (!exists) {
        const newTab = { id: tabId, title: tabId };
        localMgr.addToTabHistory(newTab);
        return [...prev, newTab];
      }
      return prev;
    });
    setActiveTab(tabId);
  };

  const handleTabClose = (tabId: string) => {
    setTabs((prev) => prev.filter((tab) => tab.id !== tabId));
    if (activeTab === tabId) {
      setActiveTab(tabs[0].id);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "search":
        return (
          <div className="flex-1 flex flex-col items-center p-4">
            <div className="w-full max-w-2xl mb-8">
              <SearchBar tabs={tabs} onTabSelect={handleTabSelect} />
              <br />
              <h2 className="text-xl font-semibold mb-4">Recent Tabs</h2>
              <div className="grid gap-2">
                {recentTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabSelect(tab.id)}
                    className="w-full p-3 text-left bg-base-200 hover:bg-base-300 rounded-lg transition-colors"
                  >
                    {tab.title}
                  </button>
                ))}
              </div>
            </div>
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
