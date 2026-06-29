# 🎓 Hệ Thống Hỗ Trợ Học Phát Âm Tiếng Anh

> **English Pronunciation Learning Platform** - Ứng dụng web gamification toàn diện giúp người học tiếng Anh cải thiện phát âm thông qua IPA (International Phonetic Alphabet), bài tập đa dạng, và hệ thống tích điểm, xếp hạng hấp dẫn.

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.136-009688)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-Educational-blue)]()

---

## 📋 Mục Lục

- [Giới Thiệu](#-giới-thiệu)
- [Mục Tiêu Đồ Án](#-mục-tiêu-đồ-án)
- [Kiến Trúc Hệ Thống](#️-kiến-trúc-hệ-thống)
- [Công Nghệ Sử Dụng](#-công-nghệ-sử-dụng)
- [Tính Năng Nổi Bật](#-tính-năng-nổi-bật)
- [Yêu Cầu Hệ Thống](#-yêu-cầu-hệ-thống)
- [Hướng Dẫn Cài Đặt](#-hướng-dẫn-cài-đặt)
- [Triển Khai Production](#-triển-khai-production)
- [Cấu Trúc Thư Mục](#-cấu-trúc-thư-mục)
- [Đóng Góp](#-đóng-góp)
- [Giấy Phép](#-giấy-phép)

---

## 🎯 Giới Thiệu

**Hệ Thống Hỗ Trợ Học Phát Âm Tiếng Anh** là nền tảng e-learning tương tác, được thiết kế đặc biệt cho người Việt học phát âm chuẩn tiếng Anh thông qua:

- 🎵 **Ký hiệu IPA**: Học 44 âm tiếng Anh qua ký hiệu phiên âm quốc tế
- 🎮 **Gamification**: Tích điểm XP, huy hiệu, streak check-in, league tier (Bronze → Legend)
- 🎯 **Bài tập đa dạng**: Nghe chọn âm, phát âm từ, phân biệt âm tối thiểu, nhấn âm & nối âm
- 🏆 **Xếp hạng & thử thách**: Bảng xếp hạng tuần/tháng, nhiệm vụ hàng ngày, thử thách tuần
- 🛒 **Cửa hàng ảo**: Mua vật phẩm hỗ trợ bằng gems (gợi ý, XP boost, đóng băng streak)
- 🎡 **Vòng quay may mắn**: Nhận phần thưởng ngẫu nhiên mỗi ngày

Ứng dụng phù hợp cho:
- Sinh viên, học sinh tự học phát âm
- Giáo viên tạo bài tập cho lớp
- Trung tâm ngoại ngữ số hóa giảng dạy

---

## 🎯 Mục Tiêu Đồ Án

### 1. Mục tiêu học tập
- Áp dụng kiến thức **Lập Trình Web** (HTML, CSS, JavaScript, React/Next.js)
- Thiết kế **kiến trúc Microservices** phân tách frontend-backend
- Thực hành **Database Design** phức tạp (Prisma ORM, PostgreSQL)
- Triển khai ứng dụng thực tế với **Docker** và **CI/CD**

### 2. Mục tiêu nghiệp vụ
- Giải quyết bài toán **học phát âm hiệu quả** cho người Việt
- Xây dựng hệ thống **gamification engagement** tăng động lực học tập
- Cung cấp **feedback tự động** qua Web Speech API
- Tạo môi trường học tập **cá nhân hóa** theo tiến độ từng người

### 3. Mục tiêu kỹ thuật
- ✅ Responsive design (Mobile-first)
- ✅ Progressive Web App (PWA) ready
- ✅ Server-side rendering (Next.js App Router)
- ✅ Real-time leaderboard updates
- ✅ Offline-first audio storage
- ✅ Production-ready Docker deployment

---

## 🏗️ Kiến Trúc Hệ Thống

### Tổng quan kiến trúc

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Next.js Frontend (Port 3000)                        │   │
│  │  - React 18 + TypeScript                             │   │
│  │  - Tailwind CSS 4.0 + Lucide Icons                   │   │
│  │  - NextAuth.js (Authentication)                      │   │
│  │  - Web Speech API (Pronunciation Recognition)        │   │
│  │  - Prisma Client (Database ORM)                      │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  FastAPI Backend (Port 8000)                         │   │
│  │  - Python 3.11+ + Uvicorn                            │   │
│  │  - Health Check Endpoint                             │   │
│  │  - Future: Pronunciation Scoring API                 │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                       DATA LAYER                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  PostgreSQL 15 (Port 5432)                           │   │
│  │  - 30+ Tables (Users, Exercises, Progress, etc.)     │   │
│  │  - Prisma Migrations                                 │   │
│  │  - Transaction Support                               │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Luồng dữ liệu chính

1. **Authentication Flow**: NextAuth.js → Credentials Provider → PostgreSQL
2. **Exercise Flow**: User → Frontend → Prisma ORM → PostgreSQL
3. **Leaderboard Flow**: Cron Job (Weekly) → Update Scores → Real-time Display
4. **Gamification Flow**: XP/Gems Earned → Level Up Logic → Milestone Rewards

---

## 🛠 Công Nghệ Sử Dụng

### Frontend
| Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|----------|
| **Next.js** | 16.2.7 | React framework với SSR/SSG |
| **React** | 18.3.1 | UI library |
| **TypeScript** | 6.0.3 | Type safety |
| **Tailwind CSS** | 4.3.0 | Utility-first CSS framework |
| **Prisma** | 6.19.3 | ORM & Database Client |
| **NextAuth.js** | 5.0.0-beta | Authentication solution |
| **Lucide React** | 1.21.0 | Icon library |
| **WaveSurfer.js** | 7.12.7 | Audio waveform visualization |
| **Canvas Confetti** | 1.9.4 | Celebration animations |

### Backend
| Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|----------|
| **FastAPI** | 0.136.3 | Python web framework |
| **Uvicorn** | 0.48.0 | ASGI server |
| **SQLAlchemy** | 2.0.50 | SQL toolkit |
| **Psycopg2** | 2.9.12 | PostgreSQL adapter |
| **Alembic** | 1.18.4 | Database migrations |
| **Bcrypt** | 5.0.0 | Password hashing |

### Database & DevOps
| Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|----------|
| **PostgreSQL** | 15-alpine | Relational database |
| **Docker** | 24+ | Containerization |
| **Docker Compose** | 3.8 | Multi-container orchestration |

---

## ✨ Tính Năng Nổi Bật

### 🎓 Học tập & Luyện tập
- **4 Chủ đề chính**:
  1. Nguyên âm (Vowels): 12 âm đơn + 8 nguyên âm đôi
  2. Phụ âm (Consonants): 24 âm phụ âm
  3. Phân biệt âm tối thiểu (Minimal Pairs): /ship/ vs /sheep/
  4. Trọng âm & Nối âm (Stress & Linking): phát âm tự nhiên

- **3 Loại bài tập**:
  - **Listen & Choose**: Nghe audio, chọn âm IPA đúng
  - **Tap the Stress**: Nhấn vào âm tiết được nhấn mạnh
  - **Speak & Compare**: Thu âm, so sánh với chuẩn (Web Speech API)

### 🎮 Gamification
- **XP & Leveling**: Tích điểm kinh nghiệm, lên cấp 1→100
- **Streak System**: Chuỗi ngày học liên tiếp, thưởng gems
- **Daily Quests**: 3 nhiệm vụ hàng ngày (Luyện 3 bài, Check-in 3 ngày, v.v.)
- **Weekly Challenges**: Thử thách tuần, thưởng gems + huy hiệu
- **League Tier**: 5 hạng (Bronze → Silver → Gold → Diamond → Legend)
- **Milestone Rewards**: Thưởng theo cấp độ (gems, avatar frames, themes)

### 🛒 Shop & Items
- **Consumable Items**:
  - 📚 **Sách Thần** (XP Boost): x1.5 XP cho bài tiếp theo
  - 💡 **Gợi Ý Vàng** (Hint Token): Hiện gợi ý trong bài tập
  - 🔄 **Cơ Hội Thứ Hai**: Làm lại câu sai không mất điểm
- **Permanent Unlocks**:
  - 🔍 **Kính Lúp IPA**: Hiện IPA trong bài tập
  - 🔊 **Loa Ma Thuật**: Phát chậm audio
- **Cosmetics**:
  - Avatar frames, titles (Scholar, Champion, v.v.)

### 📊 Xếp hạng & Thống kê
- **Bảng xếp hạng tuần/tháng**: Top users theo điểm
- **Profile Dashboard**: XP, cấp độ, streak, achievements
- **Progress Tracking**: Tiến độ từng chủ đề, % hoàn thành
- **Season Transition**: Thăng/giáng hạng cuối tuần

---

## 💻 Yêu Cầu Hệ Thống

### Phần mềm cần thiết
- **Docker Desktop** (khuyến nghị): [Download](https://www.docker.com/products/docker-desktop)
  - Bao gồm Docker Compose
  - Hỗ trợ Windows, macOS, Linux

**HOẶC** cài đặt thủ công:
- **Node.js** 20+ & npm: [Download](https://nodejs.org/)
- **Python** 3.11+: [Download](https://www.python.org/)
- **PostgreSQL** 15+: [Download](https://www.postgresql.org/)

### Cấu hình tối thiểu
- **CPU**: 2 cores
- **RAM**: 4GB (8GB khuyến nghị)
- **Disk**: 3GB trống
- **OS**: Windows 10+, macOS 12+, Ubuntu 20.04+

### Trình duyệt hỗ trợ
- Chrome/Edge 90+ (Khuyến nghị - hỗ trợ Web Speech API)
- Firefox 88+
- Safari 14+

---

## 🚀 Hướng Dẫn Cài Đặt

### Phương án 1: Docker (Khuyến nghị) ⭐

**Bước 1: Clone repository**
```bash
git clone https://github.com/HuynhPhuocTho564/HoTroHocPhatAmTiengAnh.git
cd HoTroHocPhatAmTiengAnh
```

**Bước 2: Cấu hình environment**
```bash
# Windows (CMD/PowerShell)
copy .env.docker .env

# Linux/macOS
cp .env.docker .env
```

**Chỉnh sửa `.env`** - Thay đổi `AUTH_SECRET` (quan trọng!):
```bash
# Generate secret (PowerShell):
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Max 256 }))

# Hoặc dùng online: https://generate-secret.vercel.app/32
```

**Bước 3: Khởi động Docker**
```bash
docker-compose up --build
```

Chờ thông báo:
```
✓ pronunciation_db       Started
✓ pronunciation_backend  Started
✓ pronunciation_frontend Started
```

**Bước 4: Khởi tạo database** (Terminal mới)
```bash
# Chạy migrations
docker exec pronunciation_frontend npx prisma migrate deploy

# Seed dữ liệu
docker exec pronunciation_frontend npm run db:seed:lessons
docker exec pronunciation_frontend npx tsx prisma/seed_audio_local.ts
docker exec pronunciation_frontend npx tsx prisma/seed_listen_choose_audio.ts
docker exec pronunciation_frontend npx tsx prisma/seed_demo_user.ts
```

**Bước 5: Truy cập ứng dụng**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/health
- **Database**: localhost:5432

**Tài khoản demo**:
- Basic User: `demo@pronunciation.app` / `Demo1234!`
- Power User (100% progress): `expert@pronunciation.app` / `Expert1234!`

---

### Phương án 2: Cài đặt thủ công

<details>
<summary>Click để xem hướng dẫn chi tiết</summary>

#### A. Cài đặt Database
```bash
# Tạo database PostgreSQL
createdb english_app

# Hoặc dùng psql
psql -U postgres
CREATE DATABASE english_app;
```

#### B. Cài đặt Frontend
```bash
cd frontend

# Cài đặt dependencies
npm install

# Cấu hình .env
cp .env.example .env.local
# Chỉnh sửa DATABASE_URL, AUTH_SECRET

# Chạy Prisma migrations
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate

# Seed database
npm run db:seed:lessons
npx tsx prisma/seed_audio_local.ts
npx tsx prisma/seed_listen_choose_audio.ts
npx tsx prisma/seed_demo_user.ts

# Chạy development server
npm run dev
```

Frontend chạy tại: http://localhost:3000

#### C. Cài đặt Backend
```bash
cd backend

# Tạo virtual environment
python -m venv venv

# Kích hoạt venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Cài đặt dependencies
pip install -r requirements.txt

# Cấu hình .env
cp .env.example .env
# Chỉnh sửa DATABASE_URL

# Chạy server
uvicorn app.main:app --reload --port 8000
```

Backend chạy tại: http://localhost:8000

</details>

---

## 🌐 Triển Khai Production

### Option 1: Docker Hub + VPS

**Bước 1: Build & Push Images**
```bash
# Login Docker Hub
docker login

# Build images
docker build -t yourusername/pronunciation-frontend:latest ./frontend
docker build -t yourusername/pronunciation-backend:latest ./backend

# Push to registry
docker push yourusername/pronunciation-frontend:latest
docker push yourusername/pronunciation-backend:latest
```

**Bước 2: Deploy trên VPS**
```bash
# SSH vào server
ssh user@your-vps-ip

# Pull images
docker pull yourusername/pronunciation-frontend:latest
docker pull yourusername/pronunciation-backend:latest

# Chạy docker-compose với production .env
docker-compose -f docker-compose.prod.yml up -d
```

**Lưu ý Production**:
- Đổi `AUTH_SECRET` thành secret mạnh mới
- Sử dụng HTTPS (cấu hình Nginx reverse proxy)
- Đặt `POSTGRES_PASSWORD` phức tạp
- Bật firewall, chỉ mở port 80/443
- Cấu hình auto-restart: `restart: always`

---

### Option 2: Vercel (Frontend) + Railway (Backend + DB)

**Frontend trên Vercel**:
1. Push code lên GitHub
2. Import project vào [Vercel](https://vercel.com)
3. Set environment variables:
   - `DATABASE_URL`
   - `AUTH_SECRET`
   - `AUTH_URL=https://yourdomain.vercel.app`
4. Deploy ✅

**Backend + Database trên Railway**:
1. Tạo project mới tại [Railway](https://railway.app)
2. Add service → PostgreSQL
3. Add service → GitHub Repo (backend folder)
4. Set environment variables
5. Deploy ✅

**Demo hoạt động**: Xem [DOCKER_QUICK_START.md](./DOCKER_QUICK_START.md) để biết thêm chi tiết.

---

### Option 3: AWS ECS / Google Cloud Run

<details>
<summary>Hướng dẫn deploy lên AWS</summary>

```bash
# Install AWS CLI & ECS CLI
pip install awscli
ecs-cli configure

# Push images to ECR
aws ecr create-repository --repository-name pronunciation-app
docker tag pronunciation-frontend:latest <ECR_URI>/pronunciation-frontend:latest
docker push <ECR_URI>/pronunciation-frontend:latest

# Deploy with ECS
ecs-cli compose up --cluster pronunciation-cluster
```

Tham khảo: [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)

</details>

---

## 📁 Cấu Trúc Thư Mục

```
english_pronunciation_app/
├── frontend/                    # Next.js Frontend
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema (30+ models)
│   │   ├── migrations/         # Prisma migrations
│   │   └── seed_*.ts           # Seed scripts
│   ├── src/
│   │   ├── app/                # Next.js App Router
│   │   │   ├── api/            # API routes (NextAuth, exercises, leaderboard)
│   │   │   ├── exercises/      # Exercise pages
│   │   │   ├── dashboard/      # User dashboard
│   │   │   ├── leaderboard/    # Leaderboard page
│   │   │   ├── shop/           # Shop page
│   │   │   └── admin/          # Admin panel
│   │   ├── components/         # React components
│   │   │   ├── gamification/   # XP bar, streak, missions
│   │   │   ├── admin/          # Admin UI components
│   │   │   └── layout/         # Navbar, theme
│   │   └── lib/                # Utilities, gamification logic
│   ├── public/
│   │   └── audio/              # Audio files (IPA sounds, words)
│   ├── Dockerfile              # Frontend Docker config
│   ├── package.json
│   └── next.config.mjs
│
├── backend/                     # FastAPI Backend
│   ├── app/
│   │   ├── api/routes/         # API endpoints (health check)
│   │   ├── core/               # Config, database
│   │   └── main.py             # FastAPI app entry
│   ├── Dockerfile              # Backend Docker config
│   ├── requirements.txt
│   └── README.md
│
├── Docs/                        # Tài liệu đồ án
├── docker-compose.yml           # Docker orchestration
├── .env.docker                  # Environment template
├── DOCKER_QUICK_START.md        # Docker quick guide
└── README.md                    # This file

Total: ~500 files, 15,000+ lines of code
```

---

## 🧪 Chạy Tests

```bash
# Frontend tests
cd frontend
npm run test

# Backend tests (coming soon)
cd backend
pytest
```

---

## 🛠 Troubleshooting

### Port đã được sử dụng
```bash
# Thay đổi port trong .env
FRONTEND_PORT=3001
BACKEND_PORT=8001
POSTGRES_PORT=5433
```

### Database connection error
```bash
# Kiểm tra database container
docker-compose ps

# Restart database
docker-compose restart db

# Xem logs
docker-compose logs db
```

### Frontend không build được
```bash
# Xóa node_modules và reinstall
cd frontend
rm -rf node_modules .next
npm install
npm run build
```

### Prisma Client lỗi
```bash
docker exec pronunciation_frontend npx prisma generate
docker-compose restart frontend
```

---

## 🤝 Đóng Góp

Dự án này là đồ án môn học, không mở cho đóng góp bên ngoài. Tuy nhiên, bạn có thể:

1. **Fork** project để phát triển phiên bản riêng
2. **Star** ⭐ nếu thấy hữu ích
3. **Report issues** nếu phát hiện bug

---

## 📄 Giấy Phép

Dự án này được phát triển cho mục đích **giáo dục** (Educational Use Only).

- Audio files: Sử dụng nguồn mở từ FreeDictionaryAPI, licensed sources
- Icons: Lucide Icons (MIT License)
- Dependencies: Xem `package.json` và `requirements.txt`

**Sinh viên thực hiện**:
- Huỳnh Phước Thọ - MSSV: [Điền MSSV]
- Trường: [Điền tên trường]
- Môn học: Lập Trình Web / Đồ Án Tốt Nghiệp
- Năm học: 2025-2026

---

## 📞 Liên Hệ

- **GitHub**: [HuynhPhuocTho564](https://github.com/HuynhPhuocTho564)
- **Email**: [Điền email]
- **Demo Link**: [Điền link demo nếu có]

---

## 🙏 Acknowledgments

- Next.js Team - Amazing React framework
- Vercel - Deployment platform
- Prisma - Modern ORM
- FastAPI - Python web framework
- Community contributors

---

<div align="center">

**⭐ Nếu dự án này hữu ích, hãy cho một star! ⭐**

Made with ❤️ by Huỳnh Phước Thọ

</div>
