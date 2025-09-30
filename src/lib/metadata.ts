import { getWebsiteTitle, getWebsiteDescription } from "./app-settings";

export async function getSiteMetadata() {
  const [siteName, siteDescription] = await Promise.all([
    getWebsiteTitle(),
    getWebsiteDescription()
  ]);

  return {
    siteName,
    siteDescription
  };
}