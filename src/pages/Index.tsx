import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';

const HERO_IMG = 'https://cdn.poehali.dev/projects/20a58e1b-bbfa-4de9-9afd-c23c477f5b6e/files/2cd56e6c-d6ed-4598-9a4a-854336bd5be1.jpg';
const CHARITY_IMG = 'https://cdn.poehali.dev/projects/20a58e1b-bbfa-4de9-9afd-c23c477f5b6e/files/faf47638-08e0-4ad3-b5ce-4251a5af2944.jpg';

const products = [
  { id: 1, name: 'Перстень Фараона', era: 'Древний Египет', price: '184 000 ₽', icon: 'Gem' },
  { id: 2, name: 'Амулет Солнца', era: 'Византия', price: '96 500 ₽', icon: 'Sun' },
  { id: 3, name: 'Колье Династии', era: 'Месопотамия', price: '312 000 ₽', icon: 'Crown' },
  { id: 4, name: 'Браслет Скифов', era: 'Скифия', price: '127 800 ₽', icon: 'Circle' },
  { id: 5, name: 'Серьги Луны', era: 'Эллада', price: '74 200 ₽', icon: 'Moon' },
  { id: 6, name: 'Печать Царя', era: 'Персия', price: '258 000 ₽', icon: 'Stamp' },
];

const Index = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const scrollTo = (id: string) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/80 border-b border-border">
        <div className="container flex items-center justify-between h-20">
          <button onClick={() => scrollTo('top')} className="flex items-center gap-2">
            <Icon name="Sparkles" className="text-primary" size={26} />
            <span className="font-display text-2xl tracking-[0.3em] text-gold-gradient font-semibold">AURUM</span>
          </button>
          <nav className="hidden md:flex items-center gap-10 font-display text-sm tracking-widest uppercase">
            <button onClick={() => scrollTo('top')} className="hover:text-primary transition-colors">Главная</button>
            <button onClick={() => scrollTo('catalog')} className="hover:text-primary transition-colors">Каталог</button>
            <button onClick={() => scrollTo('charity')} className="hover:text-primary transition-colors">Благотворительность</button>
          </nav>
          <button className="md:hidden text-primary" onClick={() => setMenuOpen(!menuOpen)}>
            <Icon name={menuOpen ? 'X' : 'Menu'} size={28} />
          </button>
        </div>
        {menuOpen && (
          <nav className="md:hidden flex flex-col gap-4 px-6 pb-6 font-display text-sm tracking-widest uppercase animate-fade-in">
            <button onClick={() => scrollTo('top')} className="text-left py-2 border-b border-border">Главная</button>
            <button onClick={() => scrollTo('catalog')} className="text-left py-2 border-b border-border">Каталог</button>
            <button onClick={() => scrollTo('charity')} className="text-left py-2">Благотворительность</button>
          </nav>
        )}
      </header>

      {/* HERO */}
      <section id="top" className="relative min-h-screen flex items-center ornament-bg pt-20">
        <div className="container grid md:grid-cols-2 gap-12 items-center py-16">
          <div className="animate-float-up">
            <p className="font-display tracking-[0.4em] uppercase text-primary text-sm mb-6 animate-shimmer">Сокровища тысячелетий</p>
            <h1 className="font-serif text-5xl md:text-7xl leading-[1.05] mb-8">
              Древнее <span className="text-gold-gradient italic">золото</span>, что пережило империи
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-md leading-relaxed">
              Украшения, вдохновлённые великими цивилизациями. Каждое изделие хранит дыхание веков — и дарит надежду тем, кто в ней нуждается.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button onClick={() => scrollTo('catalog')} className="font-display tracking-widest uppercase glow-gold h-12 px-8">
                Смотреть каталог
              </Button>
              <Button onClick={() => scrollTo('charity')} variant="outline" className="font-display tracking-widest uppercase border-primary text-primary hover:bg-primary hover:text-primary-foreground h-12 px-8">
                Наша миссия
              </Button>
            </div>
          </div>
          <div className="relative animate-float-up" style={{ animationDelay: '0.2s' }}>
            <div className="absolute -inset-4 bg-primary/20 blur-3xl rounded-full" />
            <img src={HERO_IMG} alt="Древнее золото" className="relative rounded-sm w-full object-cover aspect-square shadow-2xl gold-border border-2" />
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-primary/60 animate-bounce">
          <Icon name="ChevronDown" size={28} />
        </div>
      </section>

      {/* CATALOG */}
      <section id="catalog" className="py-28 border-t border-border">
        <div className="container">
          <div className="text-center mb-16">
            <p className="font-display tracking-[0.4em] uppercase text-primary text-sm mb-4">Коллекция</p>
            <h2 className="font-serif text-4xl md:text-6xl">Реликвии на продажу</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((p, i) => (
              <div
                key={p.id}
                className="group bg-card border border-border rounded-sm p-8 hover:border-primary transition-all duration-500 hover:glow-gold animate-float-up"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className="w-16 h-16 rounded-full border border-primary/40 flex items-center justify-center mb-6 group-hover:bg-primary/10 transition-colors">
                  <Icon name={p.icon} className="text-primary" size={28} />
                </div>
                <p className="font-display tracking-widest uppercase text-xs text-muted-foreground mb-2">{p.era}</p>
                <h3 className="font-serif text-2xl mb-4">{p.name}</h3>
                <div className="flex items-center justify-between">
                  <span className="text-gold-gradient font-display text-xl font-semibold">{p.price}</span>
                  <Button size="sm" variant="ghost" className="text-primary hover:text-primary-foreground hover:bg-primary font-display tracking-wide uppercase text-xs">
                    В корзину
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CHARITY */}
      <section id="charity" className="py-28 border-t border-border ornament-bg">
        <div className="container grid md:grid-cols-2 gap-14 items-center">
          <div className="relative order-2 md:order-1">
            <div className="absolute -inset-4 bg-primary/15 blur-3xl rounded-full" />
            <img src={CHARITY_IMG} alt="Благотворительность" className="relative rounded-sm w-full object-cover aspect-[4/5] gold-border border-2" />
          </div>
          <div className="order-1 md:order-2">
            <p className="font-display tracking-[0.4em] uppercase text-primary text-sm mb-6">Наша миссия</p>
            <h2 className="font-serif text-4xl md:text-6xl mb-8 leading-tight">
              Золото, что <span className="text-gold-gradient italic">творит добро</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
              Мы верим: настоящая ценность золота — не в блеске, а в добре, которое оно несёт. Часть выручки с каждого изделия направляется на благотворительность.
            </p>
            <div className="space-y-5 mb-10">
              {[
                { icon: 'HandHeart', text: '15% с каждой продажи — в фонд помощи' },
                { icon: 'Users', text: 'Поддержка семей и общин в нужде' },
                { icon: 'ShieldCheck', text: 'Прозрачная отчётность по каждому рублю' },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-4">
                  <div className="w-11 h-11 shrink-0 rounded-full border border-primary/40 flex items-center justify-center">
                    <Icon name={item.icon} className="text-primary" size={20} />
                  </div>
                  <span className="text-lg">{item.text}</span>
                </div>
              ))}
            </div>
            <Button className="font-display tracking-widest uppercase glow-gold h-12 px-8">
              Поддержать фонд
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-12">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Icon name="Sparkles" className="text-primary" size={22} />
            <span className="font-display text-xl tracking-[0.3em] text-gold-gradient font-semibold">AURUM</span>
          </div>
          <p className="text-muted-foreground text-sm font-display tracking-wider">© 2026 AURUM · Древнее золото · Добрые дела</p>
          <div className="flex gap-5 text-primary">
            <Icon name="Send" size={20} />
            <Icon name="Instagram" size={20} />
            <Icon name="Mail" size={20} />
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
