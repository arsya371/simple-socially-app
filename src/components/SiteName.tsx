import { getSiteMetadata } from "@/lib/metadata";

export async function SiteName() {
  const { siteName } = await getSiteMetadata();
  return <span className="font-mono tracking-wider">{siteName}</span>;
}