import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";

type AuthModalTab = "login" | "register";

type AuthModalContextValue = {
  isOpen: boolean;
  tab: AuthModalTab;
  sharedPhone: string;
  openAuthModal: (tab?: AuthModalTab) => void;
  closeAuthModal: () => void;
  switchTab: (tab: AuthModalTab) => void;
  setSharedPhone: (phone: string) => void;
};

const AuthModalContext = createContext<AuthModalContextValue | undefined>(undefined);

export const AuthModalProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<AuthModalTab>("login");
  const [sharedPhone, setSharedPhone] = useState("");

  const openAuthModal = useCallback((t: AuthModalTab = "login") => {
    setTab(t);
    setIsOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  const switchTab = useCallback((t: AuthModalTab) => setTab(t), []);

  const value = useMemo<AuthModalContextValue>(() => ({
    isOpen, tab, sharedPhone, openAuthModal, closeAuthModal, switchTab, setSharedPhone
  }), [isOpen, tab, sharedPhone, openAuthModal, closeAuthModal, switchTab]);

  return <AuthModalContext.Provider value={value}>{children}</AuthModalContext.Provider>;
};

export const useAuthModal = () => {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error("useAuthModal 必须在 AuthModalProvider 内部使用");
  return ctx;
};