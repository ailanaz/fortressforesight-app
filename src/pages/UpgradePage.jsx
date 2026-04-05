import { Link } from 'react-router-dom'
import { hasPlayStoreUrl, PLAY_STORE_URL, supportsDigitalGoodsApi } from '../utils/googlePlay'
import './Page.css'
import './UpgradePage.css'

function UpgradePage() {
  const canUseDigitalGoods = supportsDigitalGoodsApi()
  const upgradeTitle = canUseDigitalGoods ? 'Upgrade in the Android App' : 'Upgrade in Google Play'
  const upgradeCopy = canUseDigitalGoods
    ? 'Paid access is activated through the Android app version of FortressForesight. Use Google Play there to unlock saved access.'
    : 'Paid access is activated through the Android app version of FortressForesight and billed through Google Play.'

  return (
    <div className="page upgrade-page">
      <h1 className="page-title">{upgradeTitle}</h1>
      <p className="page-subtitle">{upgradeCopy}</p>

      <section className="card upgrade-card">
        <div className="upgrade-list">
          <div className="upgrade-item">Save up to 2 properties</div>
          <div className="upgrade-item">Save checklist progress and notes</div>
          <div className="upgrade-item">Set alerts with calendar events</div>
          <div className="upgrade-item">Upload documents and photos</div>
          <div className="upgrade-item">Track recovery and insurance claims</div>
        </div>

        <div className="upgrade-note">
          Buy paid access in Google Play, then return here and sign in with the same account.
        </div>

        <div className="upgrade-actions">
          {hasPlayStoreUrl ? (
            <a
              className="btn-primary upgrade-store-link"
              href={PLAY_STORE_URL}
              rel="noreferrer"
              target="_blank"
            >
              Get FortressForesight on Google Play
            </a>
          ) : (
            <button className="btn-primary upgrade-store-link" disabled type="button">
              Google Play listing link coming soon
            </button>
          )}

          <Link className="btn-outline upgrade-signin-link" to="/login">
            Already paid? Sign in
          </Link>
        </div>

        {!hasPlayStoreUrl ? (
          <p className="upgrade-setup-note">
            Add <code>VITE_PLAY_APP_PACKAGE</code> or <code>VITE_PLAY_STORE_URL</code> when the Play app is ready.
          </p>
        ) : null}
      </section>
    </div>
  )
}

export default UpgradePage
