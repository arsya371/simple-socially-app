import prisma from "./prisma";

export async function getSiteMetadata() {
  const settings = await prisma.siteSetting.findMany({
    where: {
      key: {
        in: ["site-name", "site-description"]
      }
    }
  });

  const siteName = settings.find(s => s.key === "site-name")?.value || "Socially";
  const siteDescription = settings.find(s => s.key === "site-description")?.value || "A modern social media application powered by Next.js";

  return {
    siteName,
    siteDescription
  };
}