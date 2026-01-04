/**
 * Privacy Policy Page
 * 개인정보처리방침
 */

export const metadata = {
    title: '개인정보처리방침 - Kemotown',
    description: 'Kemotown 개인정보처리방침',
};

export default function PrivacyPage() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            {/* Header */}
            <div className="text-center mb-12">
                <h1 className="text-4xl font-display font-bold text-forest-800 dark:text-cream-100 mb-4">
                    개인정보처리방침
                </h1>
                <p className="text-warm-500 dark:text-warm-400 font-korean">
                    최종 수정일: 2025년 1월 1일
                </p>
            </div>

            {/* Content */}
            <div className="space-y-8 font-korean">
                {/* Section 1 */}
                <section className="card-elevated p-6">
                    <h2 className="text-xl font-display font-bold text-forest-700 dark:text-forest-300 mb-4">
                        1. 수집하는 개인정보
                    </h2>
                    <div className="text-warm-600 dark:text-warm-400 space-y-4 leading-relaxed">
                        <p>
                            Kemotown은 서비스 제공을 위해 다음과 같은 개인정보를 수집합니다:
                        </p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>Google/Kakao OAuth 로그인 시 제공되는 이메일 주소</li>
                            <li>프로필 정보 (닉네임, 프로필 사진, 자기소개)</li>
                            <li>서비스 이용 기록 (이벤트 참가 내역, 범프 기록)</li>
                        </ul>
                    </div>
                </section>

                {/* Section 2 */}
                <section className="card-elevated p-6">
                    <h2 className="text-xl font-display font-bold text-forest-700 dark:text-forest-300 mb-4">
                        2. 개인정보의 이용 목적
                    </h2>
                    <div className="text-warm-600 dark:text-warm-400 space-y-4 leading-relaxed">
                        <p>수집된 개인정보는 다음의 목적으로 이용됩니다:</p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>회원 식별 및 서비스 제공</li>
                            <li>이벤트 참가 관리 및 알림 발송</li>
                            <li>커뮤니티 활동 지원 (범프, 팔로우 등)</li>
                            <li>서비스 개선을 위한 통계 분석</li>
                        </ul>
                    </div>
                </section>

                {/* Section 3 */}
                <section className="card-elevated p-6">
                    <h2 className="text-xl font-display font-bold text-forest-700 dark:text-forest-300 mb-4">
                        3. 개인정보의 보관 및 파기
                    </h2>
                    <div className="text-warm-600 dark:text-warm-400 space-y-4 leading-relaxed">
                        <p>
                            회원의 개인정보는 서비스 이용 기간 동안 보관되며, 회원 탈퇴 요청 시
                            30일 이내에 모든 개인정보를 안전하게 파기합니다.
                        </p>
                        <p>
                            단, 관계 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관될 수 있습니다.
                        </p>
                    </div>
                </section>

                {/* Section 4 */}
                <section className="card-elevated p-6">
                    <h2 className="text-xl font-display font-bold text-forest-700 dark:text-forest-300 mb-4">
                        4. 개인정보의 제3자 제공
                    </h2>
                    <div className="text-warm-600 dark:text-warm-400 space-y-4 leading-relaxed">
                        <p>
                            Kemotown은 원칙적으로 회원의 개인정보를 제3자에게 제공하지 않습니다.
                            다만, 다음의 경우에는 예외로 합니다:
                        </p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>회원의 사전 동의가 있는 경우</li>
                            <li>법령에 따라 요청이 있는 경우</li>
                        </ul>
                    </div>
                </section>

                {/* Section 5 */}
                <section className="card-elevated p-6">
                    <h2 className="text-xl font-display font-bold text-forest-700 dark:text-forest-300 mb-4">
                        5. 쿠키 사용
                    </h2>
                    <div className="text-warm-600 dark:text-warm-400 space-y-4 leading-relaxed">
                        <p>
                            Kemotown은 로그인 세션 유지를 위해 쿠키를 사용합니다.
                            쿠키는 서비스 이용에 필수적이며, 브라우저 설정에서 관리할 수 있습니다.
                        </p>
                    </div>
                </section>

                {/* Section 6 */}
                <section className="card-elevated p-6">
                    <h2 className="text-xl font-display font-bold text-forest-700 dark:text-forest-300 mb-4">
                        6. 이용자의 권리
                    </h2>
                    <div className="text-warm-600 dark:text-warm-400 space-y-4 leading-relaxed">
                        <p>이용자는 언제든지 다음의 권리를 행사할 수 있습니다:</p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>개인정보 열람 요청</li>
                            <li>개인정보 수정 요청</li>
                            <li>회원 탈퇴 및 개인정보 삭제 요청</li>
                        </ul>
                    </div>
                </section>

                {/* Contact */}
                <section className="card-elevated p-6 bg-forest-50 dark:bg-forest-900/50 border-forest-200 dark:border-forest-800">
                    <h2 className="text-xl font-display font-bold text-forest-700 dark:text-forest-300 mb-4">
                        문의처
                    </h2>
                    <p className="text-warm-600 dark:text-warm-400 leading-relaxed">
                        개인정보 관련 문의사항이 있으시면 언제든지 연락해 주세요.
                    </p>
                </section>
            </div>
        </div>
    );
}
