import Link from "next/link";

import { AppShell } from "@/components/app-shell/app-shell";

export default function HomePage() {
  return (
    <AppShell>
      <main className="page-shell" id="main-content" tabIndex={-1}>
        <header className="page-heading">
          <p className="eyebrow">Tu espacio personal</p>
          <h1>Todo en calma. Todo a mano.</h1>
          <p className="page-introduction">
            Un lugar sencillo para organizar lo importante, pensado para crecer
            contigo sin añadir ruido.
          </p>
          <div className="hero-actions">
            <Link className="button-link" href="/dashboard">
              Abrir mi espacio
            </Link>
            <Link className="text-link" href="/login">
              Acceder
            </Link>
          </div>
        </header>

        <section aria-labelledby="foundation-title" className="foundation-card">
          <div className="foundation-copy">
            <p className="eyebrow">Base visual</p>
            <h2 id="foundation-title">Tu espacio ya tiene forma</h2>
            <p>
              La estructura de navegación y los fundamentos visuales están
              preparados. Las funciones se incorporarán de manera gradual y solo
              cuando estén listas.
            </p>
          </div>
          <div className="foundation-status">
            <span className="status-badge">Sistema preparado</span>
          </div>
        </section>

        <section
          aria-label="Principios del producto"
          className="principles-grid"
        >
          <article className="principle-card">
            <span className="principle-number">01</span>
            <h2>Privado por diseño</h2>
            <p>Tus datos permanecen bajo tu control desde el primer momento.</p>
          </article>
          <article className="principle-card">
            <span className="principle-number">02</span>
            <h2>Modular de verdad</h2>
            <p>
              Activa únicamente las herramientas que aporten valor a tu día a
              día.
            </p>
          </article>
          <article className="principle-card">
            <span className="principle-number">03</span>
            <h2>Cálido y sencillo</h2>
            <p>
              Una interfaz serena, accesible y cómoda en cualquier dispositivo.
            </p>
          </article>
        </section>
      </main>
    </AppShell>
  );
}
