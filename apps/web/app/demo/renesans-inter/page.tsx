import type { Metadata } from "next";
import { ArrowUpRight, Check, ChevronDown, Mail, MapPin, MessageCircle, Phone } from "lucide-react";

import {
  contacts,
  everyPackageIncludes,
  faq,
  methods,
  packages,
  placeFacts,
  selfTests,
  steps,
  treatments,
  trustPoints,
} from "./content";

export const metadata: Metadata = {
  title: "Ренесанс-Интер - демо",
  description: "Мобилна демо версия на сайта на центъра за лечение на зависимости Ренесанс-Интер, Варна.",
  robots: { index: false, follow: false },
};

const heading = "font-[family-name:var(--font-forum)] font-normal tracking-tight text-[#0b2533]";
const eyebrow = "text-xs font-semibold uppercase tracking-[0.2em] text-[#2c6f7c]";

function Section({
  id,
  label,
  title,
  children,
  className = "",
}: {
  id: string;
  label: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={`px-5 py-16 sm:px-8 md:py-24 ${className}`}>
      <div className="mx-auto max-w-5xl">
        <p className={eyebrow}>{label}</p>
        <h2 id={`${id}-title`} className={`${heading} mt-3 text-3xl sm:text-4xl md:text-5xl`}>
          {title}
        </h2>
        <div className="mt-8 md:mt-12">{children}</div>
      </div>
    </section>
  );
}

export default function RenesansInterDemoPage() {
  return (
    <div className="min-h-screen bg-[#fbf7f0] pb-24 font-[family-name:var(--font-inter)] text-[#28414a] md:pb-0">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-[#0b2533]/10 bg-[#fbf7f0]/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3 sm:px-8">
          <a href="#top" className="flex items-baseline gap-2">
            <span className={`${heading} text-xl`}>Ренесанс</span>
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#2c6f7c]">Интер</span>
          </a>
          <nav aria-label="Основна навигация" className="hidden items-center gap-6 text-sm md:flex">
            <a href="#lechenie" className="hover:text-[#0b2533]">Лечение</a>
            <a href="#metod" className="hover:text-[#0b2533]">Методика</a>
            <a href="#paketi" className="hover:text-[#0b2533]">Пакети</a>
            <a href="#kontakti" className="hover:text-[#0b2533]">Контакти</a>
          </nav>
          <a
            href={contacts.phoneHref}
            className="inline-flex items-center gap-2 rounded-full bg-[#0b2533] px-4 py-2 text-sm font-medium text-[#fbf7f0] transition-colors hover:bg-[#1d5566]"
          >
            <Phone className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">{contacts.phone}</span>
            <span className="sm:hidden">Обади се</span>
          </a>
        </div>
      </header>

      <main id="top">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-b from-[#0b2533] via-[#1d5566] to-[#e9b27a] px-5 pt-16 pb-28 text-[#fdf6ea] sm:px-8 md:pt-24 md:pb-40">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-40 left-1/2 size-[28rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,#fff4dc_0%,#f7c98c80_35%,transparent_70%)] md:left-3/4"
          />
          <div className="relative mx-auto max-w-5xl">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#f6d9b0]">
              Център за лечение на зависимости · Варна
            </p>
            <h1 className="mt-5 max-w-2xl font-[family-name:var(--font-forum)] text-4xl leading-[1.1] sm:text-5xl md:text-6xl">
              Честност и откритост - ключ към всяка победа
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-[#fdf6ea]/85 sm:text-lg">
              Лечение на наркомания, алкохолизъм, хазарт и интернет зависимост на брега на Черно море. Анонимно, с
              индивидуален план за всеки пациент.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={contacts.phoneHref}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#fdf6ea] px-6 py-3.5 font-medium text-[#0b2533] transition-transform active:scale-[0.98]"
              >
                <Phone className="size-5" aria-hidden="true" />
                Говорете с консултант
              </a>
              <a
                href="#paketi"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#fdf6ea]/40 px-6 py-3.5 font-medium text-[#fdf6ea] transition-colors hover:bg-[#fdf6ea]/10"
              >
                Пакети и цени
              </a>
            </div>
          </div>
        </section>

        {/* Trust points */}
        <div className="relative z-10 -mt-14 px-5 sm:px-8 md:-mt-20">
          <dl className="mx-auto grid max-w-5xl grid-cols-2 gap-px overflow-hidden rounded-2xl bg-[#0b2533]/10 shadow-xl shadow-[#0b2533]/10 md:grid-cols-4">
            {trustPoints.map((point) => (
              <div key={point.label} className="bg-white px-4 py-5 text-center">
                <dt className="sr-only">{point.label}</dt>
                <dd className={`${heading} text-2xl md:text-3xl`}>{point.value}</dd>
                <dd className="mt-1 text-xs text-[#28414a]/70 md:text-sm">{point.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <Section id="lechenie" label="Какво лекуваме" title="Зависимостта е болест. Тя се лекува.">
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {treatments.map((item) => (
              <li key={item.title}>
                <a
                  href={item.href}
                  className="group flex h-full flex-col rounded-2xl border border-[#0b2533]/10 bg-white p-5 transition-colors hover:border-[#2c6f7c]/40"
                >
                  <span className="flex items-center justify-between">
                    <span className={`${heading} text-xl`}>{item.title}</span>
                    <ArrowUpRight
                      className="size-4 text-[#2c6f7c] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </span>
                  <span className="mt-2 text-sm leading-relaxed text-[#28414a]/80">{item.text}</span>
                </a>
              </li>
            ))}
          </ul>
        </Section>

        <Section id="metod" label="Методика «Ренесанс»" title="Три етапа към трезв живот" className="bg-white">
          <ol className="grid gap-4 md:grid-cols-3">
            {steps.map((step, index) => (
              <li key={step.title} className="relative rounded-2xl bg-[#fbf7f0] p-6">
                <span className="font-[family-name:var(--font-forum)] text-5xl text-[#e9b27a]">0{index + 1}</span>
                <h3 className={`${heading} mt-2 text-2xl`}>{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#28414a]/80">{step.text}</p>
              </li>
            ))}
          </ol>
          <p className="mt-10 max-w-2xl leading-relaxed">
            Химическата зависимост поразява всички сфери на личността - физическа, психическа, социална и духовна.
            Затова авторската ни програма, регистрирана в патентно бюро, лекува човека цялостно.
          </p>
          <ul className="mt-6 flex flex-wrap gap-2" aria-label="Методи на лечение">
            {methods.map((method) => (
              <li key={method} className="rounded-full border border-[#2c6f7c]/25 px-3 py-1.5 text-sm text-[#1d5566]">
                {method}
              </li>
            ))}
          </ul>
        </Section>

        <Section id="paketi" label="Пакети" title="Ясни цени, без изненади">
          <ul className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 sm:-mx-8 sm:px-8 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0">
            {packages.map((pkg) => (
              <li
                key={pkg.name}
                className={`flex w-[82%] shrink-0 snap-center flex-col rounded-2xl p-6 sm:w-[46%] lg:w-auto ${
                  pkg.featured
                    ? "bg-[#0b2533] text-[#fdf6ea] shadow-xl shadow-[#0b2533]/20"
                    : "border border-[#0b2533]/10 bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3
                    className={`font-[family-name:var(--font-forum)] text-2xl ${pkg.featured ? "text-[#fdf6ea]" : "text-[#0b2533]"}`}
                  >
                    {pkg.name}
                  </h3>
                  {pkg.featured && (
                    <span className="rounded-full bg-[#e9b27a] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#0b2533]">
                      Най-избиран
                    </span>
                  )}
                </div>
                <p className={`mt-1 text-sm ${pkg.featured ? "text-[#f6d9b0]" : "text-[#2c6f7c]"}`}>{pkg.duration}</p>
                <p className="mt-5 font-[family-name:var(--font-forum)] text-4xl">{pkg.price}</p>
                {pkg.priceNote && (
                  <p className={`text-xs ${pkg.featured ? "text-[#fdf6ea]/70" : "text-[#28414a]/60"}`}>{pkg.priceNote}</p>
                )}
                <p className={`mt-4 text-sm leading-relaxed ${pkg.featured ? "text-[#fdf6ea]/85" : "text-[#28414a]/80"}`}>
                  {pkg.forWhom}
                </p>
                <ul className="mt-5 space-y-2 text-sm">
                  {pkg.includes.map((item) => (
                    <li key={item} className="flex gap-2">
                      <Check
                        className={`mt-0.5 size-4 shrink-0 ${pkg.featured ? "text-[#e9b27a]" : "text-[#2c6f7c]"}`}
                        aria-hidden="true"
                      />
                      {item}
                    </li>
                  ))}
                </ul>
                <a
                  href={pkg.href}
                  className={`mt-auto inline-flex items-center gap-1 pt-6 text-sm font-medium ${
                    pkg.featured ? "text-[#f6d9b0]" : "text-[#1d5566]"
                  }`}
                >
                  Какво включва
                  <ArrowUpRight className="size-4" aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-8 rounded-2xl bg-[#e9b27a]/15 p-5">
            <p className="text-sm font-semibold text-[#0b2533]">Във всеки пакет:</p>
            <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
              {everyPackageIncludes.map((item) => (
                <li key={item} className="flex gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-[#2c6f7c]" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-[#28414a]/70">Предлагаме и VIP пакет. Ще ви помогнем да изберете.</p>
          </div>
        </Section>

        {/* Place */}
        <section
          id="myastoto"
          aria-labelledby="myastoto-title"
          className="bg-gradient-to-b from-[#1d5566] to-[#0b2533] px-5 py-16 text-[#fdf6ea] sm:px-8 md:py-24"
        >
          <div className="mx-auto max-w-5xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#f6d9b0]">Мястото</p>
            <h2 id="myastoto-title" className="mt-3 font-[family-name:var(--font-forum)] text-3xl sm:text-4xl md:text-5xl">
              Морето лекува също
            </h2>
            <p className="mt-6 max-w-2xl leading-relaxed text-[#fdf6ea]/85">
              Центърът е край курортен комплекс „Златни пясъци“, близо до Варна. Уютна домашна обстановка, тераси с
              изглед към морето, свеж въздух и минерални извори - всичко, което помага на възстановяването.
            </p>
            <dl className="mt-10 grid grid-cols-3 gap-4 border-t border-[#fdf6ea]/15 pt-8">
              {placeFacts.map((fact) => (
                <div key={fact.label}>
                  <dt className="sr-only">{fact.label}</dt>
                  <dd className="font-[family-name:var(--font-forum)] text-xl text-[#f6d9b0] sm:text-3xl">{fact.value}</dd>
                  <dd className="mt-1 text-xs text-[#fdf6ea]/70 sm:text-sm">{fact.label}</dd>
                </div>
              ))}
            </dl>
            <a
              href="https://ren.bg/виртуална-разходка.html"
              className="mt-10 inline-flex items-center gap-2 rounded-full border border-[#fdf6ea]/30 px-5 py-3 text-sm font-medium transition-colors hover:bg-[#fdf6ea]/10"
            >
              Виртуална разходка
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </a>
          </div>
        </section>

        <Section id="testove" label="Самопроверка" title="Не сте сигурни? Започнете с тест.">
          <ul className="grid gap-3 md:grid-cols-3">
            {selfTests.map((test) => (
              <li key={test.title}>
                <a
                  href={test.href}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-[#0b2533]/10 bg-white p-5 transition-colors hover:border-[#2c6f7c]/40"
                >
                  <span>
                    <span className="block font-semibold text-[#0b2533]">{test.title}</span>
                    <span className="mt-1 block text-sm text-[#28414a]/75">{test.text}</span>
                  </span>
                  <ArrowUpRight className="size-5 shrink-0 text-[#2c6f7c]" aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        </Section>

        <Section id="vaprosi" label="Въпроси" title="Това, което ни питат първо" className="bg-white">
          <div className="divide-y divide-[#0b2533]/10 border-y border-[#0b2533]/10">
            {faq.map((item) => (
              <details key={item.question} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-medium text-[#0b2533] [&::-webkit-details-marker]:hidden">
                  {item.question}
                  <ChevronDown
                    className="size-5 shrink-0 text-[#2c6f7c] transition-transform group-open:rotate-180"
                    aria-hidden="true"
                  />
                </summary>
                <p className="mt-3 max-w-2xl leading-relaxed text-[#28414a]/85">{item.answer}</p>
              </details>
            ))}
          </div>
        </Section>

        <Section id="kontakti" label="Контакти" title="Обадете се. Разговорът е анонимен.">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-[#0b2533] p-6 text-[#fdf6ea]">
              <a href={contacts.phoneHref} className="block font-[family-name:var(--font-forum)] text-3xl">
                {contacts.phone}
              </a>
              <p className="mt-1 text-sm text-[#fdf6ea]/70">Мобилен, Viber и WhatsApp</p>
              <div className="mt-6 flex flex-wrap gap-2">
                <a
                  href={contacts.viberHref}
                  className="inline-flex items-center gap-2 rounded-full bg-[#7360f2] px-4 py-2 text-sm font-medium"
                >
                  <MessageCircle className="size-4" aria-hidden="true" />
                  Viber
                </a>
                <a
                  href={contacts.whatsappHref}
                  className="inline-flex items-center gap-2 rounded-full bg-[#25d366] px-4 py-2 text-sm font-medium text-[#0b2533]"
                >
                  <MessageCircle className="size-4" aria-hidden="true" />
                  WhatsApp
                </a>
              </div>
            </div>
            <ul className="space-y-4 rounded-2xl border border-[#0b2533]/10 bg-white p-6 text-sm">
              <li className="flex gap-3">
                <Phone className="mt-0.5 size-4 shrink-0 text-[#2c6f7c]" aria-hidden="true" />
                <span>
                  <a href={contacts.phoneLandlineHref} className="font-medium text-[#0b2533]">
                    {contacts.phoneLandline}
                  </a>
                  <span className="block text-[#28414a]/70">Стационарен</span>
                </span>
              </li>
              <li className="flex gap-3">
                <Phone className="mt-0.5 size-4 shrink-0 text-[#2c6f7c]" aria-hidden="true" />
                <span>
                  <a href={contacts.phoneRuHref} className="font-medium text-[#0b2533]">
                    {contacts.phoneRu}
                  </a>
                  <span className="block text-[#28414a]/70">За обаждания от Русия</span>
                </span>
              </li>
              <li className="flex gap-3">
                <Mail className="mt-0.5 size-4 shrink-0 text-[#2c6f7c]" aria-hidden="true" />
                <a href={`mailto:${contacts.email}`} className="font-medium text-[#0b2533]">
                  {contacts.email}
                </a>
              </li>
              <li className="flex gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-[#2c6f7c]" aria-hidden="true" />
                <span>{contacts.address}</span>
              </li>
            </ul>
          </div>
        </Section>
      </main>

      <footer className="border-t border-[#0b2533]/10 px-5 py-10 text-xs text-[#28414a]/60 sm:px-8">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 sm:flex-row sm:justify-between">
          <p>© 2010-{new Date().getFullYear()} Ренесанс-Интер</p>
          <p>
            Демо концепция от{" "}
            <a href="/projects/renesans-inter" className="underline underline-offset-2">
              sbozh.me
            </a>
          </p>
        </div>
      </footer>

      {/* Thumb-reach action bar, phones only */}
      <nav
        aria-label="Бърза връзка"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 gap-2 border-t border-[#0b2533]/10 bg-[#fbf7f0]/95 px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden"
      >
        <a
          href={contacts.phoneHref}
          className="flex flex-col items-center gap-0.5 rounded-xl bg-[#0b2533] py-2 text-xs font-medium text-[#fdf6ea]"
        >
          <Phone className="size-5" aria-hidden="true" />
          Обади се
        </a>
        <a
          href={contacts.viberHref}
          className="flex flex-col items-center gap-0.5 rounded-xl py-2 text-xs font-medium text-[#7360f2]"
        >
          <MessageCircle className="size-5" aria-hidden="true" />
          Viber
        </a>
        <a
          href={contacts.whatsappHref}
          className="flex flex-col items-center gap-0.5 rounded-xl py-2 text-xs font-medium text-[#128c4a]"
        >
          <MessageCircle className="size-5" aria-hidden="true" />
          WhatsApp
        </a>
      </nav>
    </div>
  );
}
