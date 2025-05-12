import React from 'react';

interface Tab {
  id: string;
  title: string;
  isBuiltin?: boolean;
}

interface TabBarProps {
  tabs: Tab[];
  activeTab: string;
  onTabSelect: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
}

const TabBar: React.FC<TabBarProps> = ({ tabs, activeTab, onTabSelect, onTabClose }) => {
  return (
    <div className="flex items-center bg-base-200 border-b border-base-300">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`flex items-center px-4 py-2 border-r border-base-300 cursor-pointer ${
            activeTab === tab.id ? 'bg-base-100' : 'hover:bg-base-300'
          }`}
          onClick={() => onTabSelect(tab.id)}
        >
          <span className="mr-2">{tab.title}</span>
          {!tab.isBuiltin && (
            <button
              className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-base-400"
              onClick={(e) => {
                e.stopPropagation();
                onTabClose(tab.id);
              }}
            >
              ×
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default TabBar; 