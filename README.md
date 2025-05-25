# Kemotown

A community platform for Korean furry meetups built with Next.js and React.

## Overview

Kemotown is a dedicated platform designed to provide a semi-formal digital space for the Korean furry community. The platform focuses on event organization, participation, and social interaction, with integrated payment processing via Toss Payments.

## Features

- **Event Creation & Management**: Create detailed meetups with payment processing
- **User Profiles & Discovery**: Build community connections with profile systems
- **Bump System**: Record in-person interactions at events
- **Payment Integration**: Automated payment handling via Toss Payments
- **Korean Language Support**: Fully localized interface

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **UI Library**: React 18
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Font**: Noto Sans KR for Korean text
- **Color Scheme**: Purple/Amber theme (non-green as per design requirements)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd kemotown
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env.local`
   - Configure OAuth providers:
     - For Google OAuth: Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
     - For Kakao OAuth: Follow the [Kakao OAuth Setup Guide](KAKAO_OAUTH_SETUP.md)

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx          # Landing page
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── forms/            # Form components
│   └── layout/           # Layout components
├── lib/                  # Utility functions
├── types/               # TypeScript definitions
└── styles/              # Additional styles
```

## Design Philosophy

The application follows a **simple, cute, and modern aesthetic** inspired by Naver Band's card layouts and Google Material Design, while avoiding green as the primary color theme. The interface is designed to be welcoming to the Korean furry community.

## Current Status

🚧 **In Development** - This is the initial boilerplate setup with a landing page. Core features are being developed according to the [PROPOSAL.md](PROPOSAL.md) and [DESIGN.md](DESIGN.md).

## Contributing

Please read [PROPOSAL.md](PROPOSAL.md) and [DESIGN.md](DESIGN.md) before contributing to understand the project's objectives and architecture.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.