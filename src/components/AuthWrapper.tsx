"use client";

import { useAuthSettings } from "@/hooks/use-auth-settings";

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { maintenanceMode, userRegistration, loading } = useAuthSettings();

  // Hide registration options if in maintenance mode or registration is disabled
  const hideSignUp = maintenanceMode || !userRegistration;

  // Hide any sign-up related elements
  if (hideSignUp) {
    const signUpElements = document.querySelectorAll('[href*="sign-up"], [href*="sign_up"]');
    signUpElements.forEach(element => {
      if (element instanceof HTMLElement) {
        element.style.display = 'none';
      }
    });

    // Also hide any elements with text containing "Sign Up"
    const allElements = document.querySelectorAll('*');
    allElements.forEach(element => {
      if (element instanceof HTMLElement && 
          element.textContent?.includes('Sign Up') &&
          !element.closest('[data-auth-wrapper]')) {
        element.style.display = 'none';
      }
    });
  }

  return <div data-auth-wrapper>{children}</div>;
}