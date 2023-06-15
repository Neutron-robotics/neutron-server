function getFileExtension(fileName: string): string | null {
  const lastDotIndex = fileName.lastIndexOf('.');
  if (lastDotIndex === -1) {
    return null; // No extension found
  }

  const extension = fileName.slice(lastDotIndex + 1);
  const otherDotsIndex = fileName.slice(0, lastDotIndex).indexOf('.');
  if (otherDotsIndex !== -1) {
    // If there are other dots before the last one, ignore them
    return null;
  }

  return extension;
}

export default getFileExtension;
