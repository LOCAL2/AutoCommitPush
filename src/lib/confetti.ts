import confetti from "canvas-confetti";

/**
 * Trigger a celebratory confetti burst across the screen
 */
export function fireConfettiCelebration() {
  // Fire a single clean burst of confetti
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.65 },
    zIndex: 9999,
  });
}
