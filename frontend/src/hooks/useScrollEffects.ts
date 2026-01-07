import { useEffect } from "react";

const SCROLL_EFFECT_CLASS = "scroll-fx";

export const useScrollEffects = () => {
  useEffect(() => {
    // Advanced: Intersection Observer for fade/appear
    const elements = Array.from(document.querySelectorAll(`.${SCROLL_EFFECT_CLASS}`));
    const observer = new window.IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          const el = entry.target as HTMLElement;
          // Parallax effect (still use scrollY for smoothness)
          const scrollY = window.scrollY;
          el.style.transform = `translateY(${scrollY * (0.03 + i * 0.01)}px)`;
          // Advanced fade/appear effect
          if (entry.isIntersecting) {
            el.style.opacity = "1";
            el.style.pointerEvents = "auto";
            el.style.filter = "blur(0px)";
            el.style.transition = "opacity 0.7s cubic-bezier(0.4,0,0.2,1), filter 0.7s cubic-bezier(0.4,0,0.2,1), transform 0.7s cubic-bezier(0.4,0,0.2,1)";
          } else {
            el.style.opacity = "0";
            el.style.pointerEvents = "none";
            el.style.filter = "blur(16px)";
            el.style.transition = "opacity 0.7s cubic-bezier(0.4,0,0.2,1), filter 0.7s cubic-bezier(0.4,0,0.2,1), transform 0.7s cubic-bezier(0.4,0,0.2,1)";
          }
        });
      },
      {
        threshold: [0, 0.2, 0.5, 0.8, 1],
        rootMargin: "-10% 0px -10% 0px"
      }
    );
    elements.forEach((el) => {
      el.style.opacity = "0";
      el.style.filter = "blur(16px)";
      el.style.pointerEvents = "none";
      observer.observe(el);
    });
    // Parallax on scroll
    const handleScroll = () => {
      elements.forEach((el, i) => {
        el.style.transform = `translateY(${window.scrollY * (0.03 + i * 0.01)}px)`;
      });
    };
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      observer.disconnect();
    };
  }, []);
};
