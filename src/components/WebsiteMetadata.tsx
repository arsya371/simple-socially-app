import { getWebsiteTitle, getWebsiteDescription, getWebsiteKeywords, getCustomOgImage, isDefaultOgImage, getCustomFavicon, isDefaultFavicon } from "@/lib/app-settings";

interface WebsiteMetadataProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
}

export default async function WebsiteMetadata({ 
  title, 
  description, 
  keywords, 
  ogImage 
}: WebsiteMetadataProps) {
  const [
    websiteTitle,
    websiteDescription,
    websiteKeywords,
    customOgImage,
    isDefaultOgImageValue
  ] = await Promise.all([
    getWebsiteTitle(),
    getWebsiteDescription(),
    getWebsiteKeywords(),
    getCustomOgImage(),
    isDefaultOgImage()
  ]);

  const [customFavicon, useDefaultFavicon] = await Promise.all([
    getCustomFavicon(),
    isDefaultFavicon()
  ]);

  const finalTitle = title || websiteTitle;
  const finalDescription = description || websiteDescription;
  const finalKeywords = keywords || websiteKeywords;
  const finalOgImage = ogImage || (!isDefaultOgImageValue && customOgImage ? customOgImage : '/og-image.png');

  return (
    <>
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      <meta name="keywords" content={finalKeywords} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:image" content={finalOgImage} />
      
      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:title" content={finalTitle} />
      <meta property="twitter:description" content={finalDescription} />
      <meta property="twitter:image" content={finalOgImage} />
      
      {/* Favicon */}
      {useDefaultFavicon || !customFavicon ? (
        <link rel="icon" href="/favicon.ico" />
      ) : (
        <link rel="icon" href={customFavicon} />
      )}
    </>
  );
}
