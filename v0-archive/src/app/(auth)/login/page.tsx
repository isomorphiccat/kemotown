import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import LoginButtons from './LoginButtons';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function LoginPage() {
  const session = await getServerSession(authOptions);

  // If the user is already logged in, redirect to the home page or a dashboard
  if (session) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-amber-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">K</span>
            </div>
            <h1 className="text-2xl font-bold text-primary font-korean">Kemotown</h1>
          </Link>
          <div className="flex space-x-4 items-center">
            <Link href="/users">
              <Button variant="ghost" className="font-korean">멤버 둘러보기</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Login Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-md mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-2 font-korean">
              환영합니다!
            </h2>
            <p className="text-center text-gray-600 dark:text-gray-300 mb-8 font-korean">
              Kemotown에 로그인하여 커뮤니티에 참여하세요
            </p>
            
            <LoginButtons />
            
            <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400 font-korean">
              로그인하면 <Link href="/terms" className="text-primary hover:underline">이용약관</Link> 및{' '}
              <Link href="/privacy" className="text-primary hover:underline">개인정보처리방침</Link>에 동의하는 것으로 간주됩니다.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
