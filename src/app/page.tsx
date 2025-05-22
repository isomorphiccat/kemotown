import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-amber-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">K</span>
            </div>
            <h1 className="text-2xl font-bold text-primary font-korean">Kemotown</h1>
          </div>
          <div className="flex space-x-4">
            <Link href="/login">
              <Button variant="ghost">로그인</Button>
            </Link>
            <Link href="/login">
              <Button>회원가입</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl font-bold text-gray-900 dark:text-white mb-6 font-korean">
            한국 퍼리 커뮤니티를 위한
            <br />
            <span className="text-primary">특별한 공간</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 font-korean leading-relaxed">
            Kemotown에서 전국의 퍼리 친구들과 만나고, 이벤트를 만들고, 
            <br />
            함께하는 특별한 추억을 만들어보세요.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8 py-4 font-korean">
              지금 시작하기
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-4 font-korean">
              더 알아보기
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 font-korean">
            Kemotown의 특별한 기능들
          </h3>
          <p className="text-gray-600 dark:text-gray-300 font-korean">
            퍼리 커뮤니티를 위해 특별히 설계된 기능들을 만나보세요
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">📅</span>
              </div>
              <CardTitle className="font-korean">이벤트 만들기</CardTitle>
              <CardDescription className="font-korean">
                쉽고 빠르게 퍼리 모임을 기획하고 친구들을 초대하세요
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">💳</span>
              </div>
              <CardTitle className="font-korean">간편 결제</CardTitle>
              <CardDescription className="font-korean">
                토스 페이먼츠 연동으로 유료 이벤트도 안전하게 관리하세요
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🤝</span>
              </div>
              <CardTitle className="font-korean">범프 시스템</CardTitle>
              <CardDescription className="font-korean">
                이벤트에서 만난 친구들과 특별한 인연을 기록하세요
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Community Stats */}
      <section className="bg-white dark:bg-gray-800 py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">Coming</div>
              <div className="text-gray-600 dark:text-gray-300 font-korean">활성 사용자</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">Soon</div>
              <div className="text-gray-600 dark:text-gray-300 font-korean">진행된 이벤트</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">2025</div>
              <div className="text-gray-600 dark:text-gray-300 font-korean">서비스 런칭</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-2xl mx-auto">
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 font-korean">
            지금 바로 시작해보세요
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-8 font-korean">
            Kemotown은 현재 개발 중입니다. 
            <br />
            출시 소식을 가장 먼저 받아보시려면 베타 테스터로 등록해주세요!
          </p>
          <Button size="lg" className="text-lg px-8 py-4 font-korean">
            베타 테스터 신청하기
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">K</span>
                </div>
                <h4 className="text-xl font-bold font-korean">Kemotown</h4>
              </div>
              <p className="text-gray-400 font-korean">
                한국 퍼리 커뮤니티를 위한 특별한 공간
              </p>
            </div>
            <div>
              <h5 className="font-semibold mb-4 font-korean">서비스</h5>
              <ul className="space-y-2 text-gray-400 font-korean">
                <li>이벤트 만들기</li>
                <li>커뮤니티 참여</li>
                <li>프로필 관리</li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-4 font-korean">지원</h5>
              <ul className="space-y-2 text-gray-400 font-korean">
                <li>자주 묻는 질문</li>
                <li>개인정보처리방침</li>
                <li>이용약관</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 font-korean">
            <p>&copy; 2025 Kemotown. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}