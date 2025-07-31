'use client';
import { useState } from 'react';
import styles from './styles.module.css';

export default function GhostCardManagePage() {
  const [alias, setAlias] = useState('');
  const [amount, setAmount] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [merchants, setMerchants] = useState('');
  const [cardDetails, setCardDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateCard = async () => {
    setLoading(true);
    setError('');

    try {
      const userId = localStorage.getItem('user_id');
      if (!userId) {
        throw new Error('No logged-in user found');
      }

      const res = await fetch('http://localhost:8080/create_ghost_cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          amount: parseFloat(amount),
          allowed_merchants: merchants.split(',').map(m => m.trim()),
          expires_at: expiresAt
        })
      });

      if (!res.ok) throw new Error('Failed to create ghost card');
      const data = await res.json();
      setCardDetails(data);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <nav className={styles.nav}>
        <div className={styles.navLeft}>
          <h1>Create Ghost Card</h1>
        </div>
        <button className={styles.backBtn} onClick={() => window.location.href = '/dashboard'}>
          ← Back to Dashboard
        </button>
      </nav>

      <main className={styles.main}>
        <div className={styles.cardForm}>
          <div className={styles.inputGroup}>
            <label>Alias</label>
            <input value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="Netflix Monthly" />
          </div>
          <div className={styles.inputGroup}>
            <label>Amount (USD)</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className={styles.inputGroup}>
            <label>Allowed Merchants (comma separated)</label>
            <input value={merchants} onChange={(e) => setMerchants(e.target.value)} placeholder="Netflix, Spotify" />
          </div>
          <div className={styles.inputGroup}>
            <label>Expiration Date</label>
            <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button onClick={handleCreateCard} disabled={loading} className={styles.button}>
            {loading ? 'Creating...' : 'Create Ghost Card'}
          </button>
        </div>

        {cardDetails && (
          <div className={styles.cardDetails}>
            <h2>Card Created</h2>
            <p><strong>Ghost Card ID:</strong> {cardDetails.ghost_card_id}</p>
            <p><strong>Number:</strong> {cardDetails.stripe_card?.number}</p>
            <p><strong>Last 4:</strong> {cardDetails.stripe_card?.last4}</p>
            <p><strong>Exp:</strong> {cardDetails.stripe_card?.exp_month}/{cardDetails.stripe_card?.exp_year}</p>
            <p><strong>CVC:</strong> {cardDetails.stripe_card?.cvc}</p>
          </div>
        )}
      </main>
    </div>
  );
}