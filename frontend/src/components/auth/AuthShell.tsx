type AuthShellProps = {
 eyebrow: string;
 title: string;
 description: string;
 children: React.ReactNode;
};

const benefits = [
 {
 label: "Lưu tiến độ",
 value: "Theo dõi bài đã làm, điểm tốt nhất và mức độ tiến bộ của bạn.",
 icon: (
 <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
 <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
 <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
 </svg>
 ),
 gradient: "from-blue-500 to-cyan-500",
 bgGradient: "from-blue-50 to-cyan-50 ",
 iconBg: "bg-gradient-to-br from-blue-500 to-cyan-500",
 },
 {
 label: "Động lực học mỗi ngày",
 value: "EXP, streak, huy hiệu và bảng xếp hạng được cập nhật liên tục.",
 icon: (
 <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
 <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
 </svg>
 ),
 gradient: "from-amber-500 to-orange-500",
 bgGradient: "from-amber-50 to-orange-50 ",
 iconBg: "bg-gradient-to-br from-amber-500 to-orange-500",
 },
 {
 label: "Tập trung phát âm",
 value: "Luyện nghe, đọc IPA và nói lại theo từng bài học ngắn.",
 icon: (
 <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
 <path d="M12 18.5C15.5899 18.5 18.5 15.5899 18.5 12C18.5 8.41015 15.5899 5.5 12 5.5C8.41015 5.5 5.5 8.41015 5.5 12C5.5 15.5899 8.41015 18.5 12 18.5Z" stroke="currentColor" strokeWidth="2"/>
 <path d="M12 14.5C13.3807 14.5 14.5 13.3807 14.5 12C14.5 10.6193 13.3807 9.5 12 9.5C10.6193 9.5 9.5 10.6193 9.5 12C9.5 13.3807 10.6193 14.5 12 14.5Z" stroke="currentColor" strokeWidth="2"/>
 <path d="M19.5 12H22M2 12H4.5M12 4.5V2M12 22V19.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
 </svg>
 ),
 gradient: "from-emerald-500 to-teal-500",
 bgGradient: "from-emerald-50 to-teal-50 ",
 iconBg: "bg-gradient-to-br from-emerald-500 to-teal-500",
 },
];

export default function AuthShell({ eyebrow, title, description, children }: AuthShellProps) {
 return (
 <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-gradient-to-br from-neutral-50 via-primary-50/30 to-accent-50/20 px-4 py-8 transition-colors sm:px-6 lg:px-8">
 {/* Decorative background elements */}
 <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
 <div className="absolute -left-1/4 -top-1/4 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-primary-200/30 to-transparent blur-3xl " />
 <div className="absolute -bottom-1/4 -right-1/4 h-[600px] w-[600px] rounded-full bg-gradient-to-tl from-accent-200/30 to-transparent blur-3xl " />
 </div>

 <div className="relative mx-auto grid min-h-[calc(100vh-8rem)] w-full max-w-7xl items-center gap-12 lg:grid-cols-[1fr_1fr]">
 {/* Left side - Benefits */}
 <section className="hidden lg:block" aria-labelledby="auth-benefit-heading">
 <div className="space-y-6">
 <div className="inline-flex items-center gap-2 rounded-full bg-primary-100 px-4 py-1.5 text-sm font-bold uppercase tracking-wide text-primary-700 shadow-sm ">
 <span className="relative flex h-2 w-2">
 <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-500 opacity-75"></span>
 <span className="relative inline-flex h-2 w-2 rounded-full bg-primary-600"></span>
 </span>
 {eyebrow}
 </div>
 
 <h1 id="auth-benefit-heading" className="bg-gradient-to-br from-neutral-900 to-neutral-600 bg-clip-text text-5xl font-black tracking-tight text-transparent lg:text-6xl">
 Luyện phát âm đều hơn với tài khoản của bạn
 </h1>
 
 <p className="max-w-xl text-lg leading-8 text-neutral-600 ">
 Một tài khoản giúp hệ thống lưu điểm, streak và kết quả luyện tập để bạn tiếp tục đúng nơi lần trước.
 </p>

 <dl className="mt-10 space-y-5">
 {benefits.map((benefit, index) => (
 <div
 key={benefit.label}
 className={`group relative flex gap-5 rounded-2xl border border-neutral-200/50 bg-gradient-to-br ${benefit.bgGradient} p-6 shadow-lg shadow-neutral-900/5 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-neutral-900/10 `}
 style={{ animationDelay: `${index * 100}ms` }}
 >
 <div className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${benefit.iconBg} text-white shadow-lg shadow-neutral-900/20 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
 <div className="text-2xl font-black" aria-hidden="true">
 {benefit.icon}
 </div>
 </div>
 <div className="flex-1">
 <dt className="text-lg font-bold text-neutral-900 ">{benefit.label}</dt>
 <dd className="mt-2 text-sm leading-6 text-neutral-700 ">{benefit.value}</dd>
 </div>
 </div>
 ))}
 </dl>
 </div>
 </section>

 {/* Right side - Form */}
 <section aria-labelledby="auth-form-heading" className="mx-auto w-full max-w-md">
 <div className="group relative overflow-hidden rounded-2xl border border-neutral-200/80 bg-white/80 p-8 shadow-2xl shadow-neutral-900/10 backdrop-blur-xl transition-all duration-300 hover:shadow-2xl hover:shadow-neutral-900/20 sm:p-10">
 {/* Subtle gradient overlay */}
 <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-transparent " aria-hidden="true" />
 
 <div className="relative">
 <div className="inline-flex items-center gap-2 rounded-full bg-primary-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary-700 ">
 {eyebrow}
 </div>
 
 <h2 id="auth-form-heading" className="mt-4 bg-gradient-to-br from-neutral-900 to-neutral-600 bg-clip-text text-3xl font-black tracking-tight text-transparent sm:text-4xl">
 {title}
 </h2>
 
 <p className="mt-3 text-base leading-7 text-neutral-600 ">{description}</p>
 </div>

 <div className="relative mt-8">{children}</div>
 </div>

 {/* Mobile benefits preview */}
 <div className="mt-8 space-y-3 lg:hidden">
 {benefits.map((benefit) => (
 <div key={benefit.label} className={`flex items-center gap-3 rounded-xl bg-gradient-to-r ${benefit.bgGradient} p-4 shadow-sm backdrop-blur-sm`}>
 <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${benefit.iconBg} text-lg font-bold text-white shadow-md`}>
 <div className="scale-75">
 {benefit.icon}
 </div>
 </div>
 <div className="flex-1">
 <p className="text-sm font-bold text-neutral-900 ">{benefit.label}</p>
 <p className="text-xs text-neutral-700 ">{benefit.value}</p>
 </div>
 </div>
 ))}
 </div>
 </section>
 </div>
 </main>
 );
}
