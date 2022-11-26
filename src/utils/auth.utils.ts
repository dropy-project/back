export function isVersionSuperiorOrEqual(version: string, minimumVersion: string): boolean {
  const versionArray = version.split('.');
  const minimumVersionArray = minimumVersion.split('.');

  if (versionArray.length !== minimumVersionArray.length) {
    throw new Error('Version and minimum version must have the same length');
  }

  for (let i = 0; i < versionArray.length; i++) {
    const versionNumber = parseInt(versionArray[i]);
    const minimumVersionNumber = parseInt(minimumVersionArray[i]);

    if (versionNumber > minimumVersionNumber) {
      return true;
    } else if (versionNumber < minimumVersionNumber) {
      return false;
    }
  }

  return true;
}
