import { useState } from "react";
import WelcomePrompt from "./WelcomePrompt";
import Menu from "./Menu";

export default function MainView() {
  const [entered, setEntered] = useState(false);

  return (
    <>
      {entered ? <Menu /> : <WelcomePrompt onEnter={() => setEntered(true)} />}
    </>
  );
}
