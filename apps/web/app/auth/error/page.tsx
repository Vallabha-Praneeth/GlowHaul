type AuthErrorPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readMessage(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AuthErrorPage({ searchParams }: AuthErrorPageProps) {
  const params = (await searchParams) ?? {};
  const message = readMessage(params.message) ?? 'Authentication could not be completed.';

  return (
    <main className="mobile-stack" style={{ padding: '32px 24px 48px' }}>
      <section className="surface" style={{ maxWidth: 620, margin: '0 auto', padding: 32 }}>
        <div className="stack">
          <span className="badge warning">Auth error</span>
          <h1 style={{ margin: 0, fontSize: 36 }}>Magic link confirmation failed.</h1>
          <p className="fine" style={{ margin: 0 }}>
            {message}
          </p>
          <a className="button-secondary" href="/login">
            Return to login
          </a>
        </div>
      </section>
    </main>
  );
}
