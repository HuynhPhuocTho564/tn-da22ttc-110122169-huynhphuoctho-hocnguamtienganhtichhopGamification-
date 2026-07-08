"use client";

import { useState } from "react";
import { Coins, Sparkles } from "lucide-react";
import SpinWheelPrizeConfig, { SpinWheelStatTile } from "./SpinWheelPrizeConfig";
import SpinWheelLogViewer, { type SpinWheelLog } from "./SpinWheelLogViewer";

// Re-export so consumers can `import { SpinWheelLog } from "./SpinWheelManagement"`
// without needing to know which sub-component owns the type.
export type { SpinWheelLog };

/**
 * Spin Wheel management container.
 *
 * Composes 2 cohesive sub-components:
 * - `SpinWheelPrizeConfig` — CRUD for prize cells (loads its own state)
 * - `SpinWheelLogViewer` — read-only log table (props only)
 *
 * This container only owns aggregate stats derived from both children.
 * Keeping each concern in its own file makes each piece independently
 * testable and replaceable (per cohesion-based boundaries in
 * maintainable-code skill §J).
 */

type SpinWheelManagementProps = {
  logs: SpinWheelLog[];
};

export default function SpinWheelManagement({ logs }: SpinWheelManagementProps) {
  const [prizeCount, setPrizeCount] = useState(0);

  const totalSpins = logs.length;
  const totalGemsAwarded = logs.reduce((sum, log) => sum + log.prizeValue, 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <SpinWheelStatTile icon={Sparkles} label="Tổng lượt quay" value={totalSpins} tone="blue" />
        <SpinWheelStatTile icon={Coins} label="Tổng Gems phát" value={totalGemsAwarded} tone="emerald" />
        <SpinWheelStatTile icon={Sparkles} label="Số ô prize" value={prizeCount} tone="purple" />
      </div>

      <SpinWheelPrizeConfig onPrizeCountChange={setPrizeCount} />
      <SpinWheelLogViewer logs={logs} />
    </div>
  );
}
