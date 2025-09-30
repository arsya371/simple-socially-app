import prisma from "./prisma";
import { ViolationType } from "@prisma/client";
import { getAppSetting } from "./app-settings";

interface ContentModerationResult {
  isClean: boolean;
  censoredContent?: string;
  hasViolation: boolean;
}

interface ViolationDetails {
  originalContent: string;
  detectedWords: string[];
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function moderateContent(
  content: string,
  _userId: string
): Promise<ContentModerationResult> {
  // console.log("\n--- [DEBUG] Memulai Moderasi Konten ---");
  // console.log(`[DEBUG] Konten Asli: "${content}"`);

  const [wordsEnabled, domainsEnabled] = await Promise.all([
    getAppSetting("censored_words_enabled", false),
    getAppSetting("censored_domains_enabled", false)
  ]);
  // console.log(`[DEBUG] Sensor Kata Aktif: ${wordsEnabled}`);
  // console.log(`[DEBUG] Sensor Domain Aktif: ${domainsEnabled}`);

  let resultContent = content;
  let hasViolation = false;

  if (wordsEnabled) {
    const keywordsValue = await getAppSetting("prohibited_keywords", "[]");
    console.log(`[DEBUG] Data mentah 'prohibited_keywords' dari database:`, keywordsValue);

    let prohibitedKeywords: string[] = [];
    if (keywordsValue) {
      if (Array.isArray(keywordsValue)) {
        prohibitedKeywords = keywordsValue;
      } else if (typeof keywordsValue === 'string') {
        try {
          const parsed = JSON.parse(keywordsValue);
          prohibitedKeywords = Array.isArray(parsed) ? parsed : [];
        } catch (e) {
          console.log("[DEBUG] 'prohibited_keywords' bukan JSON, mencoba parsing dengan koma.");
          prohibitedKeywords = keywordsValue.split(",").map(w => w.trim());
        }
      }
      prohibitedKeywords = prohibitedKeywords.filter(Boolean);
    }
    console.log("[DEBUG] Kata-kata yang dilarang (setelah parsing):", prohibitedKeywords);

    if (prohibitedKeywords.length > 0) {
      const wordPattern = new RegExp(prohibitedKeywords.map(w => `\\b${escapeRegExp(w)}\\b`).join("|"), "gi");
      console.log("[DEBUG] Pola Regex yang dibuat:", wordPattern);
      
      if (wordPattern.test(resultContent)) {
        // console.log("[DEBUG] PELANGGARAN TERDETEKSI. Melakukan sensor...");
        hasViolation = true;
        resultContent = resultContent.replace(wordPattern, (m: string) => "*".repeat(m.length));
        // console.log(`[DEBUG] Konten setelah disensor: "${resultContent}"`);
      } else {
        console.log("[DEBUG] Tidak ada kata terlarang yang ditemukan di konten.");
      }
    } else {
        console.log("[DEBUG] Tidak ada kata yang dilarang di pengaturan. Melewati pemeriksaan kata.");
    }
  } else {
    console.log("[DEBUG] Sensor kata tidak aktif. Melewati pemeriksaan kata.");
  }

  if (domainsEnabled) {
    const domainsValue = await getAppSetting("censored_domains", "[]");
    let domains: string[] = [];
    if (domainsValue) {
       if (Array.isArray(domainsValue)) {
        domains = domainsValue;
      } else if (typeof domainsValue === 'string') {
        try {
          const parsed = JSON.parse(domainsValue);
          domains = Array.isArray(parsed) ? parsed : [];
        } catch (e) {
          domains = domainsValue.split(",").map(d => d.trim());
        }
      }
      domains = domains.map(d => d.replace(/^https?:\/\//, "").replace(/\/$/, "")).filter(Boolean);
    }
    
    if (domains.length > 0) {
      const domainPattern = new RegExp(`https?:\\/\\/([^\\s/]+)`, "gi");
      resultContent = resultContent.replace(domainPattern, (match: string, host: string) => {
        const blocked = domains.some(d => host.endsWith(d));
        if (blocked) {
          hasViolation = true;
          return "[link blocked]";
        }
        return match;
      });
    }
  }

  console.log(`[DEBUG] Hasil Akhir: Pelanggaran Terdeteksi = ${hasViolation}`);
  console.log("--- [DEBUG] Selesai Moderasi Konten ---\n");

  return {
    isClean: !hasViolation,
    hasViolation,
    censoredContent: hasViolation ? resultContent : undefined
  };
}

export async function handleViolation(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      suspendedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
    }
  });
}



// 2. GEMINI
// import prisma from "./prisma";
// import { ViolationType } from "@prisma/client";
// import { getAppSetting } from "./app-settings";

// interface ContentModerationResult {
//   isClean: boolean;
//   censoredContent?: string;
//   hasViolation: boolean;
// }

// interface ViolationDetails {
//   originalContent: string;
//   detectedWords: string[];
// }

// function escapeRegExp(string: string) {
//   // $& means the whole matched string
//   return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// }

// export async function moderateContent(
//   content: string,
//   _userId: string
// ): Promise<ContentModerationResult> {
//   // Feature toggles from the AppSetting table
//   const [wordsEnabled, domainsEnabled] = await Promise.all([
//     getAppSetting("censored_words_enabled", false),
//     getAppSetting("censored_domains_enabled", false)
//   ]);

//   let resultContent = content;
//   let hasViolation = false;

//   // Censor prohibited words
//   if (wordsEnabled) {
//     const keywordsValue = await getAppSetting("prohibited_keywords", "[]");

//     let prohibitedKeywords: string[] = [];
//     if (keywordsValue) {
//       if (Array.isArray(keywordsValue)) {
//         prohibitedKeywords = keywordsValue;
//       } else if (typeof keywordsValue === 'string') {
//         try {
//           prohibitedKeywords = JSON.parse(keywordsValue);
//         } catch (e) {
//           prohibitedKeywords = keywordsValue.split(",").map(w => w.trim());
//         }
//       }
//       prohibitedKeywords = prohibitedKeywords.filter(Boolean);
//     }

//     if (prohibitedKeywords.length > 0) {
//       const wordPattern = new RegExp(prohibitedKeywords.map(w => `\\b${escapeRegExp(w)}\\b`).join("|"), "gi");
//       if (wordPattern.test(resultContent)) {
//         hasViolation = true;
//         resultContent = resultContent.replace(wordPattern, (m: string) => "*".repeat(m.length));
//       }
//     }
//   }

//   // Block links from censored domains
//   if (domainsEnabled) {
//     const domainsValue = await getAppSetting("censored_domains", "[]");
    
//     let domains: string[] = [];
//     if (domainsValue) {
//        if (Array.isArray(domainsValue)) {
//         domains = domainsValue;
//       } else if (typeof domainsValue === 'string') {
//         try {
//           domains = JSON.parse(domainsValue);
//         } catch (e) {
//           domains = domainsValue.split(",").map(d => d.trim());
//         }
//       }
//       domains = domains.map(d => d.replace(/^https?:\/\//, "").replace(/\/$/, "")).filter(Boolean);
//     }
    
//     if (domains.length > 0) {
//       const domainPattern = new RegExp(`https?:\\/\\/([^\\s/]+)`, "gi");
//       resultContent = resultContent.replace(domainPattern, (match: string, host: string) => {
//         const blocked = domains.some(d => host.endsWith(d));
//         if (blocked) {
//           hasViolation = true;
//           return "[link blocked]";
//         }
//         return match;
//       });
//     }
//   }

//   return {
//     isClean: !hasViolation,
//     hasViolation,
//     censoredContent: hasViolation ? resultContent : undefined
//   };
// }

// export async function handleViolation(userId: string): Promise<void> {
//   // Suspend the user for 24 hours
//   await prisma.user.update({
//     where: { id: userId },
//     data: {
//       suspendedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
//     }
//   });
// }


// 1. CURSOR
// import prisma from "./prisma";
// import { ViolationType } from "@prisma/client";

// interface ContentModerationResult {
//   isClean: boolean;
//   censoredContent?: string;
//   hasViolation: boolean;
// }

// interface ViolationDetails {
//   originalContent: string;
//   detectedWords: string[];
// }

// export async function moderateContent(
//   content: string,
//   _userId: string
// ): Promise<ContentModerationResult> {
//   // Feature toggles
//   const [wordsEnabledSetting, domainsEnabledSetting] = await Promise.all([
//     prisma.siteSetting.findFirst({ where: { key: "censored_words_enabled", category: "moderation" } }),
//     prisma.siteSetting.findFirst({ where: { key: "censored_domains_enabled", category: "moderation" } })
//   ]);

//   const wordsEnabled = wordsEnabledSetting?.value === "true";
//   const domainsEnabled = domainsEnabledSetting?.value === "true";

//   let resultContent = content;
//   let hasViolation = false;

//   // Prohibited words
//   if (wordsEnabled) {
//     const keywordsSetting = await prisma.siteSetting.findFirst({
//       where: { key: "prohibited_keywords", category: "moderation" }
//     });

//     let prohibitedKeywords: string[] = [];
//     if (keywordsSetting?.value) {
//       const raw = keywordsSetting.value.trim();
//       try {
//         if (raw.startsWith("[") || raw.startsWith("{")) {
//           prohibitedKeywords = JSON.parse(raw);
//         } else {
//           prohibitedKeywords = raw.split(",").map(w => w.trim());
//         }
//       } catch {
//         prohibitedKeywords = raw.split(",").map(w => w.trim());
//       }
//       prohibitedKeywords = prohibitedKeywords.filter(Boolean);
//     }

//     if (prohibitedKeywords.length > 0) {
//       const wordPattern = new RegExp(prohibitedKeywords.map(w => `\\b${w}\\b`).join("|"), "gi");
//       if (wordPattern.test(resultContent)) {
//         hasViolation = true;
//         resultContent = resultContent.replace(wordPattern, (m: string) => "*".repeat(m.length));
//       }
//     }
//   }

//   // Censored domains
//   if (domainsEnabled) {
//     const domainsSetting = await prisma.siteSetting.findFirst({
//       where: { key: "censored_domains", category: "moderation" }
//     });

//     let domains: string[] = [];
//     if (domainsSetting?.value) {
//       const raw = domainsSetting.value.trim();
//       try {
//         if (raw.startsWith("[") || raw.startsWith("{")) {
//           domains = JSON.parse(raw);
//         } else {
//           domains = raw.split(",").map(d => d.trim());
//         }
//       } catch {
//         domains = raw.split(",").map(d => d.trim());
//       }
//       domains = domains.map(d => d.replace(/^https?:\/\//, "").replace(/\/$/, "")).filter(Boolean);
//     }

//     if (domains.length > 0) {
//       const domainPattern = new RegExp(`https?:\\/\\/([^\\s/]+)`, "gi");
//       resultContent = resultContent.replace(domainPattern, (match: string, host: string) => {
//         const blocked = domains.some(d => host.endsWith(d));
//         if (blocked) {
//           hasViolation = true;
//           return "[link blocked]";
//         }
//         return match;
//       });
//     }
//   }

//   return {
//     isClean: !hasViolation,
//     hasViolation,
//     censoredContent: hasViolation ? resultContent : undefined
//   };
// }

// export async function handleViolation(userId: string): Promise<void> {
//   // Suspend the user for 24 hours
//   await prisma.user.update({
//     where: { id: userId },
//     data: {
//       suspendedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
//     }
//   });
// }