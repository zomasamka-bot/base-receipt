"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { PI_NETWORK_CONFIG, BACKEND_URLS } from "@/lib/system-config";
import { api, setApiAuthToken } from "@/lib/api";
import {
  initializeGlobalPayment,
  checkIncompletePayments,
} from "@/lib/pi-payment";
import { initializeGlobalApproval } from "@/lib/pi-approval";

export type LoginDTO = {
  id: string;
  username: string;
  credits_balance: number;
  terms_accepted: boolean;
  app_id: string;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  price_in_pi: number;
  total_quantity: number;
  is_active: boolean;
  created_at: string;
};

export type ProductList = {
  products: Product[];
};

interface PiAuthContextType {
  isAuthenticated: boolean;
  authMessage: string;
  hasError: boolean;
  piAccessToken: string | null;
  userData: LoginDTO | null;
  reinitialize: () => Promise<void>;
  appId: string | null;
  products: Product[] | null;
}

const PiAuthContext = createContext<PiAuthContextType | undefined>(undefined);

const loadPiSDK = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    if (!PI_NETWORK_CONFIG.SDK_URL) {
      throw new Error("SDK URL is not set");
    }
    script.src = PI_NETWORK_CONFIG.SDK_URL;
    script.async = true;

    script.onload = () => {
      console.log("✅ Pi SDK script loaded successfully");
      resolve();
    };

    script.onerror = () => {
      console.error("❌ Failed to load Pi SDK script");
      reject(new Error("Failed to load Pi SDK script"));
    };

    document.head.appendChild(script);
  });
};

export function PiAuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMessage, setAuthMessage] = useState("Initializing Pi Network...");
  const [hasError, setHasError] = useState(false);
  const [piAccessToken, setPiAccessToken] = useState<string | null>(null);
  const [userData, setUserData] = useState<LoginDTO | null>(null);
  const [appId, setAppId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[] | null>(null);

  const fetchProducts = async (currentAppId: string): Promise<void> => {
    try {
      const { data } = await api.get<ProductList>(
        BACKEND_URLS.GET_PRODUCTS(currentAppId)
      );
      setProducts(data?.products ?? []);
    } catch (e) {
      console.error("Failed to load products:", e);
    }
  };

  const authenticateAndLogin = async (): Promise<void> => {
    try {
      setAuthMessage("Authenticating with Pi Network...");

      const scopes = ["username", "payments"];
      const piAuthResult = await window.Pi.authenticate(
        scopes,
        async (payment) => {
          await new Promise((resolve) => setTimeout(resolve, 2000)); // delay 2 seconds to avoid race condition with authenticate user
          await checkIncompletePayments(payment);
        }
      );

      if (!piAuthResult?.accessToken) {
        throw new Error(
          "authenticate: No access token received from Pi Network"
        );
      }

      setAuthMessage("Logging in to backend...");
      const loginRes = await api.post<LoginDTO>(BACKEND_URLS.LOGIN, {
        pi_auth_token: piAuthResult.accessToken,
      });

      setPiAccessToken(piAuthResult.accessToken);
      setApiAuthToken(piAuthResult.accessToken);
      setUserData(loginRes.data);
      setAppId(loginRes.data.app_id);
    } catch (err) {
      if (err instanceof Error && err.message.includes("authenticate:"))
        throw err;
      throw new Error("login: Backend authentication failed");
    }
  };

  const getErrorMessage = (error: unknown): string => {
    if (!(error instanceof Error))
      return "An unexpected error occurred. Please try again.";

    const errorMessage = error.message;

    if (errorMessage.includes("SDK failed to load"))
      return "Failed to load Pi Network SDK. Please check your internet connection.";

    if (errorMessage.includes("authenticate"))
      return "Pi Network authentication failed. Please try again.";

    if (errorMessage.includes("login"))
      return "Failed to connect to backend server. Please try again later.";

    return `Authentication error: ${errorMessage}`;
  };

  const initializePiAndAuthenticate = async () => {
    try {
      setHasError(false);
      setAuthMessage("Loading Pi Network SDK...");

      if (typeof window.Pi === "undefined") {
        await loadPiSDK();
      }

      if (typeof window.Pi === "undefined") {
        throw new Error(
          "Pi SDK failed to load. Please check your network connection."
        );
      }

      setAuthMessage("Initializing Pi Network...");
      await window.Pi.init({
        version: "2.0",
        sandbox: PI_NETWORK_CONFIG.SANDBOX,
      });

      await authenticateAndLogin();

      setIsAuthenticated(true);
      setHasError(false);

      // Assigns payment function to window.pay
      initializeGlobalPayment();
      
      // Assigns approval function to window.requestApproval
      initializeGlobalApproval();
    } catch (err) {
      console.error("❌ Pi Network initialization failed:", err);
      setHasError(true);
      setAuthMessage(getErrorMessage(err));
    }
  };

  useEffect(() => {
    initializePiAndAuthenticate();
  }, []);

  useEffect(() => {
    if (!appId) return;
    fetchProducts(appId);
  }, [appId]);

  const value: PiAuthContextType = {
    isAuthenticated,
    authMessage,
    hasError,
    piAccessToken,
    userData,
    reinitialize: initializePiAndAuthenticate,
    appId,
    products,
  };

  return (
    <PiAuthContext.Provider value={value}>{children}</PiAuthContext.Provider>
  );
}

/**
 * Hook to access Pi Network authentication state and user data
 *
 * Must be used within a component wrapped by PiAuthProvider.
 * Provides access to authentication state and user data.
 *
 * @returns {PiAuthContextType} Authentication state and methods
 * @throws {Error} If used outside of PiAuthProvider
 *
 * @example
 * const { piAccessToken, userData, isAuthenticated, reinitialize } = usePiAuth();
 */
export function usePiAuth() {
  const context = useContext(PiAuthContext);
  if (context === undefined) {
    throw new Error("usePiAuth must be used within a PiAuthProvider");
  }
  return context;
}
