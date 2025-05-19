import React, { useState, useEffect } from 'react';
import ModMgr from '../modMgr';
import { localMgr } from '../modMgr/localMgr';

interface SearchBarProps {
  tabs: { id: string; title: string }[];
  onTabSelect: (tabId: string) => void;
}

type Suggestion = {
  id: string;
  title: string;
  source: 'tab' | 'package';
};

const SearchBar: React.FC<SearchBarProps> = ({ tabs, onTabSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const updateSuggestions = () => {
    const pkgNames = Array.from(ModMgr.pkgs.keys());
    const linkedNames = Object.keys(localMgr.getLocalPackages());
    const allPkgs = Array.from(new Set([...pkgNames, ...linkedNames]));

    const tabsSuggestions: Suggestion[] = tabs.map(t => ({ id: t.id, title: t.title, source: 'tab' }));
    const pkgSuggestions: Suggestion[] = allPkgs.map(name => ({ id: name, title: name, source: 'package' }));

    setSuggestions([...tabsSuggestions, ...pkgSuggestions]);
  };

  // Initial load and listen for changes
  useEffect(() => {
    updateSuggestions();

    const handleLocalPackagesChanged = () => {
      updateSuggestions();
    };

    localMgr.on('localPackagesChanged', handleLocalPackagesChanged);

    return () => {
      localMgr.off('localPackagesChanged', handleLocalPackagesChanged);
    };
  }, [tabs, updateSuggestions]);

  const filtered = suggestions.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && filtered.length > 0) {
      onTabSelect(filtered[0].id);
      setSearchTerm('');
      setShowResults(false);
    }
  };

  return (
    <div className="relative w-full max-w-md">
      <input
        type="text"
        className="w-full px-4 py-2 bg-base-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        placeholder="Search tabs..."
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setShowResults(true);
        }}
        onKeyDown={handleKeyDown}
        onFocus={() => setShowResults(true)}
      />
      {showResults && searchTerm && (
        <div className="absolute w-full mt-1 bg-base-100 rounded-lg shadow-lg border border-base-300">
          {filtered.map(item => (
            <div
              key={item.id}
              className="px-4 py-2 hover:bg-base-200 cursor-pointer"
              onClick={() => {
                onTabSelect(item.id);
                setSearchTerm('');
                setShowResults(false);
              }}
            >
              {item.title}
              {item.source === 'package' && <span className="text-xs ml-2 text-base-content/60">pkg</span>}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="px-4 py-2 text-base-content/60">
              No matching tabs found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar; 