"use client";

import { Loader2, Sparkles } from "lucide-react";
import { type ButtonHTMLAttributes, type CSSProperties, type MouseEvent, type ReactNode, useEffect, useState } from "react";
import { createPortal, useFormStatus } from "react-dom";

type ThanksActionButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  active: boolean;
  children: ReactNode;
  pendingText?: string;
};

type SparkleStyle = CSSProperties & {
  "--thanks-x": string;
  "--thanks-y": string;
  "--thanks-rotate": string;
  "--thanks-delay": string;
};

type BurstPosition = {
  sequence: number;
  height: number;
  left: number;
  top: number;
  width: number;
};

const sparkleParticles = [
  { x: "-42px", y: "-20px", rotate: "-24deg", delay: "0ms", size: 17, color: "text-blush" },
  { x: "-18px", y: "-35px", rotate: "18deg", delay: "30ms", size: 13, color: "text-blush/75" },
  { x: "12px", y: "-38px", rotate: "42deg", delay: "15ms", size: 18, color: "text-blush" },
  { x: "42px", y: "-17px", rotate: "72deg", delay: "55ms", size: 14, color: "text-blush/70" },
  { x: "44px", y: "16px", rotate: "105deg", delay: "20ms", size: 19, color: "text-blush" },
  { x: "17px", y: "34px", rotate: "138deg", delay: "65ms", size: 13, color: "text-blush/75" },
  { x: "-17px", y: "35px", rotate: "176deg", delay: "35ms", size: 17, color: "text-blush" },
  { x: "-43px", y: "15px", rotate: "215deg", delay: "70ms", size: 14, color: "text-blush/70" },
] as const;

function ThanksSparkleBurst({ position }: { position: BurstPosition }) {
  return (
    <span
      aria-hidden="true"
      className="thanks-sparkle-layer"
      style={{ height: position.height, left: position.left, top: position.top, width: position.width }}
    >
      <span className="thanks-sparkle-ring" />
      {sparkleParticles.map((particle, index) => (
        <span
          key={`${particle.x}-${particle.y}`}
          className={`thanks-sparkle-particle ${particle.color}`}
          style={
            {
              "--thanks-x": particle.x,
              "--thanks-y": particle.y,
              "--thanks-rotate": particle.rotate,
              "--thanks-delay": particle.delay,
            } as SparkleStyle
          }
        >
          <Sparkles size={particle.size} strokeWidth={2.1} fill={index % 3 === 0 ? "currentColor" : "none"} />
        </span>
      ))}
    </span>
  );
}

export function ThanksActionButton({
  active,
  children,
  className = "",
  disabled = false,
  onClick,
  pendingText = "送信中...",
  type = "button",
  ...buttonProps
}: ThanksActionButtonProps) {
  const { pending } = useFormStatus();
  const [burstPosition, setBurstPosition] = useState<BurstPosition | null>(null);
  const isDisabled = disabled || pending;

  useEffect(() => {
    if (burstPosition == null) return;

    const timeout = window.setTimeout(() => setBurstPosition(null), 700);
    return () => window.clearTimeout(timeout);
  }, [burstPosition]);

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (!active && !isDisabled) {
      const bounds = event.currentTarget.getBoundingClientRect();

      setBurstPosition((current) => ({
        sequence: (current?.sequence ?? 0) + 1,
        height: bounds.height,
        left: bounds.left,
        top: bounds.top,
        width: bounds.width,
      }));
    }

    onClick?.(event);
  }

  return (
    <>
      <button
        {...buttonProps}
        type={type}
        disabled={isDisabled}
        aria-pressed={active}
        aria-busy={pending}
        className={
          className +
          " transition active:scale-[0.98] disabled:active:scale-100 disabled:cursor-not-allowed " +
          (pending ? "pointer-events-none opacity-70" : "")
        }
        onClick={handleClick}
      >
        {pending ? (
          <>
            <Loader2 aria-hidden="true" size={16} className="animate-spin" />
            {pendingText}
          </>
        ) : (
          children
        )}
      </button>
      {burstPosition
        ? createPortal(<ThanksSparkleBurst key={burstPosition.sequence} position={burstPosition} />, document.body)
        : null}
    </>
  );
}
