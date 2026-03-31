import { useState } from 'react'
import './Page.css'
import './KnowledgeBase.css'

const ARTICLES = [
  {
    id: 'deductibles',
    title: 'Deductibles: What They Are and How They Work',
    category: 'Insurance Basics',
    summary: 'A deductible is the amount you pay out of pocket before your insurance kicks in.',
    content: `When you file a claim, your insurance company subtracts your deductible from the payout.

If your roof damage costs $15,000 to fix and your deductible is $2,000, your insurer pays $13,000 and you pay $2,000.

Types of deductibles:
- Flat deductible: A fixed dollar amount (e.g., $1,000 or $2,500)
- Percentage deductible: A percentage of your home's insured value - common for wind, hail, or hurricane damage. On a $300,000 home with a 2% hurricane deductible, you pay $6,000 before coverage kicks in.

Higher deductibles mean lower premiums. Lower deductibles mean higher premiums. Know your deductible before disaster strikes - not after.`,
  },
  {
    id: 'rcv-acv',
    title: 'Replacement Cost vs. Actual Cash Value',
    category: 'Insurance Basics',
    summary: 'Two very different ways your insurer can pay a claim - and the difference matters.',
    content: `Actual Cash Value (ACV): What your damaged property is worth TODAY, after depreciation.
A 10-year-old roof might have an ACV of $8,000 even though replacing it costs $20,000. You get $8,000.

Replacement Cost Value (RCV): What it actually costs to replace the damaged item with a new one.
Same roof scenario - you get $20,000 to replace it.

RCV policies cost more in premiums but pay significantly more at claim time. Many homeowners don't know which they have until they file a claim. Check your declarations page now.`,
  },
  {
    id: 'flood-vs-homeowners',
    title: 'Flood Insurance vs. Homeowners Insurance',
    category: 'Coverage',
    summary: 'Standard homeowners insurance does NOT cover flooding. These are two separate policies.',
    content: `Homeowners insurance covers:
- Fire, wind, hail, lightning damage
- Theft and vandalism
- Water damage from a burst pipe inside your home
- Falling objects

Homeowners insurance does NOT cover:
- Rising water from rain, rivers, storm surge, or overland flooding
- Sewer or drain backup (usually requires a separate rider)

Flood insurance (through FEMA's NFIP or private carriers) covers:
- Damage caused by rising water from any source
- Foundation, HVAC, appliances, walls, floors

You can be in a low-risk flood zone and still flood. Over 20% of flood claims come from properties outside high-risk zones.`,
  },
  {
    id: 'public-adjuster',
    title: 'What a Public Adjuster Does',
    category: 'Claims',
    summary: 'Your insurance company has an adjuster. You can have one too.',
    content: `When you file a claim, your insurance company sends their adjuster to assess the damage. That adjuster works for the insurer - not for you.

A public adjuster works for you. They:
- Assess and document your damage independently
- Prepare and negotiate your claim on your behalf
- Are paid a percentage of your settlement (typically 10-15%)

When to consider one:
- The claim is large or complex
- You believe the initial offer is too low
- You don't have time to manage the claim yourself
- You're not getting responses from your insurer

Public adjusters are licensed professionals. Verify their license with your state's Department of Insurance before hiring.`,
  },
  {
    id: 'document-damage',
    title: 'How to Document Damage Properly',
    category: 'Claims',
    summary: 'Good documentation is the difference between a full payout and a lowball offer.',
    content: `Before touching anything:
- Photograph and video every damaged area
- Shoot wide shots (room overview) and close-ups (specific damage)
- Include reference objects to show scale
- Timestamp your photos - most phones do this automatically

What to document:
- Every room, including undamaged rooms for comparison
- All damaged furniture, appliances, clothing, and personal property
- Structural damage: walls, floors, ceilings, roof
- Exterior: all sides of the structure, fencing, detached structures

What NOT to do:
- Do not throw away damaged items - adjusters need to inspect them
- Do not start major repairs before the adjuster visit (emergency tarping is OK)
- Do not give a recorded statement without understanding your policy first`,
  },
  {
    id: 'disaster-language',
    title: 'Understanding Disaster and Insurance Language',
    category: 'Reference',
    summary: 'A plain-English guide to terms you will see after a loss.',
    content: `Declarations Page: The summary page of your policy - shows your coverage amounts, deductibles, and what is covered.

Dwelling Coverage (Coverage A): Covers the structure of your home.

Personal Property (Coverage C): Covers your belongings inside the home.

Loss of Use (Coverage D): Pays for temporary housing and meals if your home is uninhabitable.

Peril: A specific cause of loss (fire, wind, hail). Named peril policies only cover what is listed. Open peril policies cover everything except what is excluded.

Subrogation: After paying your claim, your insurer may pursue the party responsible for your loss.

Proof of Loss: A formal statement you submit to your insurer listing all damaged property and its value.

Depreciation: The reduction in value of property over time due to age and wear.

Holdback: The portion of a replacement cost claim withheld until repairs are complete.`,
  },
]

const CATEGORIES = ['All', 'Insurance Basics', 'Coverage', 'Claims', 'Reference']

function Article({ article }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="article-card card">
      <div className="article-header" onClick={() => setOpen((value) => !value)}>
        <div>
          <span className="article-category">{article.category}</span>
          <div className="article-title">{article.title}</div>
          <div className="article-summary">{article.summary}</div>
        </div>
        <svg
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
      {open && (
        <div className="article-body">
          {article.content.split('\n').map((line, index) =>
            line.trim() === '' ? <br key={index} /> : <p key={index}>{line}</p>,
          )}
        </div>
      )}
    </div>
  )
}

function KnowledgeBase() {
  const [category, setCategory] = useState('All')
  const filtered = category === 'All' ? ARTICLES : ARTICLES.filter((article) => article.category === category)

  return (
    <div className="page">
      <h1 className="page-title">Knowledge Base</h1>
      <p className="page-subtitle">Plain-language explanations of insurance, claims, and disasters.</p>

      <div className="filter-tabs">
        {CATEGORIES.map((item) => (
          <button
            key={item}
            className={`filter-tab${item === 'All' ? ' filter-tab-all' : ''}${category === item ? ' active' : ''}`}
            onClick={() => setCategory(item)}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="article-list">
        {filtered.map((article) => (
          <Article key={article.id} article={article} />
        ))}
      </div>
    </div>
  )
}

export default KnowledgeBase
