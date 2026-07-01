/* Placeholder business-signup landing — reached from "Unirse como negocio".
   Intentionally minimal: a single hero with the approved Header/Footer. Not the
   final business landing page. */
function BusinessLanding({ onHome, onLogin }) {
  const DS = window.RezervameDesignSystem_4317c4;
  const { Header, Footer, Button, Glyph } = DS;
  const RZ = window.RZ;
  const logo = '../../assets/logos/rezervame-color.png';
  const logoW = '../../assets/logos/rezervame-white.png';

  return (
    <div style={{ background: 'var(--rz-gray-050)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header variant="home" logoSrc={logo} sticky onLogoClick={onHome} onLogin={onLogin} />

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px clamp(20px,5vw,40px)' }}>
        <div style={{ maxWidth: 620, textAlign: 'center' }}>
          <span style={{ display: 'inline-block', fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--rz-coral)', marginBottom: 18 }}>Para negocios</span>
          <h1 style={{ fontSize: 'clamp(32px,4.5vw,48px)', fontWeight: 700, color: 'var(--rz-navy)', letterSpacing: '-0.6px', lineHeight: 1.12 }}>Únete a Rezervame</h1>
          <p style={{ fontSize: 18, color: 'var(--rz-gray-600)', marginTop: 18, lineHeight: 1.55, maxWidth: 500, marginLeft: 'auto', marginRight: 'auto' }}>
            Haz crecer tu negocio y recibe reservas en línea de nuevos clientes.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginTop: 32 }}>
            <Button variant="primary" size="lg" rightIcon="arrowRight">Solicitar acceso</Button>
            <Button variant="outline" size="lg">Conocer más</Button>
          </div>
          <div style={{ marginTop: 40 }}>
            <button onClick={onHome} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, color: 'var(--rz-gray-500)' }}>
              <Glyph name="chevronLeft" size={16} />Volver al inicio
            </button>
          </div>
        </div>
      </main>

      <Footer logoSrc={logoW} columns={RZ.footerColumns} socials={['instagram', 'facebook', 'linkedin', 'x']} contentMax="min(94vw, 1600px)" />
    </div>
  );
}
window.BusinessLanding = BusinessLanding;
