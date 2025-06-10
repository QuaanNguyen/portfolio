import { useState, useCallback } from "react";

export default function useChangeText() {
  const [welcomeText, setWelcomeText] = useState("Welcome to Quan's Bistro");
  const [showButton, setShowButton] = useState(false);

  const tableText = useCallback(() => {
    setWelcomeText("table for one?");
    setShowButton(true);
  }, []);
  return { welcomeText, tableText, showButton };
}
