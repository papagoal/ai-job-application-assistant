import { Link } from 'react-router-dom'

const workflowSteps = [
  {
    number: '01',
    title: 'Add the role',
    description: 'Paste a job description or import a public listing to capture the role requirements.',
  },
  {
    number: '02',
    title: 'See your match',
    description: 'Compare the role with your real experience and identify the strongest skills and gaps.',
  },
  {
    number: '03',
    title: 'Prepare to apply',
    description: 'Create a tailored resume and cover letter, then keep the application organized.',
  },
]

const productFeatures = [
  {
    label: 'Match analysis',
    title: 'Know where you stand before you apply.',
    description: 'Turn a long job posting into a clear match score, skill comparison, and practical next steps.',
  },
  {
    label: 'Tailored resume',
    title: 'Adapt your resume without inventing experience.',
    description: 'Build a role-specific draft grounded in the resume facts you provide, ready to edit or download.',
  },
  {
    label: 'Application writing',
    title: 'Move from analysis to a complete application.',
    description: 'Draft a focused cover letter and regenerate your tailored resume when the first version is not right.',
  },
  {
    label: 'Job tracker',
    title: 'Keep every opportunity in one workspace.',
    description: 'Track status, private notes, match scores, and saved documents from first review to final decision.',
  },
]

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
      <path d="M4 10h12M11 5l5 5-5 5" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
      <path d="m5 10 3 3 7-7" />
    </svg>
  )
}

function LandingPage() {
  return (
    <div className="landing-page">
      <header className="landing-header">
        <Link className="landing-brand" to="/" aria-label="RoleLumi home">
          <span className="landing-brand-mark" aria-hidden="true">
            <img src="/rolelumi-logo.png" alt="" />
          </span>
          <span>RoleLumi</span>
        </Link>

        <nav className="landing-navigation" aria-label="Landing page navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#features">Features</a>
          <Link to="/pricing">Pricing</Link>
        </nav>

        <Link className="landing-workspace-link" to="/dashboard">
          Open workspace
        </Link>
      </header>

      <main>
        <section className="landing-hero">
          <div className="landing-hero-copy">
            <p className="landing-eyebrow">Your AI application workspace</p>
            <h1>Turn every job posting into a stronger application.</h1>
            <p className="landing-hero-description">
              RoleLumi compares the role with your real experience, then helps you prepare a tailored resume, cover letter, and clear application plan.
            </p>
            <div className="landing-hero-actions">
              <Link className="landing-primary-action" to="/applications/new">
                Try RoleLumi free
                <ArrowIcon />
              </Link>
              <a className="landing-secondary-action" href="#how-it-works">
                See how it works
              </a>
            </div>
            <ul className="landing-trust-list" aria-label="Product benefits">
              <li><CheckIcon /> No credit card</li>
              <li><CheckIcon /> Start as a guest</li>
              <li><CheckIcon /> Keep your work private</li>
            </ul>
          </div>

          <div className="landing-product-preview" aria-label="Example RoleLumi job analysis">
            <div className="landing-preview-window">
              <div className="landing-preview-topbar">
                <span className="landing-preview-logo">
                  <img src="/rolelumi-logo.png" alt="" />
                </span>
                <span>RoleLumi</span>
                <span className="landing-preview-status">Analysis ready</span>
              </div>
              <div className="landing-preview-body">
                <div className="landing-preview-heading">
                  <div>
                    <span>Frontend Developer</span>
                    <strong>Northstar Labs</strong>
                  </div>
                  <div className="landing-score">
                    <strong>86%</strong>
                    <span>Match</span>
                  </div>
                </div>

                <div className="landing-preview-grid">
                  <article>
                    <span className="landing-preview-label">Strong matches</span>
                    <ul>
                      <li><CheckIcon /> React &amp; TypeScript</li>
                      <li><CheckIcon /> REST API experience</li>
                      <li><CheckIcon /> Automated testing</li>
                    </ul>
                  </article>
                  <article>
                    <span className="landing-preview-label">Your next step</span>
                    <strong>Tailored resume ready</strong>
                    <p>Role-specific summary and experience points prepared from your profile.</p>
                    <span className="landing-preview-button">Review draft <ArrowIcon /></span>
                  </article>
                </div>
              </div>
            </div>
            <div className="landing-preview-accent" aria-hidden="true">Role clarity, without the guesswork.</div>
          </div>
        </section>

        <section className="landing-proof" aria-label="RoleLumi capabilities">
          <p>One focused workspace for the work between finding a role and submitting the application.</p>
          <div>
            <span>Analyze</span>
            <span>Tailor</span>
            <span>Write</span>
            <span>Track</span>
          </div>
        </section>

        <section className="landing-section landing-workflow" id="how-it-works">
          <div className="landing-section-heading">
            <p className="landing-eyebrow">How it works</p>
            <h2>From job description to application-ready.</h2>
            <p>Bring the role and your resume. RoleLumi organizes the rest into a simple, reviewable workflow.</p>
          </div>

          <div className="landing-step-grid">
            {workflowSteps.map((step) => (
              <article key={step.number} className="landing-step-card">
                <span>{step.number}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-section landing-features" id="features">
          <div className="landing-section-heading landing-feature-heading">
            <p className="landing-eyebrow">Built for thoughtful applications</p>
            <h2>Useful AI, with you still in control.</h2>
            <p>Every generated document stays editable, and your experience remains the source of truth.</p>
          </div>

          <div className="landing-feature-grid">
            {productFeatures.map((feature, index) => (
              <article key={feature.label} className="landing-feature-card">
                <span className="landing-feature-number">0{index + 1}</span>
                <p className="landing-feature-label">{feature.label}</p>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-final-cta">
          <div>
            <p className="landing-eyebrow">Your next application</p>
            <h2>Make it clearer before you send it.</h2>
            <p>Start with one job description. No credit card required.</p>
          </div>
          <Link className="landing-primary-action landing-primary-light" to="/applications/new">
            Analyze my first role
            <ArrowIcon />
          </Link>
        </section>
      </main>

      <footer className="landing-footer">
        <Link className="landing-brand" to="/">
          <span className="landing-brand-mark" aria-hidden="true">
            <img src="/rolelumi-logo.png" alt="" />
          </span>
          <span>RoleLumi</span>
        </Link>
        <p>AI-assisted job applications, grounded in your experience.</p>
        <Link to="/dashboard">Open workspace</Link>
      </footer>
    </div>
  )
}

export default LandingPage
