import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

export default function GuidedTutor({
  open,
  steps = [],
  stepIndex = 0,
  onNext,
  onPrev,
  onClose,
  allowClose = false,
  zIndex = 30000,
}) {
  const [targetRect, setTargetRect] = useState(null);
  const step = steps?.[stepIndex];

  useEffect(() => {
    if (!open) return;

    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    const preventScroll = (e) => {
      e.preventDefault();
    };

    window.addEventListener("wheel", preventScroll, {
      passive: false,
      capture: true,
    });

    window.addEventListener("touchmove", preventScroll, {
      passive: false,
      capture: true,
    });

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;

      window.removeEventListener("wheel", preventScroll, true);
      window.removeEventListener("touchmove", preventScroll, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open || !step) return;

    let timeoutId = null;
    let intervalId = null;
    let cancelled = false;
    let retryCount = 0;

    const updateRect = () => {
      if (cancelled) return;

      if (!step.target) {
        setTargetRect(null);
        return;
      }

      const el = document.querySelector(step.target);

      if (!el) {
        setTargetRect(null);

        if (retryCount < 30) {
          retryCount += 1;
          timeoutId = window.setTimeout(updateRect, 160);
        }

        return;
      }

      el.scrollIntoView({
        block: "center",
        inline: "center",
        behavior: "auto",
      });

      window.clearTimeout(timeoutId);

      timeoutId = window.setTimeout(() => {
        if (cancelled) return;

        const rect = el.getBoundingClientRect();

        setTargetRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        });
      }, 120);
    };

    updateRect();
    intervalId = window.setInterval(updateRect, 550);
    window.addEventListener("resize", updateRect);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
      window.removeEventListener("resize", updateRect);
    };
  }, [open, step?.target, stepIndex]);

  useEffect(() => {
    if (!open) return;

    const onKey = (e) => {
      if (e.key !== "Escape") return;

      e.preventDefault();
      e.stopPropagation();

      if (allowClose) onClose?.();
    };

    window.addEventListener("keydown", onKey, true);

    return () => {
      window.removeEventListener("keydown", onKey, true);
    };
  }, [open, allowClose, onClose]);

  const paddedRect = useMemo(() => {
    if (!targetRect) return null;

    const padding = Number(step?.padding ?? 12);

    const top = Math.max(8, targetRect.top - padding);
    const left = Math.max(8, targetRect.left - padding);
    const right = Math.min(
      window.innerWidth - 8,
      targetRect.left + targetRect.width + padding,
    );
    const bottom = Math.min(
      window.innerHeight - 8,
      targetRect.top + targetRect.height + padding,
    );

    return {
      top,
      left,
      right,
      bottom,
      width: Math.max(0, right - left),
      height: Math.max(0, bottom - top),
    };
  }, [targetRect, step?.padding]);

  const cardStyle = useMemo(() => {
    const base = {
      ...T.cardWrap,
      zIndex: 20,
    };

    if (!paddedRect) {
      return {
        ...base,
        left: "50%",
        top: "50%",
        bottom: "auto",
        transform: "translate(-50%, -50%)",
      };
    }

    const gap = 16;
    const cardWidth = Math.min(430, window.innerWidth - 28);
    const estimatedHeight = 230;

    const centerLeft = paddedRect.left + paddedRect.width / 2 - cardWidth / 2;
    const left = Math.min(
      Math.max(14, centerLeft),
      window.innerWidth - cardWidth - 14,
    );

    const enoughBelow = paddedRect.bottom + gap + estimatedHeight < window.innerHeight;
    const enoughAbove = paddedRect.top - gap - estimatedHeight > 8;

    let top;

    if (enoughBelow) {
      top = paddedRect.bottom + gap;
    } else if (enoughAbove) {
      top = paddedRect.top - gap - estimatedHeight;
    } else {
      const rightSpace = window.innerWidth - paddedRect.right;
      const leftSpace = paddedRect.left;

      if (rightSpace > cardWidth + gap) {
        return {
          ...base,
          left: paddedRect.right + gap,
          top: Math.min(
            Math.max(14, paddedRect.top + paddedRect.height / 2 - estimatedHeight / 2),
            window.innerHeight - estimatedHeight - 14,
          ),
          bottom: "auto",
          transform: "none",
        };
      }

      if (leftSpace > cardWidth + gap) {
        return {
          ...base,
          left: paddedRect.left - cardWidth - gap,
          top: Math.min(
            Math.max(14, paddedRect.top + paddedRect.height / 2 - estimatedHeight / 2),
            window.innerHeight - estimatedHeight - 14,
          ),
          bottom: "auto",
          transform: "none",
        };
      }

      top = Math.min(
        Math.max(14, paddedRect.bottom + gap),
        window.innerHeight - estimatedHeight - 14,
      );
    }

    return {
      ...base,
      left,
      top,
      bottom: "auto",
      transform: "none",
    };
  }, [paddedRect]);

  if (!open || !step) return null;

  const isLast = stepIndex >= steps.length - 1;
  const primaryText = step.actionLabel || (isLast ? "Oke, paham" : "Lanjut");

  const blockClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const content = (
    <div style={{ ...T.layer, zIndex }}>
      {paddedRect ? (
        <>
          <div
            style={{
              ...T.dimBlock,
              top: 0,
              left: 0,
              right: 0,
              height: paddedRect.top,
            }}
            onMouseDown={blockClick}
            onClick={blockClick}
          />

          <div
            style={{
              ...T.dimBlock,
              top: paddedRect.bottom,
              left: 0,
              right: 0,
              bottom: 0,
            }}
            onMouseDown={blockClick}
            onClick={blockClick}
          />

          <div
            style={{
              ...T.dimBlock,
              top: paddedRect.top,
              left: 0,
              width: paddedRect.left,
              height: paddedRect.height,
            }}
            onMouseDown={blockClick}
            onClick={blockClick}
          />

          <div
            style={{
              ...T.dimBlock,
              top: paddedRect.top,
              left: paddedRect.right,
              right: 0,
              height: paddedRect.height,
            }}
            onMouseDown={blockClick}
            onClick={blockClick}
          />

          <div
            style={{
              ...T.spotlight,
              top: paddedRect.top,
              left: paddedRect.left,
              width: paddedRect.width,
              height: paddedRect.height,
            }}
          />
        </>
      ) : (
        <div style={T.fullDim} onMouseDown={blockClick} onClick={blockClick} />
      )}

      <div style={cardStyle}>
        <div
          style={T.card}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={T.badge}>
            Tutorial {stepIndex + 1}/{steps.length}
          </div>

          <div style={T.title}>{step.title}</div>

          <div style={T.body}>{step.body}</div>

          <div style={T.actions}>
            {allowClose ? (
              <button type="button" style={T.ghostBtn} onClick={onClose}>
                Lewati
              </button>
            ) : stepIndex > 0 && onPrev ? (
              <button type="button" style={T.ghostBtn} onClick={onPrev}>
                Kembali
              </button>
            ) : (
              <span />
            )}

            <button
              type="button"
              style={T.primaryBtn}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();

                if (typeof step.onAction === "function") {
                  step.onAction();
                  return;
                }

                onNext?.();
              }}
            >
              {primaryText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}

const T = {
  layer: {
    position: "fixed",
    inset: 0,
    pointerEvents: "none",
  },

  dimBlock: {
    position: "fixed",
    background: "rgba(0,0,0,0.72)",
    backdropFilter: "blur(2px)",
    pointerEvents: "auto",
    zIndex: 1,
  },

  fullDim: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.72)",
    backdropFilter: "blur(2px)",
    pointerEvents: "auto",
    zIndex: 1,
  },

  spotlight: {
    position: "fixed",
    borderRadius: 18,
    border: "2px solid rgba(91,255,215,0.98)",
    boxShadow:
      "0 0 0 1px rgba(91,255,215,0.18), 0 0 28px rgba(91,255,215,0.50)",
    pointerEvents: "none",
    transition: "all 180ms ease",
    background: "rgba(91,255,215,0.035)",
    zIndex: 3,
  },

  cardWrap: {
    position: "fixed",
    width: "min(430px, calc(100vw - 28px))",
    pointerEvents: "auto",
  },

  card: {
    borderRadius: 22,
    border: "1px solid rgba(255,255,255,0.12)",
    background:
      "radial-gradient(700px 360px at 30% 0%, rgba(91,255,215,0.18), rgba(116,86,255,0.16) 38%, rgba(12,14,24,0.98) 100%)",
    color: "rgba(245,248,255,0.96)",
    boxShadow: "0 24px 80px rgba(0,0,0,0.48)",
    padding: 18,
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial",
    pointerEvents: "auto",
  },

  badge: {
    display: "inline-flex",
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid rgba(91,255,215,0.22)",
    background: "rgba(91,255,215,0.10)",
    fontSize: 12,
    fontWeight: 800,
    marginBottom: 12,
  },

  title: {
    fontSize: 20,
    fontWeight: 950,
    lineHeight: 1.25,
    marginBottom: 8,
  },

  body: {
    fontSize: 14,
    lineHeight: 1.65,
    opacity: 0.88,
    whiteSpace: "pre-line",
  },

  actions: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "center",
    marginTop: 18,
  },

  ghostBtn: {
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.04)",
    color: "rgba(245,248,255,0.88)",
    borderRadius: 12,
    padding: "10px 13px",
    fontWeight: 800,
    cursor: "pointer",
  },

  primaryBtn: {
    border: "none",
    background: "linear-gradient(135deg, #7c5cff, #32dbc6)",
    color: "white",
    borderRadius: 12,
    padding: "10px 15px",
    fontWeight: 950,
    cursor: "pointer",
    boxShadow: "0 14px 30px rgba(80,90,255,0.28)",
  },
};
