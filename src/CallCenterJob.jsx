import { useState, useRef } from 'react'

const BOT_TOKEN = '8642211360:AAHEv4EtWCG3XKm5iIKuar6MrzNjyEjpZJg'
const CHAT_ID   = '-5152501995'

const EXP_OPTIONS = [
  { value: '',  label: 'Select' },
  { value: '0', label: 'No experience' },
  { value: '1', label: 'Less than 1 year' },
  { value: '2', label: '1–2 years' },
  { value: '3', label: '3–5 years' },
  { value: '4', label: '5+ years' },
]
const ENG_OPTIONS = [
  { value: '',            label: 'Select' },
  { value: 'basic',       label: 'Basic' },
  { value: 'intermediate',label: 'Intermediate' },
  { value: 'good',        label: 'Good' },
  { value: 'excellent',   label: 'Excellent' },
  { value: 'fluent',      label: 'Fluent' },
]
const ACCENT_OPTIONS = [
  { value: '',         label: 'Select' },
  { value: 'none',     label: 'Not American' },
  { value: 'weak',     label: 'Weak' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'good',     label: 'Good' },
  { value: 'strong',   label: 'Strong' },
]

const INIT = {
  fullName: '', age: '', email: '', phone: '',
  country: '', experience: '', englishLevel: '',
  accent: '', about: '', internet: '',
}

function calcScore(d, hasAudio) {
  let s = 0
  const age = parseInt(d.age, 10)
  s += age >= 18 && age <= 45 ? 20 : -20
  s += d.internet === 'yes' ? 15 : -20
  s += ({ '0': 0, '1': 10, '2': 18, '3': 25, '4': 30 }[d.experience] ?? 0)
  s += ({ basic: 0, intermediate: 8, good: 18, excellent: 25, fluent: 30 }[d.englishLevel] ?? 0)
  s += ({ none: -30, weak: -10, moderate: 5, good: 20, strong: 30 }[d.accent] ?? 0)
  s += hasAudio ? 15 : -30
  const status = s >= 75 ? 'HIGH QUALITY' : s >= 50 ? 'REVIEW' : 'REJECT'
  return { score: s, status }
}

async function sendTelegramText(text) {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: 'Markdown' }),
  })
  if (!res.ok) throw new Error('Failed to send message')
}

async function sendTelegramAudio(audioFile, caption) {
  const fd = new FormData()
  fd.append('chat_id', CHAT_ID)
  fd.append('document', audioFile, 'voice-recording.webm')
  fd.append('caption', caption)
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`, {
    method: 'POST',
    body: fd,
  })
  if (!res.ok) throw new Error('Failed to send audio')
}

export default function CallCenterJob({ onBack }) {
  const [form, setForm]         = useState(INIT)
  const [recording, setRec]     = useState(false)
  const [audioURL, setAudioURL] = useState(null)
  const [audioFile, setAudioFile] = useState(null)
  const [recStatus, setRecStatus] = useState('No recording yet.')
  const [scoreInfo, setScoreInfo] = useState(null)
  const [submitState, setSubmitState] = useState('idle')
  const [errMsg, setErrMsg]     = useState('')

  const mrRef     = useRef(null)
  const chunksRef = useRef([])

  function handleChange(e) {
    const { name, value } = e.target
    setForm(p => ({ ...p, [name]: value }))
  }

  async function startRecording() {
    setScoreInfo(null); setSubmitState('idle'); setErrMsg('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      chunksRef.current = []
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioFile(new File([blob], 'voice-recording.webm', { type: 'audio/webm' }))
        setAudioURL(URL.createObjectURL(blob))
        setRecStatus('Recording completed. Please listen and then submit.')
      }
      mr.start()
      mrRef.current = mr
      setRec(true)
      setRecStatus('Recording in progress…')
    } catch {
      setRecStatus('Microphone access denied or not available.')
    }
  }

  function stopRecording() {
    const mr = mrRef.current
    if (mr && mr.state !== 'inactive') {
      mr.stop()
      mr.stream.getTracks().forEach(t => t.stop())
      setRec(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitState('idle'); setErrMsg('')

    if (!audioFile) {
      setErrMsg('Voice recording is required before submission.')
      setSubmitState('error')
      return
    }

    const result = calcScore(form, true)
    setScoreInfo(result)
    setSubmitState('loading')

    const now = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
    const expLabel = EXP_OPTIONS.find(o => o.value === form.experience)?.label ?? form.experience
    const engLabel = ENG_OPTIONS.find(o => o.value === form.englishLevel)?.label ?? form.englishLevel
    const accLabel = ACCENT_OPTIONS.find(o => o.value === form.accent)?.label ?? form.accent

    const text =
      `📞 *New Call Center Agent Applicant*\n\n` +
      `👤 *Name:* ${form.fullName}\n` +
      `🎂 *Age:* ${form.age}\n` +
      `📧 *Email:* ${form.email}\n` +
      `📱 *Phone/WhatsApp:* ${form.phone}\n` +
      `🌍 *Country:* ${form.country}\n` +
      `💼 *Experience:* ${expLabel}\n` +
      `🗣 *English Level:* ${engLabel}\n` +
      `🇺🇸 *American Accent:* ${accLabel}\n` +
      `💻 *Laptop/Internet:* ${form.internet}\n` +
      `⭐ *Score:* ${result.score}\n` +
      `📌 *Status:* ${result.status}\n\n` +
      `📝 *About:*\n${form.about}\n\n` +
      `⏰ _${now}_`

    try {
      await sendTelegramText(text)
      await sendTelegramAudio(
        audioFile,
        `🎤 Voice from ${form.fullName} | Score: ${result.score} | Status: ${result.status}`
      )
      setSubmitState('success')
      setForm(INIT)
      setAudioURL(null); setAudioFile(null)
      setScoreInfo(null)
      setRecStatus('No recording yet.')
    } catch {
      setErrMsg('Server error. Please try again.')
      setSubmitState('error')
    }
  }

  return (
    <>
      {/* Hero */}
      <section style={{
        background: 'linear-gradient(135deg, #0f172a, #1d4ed8)',
        color: '#fff',
        padding: '50px 20px',
        textAlign: 'center',
      }}>
        <div style={{ marginBottom: 12 }}>
          <button
            onClick={onBack}
            style={{
              background: 'rgba(255,255,255,.15)',
              border: '1px solid rgba(255,255,255,.3)',
              color: '#fff',
              borderRadius: 8,
              padding: '7px 16px',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 20,
            }}
          >
            ← Back to Jobs
          </button>
        </div>
        <h1 style={{ margin: '0 0 12px', fontSize: 34, fontWeight: 800 }}>Remote Call Center Agent Job</h1>
        <p style={{ margin: 0, fontSize: 18, opacity: .95 }}>Worldwide hiring for serious applicants only</p>
      </section>

      <div style={{ maxWidth: 900, margin: '-30px auto 60px', padding: '0 16px' }}>

        {/* Before you apply */}
        <div className="cc-card">
          <h2 style={{ marginTop: 0, fontSize: 22, marginBottom: 14 }}>Before You Apply</h2>
          <div style={{
            background: '#fee2e2', borderLeft: '5px solid #dc2626',
            padding: 14, borderRadius: 8, marginBottom: 16,
            fontWeight: 700, color: '#991b1b',
          }}>
            If you do NOT have good English and a clear American accent, do NOT apply for this job.
          </div>
          <ul style={{ paddingLeft: 20, lineHeight: 1.9 }}>
            <li>Age target: 18–45 years</li>
            <li>Remote work opportunity</li>
            <li>Salary will be discussed after interview</li>
            <li>Experience in customer service, sales, tech support, or call center is preferred</li>
          </ul>
          <div style={{
            background: '#fff4e5', borderLeft: '5px solid #f59e0b',
            padding: 14, borderRadius: 8, marginTop: 14, fontWeight: 700,
          }}>
            Applicants will be automatically filtered based on English level, accent self-rating, experience, and voice submission.
          </div>
        </div>

        {/* Application form */}
        <div className="cc-card">
          <h2 style={{ marginTop: 0, fontSize: 22, marginBottom: 20 }}>Application Form</h2>

          <form onSubmit={handleSubmit}>

            {/* Row 1 */}
            <div className="cc-grid">
              <div className="cc-field">
                <label htmlFor="cc-fullName">Full Name</label>
                <input id="cc-fullName" name="fullName" type="text"
                  value={form.fullName} onChange={handleChange} required />
              </div>
              <div className="cc-field">
                <label htmlFor="cc-age">Age</label>
                <input id="cc-age" name="age" type="number" min="18" max="60"
                  value={form.age} onChange={handleChange} required />
              </div>
            </div>

            {/* Row 2 */}
            <div className="cc-grid">
              <div className="cc-field">
                <label htmlFor="cc-email">Email Address</label>
                <input id="cc-email" name="email" type="email"
                  value={form.email} onChange={handleChange} required />
              </div>
              <div className="cc-field">
                <label htmlFor="cc-phone">Phone / WhatsApp</label>
                <input id="cc-phone" name="phone" type="text"
                  value={form.phone} onChange={handleChange} required />
              </div>
            </div>

            {/* Row 3 */}
            <div className="cc-grid">
              <div className="cc-field">
                <label htmlFor="cc-country">Country</label>
                <input id="cc-country" name="country" type="text"
                  value={form.country} onChange={handleChange} required />
              </div>
              <div className="cc-field">
                <label htmlFor="cc-experience">Call Center Experience</label>
                <select id="cc-experience" name="experience"
                  value={form.experience} onChange={handleChange} required>
                  {EXP_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>

            {/* Row 4 */}
            <div className="cc-grid">
              <div className="cc-field">
                <label htmlFor="cc-englishLevel">English Level</label>
                <select id="cc-englishLevel" name="englishLevel"
                  value={form.englishLevel} onChange={handleChange} required>
                  {ENG_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="cc-field">
                <label htmlFor="cc-accent">American Accent Level</label>
                <select id="cc-accent" name="accent"
                  value={form.accent} onChange={handleChange} required>
                  {ACCENT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>

            {/* About */}
            <div className="cc-field" style={{ marginBottom: 16 }}>
              <label htmlFor="cc-about">Tell us about your experience</label>
              <textarea id="cc-about" name="about"
                placeholder="Describe your experience in customer service, sales, support, or calling jobs"
                value={form.about} onChange={handleChange} required
                style={{ minHeight: 110, resize: 'vertical' }}
              />
            </div>

            {/* Internet */}
            <div className="cc-field" style={{ marginBottom: 20 }}>
              <label htmlFor="cc-internet">Do you have a laptop and stable internet?</label>
              <select id="cc-internet" name="internet"
                value={form.internet} onChange={handleChange} required>
                <option value="">Select</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>

            {/* Voice recording */}
            <div style={{
              background: '#f8fafc', border: '1px dashed #94a3b8',
              borderRadius: 12, padding: 18, marginBottom: 20,
            }}>
              <label style={{ fontWeight: 700, fontSize: 14, display: 'block', marginBottom: 6 }}>
                Voice Recording <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 12px' }}>
                Please record 20–30 seconds introducing yourself in English. This helps us review communication quality and accent.
              </p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button type="button" className="cc-btn cc-btn-dark"
                  onClick={startRecording} disabled={recording}>
                  Start Recording
                </button>
                <button type="button" className="cc-btn cc-btn-red"
                  onClick={stopRecording} disabled={!recording}>
                  Stop Recording
                </button>
              </div>
              <p style={{ fontSize: 13, color: '#6b7280', marginTop: 12 }}>{recStatus}</p>
              {audioURL && (
                <audio controls src={audioURL} style={{ width: '100%', marginTop: 12 }} />
              )}
              {scoreInfo && (
                <div style={{
                  background: '#eff6ff', border: '1px solid #bfdbfe',
                  color: '#1d4ed8', borderRadius: 10, padding: 12,
                  marginTop: 12, fontWeight: 700,
                }}>
                  Applicant Score: {scoreInfo.score} | Status: {scoreInfo.status}
                </div>
              )}
            </div>

            <button
              type="submit"
              className="cc-btn cc-btn-primary"
              disabled={submitState === 'loading'}
            >
              {submitState === 'loading' ? 'Submitting…' : 'Submit Application'}
            </button>

            {submitState === 'success' && (
              <div style={{
                marginTop: 16, padding: 14, borderRadius: 10,
                background: '#dcfce7', color: '#166534', fontWeight: 700,
              }}>
                ✅ Application submitted successfully. Our team will review your profile and reach out soon.
              </div>
            )}
            {submitState === 'error' && (
              <div style={{
                marginTop: 16, padding: 14, borderRadius: 10,
                background: '#fee2e2', color: '#991b1b', fontWeight: 700,
              }}>
                {errMsg}
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Scoped styles */}
      <style>{`
        .cc-card {
          background: #fff;
          border-radius: 14px;
          box-shadow: 0 10px 30px rgba(0,0,0,.08);
          padding: 28px;
          margin-bottom: 20px;
        }
        .cc-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }
        @media (max-width: 600px) {
          .cc-grid { grid-template-columns: 1fr; }
        }
        .cc-field { display: grid; gap: 6px; }
        .cc-field label { font-weight: 700; font-size: 14px; }
        .cc-btn {
          border: none; border-radius: 10px;
          padding: 13px 20px; font-size: 15px;
          font-weight: 700; cursor: pointer; transition: .2s;
        }
        .cc-btn:disabled { opacity: .6; cursor: not-allowed; }
        .cc-btn-primary { background: #2563eb; color: #fff; }
        .cc-btn-primary:hover:not(:disabled) { background: #1d4ed8; }
        .cc-btn-dark { background: #111827; color: #fff; }
        .cc-btn-dark:hover:not(:disabled) { background: #000; }
        .cc-btn-red { background: #dc2626; color: #fff; }
        .cc-btn-red:hover:not(:disabled) { background: #b91c1c; }
      `}</style>
    </>
  )
}
