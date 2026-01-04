/**
 * Terms of Service Page
 * 이용약관
 */

export const metadata = {
    title: '이용약관 - Kemotown',
    description: 'Kemotown 이용약관',
};

export default function TermsPage() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            {/* Header */}
            <div className="text-center mb-12">
                <h1 className="text-4xl font-display font-bold text-forest-800 dark:text-cream-100 mb-4">
                    이용약관
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
                        제1조 (목적)
                    </h2>
                    <p className="text-warm-600 dark:text-warm-400 leading-relaxed">
                        본 약관은 Kemotown(이하 &quot;서비스&quot;)의 이용 조건 및 절차에 관한 사항을 규정함을
                        목적으로 합니다.
                    </p>
                </section>

                {/* Section 2 */}
                <section className="card-elevated p-6">
                    <h2 className="text-xl font-display font-bold text-forest-700 dark:text-forest-300 mb-4">
                        제2조 (서비스 내용)
                    </h2>
                    <div className="text-warm-600 dark:text-warm-400 space-y-4 leading-relaxed">
                        <p>서비스는 다음의 기능을 제공합니다:</p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>퍼리 커뮤니티 이벤트 생성 및 참가</li>
                            <li>사용자 프로필 관리</li>
                            <li>범프 시스템을 통한 만남 기록</li>
                            <li>커뮤니티 타임라인</li>
                        </ul>
                    </div>
                </section>

                {/* Section 3 */}
                <section className="card-elevated p-6">
                    <h2 className="text-xl font-display font-bold text-forest-700 dark:text-forest-300 mb-4">
                        제3조 (회원가입)
                    </h2>
                    <div className="text-warm-600 dark:text-warm-400 space-y-4 leading-relaxed">
                        <p>
                            회원가입은 Google 또는 Kakao 계정을 통한 OAuth 인증으로 이루어집니다.
                            회원가입 시 본 약관에 동의한 것으로 간주됩니다.
                        </p>
                    </div>
                </section>

                {/* Section 4 */}
                <section className="card-elevated p-6">
                    <h2 className="text-xl font-display font-bold text-forest-700 dark:text-forest-300 mb-4">
                        제4조 (회원의 의무)
                    </h2>
                    <div className="text-warm-600 dark:text-warm-400 space-y-4 leading-relaxed">
                        <p>회원은 다음 사항을 준수해야 합니다:</p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>타인의 명예를 훼손하거나 모욕하는 행위 금지</li>
                            <li>불법적인 정보나 콘텐츠 게시 금지</li>
                            <li>타인의 개인정보를 무단으로 수집하거나 유포하는 행위 금지</li>
                            <li>서비스의 정상적인 운영을 방해하는 행위 금지</li>
                            <li>커뮤니티 가이드라인 준수</li>
                        </ul>
                    </div>
                </section>

                {/* Section 5 */}
                <section className="card-elevated p-6">
                    <h2 className="text-xl font-display font-bold text-forest-700 dark:text-forest-300 mb-4">
                        제5조 (커뮤니티 가이드라인)
                    </h2>
                    <div className="text-warm-600 dark:text-warm-400 space-y-4 leading-relaxed">
                        <p>
                            Kemotown은 모든 구성원이 안전하고 즐겁게 활동할 수 있는 커뮤니티를
                            지향합니다. 다음의 가이드라인을 준수해 주세요:
                        </p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>서로 존중하는 대화를 해주세요</li>
                            <li>다양성을 존중해주세요</li>
                            <li>오프라인 만남에서 안전을 최우선으로 해주세요</li>
                            <li>부적절한 콘텐츠는 신고해 주세요</li>
                        </ul>
                    </div>
                </section>

                {/* Section 6 */}
                <section className="card-elevated p-6">
                    <h2 className="text-xl font-display font-bold text-forest-700 dark:text-forest-300 mb-4">
                        제6조 (서비스 제공자의 책임 제한)
                    </h2>
                    <div className="text-warm-600 dark:text-warm-400 space-y-4 leading-relaxed">
                        <p>
                            서비스 제공자는 천재지변이나 이에 준하는 불가항력으로 인하여 서비스를
                            제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.
                        </p>
                        <p>
                            회원 간의 거래나 오프라인 활동으로 발생하는 문제에 대해서는
                            서비스 제공자가 책임을 지지 않습니다.
                        </p>
                    </div>
                </section>

                {/* Section 7 */}
                <section className="card-elevated p-6">
                    <h2 className="text-xl font-display font-bold text-forest-700 dark:text-forest-300 mb-4">
                        제7조 (이용 제한)
                    </h2>
                    <div className="text-warm-600 dark:text-warm-400 space-y-4 leading-relaxed">
                        <p>
                            서비스 제공자는 회원이 본 약관 또는 커뮤니티 가이드라인을 위반한 경우,
                            사전 통보 없이 서비스 이용을 제한할 수 있습니다.
                        </p>
                    </div>
                </section>

                {/* Section 8 */}
                <section className="card-elevated p-6">
                    <h2 className="text-xl font-display font-bold text-forest-700 dark:text-forest-300 mb-4">
                        제8조 (약관 변경)
                    </h2>
                    <div className="text-warm-600 dark:text-warm-400 space-y-4 leading-relaxed">
                        <p>
                            서비스 제공자는 필요한 경우 약관을 변경할 수 있으며, 변경된 약관은
                            서비스 내 공지를 통해 효력이 발생합니다.
                        </p>
                    </div>
                </section>

                {/* Footer Note */}
                <section className="card-elevated p-6 bg-forest-50 dark:bg-forest-900/50 border-forest-200 dark:border-forest-800">
                    <p className="text-warm-600 dark:text-warm-400 text-center leading-relaxed">
                        본 약관은 2025년 1월 1일부터 시행됩니다.
                    </p>
                </section>
            </div>
        </div>
    );
}
