#!/bin/bash

# Full seed script - Run all seeds in correct order
# Usage: ./seed_full.sh

set -e  # Exit on error

echo "🌱 Starting full database seed..."
echo ""

echo "📚 Step 1/5: Seeding lessons..."
npm run db:seed:lessons
echo ""

echo "🎵 Step 2/5: Downloading audio files..."
npx tsx prisma/seed_audio_local.ts
echo ""

echo "🔊 Step 3/5: Generating audio metadata..."
npx tsx prisma/seed_listen_choose_audio.ts
echo ""

echo "👥 Step 4/5: Creating demo users..."
npx tsx prisma/seed_learner_profiles.ts
echo ""

echo "⭐ Step 5/5: Creating power user..."
npx tsx prisma/seed_power_user.ts
echo ""

echo "✅ Full seed complete!"
echo ""
echo "🔑 Login credentials:"
echo "   Power User: expert@pronunciation.app / Expert1234!"
echo "   Demo User:  minh@gmail.com / abc@123456"
echo ""
echo "🚀 Start dev server: npm run dev"
