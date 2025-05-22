import React, { useState, useEffect } from 'react';
import ModMgr from '../modMgr';
import ModBucket from '../modMgr/bucket';
import ModPkg from '../modMgr/pkg';
import { localMgr } from "../modMgr/localMgr";
const path = (global as unknown as { path: typeof import("path") }).path || require("path");

interface PackageStatus {
  installed: boolean;
  version: string;
  bucketVersion?: string;
  needsUpdate: boolean;
  isLegacy?: boolean;
  displayName?: string;
}

interface PackageManagerProps {
  onTabSelect?: (tabId: string) => void;
}

const PackageManager: React.FC<PackageManagerProps> = ({ onTabSelect }) => {
  const [buckets, setBuckets] = useState<ModBucket[]>([]);
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null);
  const [packages, setPackages] = useState<Map<string, PackageStatus>>(new Map());
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkPath, setLinkPath] = useState('');
  const [showGitDialog, setShowGitDialog] = useState(false);
  const [gitUrl, setGitUrl] = useState('');

  // Create default local bucket
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const localBucket = new ModBucket({
    type: "bucket",
    pkgs: [],
    folderName: "local"
  });

  useEffect(() => {
    // Load buckets and packages
    const loadData = () => {
      const bucketList = [localBucket, ...Array.from(ModMgr.buckets.values())];
      setBuckets(bucketList);
      if (bucketList.length > 0 && !selectedBucket) {
        setSelectedBucket(bucketList[0].folderName);
      }
    };
    loadData();
  }, [localBucket, selectedBucket]);

  useEffect(() => {
    if (selectedBucket) {
      const bucket = buckets.find(b => b.folderName === selectedBucket);
      if (bucket) {
        const pkgStatus = new Map<string, PackageStatus>();
        
        if (bucket.folderName === "local") {
          // Use localMgr for local bucket packages
          const localLinks = localMgr.getLocalPackages();

          Object.entries(localLinks).forEach(([name]) => {
            pkgStatus.set(name, {
              installed: true,
              version: "local",
              needsUpdate: false
            });
          });
        } else {
          // For other buckets, get packages normally
          try {
            const bucketPkgs = bucket.getBucketPkg("", false) as ModPkg[];
            if (Array.isArray(bucketPkgs)) {
              bucketPkgs.forEach(pkg => {
                const installedPkg = ModMgr.pkgs.get(pkg.name);
                // Get the actual mod name if it's installed
                let displayName = pkg.name;
                if (installedPkg) {
                  const modName = ModMgr.getModName(pkg.name);
                  if (modName) {
                    displayName = modName;
                  }
                }
                pkgStatus.set(pkg.name, {
                  installed: !!installedPkg,
                  version: installedPkg?.version || "",
                  bucketVersion: pkg.version,
                  needsUpdate: installedPkg ? installedPkg.version !== pkg.version : false,
                  displayName: displayName
                });
              });
            }
          } catch (error) {
            console.error(`Failed to load packages for bucket ${bucket.folderName}:`, error);
          }
        }
        
        setPackages(pkgStatus);
      }
    }
  }, [selectedBucket, buckets]);

  const handleInstall = async (pkgName: string) => {
    const bucket = buckets.find(b => b.folderName === selectedBucket);
    if (bucket) {
      const pkg = await ModMgr.installPkg(pkgName, bucket);
      if (pkg) {
        // Get the mod name and update the tab history
        const modName = ModMgr.getModName(pkgName);
        if (modName && modName !== pkgName) {
          localMgr.addToTabHistory({ id: pkgName, title: modName });
        }

        setPackages(prev => {
          const next = new Map(prev);
          next.set(pkgName, {
            installed: true,
            version: pkg.version,
            bucketVersion: pkg.version,
            needsUpdate: false
          });
          return next;
        });
      }
    }
  };

  const handleUninstall = (pkgName: string) => {
    if (ModMgr.uninstallPkg(pkgName)) {
      setPackages(prev => {
        const next = new Map(prev);
        next.set(pkgName, {
          installed: false,
          version: "",
          bucketVersion: next.get(pkgName)?.bucketVersion || "",
          needsUpdate: false
        });
        return next;
      });
    }
  };

  const handleLinkLocal = () => {
    if (linkPath.trim()) {
      const name = path.basename(linkPath);
      if (localMgr.addLocalPackage(name, linkPath)) {
        setLinkPath('');
        setShowLinkDialog(false);
        // Refresh the local bucket
        setSelectedBucket("local");
      }
    }
  };

  const handleUnlinkLocal = (name: string) => {
    localMgr.removeLocalPackage(name);
    // Refresh the local bucket
    setSelectedBucket("local");
  };

  const truncatePath = (path: string) => {
    if (path.length <= 50) return path;
    const parts = path.split(/[\\/]/);
    const lastPart = parts[parts.length - 1];
    const parentPath = parts.slice(0, -1).join('/');
    const truncatedParent = parentPath.length > 20 
      ? `...${parentPath.slice(-20)}`
      : parentPath;
    return `${truncatedParent}/${lastPart}`;
  };

  const handleAddGitBucket = async () => {
    if (gitUrl.trim()) {
      try {
        const bucket = await ModMgr.addBucket(gitUrl);
        if (!bucket) {
          await eagle.dialog.showMessageBox({
            type: 'error',
            title: 'Failed to Add Bucket',
            message: 'Could not add the bucket',
            detail: 'The repository might already exist or is invalid.',
            buttons: ['OK']
          });
          return;
        }

        // Validate if it's a valid bucket
        const bucketPkgs = bucket.pkgs;
        if (!Array.isArray(bucketPkgs) || bucketPkgs.length === 0) {
          // Invalid bucket, remove it and show error
          await ModMgr.removeBucket(bucket.folderName);
          await eagle.dialog.showMessageBox({
            type: 'error',
            title: 'Invalid Bucket',
            message: 'The repository is not a valid bucket',
            detail: 'The repository must contain valid package definitions with mod.json files.',
            buttons: ['OK']
          });
          return;
        }

        setGitUrl('');
        setShowGitDialog(false);
        // Refresh buckets
        const bucketList = [localBucket, ...Array.from(ModMgr.buckets.values())];
        setBuckets(bucketList);
      } catch (error) {
        console.error('Failed to add Git bucket:', error);
        await eagle.dialog.showMessageBox({
          type: 'error',
          title: 'Failed to Add Bucket',
          message: 'Could not add the bucket',
          detail: error instanceof Error ? error.message : 'Unknown error occurred',
          buttons: ['OK']
        });
      }
    }
  };

  const handleReset = async (pkgName: string) => {
    const bucket = buckets.find(b => b.folderName === selectedBucket);
    if (bucket) {
      try {
        await ModMgr.resetPkg(pkgName, bucket);
        // Refresh package status
        const pkg = ModMgr.pkgs.get(pkgName);
        setPackages(prev => {
          const next = new Map(prev);
          next.set(pkgName, {
            installed: true,
            version: pkg?.version || "",
            bucketVersion: next.get(pkgName)?.bucketVersion || "",
            needsUpdate: false
          });
          return next;
        });
      } catch (error) {
        console.error(`Failed to reset package ${pkgName}:`, error);
        await eagle.dialog.showMessageBox({
          type: 'error',
          title: 'Reset Failed',
          message: `Could not reset ${pkgName}`,
          detail: error instanceof Error ? error.message : 'Unknown error occurred',
          buttons: ['OK']
        });
      }
    }
  };

  const handleUpdate = async (pkgName: string) => {
    const bucket = buckets.find(b => b.folderName === selectedBucket);
    if (bucket) {
      try {
        const pkg = await ModMgr.updatePkg(pkgName, bucket);
        if (pkg) {
          setPackages(prev => {
            const next = new Map(prev);
            next.set(pkgName, {
              installed: true,
              version: pkg.version,
              bucketVersion: pkg.version,
              needsUpdate: false
            });
            return next;
          });
        }
      } catch (error) {
        console.error(`Failed to update package ${pkgName}:`, error);
        await eagle.dialog.showMessageBox({
          type: 'error',
          title: 'Update Failed',
          message: `Could not update ${pkgName}`,
          detail: error instanceof Error ? error.message : 'Unknown error occurred',
          buttons: ['OK']
        });
      }
    }
  };

  const handleUpdateBucket = async () => {
    const bucket = buckets.find(b => b.folderName === selectedBucket);
    if (bucket && bucket.folderName !== "local") {
      try {
        await ModMgr.updateBucket(bucket.folderName);
        
        // Refresh the bucket data
        const updatedBucket = ModMgr.buckets.get(bucket.folderName);
        if (!updatedBucket) {
          throw new Error('Failed to refresh bucket data');
        }

        // Update package statuses with fresh data
        const updatedPackages = new Map();
        const bucketPkgs = updatedBucket.getBucketPkg("", false) as ModPkg[];
        
        if (Array.isArray(bucketPkgs)) {
          // First, add all packages from the bucket
          for (const pkg of bucketPkgs) {
            const installedPkg = ModMgr.pkgs.get(pkg.name);
            // Get the actual mod name if it's installed
            let displayName = pkg.name;
            if (installedPkg) {
              const modName = ModMgr.getModName(pkg.name);
              if (modName) {
                displayName = modName;
              }
            }
            updatedPackages.set(pkg.name, {
              installed: !!installedPkg,
              version: installedPkg?.version || "",
              bucketVersion: pkg.version,
              needsUpdate: installedPkg ? installedPkg.version !== pkg.version : false,
              isLegacy: installedPkg?.isLegacy() || false,
              displayName: displayName
            });
          }

          // Then, add any installed packages that might not be in the bucket
          for (const [name, pkg] of ModMgr.pkgs.entries()) {
            if (!updatedPackages.has(name)) {
              updatedPackages.set(name, {
                installed: true,
                version: pkg.version,
                bucketVersion: "",
                needsUpdate: false,
                isLegacy: pkg.isLegacy(),
                displayName: pkg.name
              });
            }
          }
        }

        setPackages(updatedPackages);
        await eagle.dialog.showMessageBox({
          type: 'info',
          title: 'Bucket Updated',
          message: 'Bucket has been refreshed successfully',
          buttons: ['OK']
        });
      } catch (error) {
        console.error('Failed to update bucket:', error);
        await eagle.dialog.showMessageBox({
          type: 'error',
          title: 'Update Failed',
          message: 'Could not update bucket',
          detail: error instanceof Error ? error.message : 'Unknown error occurred',
          buttons: ['OK']
        });
      }
    }
  };

  const handleUpdateAll = async () => {
    const bucket = buckets.find(b => b.folderName === selectedBucket);
    if (bucket && bucket.folderName !== "local") {
      try {
        // First update the bucket
        await handleUpdateBucket();
        
        // Then update all packages that need updates
        const updatedPackages = new Map(packages);
        let hasUpdates = false;

        for (const [name, status] of packages.entries()) {
          if (status.installed && status.needsUpdate) {
            const pkg = await ModMgr.updatePkg(name, bucket);
            if (pkg) {
              updatedPackages.set(name, {
                installed: true,
                version: pkg.version,
                bucketVersion: pkg.version,
                needsUpdate: false,
                isLegacy: pkg.isLegacy(),
                displayName: status.displayName
              });
              hasUpdates = true;
            }
          }
        }

        if (hasUpdates) {
          setPackages(updatedPackages);
          await eagle.dialog.showMessageBox({
            type: 'info',
            title: 'Updates Complete',
            message: 'All available packages have been updated',
            buttons: ['OK']
          });
        } else {
          await eagle.dialog.showMessageBox({
            type: 'info',
            title: 'No Updates Available',
            message: 'All packages are up to date',
            buttons: ['OK']
          });
        }
      } catch (error) {
        console.error('Failed to update packages:', error);
        await eagle.dialog.showMessageBox({
          type: 'error',
          title: 'Update Failed',
          message: 'Could not update packages',
          detail: error instanceof Error ? error.message : 'Unknown error occurred',
          buttons: ['OK']
        });
      }
    }
  };

  const handleRemoveBucket = async () => {
    const bucket = buckets.find(b => b.folderName === selectedBucket);
    if (bucket && bucket.folderName !== "local") {
      try {
        // First uninstall all packages from this bucket
        const bucketPkgs = bucket.getBucketPkg("", false) as ModPkg[];
        if (Array.isArray(bucketPkgs)) {
          for (const pkg of bucketPkgs) {
            if (ModMgr.pkgs.has(pkg.name)) {
              ModMgr.uninstallPkg(pkg.name);
            }
          }
        }

        // Then remove the bucket
        if (ModMgr.removeBucket(bucket.folderName)) {
          // Refresh buckets
          const bucketList = [localBucket, ...Array.from(ModMgr.buckets.values())];
          setBuckets(bucketList);
          setSelectedBucket("local"); // Switch to local bucket after removal
        }
      } catch (error) {
        console.error('Failed to remove bucket:', error);
        await eagle.dialog.showMessageBox({
          type: 'error',
          title: 'Remove Failed',
          message: 'Could not remove bucket',
          detail: error instanceof Error ? error.message : 'Unknown error occurred',
          buttons: ['OK']
        });
      }
    }
  };

  return (
    <div className="flex h-full">
      {/* Left column - Bucket list */}
      <div className="w-1/4 border-r border-base-300 flex flex-col">
        <div className="p-4 border-b border-base-300">
          <h2 className="text-lg font-semibold">Buckets</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {buckets.map(bucket => (
            <div
              key={bucket.folderName}
              className={`p-4 cursor-pointer hover:bg-base-200 ${
                selectedBucket === bucket.folderName ? 'bg-base-200' : ''
              } ${bucket.folderName === "local" ? 'border-b border-base-300' : ''}`}
              onClick={() => setSelectedBucket(bucket.folderName)}
            >
              <h3 className="font-medium">
                {bucket.folderName === "local" ? "Local" : (
                  bucket.folderName.split('_').length > 1 ? 
                    `${bucket.folderName.split('_')[1]}` :
                    bucket.folderName
                )}
              </h3>
              <p className="text-sm text-base-content/70">
                {bucket.type === "bucket" ? "Bucket" : "Package"}
                {bucket.folderName !== "local" && bucket.folderName.split('_').length > 1 && 
                  ` (${bucket.folderName.split('_')[0]})`}
              </p>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-base-300">
          <button
            className="btn btn-primary w-full"
            onClick={() => setShowGitDialog(true)}
          >
            Add Git Bucket
          </button>
        </div>
      </div>

      {/* Right column - Package list */}
      <div className="w-3/4 p-4 flex flex-col">
        <div className="flex-1 overflow-y-auto">
          {Array.from(packages.entries()).map(([name, status]) => (
            <div key={name} className="flex flex-col p-4 border-b border-base-300">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 
                    className={`font-medium ${status.installed ? 'hover:text-primary cursor-pointer' : ''}`}
                    onClick={() => {
                      if (status.installed) {
                        onTabSelect?.(name);
                      }
                    }}
                  >
                    {status.displayName || name}
                  </h3>
                  <p className="text-sm text-base-content/70">
                    {selectedBucket === "local" ? (
                      <button
                        className="hover:underline"
                        onClick={() => {
                          const pkgPath = localMgr.getLocalPackagePath(name);
                          if (pkgPath) {
                            eagle.shell.openPath(pkgPath);
                          }
                        }}
                        title={localMgr.getLocalPackagePath(name)}
                      >
                        {truncatePath(localMgr.getLocalPackagePath(name) || '')}
                      </button>
                    ) : (
                      <>
                        {status.installed ? (
                          <>
                            Installed: v{status.version}
                            {status.isLegacy && (
                              <span className="ml-2 text-warning">(Legacy)</span>
                            )}
                            {status.needsUpdate && (
                              <span className="ml-2 text-info">(Update available: v{status.bucketVersion})</span>
                            )}
                          </>
                        ) : (
                          "Not installed"
                        )}
                      </>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {selectedBucket === "local" ? (
                    <button
                      className="btn btn-sm btn-error"
                      onClick={() => handleUnlinkLocal(name)}
                    >
                      Unlink
                    </button>
                  ) : (
                    <>
                      {status.installed && (
                        <>
                          <button
                            className="btn btn-sm btn-warning"
                            onClick={() => handleReset(name)}
                            title="Reset package to clean state"
                          >
                            Reset
                          </button>
                          {status.needsUpdate && (
                            <button
                              className="btn btn-sm btn-info"
                              onClick={() => handleUpdate(name)}
                              title="Update to latest version"
                            >
                              Update
                            </button>
                          )}
                        </>
                      )}
                      <button
                        className={`btn btn-sm ${status.installed ? 'btn-error' : 'btn-primary'}`}
                        onClick={() => status.installed ? handleUninstall(name) : handleInstall(name)}
                      >
                        {status.installed ? 'Uninstall' : 'Install'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom actions */}
        <div className="mt-4 flex justify-between items-center">
          {selectedBucket === "local" && (
            <button
              className="btn btn-primary"
              onClick={() => setShowLinkDialog(true)}
            >
              Link Local Directory
            </button>
          )}
          <div className="flex gap-2">
            {selectedBucket !== "local" && (
              <>
                <button
                  className="btn btn-info"
                  onClick={handleUpdateBucket}
                >
                  Update Bucket
                </button>
                <button
                  className="btn btn-info"
                  onClick={handleUpdateAll}
                >
                  Update All
                </button>
                <button
                  className="btn btn-error"
                  onClick={handleRemoveBucket}
                >
                  Remove
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Link Dialog */}
      {showLinkDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-base-100 p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Link Local Directory</h3>
            <input
              type="text"
              className="w-full px-4 py-2 bg-base-200 rounded-lg mb-4"
              placeholder="Enter directory path"
              value={linkPath}
              onChange={(e) => setLinkPath(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button
                className="btn"
                onClick={() => {
                  setShowLinkDialog(false);
                  setLinkPath('');
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleLinkLocal}
              >
                Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Git Dialog */}
      {showGitDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-base-100 p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Add Git Bucket</h3>
            <input
              type="text"
              className="w-full px-4 py-2 bg-base-200 rounded-lg mb-4"
              placeholder="Enter Git repository URL"
              value={gitUrl}
              onChange={(e) => setGitUrl(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button
                className="btn"
                onClick={() => {
                  setShowGitDialog(false);
                  setGitUrl('');
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleAddGitBucket}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PackageManager; 