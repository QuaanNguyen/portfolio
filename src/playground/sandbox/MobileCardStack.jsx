import { Link } from "react-router-dom";
import PrototypeLogo from "../../portfolio/PrototypeLogo";
import { PROJECTS } from "./projects";

export default function MobileCardStack() {
  return (
    <main className="pg-mobile">
      <Link to="/" className="pg-logo-link" aria-label="Back to portfolio">
        <PrototypeLogo compact tone="blue" />
      </Link>
      <h1 className="pg-mobile-title">Playground</h1>
      <ul className="pg-mobile-list">
        {PROJECTS.map((project) => (
          <li key={project.id}>
            <Link to={project.href} className="pg-card pg-mobile-card">
              <h2 className="pg-card-title">{project.title}</h2>
              <p className="pg-card-tagline">{project.tagline}</p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
