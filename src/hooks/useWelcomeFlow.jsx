import { useState, useCallback, use } from "react";

export default function useWelcomeFlow() {
  const [welcomeText, setWelcomeText] = useState("Welcome to Quan's Bistro");
  const [showMenu, setShowMenu] = useState(false);

  const proceedToMenu = useCallback(() => {
    setShowMenu(true);
  }, []);

  return { welcomeText, showMenu, proceedToMenu };
}
