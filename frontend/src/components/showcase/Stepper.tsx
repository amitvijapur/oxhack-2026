"use client";

import { Pause } from "lucide-react";
import { STEPS } from "./Panel";

/** Four steps down the right edge: where you are in data → land → people → decision. */
export function Stepper({ screen, onGo, tour, onStopTour }: {
  screen: number;
  onGo: (screen: number) => void;
  tour: boolean;
  onStopTour: () => void;
}) {
  return (
    <nav className="stepper" aria-label="Steps">
      <ol>
        {[1, 2, 3, 4].map((step) => (
          <li key={step}>
            <button
              type="button"
              aria-current={screen === step ? "step" : undefined}
              data-done={screen > step || undefined}
              onClick={() => onGo(step)}
            >
              <span className="stepper-label">{STEPS[step]}</span>
              <span className="stepper-dot" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ol>
      {tour ? (
        <button type="button" className="tour-stop" onClick={onStopTour}>
          <Pause className="size-3.5" aria-hidden="true" /> Stop tour
        </button>
      ) : null}
    </nav>
  );
}
