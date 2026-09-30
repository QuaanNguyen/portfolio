import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { getIdentityPreviewOffsets } from "./identityPreviewMotion.js";

export default function IdentityHoverList({ identities }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [previewVisible, setPreviewVisible] = useState(false);
  const listRef = useRef(null);
  const previewRef = useRef(null);
  const activeIndexRef = useRef(0);
  const previewVisibleRef = useRef(false);

  useEffect(() => {
    const list = listRef.current;
    const preview = previewRef.current;

    if (!list || !preview) return undefined;

    const rows = gsap.utils.toArray(".identity-item", list);
    const images = gsap.utils.toArray(".identity-preview-image", preview);
    const moveX = gsap.quickTo(preview, "x", {
      duration: 0.4,
      ease: "power3.out",
    });
    const moveY = gsap.quickTo(preview, "y", {
      duration: 0.4,
      ease: "power3.out",
    });
    const setImageRail = (index) => {
      const offsets = getIdentityPreviewOffsets(images.length, index);
      gsap.killTweensOf(images);
      gsap.set(images, { yPercent: (imageIndex) => offsets[imageIndex] });
    };
    const hidePreview = () => {
      setImageRail(activeIndexRef.current);
      previewVisibleRef.current = false;
      setPreviewVisible(false);
      gsap.to(preview, {
        scale: 0,
        duration: 0.3,
        ease: "power2.out",
        overwrite: "auto",
      });
    };
    const handleMouseMove = (event) => {
      const halfWidth = preview.offsetWidth / 2;
      const halfHeight = preview.offsetHeight / 2;
      const x = Math.min(window.innerWidth - halfWidth - 16, Math.max(halfWidth + 16, event.clientX));
      const y = Math.min(window.innerHeight - halfHeight - 16, Math.max(halfHeight + 16, event.clientY));
      moveX(x);
      moveY(y);
    };
    const handleVisibilityChange = () => {
      if (document.hidden) hidePreview();
    };
    const transitionToImage = (index) => {
      const previousIndex = activeIndexRef.current;

      if (index === previousIndex) return;

      const offsets = getIdentityPreviewOffsets(images.length, index);

      if (!previewVisibleRef.current) {
        setImageRail(index);
      } else {
        gsap.to(images, {
          yPercent: (imageIndex) => offsets[imageIndex],
          duration: 0.46,
          ease: "power3.out",
          overwrite: "auto",
        });
      }

      activeIndexRef.current = index;
      setActiveIndex(index);
    };
    const rowCleanups = rows.map((row, index) => {
      const handleMouseEnter = () => {
        transitionToImage(index);
        previewVisibleRef.current = true;
        setPreviewVisible(true);
        gsap.to(preview, {
          scale: 1,
          duration: 0.4,
          ease: "power2.out",
          overwrite: "auto",
        });
      };

      row.addEventListener("mouseenter", handleMouseEnter);
      return () => row.removeEventListener("mouseenter", handleMouseEnter);
    });

    gsap.set(preview, {
      scale: 0,
      xPercent: -50,
      yPercent: -50,
      transformOrigin: "center center",
    });
    setImageRail(0);
    list.addEventListener("mousemove", handleMouseMove);
    list.addEventListener("mouseleave", hidePreview);
    window.addEventListener("blur", hidePreview);
    document.addEventListener("scroll", hidePreview, true);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      list.removeEventListener("mousemove", handleMouseMove);
      list.removeEventListener("mouseleave", hidePreview);
      window.removeEventListener("blur", hidePreview);
      document.removeEventListener("scroll", hidePreview, true);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      rowCleanups.forEach((cleanup) => cleanup());
      gsap.killTweensOf(preview);
      gsap.killTweensOf(images);
    };
  }, [identities]);

  return (
    <div className="identity-hover">
      <div className="identity-list" ref={listRef}>
        {identities.map((identity, index) => (
          <div
            className={`identity-item ${previewVisible && activeIndex === index ? "is-active" : ""}`}
            key={identity.label}
          >
            <span className="identity-word">
              {identity.label}
            </span>
            <img
              className="identity-mobile-image"
              src={identity.image}
              alt={identity.alt}
            />
          </div>
        ))}
      </div>

      <div
        aria-hidden={!previewVisible}
        className="identity-preview"
        ref={previewRef}
      >
        {identities.map((identity) => (
          <img
            className="identity-preview-image"
            src={identity.image}
            alt=""
            key={identity.label}
          />
        ))}
      </div>
    </div>
  );
}
