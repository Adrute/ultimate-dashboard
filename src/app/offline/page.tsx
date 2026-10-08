import Link from "next/link";

export const metadata = { title: "Sin conexión" };

export default function OfflinePage() {
  return (
    <main className="offline-page" id="main-content">
      <span aria-hidden="true" className="offline-icon">
        U
      </span>
      <p className="eyebrow">Sin conexión</p>
      <h1>Volvemos cuando vuelva tu red.</h1>
      <p>
        UltimateDashboard no guarda tareas ni páginas privadas para usarlas sin
        conexión. Reconecta para acceder a tus datos actualizados.
      </p>
      <Link className="button-link" href="/dashboard">
        Reintentar
      </Link>
    </main>
  );
}
