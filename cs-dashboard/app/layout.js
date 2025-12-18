import './globals.css';

export const metadata = {
  title: 'CS 통합 대시보드',
  description: '4개 브랜드 13개 채널 고객 문의 통합 관리',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body className="bg-slate-900 text-slate-200 min-h-screen">
        {children}
      </body>
    </html>
  );
}
