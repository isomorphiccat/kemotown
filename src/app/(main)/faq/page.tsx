/**
 * FAQ Page
 * Frequently asked questions about Kemotown
 */

import Link from 'next/link';
import { ChevronDown } from 'lucide-react';

export const metadata = {
    title: '자주 묻는 질문 - Kemotown',
    description: '케모타운에 대해 자주 묻는 질문과 답변을 확인하세요',
};

const faqItems = [
    {
        category: '계정 & 가입',
        questions: [
            {
                q: 'Kemotown에 어떻게 가입하나요?',
                a: 'Google 또는 Kakao 계정으로 간편하게 로그인할 수 있습니다. 별도의 회원가입 절차 없이 OAuth 로그인만으로 계정이 자동 생성됩니다.',
            },
            {
                q: '닉네임은 변경할 수 있나요?',
                a: '네, 프로필 설정 페이지에서 언제든지 표시 이름과 사용자명을 변경할 수 있습니다.',
            },
            {
                q: '프로필을 비공개로 설정할 수 있나요?',
                a: '네, 프로필 설정에서 공개/비공개 설정을 변경할 수 있습니다. 비공개 프로필은 로그인한 사용자에게만 표시됩니다.',
            },
        ],
    },
    {
        category: '이벤트',
        questions: [
            {
                q: '이벤트를 어떻게 만들 수 있나요?',
                a: '로그인 후 "이벤트 만들기" 버튼을 클릭하여 새 이벤트를 생성할 수 있습니다. 제목, 설명, 날짜, 장소 등의 정보를 입력하세요.',
            },
            {
                q: '이벤트 참가 신청은 어떻게 하나요?',
                a: '이벤트 상세 페이지에서 "참석" 버튼을 클릭하면 됩니다. 일부 이벤트는 주최자 승인이 필요할 수 있습니다.',
            },
            {
                q: '이벤트 참가를 취소하고 싶어요.',
                a: '이벤트 상세 페이지에서 참가 상태를 변경하거나 취소할 수 있습니다.',
            },
            {
                q: '정원이 찬 이벤트에 대기자로 등록할 수 있나요?',
                a: '네, 정원이 찬 이벤트에서 대기자 명단에 등록할 수 있으며, 자리가 나면 알림을 받게 됩니다.',
            },
        ],
    },
    {
        category: '범프 시스템',
        questions: [
            {
                q: '범프가 무엇인가요?',
                a: '범프는 실제로 만난 사람과의 인연을 기록하는 기능입니다. QR 코드, 수동 입력, 또는 NFC를 통해 범프할 수 있습니다.',
            },
            {
                q: '범프는 어떻게 하나요?',
                a: '상대방의 프로필에서 "범프" 버튼을 클릭하거나, 이벤트에서 QR 코드를 스캔하여 범프할 수 있습니다.',
            },
            {
                q: '범프 기록은 삭제할 수 있나요?',
                a: '네, 내 범프 목록에서 원하는 범프를 삭제할 수 있습니다.',
            },
        ],
    },
    {
        category: '프라이버시 & 데이터',
        questions: [
            {
                q: '제 개인정보는 안전한가요?',
                a: 'Kemotown은 개인정보 보호를 매우 중요하게 생각합니다. OAuth를 통해 비밀번호를 저장하지 않으며, 필요한 최소한의 정보만 수집합니다.',
            },
            {
                q: '계정을 삭제하고 싶어요.',
                a: '프로필 설정에서 계정 삭제를 요청할 수 있습니다. 모든 데이터는 삭제 요청 후 30일 이내에 완전히 삭제됩니다.',
            },
        ],
    },
];

export default function FAQPage() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            {/* Header */}
            <div className="text-center mb-12">
                <h1 className="text-4xl font-display font-bold text-forest-800 dark:text-cream-100 mb-4">
                    자주 묻는 질문
                </h1>
                <p className="text-warm-500 dark:text-warm-400 font-korean text-lg">
                    Kemotown에 대해 자주 묻는 질문과 답변입니다
                </p>
            </div>

            {/* FAQ Categories */}
            <div className="space-y-8">
                {faqItems.map((category) => (
                    <div key={category.category}>
                        <h2 className="text-xl font-display font-bold text-forest-700 dark:text-forest-300 mb-4 pb-2 border-b border-warm-200 dark:border-forest-800">
                            {category.category}
                        </h2>
                        <div className="space-y-4">
                            {category.questions.map((item, index) => (
                                <details
                                    key={index}
                                    className="group card-elevated p-4"
                                >
                                    <summary className="flex items-center justify-between cursor-pointer list-none">
                                        <span className="font-medium text-forest-800 dark:text-cream-100 font-korean pr-4">
                                            {item.q}
                                        </span>
                                        <ChevronDown className="w-5 h-5 text-warm-400 dark:text-warm-500 flex-shrink-0 transform group-open:rotate-180 transition-transform" />
                                    </summary>
                                    <p className="mt-3 text-warm-600 dark:text-warm-400 font-korean leading-relaxed pl-0">
                                        {item.a}
                                    </p>
                                </details>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Contact */}
            <div className="mt-12 text-center card-elevated p-8">
                <h3 className="text-lg font-display font-bold text-forest-800 dark:text-cream-100 mb-2">
                    찾으시는 답변이 없으신가요?
                </h3>
                <p className="text-warm-500 dark:text-warm-400 font-korean mb-4">
                    더 궁금한 점이 있으시다면 언제든 문의해 주세요
                </p>
                <Link
                    href="/events"
                    className="inline-block px-6 py-3 bg-forest-600 text-white rounded-xl font-medium hover:bg-forest-700 transition-colors"
                >
                    커뮤니티 둘러보기
                </Link>
            </div>
        </div>
    );
}
