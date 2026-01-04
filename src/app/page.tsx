/**
 * Home Page — "Cozy Forest Town" Premium Landing
 * A stunning, warm, and inviting welcome to the Korean furry community
 */

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import Link from 'next/link';

// Feature cards with enhanced visual design
const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
      </svg>
    ),
    title: '이벤트 만들기',
    description: '쉽고 빠르게 모임을 기획하고 친구들을 초대하세요',
    gradient: 'from-forest-500 to-forest-600',
    bgGradient: 'from-forest-50 to-forest-100 dark:from-forest-900/40 dark:to-forest-800/40',
    iconBg: 'bg-forest-500',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
      </svg>
    ),
    title: '실시간 타임라인',
    description: '커뮤니티 소식을 실시간으로 확인하고 소통하세요',
    gradient: 'from-accent-400 to-accent-500',
    bgGradient: 'from-accent-50 to-accent-100 dark:from-accent-900/30 dark:to-accent-800/30',
    iconBg: 'bg-accent-500',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
    title: '범프 시스템',
    description: '이벤트에서 만난 친구들과 인연을 기록하세요',
    gradient: 'from-cream-500 to-cream-600',
    bgGradient: 'from-cream-50 to-cream-100 dark:from-cream-900/20 dark:to-cream-800/20',
    iconBg: 'bg-cream-600',
  },
];

export default async function HomePage() {
  const session = await auth();

  // Redirect authenticated users to events
  if (session?.user) {
    redirect('/events');
  }

  return (
    <div className="min-h-screen bg-gradient-mesh grain overflow-hidden">
      {/* ─────────────────────────────────────────────
          Decorative Background Elements
          ───────────────────────────────────────────── */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {/* Large ambient blobs */}
        <div className="blob blob-green w-[700px] h-[700px] -top-64 -left-64 opacity-20 float" />
        <div className="blob blob-coral w-[500px] h-[500px] top-1/4 -right-48 opacity-15 float-slow float-delay-1" />
        <div className="blob blob-cream w-[600px] h-[600px] -bottom-48 left-1/3 opacity-20 float float-delay-2" />
        <div className="blob blob-green w-[400px] h-[400px] bottom-1/4 right-1/4 opacity-10 float-slow float-delay-3" />

        {/* Subtle grid pattern */}
        <div className="absolute inset-0 pattern-dots opacity-[0.03]" />
      </div>

      {/* Content wrapper */}
      <div className="relative z-10">
        {/* ─────────────────────────────────────────────
            Navigation Header
            ───────────────────────────────────────────── */}
        <header className="container mx-auto px-6 py-6">
          <nav className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-forest-600 to-forest-700 rounded-2xl shadow-lg flex items-center justify-center transform group-hover:scale-105 group-hover:shadow-xl transition-all duration-300">
                  <span className="text-white font-bold text-xl">K</span>
                </div>
                {/* Status indicator */}
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-gradient-to-br from-accent-400 to-accent-500 rounded-full border-[3px] border-cream-50 dark:border-forest-950 animate-pulse-soft" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-display font-bold text-forest-800 dark:text-cream-50 tracking-tight">
                  Kemotown
                </span>
                <span className="text-xs text-warm-400 dark:text-warm-500 -mt-0.5 font-medium">
                  한국 퍼리 커뮤니티
                </span>
              </div>
            </Link>

            {/* Navigation Links */}
            <div className="flex items-center gap-2">
              <Link
                href="/users"
                className="hidden sm:flex items-center gap-2 px-4 py-2.5 text-warm-600 hover:text-forest-700 dark:text-warm-400 dark:hover:text-forest-400 font-medium rounded-xl hover:bg-forest-50/80 dark:hover:bg-forest-900/50 transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
                <span className="font-korean">멤버</span>
              </Link>
              <Link
                href="/events"
                className="hidden sm:flex items-center gap-2 px-4 py-2.5 text-warm-600 hover:text-forest-700 dark:text-warm-400 dark:hover:text-forest-400 font-medium rounded-xl hover:bg-forest-50/80 dark:hover:bg-forest-900/50 transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
                <span className="font-korean">이벤트</span>
              </Link>
              <Link
                href="/login"
                className="group px-5 py-2.5 bg-forest-600 text-white rounded-xl font-medium shadow-[0_4px_12px_-4px_rgba(45,132,45,0.35)] hover:bg-forest-700 hover:shadow-[0_8px_20px_-4px_rgba(45,132,45,0.4),0_0_24px_-4px_rgba(61,163,61,0.25)] active:scale-[0.97] transition-all duration-200 font-korean"
              >
                <span className="flex items-center gap-2">
                  시작하기
                  <svg className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </span>
              </Link>
            </div>
          </nav>
        </header>

        {/* ─────────────────────────────────────────────
            Hero Section
            ───────────────────────────────────────────── */}
        <section className="container mx-auto px-6 pt-12 pb-20 md:pt-20 md:pb-28 lg:pt-24 lg:pb-36">
          <div className="max-w-4xl mx-auto text-center">
            {/* Announcement Badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-white/60 dark:bg-forest-900/60 backdrop-blur-sm rounded-full mb-8 animate-fade-in-down shadow-[0_2px_12px_-4px_rgba(26,68,32,0.1)] border border-white/40 dark:border-forest-700/40">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent-500" />
              </span>
              <span className="text-sm font-medium text-forest-700 dark:text-forest-300 font-korean">
                2025년 새롭게 시작합니다
              </span>
            </div>

            {/* Main Heading with Premium Typography */}
            <h1 className="hero-title text-forest-900 dark:text-cream-50 mb-6 animate-fade-in-up font-korean">
              한국 퍼리들의
              <br />
              <span className="text-gradient-shine">아늑한 모임 공간</span>
            </h1>

            {/* Subheading */}
            <p className="text-lg md:text-xl lg:text-2xl text-warm-600 dark:text-warm-300 mb-12 max-w-2xl mx-auto animate-fade-in-up stagger-1 font-korean leading-relaxed text-balance">
              Kemotown에서 전국의 퍼리 친구들과 만나고,
              <br className="hidden sm:block" />
              함께하는 특별한 추억을 만들어보세요.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up stagger-2">
              <Link
                href="/login"
                className="group relative px-8 py-4 bg-gradient-to-b from-forest-600 to-forest-700 text-white text-lg font-medium rounded-2xl shadow-[0_8px_24px_-8px_rgba(45,132,45,0.5),inset_0_1px_0_rgba(255,255,255,0.1)] hover:shadow-[0_12px_32px_-8px_rgba(45,132,45,0.6),0_0_48px_-12px_rgba(61,163,61,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] active:scale-[0.98] transition-all duration-300 font-korean overflow-hidden"
              >
                {/* Shine effect */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                <span className="relative flex items-center justify-center gap-2">
                  지금 시작하기
                  <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-200" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </span>
              </Link>
              <Link
                href="/events"
                className="group px-8 py-4 bg-white/70 dark:bg-forest-900/70 backdrop-blur-sm text-forest-700 dark:text-cream-100 text-lg font-medium rounded-2xl border-2 border-warm-200/80 dark:border-forest-700/80 shadow-[0_4px_16px_-8px_rgba(26,68,32,0.1)] hover:border-forest-300 dark:hover:border-forest-600 hover:bg-white/90 dark:hover:bg-forest-800/90 hover:shadow-[0_8px_24px_-8px_rgba(26,68,32,0.15)] active:scale-[0.98] transition-all duration-300 font-korean"
              >
                <span className="flex items-center justify-center gap-2">
                  이벤트 둘러보기
                  <svg className="w-5 h-5 opacity-60 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                </span>
              </Link>
            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────
            Features Section
            ───────────────────────────────────────────── */}
        <section className="container mx-auto px-6 py-20">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-forest-800 dark:text-cream-50 mb-4 font-korean tracking-tight">
              Kemotown의 특별한 기능
            </h2>
            <p className="text-warm-500 dark:text-warm-400 text-lg font-korean max-w-xl mx-auto">
              퍼리 커뮤니티를 위해 특별히 설계된 기능들
            </p>
          </div>

          {/* Feature Cards Grid */}
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group relative p-8 rounded-3xl bg-white/70 dark:bg-forest-900/50 backdrop-blur-sm border border-white/60 dark:border-forest-800/60 shadow-[0_4px_20px_-8px_rgba(26,68,32,0.1)] hover:shadow-[0_12px_40px_-12px_rgba(26,68,32,0.15)] hover:-translate-y-1 transition-all duration-300 animate-fade-in-up overflow-hidden"
                style={{ animationDelay: `${index * 100 + 200}ms` }}
              >
                {/* Background gradient on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                {/* Content */}
                <div className="relative">
                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-2xl ${feature.iconBg} text-white flex items-center justify-center mb-6 shadow-lg group-hover:scale-105 transition-transform duration-300`}>
                    {feature.icon}
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-forest-800 dark:text-cream-50 mb-3 font-korean tracking-tight">
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className="text-warm-500 dark:text-warm-400 font-korean leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─────────────────────────────────────────────
            Stats Section
            ───────────────────────────────────────────── */}
        <section className="relative py-24 overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 pattern-dots opacity-[0.04]" />

          <div className="container mx-auto px-6 relative">
            <div className="max-w-4xl mx-auto">
              <div className="relative p-10 md:p-14 rounded-[2rem] bg-white/80 dark:bg-forest-900/80 backdrop-blur-md shadow-[0_8px_32px_-8px_rgba(26,68,32,0.1)] border border-white/60 dark:border-forest-800/60 overflow-hidden">
                {/* Decorative corner accents */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-forest-100/50 to-transparent dark:from-forest-800/30 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-accent-100/40 to-transparent dark:from-accent-900/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />

                <div className="relative grid md:grid-cols-3 gap-10 text-center">
                  <div className="animate-fade-in-up">
                    <div className="text-4xl md:text-5xl font-display font-bold text-gradient mb-2">
                      Coming
                    </div>
                    <div className="text-warm-500 dark:text-warm-400 font-korean font-medium">활성 사용자</div>
                  </div>
                  <div className="animate-fade-in-up stagger-1">
                    <div className="text-4xl md:text-5xl font-display font-bold text-gradient-accent mb-2">
                      Soon
                    </div>
                    <div className="text-warm-500 dark:text-warm-400 font-korean font-medium">진행된 이벤트</div>
                  </div>
                  <div className="animate-fade-in-up stagger-2">
                    <div className="text-4xl md:text-5xl font-display font-bold text-gradient mb-2">
                      2025
                    </div>
                    <div className="text-warm-500 dark:text-warm-400 font-korean font-medium">서비스 런칭</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────
            Final CTA Section
            ───────────────────────────────────────────── */}
        <section className="container mx-auto px-6 py-20">
          <div className="max-w-3xl mx-auto text-center">
            <div className="relative p-12 md:p-16 rounded-[2rem] bg-gradient-to-b from-forest-600 to-forest-700 text-white shadow-[0_16px_48px_-16px_rgba(45,132,45,0.5)] overflow-hidden">
              {/* Background decoration */}
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />

              {/* Glow effects */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-white/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/3" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-accent-500/20 to-transparent rounded-full translate-y-1/3 -translate-x-1/4" />

              <div className="relative">
                <h2 className="font-display text-3xl md:text-4xl font-bold mb-5 font-korean tracking-tight">
                  지금 바로 시작해보세요
                </h2>
                <p className="text-forest-100/90 mb-10 text-lg font-korean leading-relaxed max-w-lg mx-auto">
                  Kemotown은 현재 개발 중입니다.
                  <br />
                  출시 소식을 가장 먼저 받아보시려면 가입해주세요!
                </p>
                <Link
                  href="/login"
                  className="group inline-flex items-center gap-2.5 px-8 py-4 bg-white text-forest-700 text-lg font-bold rounded-2xl shadow-[0_8px_24px_-8px_rgba(0,0,0,0.2)] hover:shadow-[0_12px_32px_-8px_rgba(0,0,0,0.25)] active:scale-[0.98] transition-all duration-200 font-korean"
                >
                  <svg className="w-5 h-5 text-accent-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  베타 테스터 신청하기
                  <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────
            Footer
            ───────────────────────────────────────────── */}
        <footer className="relative border-t border-warm-200/60 dark:border-forest-800/60">
          <div className="container mx-auto px-6 py-16">
            <div className="grid md:grid-cols-4 gap-12">
              {/* Brand */}
              <div className="md:col-span-2">
                <Link href="/" className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-gradient-to-br from-forest-600 to-forest-700 rounded-xl flex items-center justify-center shadow-md">
                    <span className="text-white font-bold text-lg">K</span>
                  </div>
                  <span className="text-xl font-display font-bold text-forest-800 dark:text-cream-50 tracking-tight">
                    Kemotown
                  </span>
                </Link>
                <p className="text-warm-500 dark:text-warm-400 font-korean max-w-sm leading-relaxed">
                  한국 퍼리 커뮤니티를 위한 아늑한 모임 공간.
                  함께 만들어가는 특별한 커뮤니티입니다.
                </p>
              </div>

              {/* Links */}
              <div>
                <h4 className="font-bold text-forest-800 dark:text-cream-50 mb-5 font-korean">서비스</h4>
                <ul className="space-y-3 text-warm-500 dark:text-warm-400 font-korean">
                  <li>
                    <Link href="/events" className="hover:text-forest-600 dark:hover:text-forest-400 transition-colors">
                      이벤트 찾기
                    </Link>
                  </li>
                  <li>
                    <Link href="/users" className="hover:text-forest-600 dark:hover:text-forest-400 transition-colors">
                      커뮤니티 멤버
                    </Link>
                  </li>
                  <li>
                    <Link href="/login" className="hover:text-forest-600 dark:hover:text-forest-400 transition-colors">
                      프로필 만들기
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-forest-800 dark:text-cream-50 mb-5 font-korean">지원</h4>
                <ul className="space-y-3 text-warm-500 dark:text-warm-400 font-korean">
                  <li>
                    <Link href="/faq" className="hover:text-forest-600 dark:hover:text-forest-400 transition-colors">
                      자주 묻는 질문
                    </Link>
                  </li>
                  <li>
                    <Link href="/privacy" className="hover:text-forest-600 dark:hover:text-forest-400 transition-colors">
                      개인정보처리방침
                    </Link>
                  </li>
                  <li>
                    <Link href="/terms" className="hover:text-forest-600 dark:hover:text-forest-400 transition-colors">
                      이용약관
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            {/* Bottom bar */}
            <div className="mt-14 pt-8 border-t border-warm-200/60 dark:border-forest-800/60 flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-warm-400 dark:text-warm-500 text-sm font-korean">
                © 2025 Kemotown. All rights reserved.
              </p>
              <div className="flex items-center gap-2 text-warm-400 dark:text-warm-500 text-sm">
                <span className="w-2 h-2 rounded-full bg-gradient-to-r from-forest-400 to-forest-500" />
                <span>Made with love for furries</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
