/**
 * Creates serialized selected folders with full properties
 * @param folders - Raw folders from eagle.folder.getSelected()
 * @returns Serialized folder objects with all properties
 */
export async function createSerializedSelectedFolders() {
    const folders = await (window as any).eagle.folder.getSelected();
  return folders
    ? folders.map((f: Folder) => ({
        id: f.id,
        name: f.name,
        description: f.description,
        icon: f.icon,
        iconColor: f.iconColor,
        createdAt: f.createdAt,
        children: f.children
          ? f.children.map((child: Folder) => ({
              id: child.id,
              name: child.name,
              description: child.description,
              icon: child.icon,
              iconColor: child.iconColor,
              createdAt: child.createdAt,
            }))
          : [],
      }))
    : [];
}

/**
 * Creates serialized selected items with full properties
 * @param items - Raw items from eagle.item.getSelected()
 * @returns Serialized item objects with all properties
 */
export async function createSerializedSelectedItems() {
    const items = await (window as any).eagle.item.getSelected();
  return items
    ? items.map((item: Item) => ({
        id: item.id,
        name: item.name,
        ext: item.ext,
        width: item.width,
        height: item.height,
        url: item.url,
        isDeleted: item.isDeleted,
        annotation: item.annotation,
        tags: item.tags,
        folders: item.folders,
        palettes: item.palettes,
        size: item.size,
        star: item.star,
        importedAt: item.importedAt,
        noThumbnail: item.noThumbnail,
        noPreview: item.noPreview,
        filePath: item.filePath,
        fileURL: item.fileURL,
        thumbnailPath: item.thumbnailPath,
        thumbnailURL: item.thumbnailURL,
        metadataFilePath: item.metadataFilePath,
      }))
    : [];
}

