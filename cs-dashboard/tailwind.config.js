/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // 브랜드 색상
        azacha: '#ef4444',
        bandreup: '#10b981',
        wintor: '#3b82f6',
        wellbiogen: '#f59e0b',
        // 채널 색상
        kakao: '#FEE500',
        naver: '#03C75A',
        coupang: '#E31837',
        naverpay: '#1EC800',
      },
      fontFamily: {
        sans: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
