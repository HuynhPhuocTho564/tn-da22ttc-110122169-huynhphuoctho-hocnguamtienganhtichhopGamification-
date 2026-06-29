"use client";

import { useState } from "react";
import type { TopicMastery, MasteryNode } from "@/lib/gamification/mastery";

interface MasteryTreeProps {
  /** Topic mastery data from /api/mastery */
  topics: TopicMastery[];
}

/** Tailwind classes per mastery tier — node (circle) + bar (progress) */
const TIER_STYLES: Record<MasteryNode["tier"], { node: string; bar: string }> = {
  gold:   { node: "bg-amber-400 text-amber-900", bar: "bg-amber-400" },
  silver: { node: "bg-blue-400 text-blue-900",   bar: "bg-blue-400" },
  bronze: { node: "bg-orange-300 text-orange-800", bar: "bg-orange-300" },
  none:   { node: "bg-neutral-200 text-neutral-500", bar: "bg-neutral-200" },
};

/**
 * MasteryTree — Visual skill tree showing mastery % per topic/sound group.
 *
 * Each topic is an expandable section with sound group nodes.
 * Node color indicates mastery tier (gray → orange → blue → gold).
 */
export default function MasteryTree({ topics }: MasteryTreeProps) {
  const [expandedTopic, setExpandedTopic] = useState<string | null>(
    topics.length > 0 ? topics[0].topicId : null,
  );

  if (topics.length === 0) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-neutral-500">Chưa có dữ liệu thành thạo.</p>
      </div>
    );
  }

  // Calculate overall mastery
  const overallMastery = Math.round(
    topics.reduce((sum, t) => sum + t.overallPercentage, 0) / topics.length,
  );

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-baseline justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-500">
          Cây kỹ năng
        </h3>
        <span className="text-xs font-semibold text-neutral-600">
          Tổng: {overallMastery}%
        </span>
      </div>

      {/* Topic nodes */}
      <div className="space-y-3">
        {topics.map((topic) => {
          const isExpanded = expandedTopic === topic.topicId;
          const pct = topic.overallPercentage;
          return (
            <div key={topic.topicId}>
              <button
                onClick={() => setExpandedTopic(isExpanded ? null : topic.topicId)}
                className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                aria-expanded={isExpanded}
              >
                {/* Topic indicator */}
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  pct >= 50 ? "bg-blue-100 text-blue-700" : "bg-neutral-100 text-neutral-600"
                }`}>
                  CĐ{topic.orderIndex}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-neutral-800 truncate">
                    {topic.topicName}
                  </p>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-neutral-200">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        pct >= 50 ? "bg-blue-500" : "bg-neutral-400"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <span className="shrink-0 text-xs font-bold text-neutral-600">{pct}%</span>
              </button>

              {/* Sound group details (expandable) */}
              {isExpanded && topic.soundGroups.length > 0 && (
                <div className="ml-6 mt-1 space-y-2 border-l-2 border-neutral-200 pl-4">
                  {topic.soundGroups.map((sg) => (
                    <div key={sg.soundGroupId} className="flex items-center gap-2 py-1">
                      <div className={`h-3 w-3 rounded-full ${TIER_STYLES[sg.tier].node}`} />
                      <span className="flex-1 text-xs text-neutral-700 truncate">
                        {sg.name}
                      </span>
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-neutral-200">
                        <div
                          className={`h-full rounded-full ${TIER_STYLES[sg.tier].bar}`}
                          style={{ width: `${sg.percentage}%` }}
                        />
                      </div>
                      <span className="w-8 text-right text-[10px] font-medium text-neutral-500">
                        {sg.percentage}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
