export const metadata = {
  title: "Panel",
};

export default function DashboardPage() {
  return (
    <main className="page-shell" id="main-content" tabIndex={-1}>
      <header className="page-heading dashboard-heading">
        <p className="eyebrow">Panel personal</p>
        <h1>Tu espacio está protegido.</h1>
        <p className="page-introduction">
          La sesión y el perfil ya están conectados. Los módulos se incorporarán
          en los siguientes verticales.
        </p>
      </header>
    </main>
  );
}
