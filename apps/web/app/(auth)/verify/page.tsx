export default function VerifyPage() {
  return (
    <main className="mobile-stack" style={{ padding: '32px 24px 48px' }}>
      <section className="surface" style={{ maxWidth: 620, margin: '0 auto', padding: 32 }}>
        <div className="stack">
          <span className="badge warning">Phone OTP placeholder</span>
          <div>
            <h1 style={{ margin: 0, fontSize: 40 }}>Verify your code</h1>
            <p className="fine" style={{ marginTop: 8 }}>
              Placeholder UI mirrors the planned Supabase OTP details: 6 digits, 60-second expiry, and
              test-number support. The first real auth path remains email magic-link.
            </p>
          </div>

          <div className="card-grid">
            {['1', '8', '0', '0', '1', '2'].map((digit, index) => (
              <div
                className="card"
                key={index}
                style={{
                  alignItems: 'center',
                  display: 'flex',
                  fontSize: 28,
                  fontWeight: 700,
                  justifyContent: 'center',
                  minHeight: 96,
                }}
              >
                {digit}
              </div>
            ))}
          </div>

          <div className="card">
            <div className="stack" style={{ gap: 8 }}>
              <div className="fine">Planned test phone pair</div>
              <code>18625918688 / 123456</code>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
