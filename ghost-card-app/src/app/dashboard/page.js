'use client';
import { useState, useEffect } from 'react';
import styles from './styles.module.css';

const MERCHANTS = [
  'Amazon', 'Spotify', 'Netflix', 'Walmart', 'Target',
  'Apple', 'Google Play', 'Uber', 'DoorDash', 'Grubhub',
  'Best Buy', 'eBay', 'Etsy', 'Steam', 'PlayStation',
  'Xbox', 'Hulu', 'Disney+', 'Adobe', 'Microsoft',
];

export default function DashboardPage() {
  const [showGhostCardModal, setShowGhostCardModal] = useState(false);
  const [ghostCardData, setGhostCardData] = useState({
    sourceAccount: '',
    expirationDate: '',
    expirationTime: '',
    amount: '',
    alias: '',
    merchants: []
  });
  const [ghostCards, setGhostCards] = useState([]);
  const [loading, setLoading] = useState(true);

  const accounts = [
    { type: 'Primary Checking', number: '*****1234', balance: 2543.21 },
    { type: 'High-Yield Savings', number: '*****5678', balance: 12750.84 },
    { type: 'Credit Card', number: '*****9012', balance: -450.32 }
  ];

  const fetchGhostCards = async () => {
    const userId = localStorage.getItem('user_id');
    if (!userId) {
      console.error("No logged in user");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`http://localhost:8080/ghost_cards?user_id=${userId}`);
      if (!res.ok) throw new Error("Failed to fetch ghost cards");
      const data = await res.json();
      setGhostCards(data.cards || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGhostCards();
  }, []);

  const handleGhostCardSubmit = async (e) => {
    e.preventDefault();
    const userId = localStorage.getItem('user_id');
    if (!userId) return alert("No logged in user");

    try {
      const expiryISO = new Date(
        `${ghostCardData.expirationDate}T${ghostCardData.expirationTime}:00`
      ).toISOString();

      const res = await fetch("http://localhost:8080/create_ghost_cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          amount: parseFloat(ghostCardData.amount),
          allowed_merchants: ghostCardData.merchants,
          expires_at: expiryISO
        })
      });

      if (!res.ok) throw new Error("Failed to create Ghost Card");
      await res.json();

      setShowGhostCardModal(false);
      setGhostCardData({ sourceAccount: '', expirationDate: '', expirationTime: '', amount: '', alias: '', merchants: [] });

      fetchGhostCards();
    } catch (err) {
      console.error(err);
      alert("Error creating Ghost Card");
    }
  };

  if (loading) return <p>Loading dashboard...</p>;

  return (
    <div className={styles.container}>
      <nav className={styles.nav}>
        <div className={styles.navLeft}>
          <h1>SecureBank</h1>
        </div>
        <div className={styles.navRight}>
          <button className={styles.logoutBtn} onClick={() => window.location.href = '/login'}>
            Logout
          </button>
        </div>
      </nav>

      <main className={styles.main}>
        <div className={styles.welcomeBar}>
          <div>
            <h2>Welcome back</h2>
          </div>
          <div className={styles.buttonGroup}>
            <button className={styles.primaryBtn} onClick={() => setShowGhostCardModal(true)}>
              + New Ghost Card
            </button>
          </div>
        </div>

        <div className={styles.accountsGrid}>
          {accounts.map((account, i) => (
            <div key={i} className={styles.accountCard}>
              <h3>{account.type}</h3>
              <p>{account.number}</p>
              <p className={`${styles.balance} ${account.balance < 0 ? styles.negative : ''}`}>
                ${Math.abs(account.balance).toLocaleString()}
              </p>
            </div>
          ))}

          {ghostCards.map((card) => (
            <div key={card.id} className={styles.accountCard}>
              <h3>{card.alias || "Ghost Card"}</h3>
              <p>Amount: ${card.amount}</p>
              <p>Expires: {new Date(card.expires_at._seconds * 1000).toLocaleString()}</p>
              <button 
                onClick={() => window.location.href = `/ghost-card/${card.id}`}
                className={styles.actionButton}
              >
                Manage
              </button>
            </div>
          ))}
        </div>

        {showGhostCardModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <h2>Create New Ghost Card</h2>
              <form onSubmit={handleGhostCardSubmit}>
                <div className={styles.modalGroup}>
                  <label>Source Account</label>
                  <select 
                    value={ghostCardData.sourceAccount}
                    onChange={(e) => setGhostCardData({...ghostCardData, sourceAccount: e.target.value})}
                    required
                  >
                    <option value="">Select Account</option>
                    <option value="checking">Primary Checking (*****1234)</option>
                    <option value="savings">High-Yield Savings (*****5678)</option>
                  </select>
                </div>

                <div className={styles.modalGroup}>
                  <label>Expiration Date</label>
                  <input 
                    type="date"
                    value={ghostCardData.expirationDate}
                    onChange={(e) => setGhostCardData({...ghostCardData, expirationDate: e.target.value})}
                    required
                  />
                </div>

                <div className={styles.modalGroup}>
                  <label>Expiration Time</label>
                  <input 
                    type="time"
                    value={ghostCardData.expirationTime}
                    onChange={(e) => setGhostCardData({...ghostCardData, expirationTime: e.target.value})}
                    required
                  />
                </div>

                <div className={styles.modalGroup}>
                  <label>Amount ($)</label>
                  <input 
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={ghostCardData.amount}
                    onChange={(e) => setGhostCardData({...ghostCardData, amount: e.target.value})}
                    required
                  />
                </div>

                <div className={styles.modalGroup}>
                  <label>Alias/Nickname</label>
                  <input 
                    type="text"
                    value={ghostCardData.alias}
                    onChange={(e) => setGhostCardData({...ghostCardData, alias: e.target.value})}
                    placeholder="e.g., Netflix Monthly"
                    required
                  />
                </div>

                <div className={styles.modalGroup}>
                  <label>Allowed Merchants</label>
                  <select
                    multiple
                    value={ghostCardData.merchants}
                    onChange={(e) => setGhostCardData({
                      ...ghostCardData,
                      merchants: Array.from(e.target.selectedOptions, option => option.value)
                    })}
                    required
                    className={styles.multiSelect}
                  >
                    {MERCHANTS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <small className={styles.helpText}>Hold Ctrl (Cmd on Mac) to select multiple</small>
                </div>

                <div className={styles.modalActions}>
                  <button type="button" className={styles.cancelBtn} onClick={() => setShowGhostCardModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className={styles.submitBtn}>
                    Create Ghost Card
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}