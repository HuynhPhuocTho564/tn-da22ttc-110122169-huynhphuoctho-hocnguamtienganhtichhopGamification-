#!/bin/bash
# ====================================
# VERIFY DEMO READY - Expert Account
# ====================================
# Check if expert@pronunciation.app is ready for demo
# Run: ./verify_demo_ready.sh

set -e

echo ""
echo "========================================"
echo "  DEMO READINESS CHECK"
echo "========================================"
echo ""

# Check if we're in the right directory
if [ ! -d "prisma" ]; then
    echo "❌ ERROR: Must run from frontend/ directory"
    echo ""
    echo "Run:"
    echo "  cd english_pronunciation_app/frontend"
    echo "  ./verify_demo_ready.sh"
    exit 1
fi

echo "[1/3] Checking database connection..."
if npx prisma db execute --stdin < /dev/null 2>/dev/null; then
    echo "   ✅ OK"
else
    echo "   ❌ FAIL - Database not reachable"
    echo ""
    echo "Fix: docker-compose up -d"
    exit 1
fi
echo ""

echo "[2/3] Verifying expert account unlock status..."
echo ""
npx tsx prisma/verify_expert_unlock.ts || {
    echo ""
    echo "=========================================="
    echo "  ❌ EXPERT ACCOUNT NOT READY!"
    echo "=========================================="
    echo ""
    echo "Run seed script first:"
    echo "  npx tsx prisma/seed_power_user.ts"
    echo ""
    exit 1
}

echo ""
echo "[3/3] Quick stats check..."
echo ""

npx tsx -e "import { PrismaClient } from '@prisma/client'; const prisma = new PrismaClient(); (async () => { const user = await prisma.user.findUnique({ where: { email: 'expert@pronunciation.app' }, select: { username: true, level: true, xp: true, gems: true, streakCount: true } }); if (user) { console.log('   Username:', user.username); console.log('   Level:', user.level); console.log('   XP:', user.xp); console.log('   Gems:', user.gems); console.log('   Streak:', user.streakCount, 'days'); } await prisma.\$disconnect(); })();"

echo ""
echo "========================================"
echo "  ✅ DEMO READY CHECK COMPLETE!"
echo "========================================"
echo ""
echo "Next steps:"
echo "  1. Open http://localhost:3000"
echo "  2. Login: expert@pronunciation.app / Expert1234!"
echo "  3. Verify:"
echo "     - Dashboard shows Level 10, 8500 XP"
echo "     - Learning Map shows ALL 4 topics unlocked"
echo "     - NO lock icons visible"
echo ""
echo "If any issues, run:"
echo "  npx tsx prisma/force_unlock_expert.ts"
echo ""
