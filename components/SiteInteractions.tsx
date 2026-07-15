"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function SiteInteractions() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;


    if (pathname === "/") {
      const lastVisit = sessionStorage.getItem("landing_page_visit");
      if (lastVisit === "other") {
        sessionStorage.setItem("landing_page_visit", "home");
        window.location.reload();
        return;
      } else {
        sessionStorage.setItem("landing_page_visit", "home");
      }
    } else {
      sessionStorage.setItem("landing_page_visit", "other");
    }

    initHeroReveal();
    initMobileMenu();
    initFaqAccordion();
    initSmoothScroll();
    initStatCounters();
    initContactForm();
    initAuthStatus();
  }, [pathname]);

  return null;
}

function initHeroReveal() {
  const heroTitle = document.querySelector<HTMLElement>(".home-hero-text");
  if (heroTitle) {
    heroTitle.style.transition =
      "transform 1.2s cubic-bezier(0.19, 1, 0.22, 1), opacity 1.2s cubic-bezier(0.19, 1, 0.22, 1)";
    setTimeout(() => {
      heroTitle.style.transform = "translate3d(0, 0px, 0)";
    }, 50);
  }

  const heroBtn = document.querySelector<HTMLElement>(".hero-button");
  if (heroBtn) {
    heroBtn.style.transition =
      "transform 1.2s cubic-bezier(0.19, 1, 0.22, 1), opacity 1.2s cubic-bezier(0.19, 1, 0.22, 1)";
    setTimeout(() => {
      heroBtn.style.transform = "translate3d(0, 0, 0) scale3d(1, 1, 1)";
      heroBtn.style.opacity = "1";
    }, 150);
  }

  const heroBottom = document.querySelector<HTMLElement>(".hero-bottom-content");
  if (heroBottom) {
    heroBottom.style.transition =
      "transform 1.2s cubic-bezier(0.19, 1, 0.22, 1), opacity 1.2s cubic-bezier(0.19, 1, 0.22, 1)";
    setTimeout(() => {
      heroBottom.style.transform = "translate3d(0, 0, 0)";
      heroBottom.style.opacity = "1";
    }, 300);
  }

  const heroBall = document.querySelector<HTMLElement>(".hero-ball");
  if (heroBall) {
    heroBall.style.transition =
      "transform 1.2s cubic-bezier(0.19, 1, 0.22, 1), opacity 1.2s cubic-bezier(0.19, 1, 0.22, 1)";
    setTimeout(() => {
      heroBall.style.transform = "translate3d(0, 0, 0) scale3d(1, 1, 1)";
    }, 200);
  }

  const overlay = document.querySelector<HTMLElement>(".black-overlay");
  if (overlay) {
    overlay.style.transition = "opacity 0.8s ease";
    setTimeout(() => {
      overlay.style.opacity = "0";
      setTimeout(() => {
        overlay.style.display = "none";
      }, 800);
    }, 50);
  }
}

function initMobileMenu() {
  const openMenuBtn = document.querySelector<HTMLElement>(".open-menu");
  const closeMenuBtn = document.querySelector<HTMLElement>(".close-menu");
  const adaptationMenu =
    document.querySelector<HTMLElement>(".nav-adaptation-menu");
  const dropdownMenu =
    document.querySelector<HTMLElement>(".hamburger-menu-dropdown");
  const mobileMenuQuery = window.matchMedia("(max-width: 767px)");

  if (openMenuBtn) {
    openMenuBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      if (mobileMenuQuery.matches) {
        if (adaptationMenu) {
          adaptationMenu.style.display = "flex";
          adaptationMenu.style.opacity = "0";
          adaptationMenu.style.transition = "opacity 0.3s ease";
          adaptationMenu.offsetHeight;
          adaptationMenu.style.opacity = "1";
        }
      } else {
        if (dropdownMenu) {
          const isDropdownOpen = dropdownMenu.classList.contains("show");
          if (isDropdownOpen) {
            dropdownMenu.classList.remove("show");
            openMenuBtn.classList.remove("open");
          } else {
            dropdownMenu.classList.add("show");
            openMenuBtn.classList.add("open");
          }
        }
      }
    });
  }

  // Close desktop dropdown on click outside
  document.addEventListener("click", (event) => {
    if (dropdownMenu && !dropdownMenu.contains(event.target as Node) && event.target !== openMenuBtn) {
      dropdownMenu.classList.remove("show");
      if (openMenuBtn) openMenuBtn.classList.remove("open");
    }
  });

  const closeMenu = () => {
    if (adaptationMenu) {
      adaptationMenu.style.opacity = "0";
      const onTransitionEnd = () => {
        adaptationMenu.style.display = "none";
        adaptationMenu.removeEventListener("transitionend", onTransitionEnd);
      };
      adaptationMenu.addEventListener("transitionend", onTransitionEnd);
    }
  };

  if (closeMenuBtn) {
    closeMenuBtn.addEventListener("click", closeMenu);
  }

  // Close the mobile menu automatically when any link inside it is clicked
  if (adaptationMenu) {
    const links = adaptationMenu.querySelectorAll("a");
    links.forEach((link) => {
      link.addEventListener("click", closeMenu);
    });
  }

  // Close the desktop dropdown automatically when any link inside it is clicked
  if (dropdownMenu) {
    const links = dropdownMenu.querySelectorAll("a");
    links.forEach((link) => {
      link.addEventListener("click", () => {
        dropdownMenu.classList.remove("show");
        if (openMenuBtn) openMenuBtn.classList.remove("open");
      });
    });
  }

  mobileMenuQuery.addEventListener("change", (event) => {
    if (!event.matches) {
      if (adaptationMenu) {
        adaptationMenu.style.opacity = "0";
        adaptationMenu.style.display = "none";
      }
    } else {
      if (dropdownMenu) {
        dropdownMenu.classList.remove("show");
        if (openMenuBtn) openMenuBtn.classList.remove("open");
      }
    }
  });
}

function initFaqAccordion() {
  const faqItems = document.querySelectorAll<HTMLElement>(".faq-item");

  faqItems.forEach((item) => {
    const question = item.querySelector<HTMLElement>(".faq-question");
    const answer = item.querySelector<HTMLElement>(".faq-answer");
    const icon = question?.querySelector<HTMLElement>("img");

    if (!question || !answer) return;

    answer.style.maxHeight = "0px";
    answer.style.opacity = "0";
    answer.style.overflow = "hidden";
    answer.style.transition =
      "max-height 0.3s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.3s ease, padding 0.3s ease";

    if (icon) {
      icon.style.transition = "transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)";
    }

    const answerText = answer.querySelector<HTMLElement>(".faq-answer-text");
    if (answerText) {
      answerText.style.marginTop = "0px";
      answerText.style.marginBottom = "0px";
      answerText.style.transition = "margin 0.3s cubic-bezier(0.25, 1, 0.5, 1)";
    }

    question.addEventListener("click", () => {
      const isOpen = item.classList.contains("active");

      faqItems.forEach((otherItem) => {
        if (otherItem !== item && otherItem.classList.contains("active")) {
          otherItem.classList.remove("active");
          const otherAnswer =
            otherItem.querySelector<HTMLElement>(".faq-answer");
          const otherIcon =
            otherItem.querySelector<HTMLElement>(".faq-question img");
          const otherText =
            otherAnswer?.querySelector<HTMLElement>(".faq-answer-text");
          if (otherAnswer) {
            otherAnswer.style.maxHeight = "0px";
            otherAnswer.style.opacity = "0";
          }
          if (otherIcon) otherIcon.style.transform = "none";
          if (otherText) {
            otherText.style.marginTop = "0px";
            otherText.style.marginBottom = "0px";
          }
        }
      });

      if (isOpen) {
        item.classList.remove("active");
        answer.style.maxHeight = "0px";
        answer.style.opacity = "0";
        if (icon) icon.style.transform = "none";
        if (answerText) {
          answerText.style.marginTop = "0px";
          answerText.style.marginBottom = "0px";
        }
      } else {
        item.classList.add("active");
        if (answerText) {
          answerText.style.marginTop = "24px";
          answerText.style.marginBottom = "24px";
          answer.style.maxHeight = `${answerText.offsetHeight + 48}px`;
        } else {
          answer.style.maxHeight = `${answer.scrollHeight}px`;
        }
        answer.style.opacity = "1";
        if (icon) icon.style.transform = "rotate(45deg)";
      }
    });
  });
}

function initSmoothScroll() {
  const navLinks = document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]');
  navLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("href");
      if (targetId === "#" || !targetId) return;
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        event.preventDefault();
        targetElement.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    });
  });
}

function initStatCounters() {
  const startCounters = () => {
    const stats = document.querySelectorAll<HTMLElement>(
      ".highlights-block .large-heding",
    );
    stats.forEach((stat) => {
      const originalText = stat.textContent?.trim() ?? "";
      const numbers = originalText.match(/\d+/g);
      if (!numbers) return;

      const duration = 1500;
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = progress * (2 - progress);

        let newText = originalText;
        numbers.forEach((numStr) => {
          const targetNum = parseInt(numStr, 10);
          const currentNum = Math.floor(ease * targetNum);
          newText = newText.replace(numStr, String(currentNum));
        });

        stat.textContent = newText;

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          stat.textContent = originalText;
        }
      };

      requestAnimationFrame(animate);
    });
  };

  const highlightsSection = document.getElementById("highlights");
  if (highlightsSection) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            startCounters();
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 },
    );
    observer.observe(highlightsSection);
  }
}

function initContactForm() {
  const form = document.getElementById("email-form") as HTMLFormElement | null;
  if (!form) return;

  const successMessage = document.querySelector<HTMLElement>(".success-message");
  const errorMessage = document.querySelector<HTMLElement>(".error-message");
  const submitBtn = form.querySelector<HTMLInputElement>('input[type="submit"]');
  if (!submitBtn) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const originalBtnText = submitBtn.value;
    const waitText = submitBtn.getAttribute("data-wait") || "Please wait...";
    submitBtn.value = waitText;
    submitBtn.disabled = true;

    if (successMessage) successMessage.style.display = "none";
    if (errorMessage) errorMessage.style.display = "none";

    const formData = new FormData(form);

    try {
      const response = await fetch("https://formspree.io/f/YOUR_FORM_ID", {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
        },
      });

      if (response.ok) {
        form.style.display = "none";
        if (successMessage) {
          successMessage.style.display = "block";
          successMessage.focus();
        }
      } else {
        throw new Error("Form submission failed");
      }
    } catch (err) {
      console.error(err);
      if (errorMessage) {
        errorMessage.style.display = "block";
        errorMessage.focus();
      }
      submitBtn.value = originalBtnText;
      submitBtn.disabled = false;
    }
  });
}

function initAuthStatus() {
  const isRegistered = localStorage.getItem("user_registration");
  if (isRegistered) {
    try {
      // Find all registration and login buttons & update text
      const regButtons = document.querySelectorAll("a[href='/register'], a[href='/login']");
      regButtons.forEach((btn: any) => {
        btn.setAttribute("href", "/dashboard");
      });
      regButtons.forEach((btn: any) => {
        const textWrapper = btn.querySelector(".regular-xl, .medium-m-uppercase, .regular-s-uppercase");
        if (textWrapper) {
          const txt = textWrapper.textContent.trim().toUpperCase();
          if (txt === "REGISTER NOW" || txt === "REGISTER" || txt === "LOGIN SPACE" || txt === "LOGIN NOW" || txt === "ACCESS SPACE") {
            textWrapper.textContent = "MY ACCOUNT";
          }
        } else {
          const txt = btn.textContent.trim().toUpperCase();
          if (txt === "REGISTER NOW" || txt === "REGISTER" || txt === "LOGIN SPACE" || txt === "LOGIN NOW" || txt === "ACCESS SPACE") {
            btn.textContent = "My Account";
          }
        }
      });
      
      const textElements = document.querySelectorAll(".regular-xl, .medium-m-uppercase");
      textElements.forEach((el: any) => {
        const txt = el.textContent.trim().toUpperCase();
        if (txt === "REGISTER NOW" || txt === "LOGIN SPACE" || txt === "LOGIN NOW" || txt === "ACCESS SPACE") {
          el.textContent = "MY ACCOUNT";
        }
      });
    } catch (e) {
      console.error(e);
    }
  }
}
