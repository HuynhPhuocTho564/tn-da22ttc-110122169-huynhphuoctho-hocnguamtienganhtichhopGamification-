# 🌱 Seed Scripts Guide

## 📚 Available Seed Scripts

| Script | Purpose | Runtime | Idempotent |
|--------|---------|---------|------------|
| `seed_lessons.ts` | 30 sound groups + 112 exercises + content | ~10s | ✅ Yes (upsert by id) |
| `seed_audio_local.ts` | Download 197 mp3 files to `/public/audio/` | ~30s | ✅ Yes (skip existing) |
| `seed_listen_choose_audio.ts` | Generate contrast audio for listen_choose | ~5s | ✅ Yes |
| `seed_learner_profiles.ts` | 6 beginner users with progress | ~5s | ✅ Yes |
| `seed_power_user.ts` | 1 expert user (100% complete) | ~15s | ✅ Yes |

---

## 🚀 Quick Start (Full Setup)

### Order matters! Run in sequence:

```bash
cd english_pronunciation_app/frontend

# 1. Database schema
npx prisma migrate deploy

# 2. Content (required)
npm run db:seed:lessons

# 3. Audio files (required for offline-first)
npx tsx prisma/seed_audio_local.ts

# 4. Audio metadata
npx tsx prisma/seed_listen_choose_audio.ts

# 5. Demo users (optional - for leaderboard demo)
npx tsx prisma/seed_learner_profiles.ts

# 6. Power user (recommended - for full feature demo)
npx tsx prisma/seed_power_user.ts
```

**Total time**: ~1 minute

---

## 👤 Demo Accounts

### Beginner Users (seed_learner_profiles.ts)
```
minh@gmail.com      / abc@123456  | Level 3  | 20% complete
lan@gmail.com       / abc@123456  | Level 2  | 15% complete
hoang@gmail.com     / abc@123456  | Level 4  | 30% complete
mai@gmail.com       / abc@123456  | Level 2  | 10% complete
duc@gmail.com       / abc@123456  | Level 5  | 40% complete
anh@gmail.com       / abc@123456  | Level 1  | 5% complete
```

### Power User (seed_power_user.ts) ⭐ **RECOMMENDED FOR DEMO**
```
expert@pronunciation.app / Expert1234!
```

**Features**:
- ✅ **100% completion** (112/112 exercises)
- ✅ **All 4 topics unlocked** (CD1→CD2→CD3→CD4)
- ✅ **Level ~10** with 8500 XP
- ✅ **150 gems** for shopping
- ✅ **45-day streak**
- ✅ **Top leaderboard** (tuần + tháng)
- ✅ **All learning maps completed**
- ✅ **Realistic score distribution** (70-98)

---

## 📋 Detailed Script Documentation

### 1. `seed_lessons.ts`

**What it does**:
- Creates 4 Topics (Vowels, Consonants, Minimal Pairs, Stress)
- Creates 30 Sound Groups
- Creates 112 Exercises (shell structure)
- Creates 433 QuestionBankItems
- Creates content for 30/30 sound groups

**Output**:
```
✓ 4 topics
✓ 30 sound groups
✓ 25 learning maps
✓ 112 exercises
✓ 7 question types
✓ 44 phonemes
✓ 433 question bank items
✓ 30/30 groups with content
```

**Run**: `npm run db:seed:lessons`

---

### 2. `seed_audio_local.ts`

**What it does**:
- Fetches mp3 files from Free Dictionary API
- Downloads to `public/audio/`
- Updates database `sourceType: 'FREE_API'` → `'LOCAL'`
- Skips already downloaded files

**Output**:
```
✓ 197 audio files downloaded
✓ All WordItems updated to LOCAL
✓ All MinimalPairs updated to LOCAL
```

**Run**: `npx tsx prisma/seed_audio_local.ts`

**Note**: Requires internet connection on first run. After that, audio files persist in `public/audio/`.

---

### 3. `seed_listen_choose_audio.ts`

**What it does**:
- Generates audio metadata for `listen_choose` questions
- Links questions to contrast audio files

**Run**: `npx tsx prisma/seed_listen_choose_audio.ts`

---

### 4. `seed_learner_profiles.ts`

**What it does**:
- Creates 6 beginner users
- Generates exercise attempts (random scores 60-95)
- Creates leaderboard entries (tuần + tháng)
- Creates daily activity

**Use case**: Demo leaderboard, admin dashboard with realistic data

**Run**: `npx tsx prisma/seed_learner_profiles.ts`

---

### 5. `seed_power_user.ts` ⭐

**What it does**:
- Creates 1 expert user (`expert@pronunciation.app`)
- **Completes ALL 112 exercises** with realistic scores
- Completes ALL learning maps (100% progress)
- Creates leaderboard entries (top position)
- Creates 7-day daily activity

**Use case**: 
- **Demo to advisors/committee**: Show complete system with all features unlocked
- Test admin dashboard with high-level user
- Test leaderboard ranking
- Test gamification system with power user

**Run**: `npx tsx prisma/seed_power_user.ts`

**Credentials**: `expert@pronunciation.app` / `Expert1234!`

---

## 🔧 Maintenance Commands

### Clean Database (DANGER)
```bash
# Delete all data (keeps schema)
npx tsx prisma/db_cleanup.ts

# Or truncate tables manually
npx prisma studio
```

### Re-seed from scratch
```bash
# 1. Clean
npx tsx prisma/db_cleanup.ts

# 2. Re-seed (follow Quick Start order above)
```

### Verify seed
```bash
# Check counts
npx tsx prisma/_verify_sp2.ts

# Or in Prisma Studio
npx prisma studio
```

---

## 🐛 Troubleshooting

### Error: "Unique constraint failed"
**Cause**: Trying to create duplicate records  
**Fix**: Scripts are idempotent - safe to re-run

### Error: "Cannot find module"
**Cause**: Missing dependencies  
**Fix**: `npm install`

### Error: "P1001: Can't reach database"
**Cause**: PostgreSQL not running or wrong DATABASE_URL  
**Fix**: Check `.env` and start PostgreSQL

### Audio download fails
**Cause**: Network issue or API rate limit  
**Fix**: Script is idempotent - just re-run. Already downloaded files are skipped.

---

## 📊 Database Statistics (After Full Seed)

```
Topics:              4
Sound Groups:       30
Learning Maps:      25
Exercises:         112
Question Types:      7
Phonemes:           44
Question Bank:     433
Word Items:        ~300
Minimal Pairs:     ~100
Sentence Items:    ~80
Audio Files:       197
Users:             7 (6 demo + 1 power)
Exercise Attempts: ~150
```

---

## 🎯 For Defense/Demo

**Recommended setup**:
```bash
# Minimal (no users)
npm run db:seed:lessons
npx tsx prisma/seed_audio_local.ts

# Full demo (with power user)
npm run db:seed:lessons
npx tsx prisma/seed_audio_local.ts
npx tsx prisma/seed_listen_choose_audio.ts
npx tsx prisma/seed_power_user.ts  # ⭐ Login with this
```

**Login**: `expert@pronunciation.app` / `Expert1234!`

**Show advisors**:
1. Dashboard with 100% completion
2. All 4 topics unlocked
3. Level 10 progress
4. Leaderboard top position
5. Gem economy (150 gems, can buy items)
6. Streak system (45 days)
7. All exercise history

---

**Questions?** Check logs: Each script prints summary at the end.
