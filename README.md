# Craig-O-Storage

A professional file storage and sharing service built with Next.js 15, TypeScript, Prisma, and Tailwind CSS.

## Features

- 📁 **File Upload/Download** - Drag & drop file uploads with progress tracking
- 📂 **Folder Organization** - Create nested folders to organize your files
- 🔗 **Share Links** - Generate shareable links with expiration, passwords, and download limits
- 📊 **Storage Tracking** - Real-time storage usage monitoring
- 👀 **File Previews** - Preview images directly in the browser
- ⚡ **Bulk Operations** - Select and delete multiple files at once
- 💳 **Stripe Integration** - Subscription billing for Pro tier ($14/month)

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL (Neon)
- **ORM**: Prisma
- **Styling**: Tailwind CSS
- **Authentication**: NextAuth.js
- **Payments**: Stripe

## Plans

| Feature | Free | Pro ($14/mo) |
|---------|------|--------------|
| Storage | 5GB | 100GB |
| Folders | Unlimited | Unlimited |
| Share Links | Basic | Advanced |
| Password Protection | ❌ | ✅ |
| Download Limits | ❌ | ✅ |
| Priority Support | ❌ | ✅ |

## Getting Started

1. Clone the repository
2. Copy `.env.example` to `.env` and fill in your values
3. Run `pnpm install`
4. Run `npx prisma db push` to sync the database
5. Run `pnpm dev` to start the development server

## Environment Variables

See `.env.example` for required environment variables.

## Part of the Craig-O Suite

This project is part of the Craig-O suite of applications.

## License

MIT
