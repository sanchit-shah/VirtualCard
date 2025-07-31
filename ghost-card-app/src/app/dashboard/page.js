'use client';
import { useState, useEffect } from 'react';
import styles from './styles.module.css';

const MERCHANTS = [
  'amazon', 'spotify', 'netflix', 'walmart', 'target',
  'apple', 'google play', 'uber', 'doordash', 'grubhub',
  'best buy', 'ebay', 'etsy', 'steam', 'playstation',
  'xbox', 'hulu', 'disney+', 'adobe', 'microsoft',
];

const CARD_THEMES = [
  {
    id: 'ocean',
    name: 'Ocean Blue',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    preview: '#667eea'
  },
  {
    id: 'sunset',
    name: 'Sunset Orange',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    preview: '#f5576c'
  },
  {
    id: 'forest',
    name: 'Forest Green',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    preview: '#4facfe'
  },
  {
    id: 'royal',
    name: 'Royal Purple',
    gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    preview: '#a8edea'
  },
  {
    id: 'midnight',
    name: 'Midnight Black',
    gradient: 'linear-gradient(135deg, #434343 0%, #000000 100%)',
    preview: '#434343'
  },
  {
    id: 'cherry',
    name: 'Cherry Blossom',
    gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    preview: '#fcb69f'
  },
  {
    id: 'emerald',
    name: 'Emerald Dream',
    gradient: 'linear-gradient(135deg, #a8e6cf 0%, #88d8a3 100%)',
    preview: '#88d8a3'
  },
  {
    id: 'cosmic',
    name: 'Cosmic Purple',
    gradient: 'linear-gradient(135deg, #667db6 0%, #0082c8 48%, #0082c8 100%)',
    preview: '#667db6'
  }
];

export default function DashboardPage() {
  const [showGhostCardModal, setShowGhostCardModal] = useState(false);
  const [ghostCardData, setGhostCardData] = useState({
    sourceAccount: '',
    expirationDate: '',
    expirationTime: '',
    amount: '',
    alias: '',
    merchants: [],
    colorTheme: 'ocean'
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
      const res = await fetch(`http://localhost:8080/cards/ghost_cards?user_id=${userId}`);
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

      const res = await fetch("http://localhost:8080/cards/create_ghost_cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          amount: parseFloat(ghostCardData.amount),
          allowed_merchants: ghostCardData.merchants,
          expires_at: expiryISO,
          alias: ghostCardData.alias,
          color_theme: ghostCardData.colorTheme
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

  const handleDeleteCard = async (cardId, stripeCardId) => {
    if (!confirm("Are you sure you want to delete this ghost card? This action cannot be undone.")) {
      return;
    }

    try {
      const res = await fetch(`http://localhost:8080/cards/${stripeCardId}`, {
        method: "DELETE"
      });

      if (!res.ok) throw new Error("Failed to delete card");

      const data = await res.json();
      alert(data.message);

      // Refresh the cards list
      fetchGhostCards();
    } catch (err) {
      console.error("Error deleting card:", err);
      alert("Error deleting card");
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

          {ghostCards.map((card) => {
            const cardTheme = CARD_THEMES.find(theme => theme.id === card.color_theme) || CARD_THEMES[0];
            return (
              <div
                key={card.id}
                className={`${styles.accountCard} ${styles.ghostCard}`}
                style={{ background: cardTheme.gradient }}
              >
                <div className={styles.ghostCardContent}>
                  <h3>{card.alias || "Ghost Card"}</h3>
                  <p className={styles.ghostCardBalance}>Balance: ${card.balance || card.original_amount || 0}</p>
                  <p>Merchants: {card.allowed_merchants?.slice(0, 2).map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(', ')}{card.allowed_merchants?.length > 2 ? '...' : ''}</p>
                  <p>Expires: {new Date(card.expires_at._seconds * 1000).toLocaleDateString()}</p>
                  <div className={styles.cardActions}>
                    <button
                      onClick={() => window.location.href = `/ghost-card/${card.id}`}
                      className={styles.actionButton}
                    >
                      Manage
                    </button>
                    <button
                      onClick={() => handleDeleteCard(card.id, card.stripe_card_id)}
                      className={`${styles.actionButton} ${styles.deleteButton}`}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
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
                  <label>Card Theme</label>
                  <div className={styles.colorThemeGrid}>
                    {CARD_THEMES.map((theme) => (
                      <label key={theme.id} className={styles.colorThemeOption}>
                        <input
                          type="radio"
                          name="colorTheme"
                          value={theme.id}
                          checked={ghostCardData.colorTheme === theme.id}
                          onChange={(e) => setGhostCardData({...ghostCardData, colorTheme: e.target.value})}
                          className={styles.colorThemeRadio}
                        />
                        <div
                          className={styles.colorThemePreview}
                          style={{ background: theme.gradient }}
                        >
                          <span className={styles.colorThemeName}>{theme.name}</span>
                        </div>
                      </label>
                    ))}
                  </div>
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
                      <option
                        key={m}
                        value={m}
                        style={{
                          backgroundColor: ghostCardData.merchants.includes(m) ? '#3182ce' : 'transparent',
                          color: ghostCardData.merchants.includes(m) ? 'white' : 'inherit'
                        }}
                      >
                        {ghostCardData.merchants.includes(m) ? '✓ ' : ''}{m.charAt(0).toUpperCase() + m.slice(1)}
                      </option>
                    ))}
                  </select>
                  <small className={styles.helpText}>
                    Current selections: {ghostCardData.merchants.length > 0 ?
                      ghostCardData.merchants.map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(', ') :
                      'None selected'
                    }
                    <br />Hold Ctrl (Cmd on Mac) to select multiple
                  </small>
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
