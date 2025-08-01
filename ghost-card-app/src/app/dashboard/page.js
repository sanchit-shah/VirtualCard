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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [cardToDelete, setCardToDelete] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [ghostCardData, setGhostCardData] = useState({
    sourceAccount: '',
    expirationDate: '',
    expirationTime: '',
    amount: '0', // Default to $0.00
    alias: '',
    merchants: [],
    colorTheme: 'ocean',
    single_use: false
  });
  const [ghostCards, setGhostCards] = useState([]);
  const [loading, setLoading] = useState(true);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  const handleOpenGhostCardModal = () => {
    // Reset form data when opening modal to ensure slider starts at $0.00
    setGhostCardData({
      sourceAccount: '',
      expirationDate: '',
      expirationTime: '',
      amount: '0', // Ensure slider starts at $0.00
      alias: '',
      merchants: [],
      colorTheme: 'ocean',
      single_use: false
    });
    setShowGhostCardModal(true);
  };

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
    if (!userId) {
      showToast("No logged in user", 'error');
      return;
    }

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
          color_theme: ghostCardData.colorTheme,
          single_use: ghostCardData.single_use
        })
      });

      if (!res.ok) {
        const errorData = await res.text();
        console.error("Backend error:", errorData);
        throw new Error(`Failed to create Ghost Card: ${res.status} - ${errorData}`);
      }
      await res.json();

      setShowGhostCardModal(false);
      showToast("Ghost card created successfully!", 'success');
      setGhostCardData({
        sourceAccount: '',
        expirationDate: '',
        expirationTime: '',
        amount: '0', // Reset to default $0.00
        alias: '',
        merchants: [],
        colorTheme: 'ocean',
        single_use: false
      });

      fetchGhostCards();
    } catch (err) {
      console.error(err);
      showToast("Error creating Ghost Card", 'error');
    }
  };

  const handleDeleteCard = async (cardId, stripeCardId) => {
    // Show the delete confirmation modal
    setCardToDelete({ cardId, stripeCardId });
    setShowDeleteModal(true);
  };

  const confirmDeleteCard = async () => {
    if (!cardToDelete) return;

    try {
      const res = await fetch(`http://localhost:8080/cards/${cardToDelete.stripeCardId}`, {
        method: "DELETE"
      });

      if (!res.ok) throw new Error("Failed to delete card");

      const data = await res.json();

      // Close modal and reset state
      setShowDeleteModal(false);
      setCardToDelete(null);

      // Refresh the cards list
      fetchGhostCards();
      showToast("Ghost card deleted successfully", 'success');
    } catch (err) {
      console.error("Error deleting card:", err);
      showToast("Error deleting card", 'error');
    }
  };

  const cancelDeleteCard = () => {
    setShowDeleteModal(false);
    setCardToDelete(null);
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
            <button className={styles.primaryBtn} onClick={handleOpenGhostCardModal}>
              + New Ghost Card
            </button>
          </div>
        </div>

        <div className={styles.accountsGrid}>
          {accounts.map((account, i) => (
            <div key={i} className={styles.accountCard}>
              <div>
                <h3>
                  {account.type}
                  {account.type === 'Primary Checking' && (
                    <span className={styles.accountBadge}>Primary</span>
                  )}
                </h3>
                <p className={styles.accountNumber}>{account.number}</p>
                <p className={`${styles.balance} ${account.balance < 0 ? styles.negative : styles.positive}`}>
                  ${Math.abs(account.balance).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </p>
              </div>

              <div className={styles.accountStats}>
                <span className={styles.statItem}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 20V10M5 20V4M19 20v-8"/>
                  </svg>
                  <span className={styles.statValue}>Recent Activity</span>
                </span>
                <span className={styles.statItem}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 8v4l3 3M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/>
                  </svg>
                  <span className={styles.statValue}>24h Change</span>
                </span>
              </div>

              <div className={styles.accountActions}>
                <button className={styles.accountActionBtn}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                  </svg>
                  Transfer
                </button>
                <button className={styles.accountActionBtn}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z"/>
                  </svg>
                  Pay
                </button>
                <button className={styles.accountActionBtn}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/>
                  </svg>
                  More
                </button>
              </div>
            </div>
          ))}

          {ghostCards
            .sort((a, b) => {
              // 🎯 MULTI-TIER SORTING SYSTEM:
              // 1st Priority: Active single-use cards (unused)
              // 2nd Priority: Active regular cards
              // 3rd Priority: Deactivated cards (used single-use or canceled)

              // Determine card states
              const aDeactivated = a.status === 'canceled' || (a.single_use && a.used);
              const bDeactivated = b.status === 'canceled' || (b.single_use && b.used);
              const aActiveSingleUse = !aDeactivated && a.single_use && !a.used;
              const bActiveSingleUse = !bDeactivated && b.single_use && !b.used;
              const aActiveRegular = !aDeactivated && !a.single_use;
              const bActiveRegular = !bDeactivated && !b.single_use;

              // 🥇 Active single-use cards always come first
              if (aActiveSingleUse && !bActiveSingleUse) return -1;
              if (!aActiveSingleUse && bActiveSingleUse) return 1;

              // 🥈 Active regular cards come second (after single-use)
              if (aActiveRegular && bDeactivated) return -1;
              if (aDeactivated && bActiveRegular) return 1;

              // 🥉 Deactivated cards come last
              if (aDeactivated && !bDeactivated) return 1;
              if (!aDeactivated && bDeactivated) return -1;

              // Within each priority group, sort by creation date (most recent first)
              let aDate, bDate;
              let hasValidDates = false;

              // Handle Firestore Timestamp objects and fallbacks
              if (a.created_at) {
                if (a.created_at.toDate && typeof a.created_at.toDate === 'function') {
                  aDate = a.created_at.toDate();
                } else if (a.created_at.seconds) {
                  aDate = new Date(a.created_at.seconds * 1000);
                } else {
                  aDate = new Date(a.created_at);
                }
              } else {
                aDate = new Date(0);
              }

              if (b.created_at) {
                if (b.created_at.toDate && typeof b.created_at.toDate === 'function') {
                  bDate = b.created_at.toDate();
                } else if (b.created_at.seconds) {
                  bDate = new Date(b.created_at.seconds * 1000);
                } else {
                  bDate = new Date(b.created_at);
                }
              } else {
                bDate = new Date(0);
              }

              // Ensure we have valid dates
              if (isNaN(aDate.getTime())) {
                aDate = new Date(0);
              }
              if (isNaN(bDate.getTime())) {
                bDate = new Date(0);
              }

              // Check if we have meaningful dates (not epoch 0)
              hasValidDates = aDate.getTime() > 0 || bDate.getTime() > 0;

              // If both dates are epoch 0 (no created_at), use alias for consistent ordering
              if (!hasValidDates) {
                const aName = (a.alias || a.id || '').toLowerCase();
                const bName = (b.alias || b.id || '').toLowerCase();
                // Sort alphabetically, but prefer newer-sounding names first
                // This is a heuristic - cards with "test" or recent names tend to be newer
                if (aName.includes('test') && !bName.includes('test')) return -1;
                if (!aName.includes('test') && bName.includes('test')) return 1;
                return aName.localeCompare(bName);
              }

              // Sort by date (most recent first)
              return bDate - aDate;
            })
            .map((card) => {
            const cardTheme = CARD_THEMES.find(theme => theme.id === card.color_theme) || CARD_THEMES[0];
            const isDeactivated = card.status === 'canceled' || (card.single_use && card.used);
            return (
              <div
                key={card.id}
                className={`${styles.accountCard} ${styles.ghostCard} ${isDeactivated ? styles.deactivatedCard : ''}`}
                style={{ background: cardTheme.gradient }}
              >
                <div className={styles.ghostCardContent}>
                  <div className={styles.cardHeader}>
                    <h3>
                      {card.alias || `Ghost Card ${card.id.slice(-4)}`}
                      {card.single_use && (
                        <span className={styles.singleUseBadge}>
                          {isDeactivated ? 'USED' : 'ONE-TIME'}
                        </span>
                      )}
                    </h3>
                    <div className={styles.balanceContainer}>
                      <span className={styles.balanceLabel}>Balance</span>
                      <span className={styles.balanceAmount}>
                        ${parseFloat(card.balance || card.amount || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className={styles.cardNumber}>
                    •••• •••• •••• {card.last4 || '0000'}
                  </div>
                  <div className={styles.cardFooter}>
                    <span>Expires: {new Date(card.expires_at._seconds * 1000).toLocaleString()}</span>
                    <span className={styles.cardType}>
                      {isDeactivated ? 'DEACTIVATED' : 'VIRTUAL'}
                    </span>
                  </div>
                  <div className={styles.cardActions}>
                    <button
                      onClick={() => window.location.href = `/ghost-card/${card.id}`}
                      className={styles.actionButton}
                      disabled={isDeactivated}
                    >
                      {isDeactivated ? 'View' : 'Manage'}
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
                  <div className={styles.amountContainer}>
                    <input
                      type="text"
                      value={`$${parseFloat(ghostCardData.amount || 0).toFixed(2)}`}
                      onChange={(e) => {
                        // Remove $ and any non-numeric characters except decimal point
                        const value = e.target.value.replace(/[^0-9.]/g, '');
                        const numValue = parseFloat(value);

                        // Allow any positive number or zero, including decimals
                        if (value === '' || (!isNaN(numValue) && numValue >= 0)) {
                          setGhostCardData({...ghostCardData, amount: value || '0'});
                        }
                      }}
                      placeholder="Enter amount (e.g., $5.50)"
                      required
                      className={styles.amountInput}
                    />
                    <input
                      type="range"
                      min="0"
                      max="1000"
                      step="1"
                      value={Number(ghostCardData.amount) || 0}
                      onChange={(e) => setGhostCardData({...ghostCardData, amount: e.target.value})}
                      className={styles.amountSlider}
                    />
                    <div className={styles.sliderLabels}>
                      <span>$0.00</span>
                      <span>$1,000.00</span>
                    </div>
                  </div>
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
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={ghostCardData.single_use}
                      onChange={(e) => setGhostCardData({...ghostCardData, single_use: e.target.checked})}
                      className={styles.checkbox}
                    />
                    <span className={styles.checkboxText}>One-time use only</span>
                    <small className={styles.checkboxHelpText}>
                      Card will automatically deactivate after the first successful transaction
                    </small>
                  </label>
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

        {showDeleteModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <h2>Delete Ghost Card</h2>
              <div className={styles.deleteModalContent}>
                <div className={styles.warningIcon}>⚠️</div>
                <p>Are you sure you want to delete this ghost card?</p>
                <p className={styles.warningText}>This action cannot be undone.</p>
              </div>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={cancelDeleteCard}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={`${styles.submitBtn} ${styles.deleteBtn}`}
                  onClick={confirmDeleteCard}
                >
                  Delete Card
                </button>
              </div>
            </div>
          </div>
        )}

        {toast.show && (
          <div className={`${styles.toast} ${styles[toast.type]}`}>
            {toast.message}
          </div>
        )}
      </main>
    </div>
  );
}
