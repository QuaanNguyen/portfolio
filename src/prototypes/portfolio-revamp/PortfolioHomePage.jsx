import { useEffect } from "react";
import { MotionConfig } from "motion/react";
import HomeVariants from "./HomeVariants";
import "./portfolio-revamp.css";
import "./portfolio-home.css";

export default function PortfolioHomePage() {
  useEffect(() => {
    document.title = "quan's portfolio";
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <div className="portfolio-prototype variant-c" data-variant="C">
        <div className="prototype-page">
          <HomeVariants intro="immediate" />
        </div>
      </div>
    </MotionConfig>
  );
}
