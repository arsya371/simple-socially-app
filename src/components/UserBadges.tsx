"use client";

import { Badge } from "@/components/ui/badge";
import { BadgeCheck, Shield, ShieldCheck } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface UserBadgesProps {
  isVerified: boolean;
  role: "USER" | "MODERATOR" | "ADMIN";
  className?: string;
}

export function UserBadges({ isVerified, role, className = "" }: UserBadgesProps) {
  return (
    <TooltipProvider>
      <div className={`inline-flex gap-1 items-center ${className}`}>
        {isVerified && (
          <Tooltip>
            <TooltipTrigger>
              <BadgeCheck className="h-5 w-5 text-blue-500" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Verified</p>
            </TooltipContent>
          </Tooltip>
        )}
        {role === "MODERATOR" && (
          <Tooltip>
            <TooltipTrigger>
              <Shield className="h-5 w-5 text-red-500" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Moderator</p>
            </TooltipContent>
          </Tooltip>
        )}
        {role === "ADMIN" && (
          <Tooltip>
            <TooltipTrigger>
              <ShieldCheck className="h-5 w-5 text-blue-500" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Administrator</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}


// "use client";

// import { Badge } from "@/components/ui/badge";
// import { CircleCheck, Shield, ShieldCheck } from "lucide-react";
// import {
//   Tooltip,
//   TooltipContent,
//   TooltipProvider,
//   TooltipTrigger,
// } from "@/components/ui/tooltip";
// interface UserBadgesProps {
//   isVerified: boolean;
//   role: "USER" | "MODERATOR" | "ADMIN";
//   className?: string;
// }

// export function UserBadges({ isVerified, role, className = "" }: UserBadgesProps) {
//   return (
//     <TooltipProvider>
//       <div className={`inline-flex gap-1 items-center ${className}`}>
//         {isVerified && (
//           <Tooltip>
//             <TooltipTrigger>
//               <CircleCheck className="h-4 w-4 text-blue-500" />
//             </TooltipTrigger>
//             <TooltipContent>
//               <p>Verified Account</p>
//             </TooltipContent>
//           </Tooltip>
//         )}
//         {role === "MODERATOR" && (
//           <Tooltip>
//             <TooltipTrigger>
//               <Shield className="h-5 w-5 z-10 text-red-500" />
//             </TooltipTrigger>
//             <TooltipContent>
//               <p>Content Moderator</p>
//             </TooltipContent>
//           </Tooltip>
//         )}
//         {role === "ADMIN" && (
//           <Tooltip>
//             <TooltipTrigger>
//               <ShieldCheck className="h-4 w-4 text-blue-500" />
//             </TooltipTrigger>
//             <TooltipContent>
//               <p>Site Administrator</p>
//             </TooltipContent>
//           </Tooltip>
//         )}
//       </div>
//     </TooltipProvider>
//   );
// }