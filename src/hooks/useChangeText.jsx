import { useState, useCallback } from "react";

export default function useChangeText() {
  const [welcomeText, setWelcomeText] = useState("Welcome to Quan's Bistro");

  return { welcomeText};
}
