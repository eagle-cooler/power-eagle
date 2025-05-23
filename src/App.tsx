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
  const [isAlwaysOnTop, setIsAlwaysOnTop] = useState(false);

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
        // Check if we have a title in the tab history
        const tabHistory = localMgr.getTabHistory();
        const historyItem = tabHistory.find(item => item.id === tabId);
        const newTab = { 
          id: tabId, 
          title: historyItem?.title || tabId 
        };
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

  const toggleAlwaysOnTop = () => {
    const newState = !isAlwaysOnTop;
    setIsAlwaysOnTop(newState);
    eagle.window.setAlwaysOnTop(newState);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "search":
        return (
          <div className="flex-1 flex flex-col items-center p-4">
            <div className="w-full max-w-2xl mb-8">
              <div className="flex items-center gap-2 mb-4">
                <SearchBar tabs={tabs} onTabSelect={handleTabSelect} />
                <button
                  onClick={toggleAlwaysOnTop}
                  className={`p-2 rounded-lg transition-colors ${
                    isAlwaysOnTop
                      ? 'bg-primary text-primary-content'
                      : 'bg-base-200 hover:bg-base-300'
                  }`}
                  title={isAlwaysOnTop ? "Unpin Window" : "Pin Window"}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 4.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V4.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.616a1 1 0 01.894-1.79l1.599.8L9 4.323V3a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
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
            <PackageManager onTabSelect={handleTabSelect} />
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
