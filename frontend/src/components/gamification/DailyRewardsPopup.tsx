"use client";

import React, { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { DAILY_REWARD_GEMS, DAILY_REWARD_CYCLE_DAYS } from "@/lib/gamification/constants";

type DailyReward = {
  day: number;
  gems: number;
  bonus?: string;
  claimed: boolean;
  isToday: boolean;
};

type DailyRewardsPopupProps = {
  currentStreak: number;
  onClaim: (day: number) => void;
  onClose: () => void;
};

/**
 * DailyRewardsPopup - Popup rương quà 7 ngày
 * Hiển thị tự động khi user mở app lần đầu trong ngày
 *
 * Logic:
 * - 7 rương tương ứng 7 ngày trong tuần
 * - Chỉ mở được rương ngày hôm nay
 * - Phần thưởng (diamonds) lấy từ DAILY_REWARD_GEMS constant, không hardcode
 * - Nếu bỏ lỡ 1 ngày, reset về Ngày 1
 */
export default function DailyRewardsPopup({
  currentStreak,
  onClaim,
  onClose,
}: DailyRewardsPopupProps) {
  const [showReward, setShowReward] = useState(false);
  const [claimedReward, setClaimedReward] = useState<DailyReward | null>(null);

  // Tạo danh sách 7 rương quà từ constant
  const rewards: DailyReward[] = DAILY_REWARD_GEMS.map((entry) => ({
    day: entry.day,
    gems: entry.gems,
    bonus: "bonus" in entry ? entry.bonus : undefined,
    claimed: currentStreak >= entry.day,
    isToday: currentStreak === entry.day - 1,
  }));

  const todayReward = rewards.find((r) => r.isToday);

  const handleClaim = () => {
    if (todayReward) {
      setClaimedReward(todayReward);
      setShowReward(true);
      onClaim(todayReward.day);
    }
  };

  const handleCloseReward = () => {
    setShowReward(false);
    onClose();
  };

  return (
    <>
      {/* Main Popup - 7 Rương Quà */}
      <Modal
        isOpen={!showReward}
        onClose={onClose}
        title="🎁 Phần Thưởng Hàng Ngày"
        size="lg"
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center bg-gradient-to-r from-primary-50 to-accent-50 rounded-lg p-6">
            <div className="text-5xl mb-3">🎉</div>
            <h3 className="text-2xl font-bold text-neutral-900 mb-2">
              Chào mừng trở lại!
            </h3>
            <p className="text-neutral-600">
              Nhận quà mỗi ngày để tăng chuỗi streak của bạn
            </p>
          </div>

          {/* Streak Info */}
          <div className="flex items-center justify-center gap-4 bg-white rounded-lg p-4 border border-neutral-200">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600 flex items-center gap-2">
                🔥 {currentStreak}
              </div>
              <div className="text-xs text-neutral-600 mt-1">Chuỗi hiện tại</div>
              <div className="text-xs text-neutral-500">ngày liên tiếp</div>
            </div>
            <div className="w-px h-12 bg-neutral-200"></div>
            <div className="text-center">
              <div className="text-lg font-bold text-neutral-900">
                Ngày {(currentStreak % DAILY_REWARD_CYCLE_DAYS) + 1}/{DAILY_REWARD_CYCLE_DAYS}
              </div>
              <div className="text-xs text-neutral-600 mt-1">Chu kỳ tuần</div>
            </div>
          </div>

          {/* 7 Rương Quà */}
          <div className="grid grid-cols-7 gap-2">
            {rewards.map((reward) => (
              <div
                key={reward.day}
                className={`relative rounded-lg p-3 text-center transition-all ${
                  reward.isToday
                    ? "bg-gradient-to-br from-purple-100 to-indigo-100 border-2 border-purple-400"
                    : reward.claimed
                    ? "bg-success-100 border-2 border-success-400"
                    : "bg-neutral-100 border border-neutral-300 opacity-50"
                }`}
              >
                {/* Day Number */}
                <div className="text-xs font-bold text-neutral-600 mb-2">
                  Ngày {reward.day}
                </div>

                {/* Chest Icon */}
                <div className="text-3xl mb-2">
                  {reward.claimed ? "✅" : reward.isToday ? "🎁" : "📦"}
                </div>

                {/* Reward */}
                <div className="text-xs font-bold text-neutral-900">
                  {reward.gems} 💎
                </div>
                {reward.bonus && (
                  <div className="text-xs text-purple-700 mt-1">
                    {reward.bonus}
                  </div>
                )}

                {/* Today Badge */}
                {reward.isToday && (
                  <div className="absolute -top-2 -right-2 bg-primary-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                    Hôm nay
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Claim Button — subtle hover feedback (H8: tránh animate-bounce distracting) */}
          {todayReward && (
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleClaim}
              className="hover:scale-[1.02] transition-transform"
            >
              🎁 Nhận quà ngày {todayReward.day}
            </Button>
          )}
        </div>
      </Modal>

      {/* Reward Claimed Modal */}
      {showReward && claimedReward && (
        <Modal
          isOpen={showReward}
          onClose={handleCloseReward}
          title="Chúc mừng!"
          size="md"
        >
          <div className="text-center space-y-6">
            {/* Animation */}
            <div className="text-8xl">🎉</div>

            {/* Message */}
            <div>
              <h3 className="text-2xl font-bold text-neutral-900 mb-2">
                Nhận quà thành công!
              </h3>
              <p className="text-neutral-600">
                Bạn đã nhận được phần thưởng ngày {claimedReward.day}
              </p>
            </div>

            {/* Reward Display — diamonds purple gradient (ui-color-harmony: currency palette) */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-8 border-2 border-purple-300">
              <div className="text-6xl mb-4">💎</div>
              <div className="text-4xl font-bold text-purple-700 mb-2">
                +{claimedReward.gems} 💎
              </div>
              {claimedReward.bonus && (
                <div className="text-xl font-bold text-purple-700 mt-3">
                  {claimedReward.bonus}
                </div>
              )}
            </div>

            {/* Streak Info */}
            <div className="bg-primary-50 rounded-lg p-4">
              <p className="text-sm text-neutral-700">
                Chuỗi ngày hiện tại:{" "}
                <span className="font-bold text-primary-600">
                  🔥 {currentStreak + 1}
                </span>
              </p>
              <p className="text-xs text-neutral-600 mt-1">
                Quay lại vào ngày mai để tiếp tục!
              </p>
            </div>

            {/* Close Button */}
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleCloseReward}
            >
              Tuyệt vời!
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
