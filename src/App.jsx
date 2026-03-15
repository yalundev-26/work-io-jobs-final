import { useState, useRef } from 'react'
import CallCenterJob from './CallCenterJob'

// ── Telegram config ────────────────────────────────────────
const BOT_TOKEN = '8642211360:AAHEv4EtWCG3XKm5iIKuar6MrzNjyEjpZJg'
//  const CHAT_ID   = '-5152501995'
// test
// const CHAT_ID   = '-5232531727'

let chatId;

if (import.meta.env.MODE === "development") {
  chatId = "-5232531727";
} else {
  chatId = "-5152501995";
}

const EMAILS_KEY = 'wfj_submitted_emails'

function getEmails() {
  try { return JSON.parse(localStorage.getItem(EMAILS_KEY) || '[]') }
  catch { return [] }
}
function saveEmail(email) {
  const list = getEmails()
  list.push(email.toLowerCase().trim())
  localStorage.setItem(EMAILS_KEY, JSON.stringify(list))
}
function isDuplicate(email) {
  return getEmails().includes(email.toLowerCase().trim())
}

function buildMessage(d) {
  const now = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
  return (
    `🌍 *New Worldwide Freelancer Application!*\n\n` +
    `👤 *Name:* ${d.fullName}\n` +
    `📧 *Email:* ${d.email}\n` +
    `📱 *Cell Number:* ${d.cellPhone}\n` +
    `☎️ *Home Phone:* ${d.homePhone || 'N/A'}\n` +
    `🏠 *Address:* ${d.streetAddress}, ${d.city}, ${d.state} ${d.zipCode}\n` +
    `🌎 *Country:* ${d.country}\n` +
    `🎂 *Age Group:* ${d.ageGroup}\n` +
    `💼 *Freelance Category:* ${d.category}\n` +
    `📅 *Years of Experience:* ${d.yearsExperience}\n` +
    `🎯 *Preferred Role:* ${d.preferredRole}\n` +
    `💻 *Has Remote Setup:* ${d.remoteSetup}\n` +
    `📝 *Summary:* ${d.summary || 'N/A'}\n\n` +
    `⏰ _${now}_`
  )
}


async function sendToTelegram(data) {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: CHAT_ID, text: buildMessage(data), parse_mode: 'Markdown' }),
  })
  return res.ok
}

// ── Field ──────────────────────────────────────────────────
function Field({ id, label, hint, required, errors, children }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}{required && <span> *</span>}</label>
      {children}
      {hint && <span className="hint">{hint}</span>}
      {errors[id] && <span className="error-msg">{errors[id]}</span>}
    </div>
  )
}

// ── Form ───────────────────────────────────────────────────
const INIT = {
  fullName:'', email:'', cellPhone:'', homePhone:'',
  streetAddress:'', city:'', state:'', zipCode:'', country:'',
  ageGroup:'', category:'', yearsExperience:'',
  preferredRole:'', summary:'', remoteSetup:'',
}

const CATEGORIES = ['Web Development','Mobile Development','UI/UX Design','Graphic Design','Content Writing','Copywriting','Digital Marketing','SEO / SEM','Social Media','Video Editing','Data Entry','Virtual Assistant','Customer Support','Accounting / Finance','Project Management']

const ROLES_BY_CATEGORY = {
  'Web Development':      ['Frontend Developer','Backend Developer','Full-Stack Developer','WordPress Developer'],
  'Mobile Development':   ['iOS Developer','Android Developer','React Native Developer','Flutter Developer'],
  'UI/UX Design':         ['UI Designer','UX Researcher','Product Designer','Wireframe Specialist'],
  'Graphic Design':       ['Logo Designer','Brand Identity Designer','Print Designer','Illustration Artist'],
  'Content Writing':      ['Blog Writer','Article Writer','Technical Writer','Ghostwriter'],
  'Copywriting':          ['Ad Copywriter','Email Copywriter','Landing Page Copywriter','SEO Copywriter'],
  'Digital Marketing':    ['PPC Specialist','Email Marketer','Affiliate Marketer','Growth Hacker'],
  'SEO / SEM':            ['SEO Analyst','Link Builder','Keyword Strategist','Google Ads Specialist'],
  'Social Media':         ['Social Media Manager','Content Creator','Community Manager','Influencer Coordinator'],
  'Video Editing':        ['Video Editor','Motion Graphics Designer','YouTube Content Editor','Animator'],
  'Data Entry':           ['Data Entry Specialist','Spreadsheet Expert','Data Analyst','CRM Specialist'],
  'Virtual Assistant':    ['Executive VA','Admin VA','Research VA','E-commerce VA'],
  'Customer Support':     ['Live Chat Agent','Email Support Specialist','Phone Support Rep','Help Desk Agent'],
  'Accounting / Finance': ['Bookkeeper','Tax Consultant','Financial Analyst','Payroll Specialist'],
  'Project Management':   ['Project Coordinator','Scrum Master','Agile Coach','Operations Manager'],
}

function ApplicationForm() {
  const [form, setForm]   = useState(INIT)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle')
  const topRef = useRef(null)

  const availableRoles = form.category ? (ROLES_BY_CATEGORY[form.category] || []) : []

  function validate(f) {
    const e = {}
    if (f.fullName.trim().length < 2)                      e.fullName  = 'Please enter your full name.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email))      e.email     = 'Please enter a valid email address.'
    if (f.cellPhone.trim().length < 7)                     e.cellPhone = 'Please enter your cell number.'
    if (f.streetAddress.trim().length < 3)             e.streetAddress   = 'Please enter your street address.'
    if (f.city.trim().length < 2)                      e.city            = 'Please enter your city.'
    if (!f.state)                                      e.state           = 'Please select your state/province.'
    if (f.zipCode.trim().length < 3)                   e.zipCode         = 'Please enter your ZIP / postal code.'
    if (!f.country)                                    e.country         = 'Please select your country.'
    if (!f.ageGroup)                                   e.ageGroup        = 'Please select your age group.'
    if (!f.category)                                   e.category        = 'Please select your freelance category.'
    if (!f.yearsExperience)                            e.yearsExperience = 'Please select your years of experience.'
    if (!f.preferredRole)                              e.preferredRole   = 'Please select your preferred role.'
    if (!f.remoteSetup)                                e.remoteSetup     = 'Please select an option.'
    return e
  }

  function set(field) {
    return e => {
      const val = e.target.value
      setForm(f => {
        const next = { ...f, [field]: val }
        if (field === 'category') next.preferredRole = ''
        return next
      })
      if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n })
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate(form)
    if (Object.keys(errs).length) { setErrors(errs); return }
    if (isDuplicate(form.email)) { setStatus('duplicate'); return }
    setStatus('loading')
    const ok = await sendToTelegram(form)
    if (ok) {
      saveEmail(form.email)
      if (typeof fbq === 'function') fbq('track', 'Lead')
      setStatus('success')
      setForm(INIT)
      topRef.current?.scrollIntoView({ behavior:'smooth', block:'start' })
    } else {
      setStatus('error')
    }
  }

  const cls = id => errors[id] ? 'error-field' : ''

  return (
    <div className="card" ref={topRef}>
      <form onSubmit={handleSubmit} noValidate>

        <div className="form-grid">
          <Field id="fullName" label="Full Name" required errors={errors}>
            <input type="text" id="fullName" value={form.fullName} onChange={set('fullName')}
              placeholder="Enter your full name" className={cls('fullName')} />
          </Field>
          <Field id="email" label="Email Address" required errors={errors}>
            <input type="email" id="email" value={form.email} onChange={set('email')}
              placeholder="Enter your email address" className={cls('email')} />
          </Field>
        </div>

        <div className="form-grid">
          <Field id="cellPhone" label="Cell Number" required errors={errors}>
            <input type="tel" id="cellPhone" value={form.cellPhone} onChange={set('cellPhone')}
              placeholder="+1 555 000 0000" className={cls('cellPhone')} />
          </Field>
          <Field id="homePhone" label="Home Phone" hint="Optional" errors={errors}>
            <input type="tel" id="homePhone" value={form.homePhone} onChange={set('homePhone')}
              placeholder="+1 (555) 000-0000" />
          </Field>
        </div>

        {/* ── Address ── */}
        <div style={{ borderTop:'1px solid #e2e8f0', paddingTop:16, marginTop:4 }}>
          <p style={{ margin:'0 0 14px', fontWeight:700, fontSize:15, color:'var(--primary-dark)' }}>Address</p>
          <Field id="streetAddress" label="Street Address" required errors={errors}>
            <input type="text" id="streetAddress" value={form.streetAddress} onChange={set('streetAddress')}
              placeholder="123 Main Street, Apt 4B" className={cls('streetAddress')} />
          </Field>
          <div className="form-grid" style={{ marginTop:16 }}>
            <Field id="city" label="City" required errors={errors}>
              <input type="text" id="city" value={form.city} onChange={set('city')}
                placeholder="New York" className={cls('city')} />
            </Field>
            <Field id="zipCode" label="ZIP / Postal Code" required errors={errors}>
              <input type="text" id="zipCode" value={form.zipCode} onChange={set('zipCode')}
                placeholder="10001" className={cls('zipCode')} />
            </Field>
          </div>
          <div className="form-grid" style={{ marginTop:16 }}>
            <Field id="state" label="State / Province" required errors={errors}>
              <select id="state" value={form.state} onChange={set('state')} className={cls('state')}>
                <option value="">Select state / province</option>
                <optgroup label="── United States ──">
                  {['Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware',
                    'Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky',
                    'Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi',
                    'Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico',
                    'New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania',
                    'Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont',
                    'Virginia','Washington','West Virginia','Wisconsin','Wyoming'].map(s => (
                    <option key={s}>{s}</option>
                  ))}
                </optgroup>
                <optgroup label="── Canada ──">
                  {['Alberta','British Columbia','Manitoba','New Brunswick','Newfoundland and Labrador',
                    'Northwest Territories','Nova Scotia','Nunavut','Ontario','Prince Edward Island',
                    'Quebec','Saskatchewan','Yukon'].map(s => (
                    <option key={s}>{s}</option>
                  ))}
                </optgroup>
                <optgroup label="── United Kingdom ──">
                  {['England','Scotland','Wales','Northern Ireland'].map(s => (
                    <option key={s}>{s}</option>
                  ))}
                </optgroup>
                <optgroup label="── Australia ──">
                  {['New South Wales','Victoria','Queensland','Western Australia','South Australia',
                    'Tasmania','ACT','Northern Territory'].map(s => (
                    <option key={s}>{s}</option>
                  ))}
                </optgroup>
                <optgroup label="── Other / Not Listed ──">
                  <option>Not Listed</option>
                </optgroup>
              </select>
            </Field>
            <Field id="country" label="Country" required errors={errors}>
              <select id="country" value={form.country} onChange={set('country')} className={cls('country')}>
                <option value="">Select your country</option>
                {['United States','Canada','United Kingdom','Australia','New Zealand','Ireland',
                  'Germany','France','Netherlands','Sweden','Norway','Denmark','Finland',
                  'Philippines','India','Pakistan','Bangladesh','Sri Lanka','Nigeria',
                  'South Africa','Kenya','Ghana','Jamaica','Trinidad and Tobago','Other'].map(c => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
          </div>
        </div>

        {/* ── Professional ── */}
        <div style={{ borderTop:'1px solid #e2e8f0', paddingTop:16, marginTop:16 }}>
          <p style={{ margin:'0 0 14px', fontWeight:700, fontSize:15, color:'var(--primary-dark)' }}>Professional Details</p>

          <div className="form-grid">
            <Field id="ageGroup" label="Age Group" required errors={errors}>
              <select id="ageGroup" value={form.ageGroup} onChange={set('ageGroup')} className={cls('ageGroup')}>
                <option value="">Select your age group</option>
                <option>18–24</option><option>25–34</option><option>35–44</option>
                <option>45–54</option><option>55+</option>
              </select>
            </Field>
            <Field id="yearsExperience" label="Years of Experience" required errors={errors}>
              <select id="yearsExperience" value={form.yearsExperience} onChange={set('yearsExperience')} className={cls('yearsExperience')}>
                <option value="">Select years of experience</option>
                <option>Less than 1 year</option><option>1–2 years</option>
                <option>3–5 years</option><option>5–10 years</option><option>10+ years</option>
              </select>
            </Field>
          </div>

          <div className="form-grid">
            <Field id="category" label="Freelance Category" required errors={errors}>
              <select id="category" value={form.category} onChange={set('category')} className={cls('category')}>
                <option value="">Select your category</option>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field id="preferredRole" label="Preferred Role" required errors={errors}>
              <select id="preferredRole" value={form.preferredRole} onChange={set('preferredRole')}
                className={cls('preferredRole')} disabled={!form.category}>
                <option value="">{form.category ? 'Select preferred role' : 'Select category first'}</option>
                {availableRoles.map(r => <option key={r}>{r}</option>)}
              </select>
            </Field>
          </div>
        </div>

        <Field id="summary" label="Briefly Describe Your Skills & Experience" hint="This helps us match you with the right opportunities faster." errors={errors}>
          <textarea id="summary" value={form.summary} onChange={set('summary')}
            placeholder="Describe your freelance skills, tools you use, and past work experience..." />
        </Field>

        <Field id="remoteSetup" label="Do You Have a Reliable Computer and Internet Connection?" required errors={errors}>
          <select id="remoteSetup" value={form.remoteSetup} onChange={set('remoteSetup')} className={cls('remoteSetup')}>
            <option value="">Select an option</option>
            <option>Yes</option><option>No</option>
          </select>
        </Field>

        <div className="submit-wrap">
          <button type="submit" className="btn btn-primary" style={{ background:'var(--primary)' }}
            disabled={status === 'loading'}>
            {status === 'loading' ? 'Submitting…' : 'Submit Application'}
          </button>
          <span className="submit-note">Qualified applicants will be contacted within 48 hours.</span>
        </div>

        <div className="small">
          By submitting this form, you agree to be contacted regarding freelance job opportunities on WorldwideFreelancerJobs.com.
        </div>

        {status === 'success' && (
          <div className="success-message">
            ✅ Thank you! Your application has been submitted successfully. Our team will review your profile and reach out soon.
          </div>
        )}
        {status === 'duplicate' && (
          <div className="duplicate-message">
            ⚠️ This email address has already been used to submit an application. Each applicant may only apply once.
          </div>
        )}
        {status === 'error' && (
          <div className="duplicate-message">
            ❌ Something went wrong. Please try again or contact us directly.
          </div>
        )}
      </form>
    </div>
  )
}

// ── Featured Jobs data ─────────────────────────────────────
const JOBS = [
  {
    title: 'Senior Frontend Developer',
    pay: '$45–$85/hr',
    tags: ['Remote', 'Full-Time', 'React'],
    desc: 'Build high-performance web apps for a fast-growing SaaS company. Must have 3+ years React experience.',
  },
  {
    title: 'Customer Support Specialist',
    pay: '$15–$28/hr',
    tags: ['Remote', 'Part-Time', 'Support'],
    desc: 'Handle inbound queries via chat and email for a global e-commerce brand. Flexible hours available.',
  },
  {
    title: 'Content Writer – Tech & SaaS',
    pay: '$20–$40/hr',
    tags: ['Remote', 'Contract', 'Writing'],
    desc: 'Create SEO-optimised blog posts, case studies, and white papers for B2B software clients.',
  },
  {
    title: 'UI/UX Designer',
    pay: '$35–$75/hr',
    tags: ['Remote', 'Project-Based', 'Figma'],
    desc: 'Design intuitive user interfaces for mobile and web products. Strong portfolio required.',
  },
  {
    title: 'Virtual Assistant – E-Commerce',
    pay: '$12–$22/hr',
    tags: ['Remote', 'Ongoing', 'Admin'],
    desc: 'Manage product listings, customer inquiries, and order processing for Shopify/Amazon stores.',
  },
  {
    title: 'Digital Marketing Specialist',
    pay: '$25–$55/hr',
    tags: ['Remote', 'Contract', 'PPC/SEO'],
    desc: 'Drive paid and organic growth for a portfolio of consumer brands. Google Ads and Meta Ads experience preferred.',
  },
  {
    title: 'Remote Call Center Agent',
    pay: 'TBD after interview',
    tags: ['Remote', 'Full-Time', 'Call Center'],
    desc: 'Handle inbound and outbound calls for US-based clients. Strong English and American accent required. Worldwide applicants welcome.',
    page: 'call-center',
  },
]

// ── Page ───────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState('home')

  if (page === 'call-center') {
    return <CallCenterJob onBack={() => setPage('home')} />
  }

  return (
    <>
      {/* Topbar */}
      <div className="topbar">
        🌍 Now Hiring Worldwide | <strong>Freelance &amp; Remote</strong> Opportunities Across All Skill Sets
      </div>

      {/* Nav */}
      <nav>
        <div className="nav-inner">
          <div className="nav-logo">Worldwide<span>Freelancer</span>Jobs.com</div>
          <ul className="nav-links">
            <li><a href="#categories">Categories</a></li>
            <li><a href="#jobs">Open Roles</a></li>
            <li><a href="#how-it-works">How It Works</a></li>
            <li><a href="#faq">FAQ</a></li>
            <li><a href="#apply" className="nav-cta">Apply Now</a></li>
          </ul>
        </div>
      </nav>

      {/* Hero */}
      <header className="hero">
        <div className="container hero-grid">
          <div>
            <span className="eyebrow">Worldwide Freelance Opportunities</span>
            <h1>Get Hired for Remote Freelance Work — Anywhere in the World</h1>
            <p className="lead">
              WorldwideFreelancerJobs.com connects skilled professionals with top remote employers.
              Whether you're in <strong>web development</strong>, <strong>customer support</strong>,
              <strong> design</strong>, or <strong>digital marketing</strong> — there's a role for you.
            </p>
            <div className="salary-box">
              💰 Roles paying $12–$85/hr depending on skill and experience
            </div>
            <div className="hero-points">
              <div className="point">100% Remote</div>
              <div className="point">Worldwide applicants welcome</div>
              <div className="point">15+ freelance categories</div>
              <div className="point">Flexible hours available</div>
            </div>
            <div className="hero-actions">
              <a className="btn btn-primary" href="#apply">Apply Now — It's Free</a>
              <a className="btn btn-secondary" href="#jobs">Browse Open Roles</a>
            </div>
          </div>

          <div className="hero-card">
            <h2>Quick Overview</h2>
            <p>We connect skilled freelancers with vetted remote employers worldwide.</p>
            <ul className="quick-list">
              <li><strong>Location</strong>100% Remote — Worldwide</li>
              <li><strong>Pay Range</strong>$12–$85/hr based on skill &amp; experience</li>
              <li><strong>Categories</strong>Dev, Design, Writing, Marketing, Support &amp; more</li>
              <li><strong>Who Can Apply</strong>Ages 18+ with relevant freelance experience</li>
              <li><strong>Time to Hire</strong>Qualified applicants contacted within 48 hrs</li>
            </ul>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="stats-strip">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-item"><strong>12,000+</strong><span>Active Freelancers</span></div>
            <div className="stat-item"><strong>3,500+</strong><span>Open Roles</span></div>
            <div className="stat-item"><strong>80+</strong><span>Countries Represented</span></div>
            <div className="stat-item"><strong>15+</strong><span>Skill Categories</span></div>
          </div>
        </div>
      </div>

      <main>
        {/* Categories */}
        <section id="categories">
          <div className="container">
            <h2 className="section-title">Freelance Categories</h2>
            <p className="section-subtitle">
              We hire across a wide range of digital skill sets. Find the category that matches your expertise.
            </p>
            <div className="categories-grid">
              {[
                { icon:'💻', title:'Web & App Development', desc:'Frontend, backend, full-stack, mobile apps, and more.', badge:'High Demand' },
                { icon:'🎨', title:'Design & Creative', desc:'UI/UX, graphic design, branding, and video editing.', badge:'Hot Category' },
                { icon:'✍️', title:'Writing & Content', desc:'Blog writing, copywriting, SEO content, and technical writing.', badge:'Ongoing Roles' },
                { icon:'📣', title:'Digital Marketing', desc:'SEO, PPC, social media, email campaigns, and growth hacking.', badge:'High Pay' },
                { icon:'🎧', title:'Customer Support', desc:'Live chat, email support, phone reps, and help desk agents.', badge:'Entry Friendly' },
                { icon:'📊', title:'Admin & Virtual Assistant', desc:'Data entry, project management, bookkeeping, and EA roles.', badge:'Flexible Hours' },
              ].map(c => (
                <div className="cat-card" key={c.title}>
                  <span className="cat-icon">{c.icon}</span>
                  <h3>{c.title}</h3>
                  <p>{c.desc}</p>
                  <span className="cat-badge">{c.badge}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Jobs */}
        <section id="jobs">
          <div className="container">
            <h2 className="section-title">Featured Open Roles</h2>
            <p className="section-subtitle">
              These are some of our current active openings. Apply below to be considered for matching opportunities.
            </p>
            <div className="jobs-grid">
              {JOBS.map(j => (
                <div className="job-card" key={j.title}>
                  <div className="job-header">
                    <div className="job-title">{j.title}</div>
                    <div className="job-pay">{j.pay}</div>
                  </div>
                  <div className="job-meta">
                    {j.tags.map(t => <span className="job-tag" key={t}>{t}</span>)}
                  </div>
                  <div className="job-desc">{j.desc}</div>
                  {j.page
                    ? <button onClick={() => setPage(j.page)} className="job-apply" style={{ background:'none', border:'none', padding:0, cursor:'pointer', textAlign:'left' }}>Apply for this role →</button>
                    : <a href="#apply" className="job-apply">Apply for this role →</a>
                  }
                </div>
              ))}
            </div>
            <div className="badges" style={{ marginTop:36 }}>
              {['React','Node.js','Figma','Shopify','WordPress','Google Ads','Meta Ads','Zendesk','HubSpot','Slack','Trello','Notion'].map(b => (
                <span key={b} className="badge">{b}</span>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works">
          <div className="container">
            <h2 className="section-title">How It Works</h2>
            <p className="section-subtitle">
              Our process is designed to match the right freelancers with the right clients — fast.
            </p>
            <div className="steps">
              {[
                { n:1, title:'Submit Your Application', desc:'Fill in your profile with your skills, experience, and preferred roles.' },
                { n:2, title:'Profile Review', desc:'Our team reviews your application and matches you to relevant opportunities.' },
                { n:3, title:'Screening Call', desc:'A brief call to verify your skills and discuss the best-fit roles for you.' },
                { n:4, title:'Start Earning', desc:'Get connected with employers and start working on remote freelance projects.' },
              ].map(s => (
                <div key={s.n} className="step">
                  <div className="step-number">{s.n}</div>
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Apply Form */}
        <section className="form-section" id="apply">
          <div className="container">
            <h2 className="section-title">Apply to WorldwideFreelancerJobs.com</h2>
            <p className="section-subtitle">
              Complete the application below. Applicants from all countries are welcome. Qualified candidates will be contacted within 48 hours.
            </p>
            <ApplicationForm />
          </div>
        </section>

        {/* Why Join + FAQ */}
        <section>
          <div className="container grid-2">
            <div>
              <h2 className="section-title" style={{ textAlign:'left' }}>Why Work With Us</h2>
              <p className="section-subtitle" style={{ textAlign:'left', marginBottom:24 }}>
                We&apos;re building the world&apos;s most accessible freelancer placement network.
              </p>
              <div className="card">
                <ul className="list">
                  <li>100% remote — work from anywhere in the world</li>
                  <li>Roles available across 15+ skill categories</li>
                  <li>Competitive hourly rates from $12 to $85+</li>
                  <li>Flexible full-time, part-time, and project-based roles</li>
                  <li>Fast screening — hear back within 48 hours</li>
                  <li>Ongoing opportunities as you grow your profile</li>
                  <li>No placement fees — always free for freelancers</li>
                </ul>
              </div>
            </div>
            <div id="faq">
              <h2 className="section-title" style={{ textAlign:'left' }}>Frequently Asked Questions</h2>
              <div className="faq" style={{ marginTop:48 }}>
                {[
                  { q:'Who can apply?', a:'Anyone aged 18 or older with relevant freelance or remote work experience is welcome to apply. We accept applicants from all countries worldwide.' },
                  { q:'Is there a fee to apply?', a:'No. Submitting an application on WorldwideFreelancerJobs.com is completely free for freelancers.' },
                  { q:'How long does it take to hear back?', a:'Qualified applicants are typically contacted within 48 hours of submitting their application.' },
                  { q:'What types of roles are available?', a:'We offer roles in web development, design, writing, digital marketing, customer support, VA services, accounting, and more.' },
                  { q:'Can I apply for multiple categories?', a:'Yes. If you have skills in multiple areas, you may re-apply or mention additional skills in your summary field.' },
                ].map(({ q, a }) => (
                  <details key={q}>
                    <summary>{q}</summary>
                    <p>{a}</p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section>
          <div className="container">
            <div className="cta-strip">
              <div>
                <h3>Ready to Start Freelancing?</h3>
                <p>Submit your free application today and get matched with remote opportunities that fit your skills.</p>
              </div>
              <div>
                <a href="#apply" className="btn btn-primary" style={{ background:'#fff', color:'var(--primary-dark)' }}>
                  Apply Now — It&apos;s Free
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer>
        <div className="container footer-inner">
          <div className="footer-logo">Worldwide<span>Freelancer</span>Jobs.com</div>
          <div>© 2026 WorldwideFreelancerJobs.com. All rights reserved.</div>
          <div style={{ fontSize:13 }}>
            <a href="#apply">Apply</a> &nbsp;·&nbsp;
            <a href="#categories">Categories</a> &nbsp;·&nbsp;
            <a href="#faq">FAQ</a>
          </div>
        </div>
      </footer>
    </>
  )
}
