import { Link } from "react-router-dom";
import ComingSoonSection from "./coming-soon/ComingSoonSection";
import { PLAYGROUND_MAINTENANCE } from "./playgroundMaintenance";

export default function PlaygroundSection() {
  if (PLAYGROUND_MAINTENANCE) return <ComingSoonSection />;

  return (
    <section className="playground-section" aria-labelledby="playground-title">
      <h2 id="playground-title">playground</h2>
      <Link to="/playground" className="playground-enter">
        enter site
        <span aria-hidden="true">↗</span>
      </Link>
    </section>
  );
}
