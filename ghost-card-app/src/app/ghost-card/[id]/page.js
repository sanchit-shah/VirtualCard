'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import styles from './styles.module.css';

// Demo merchants list
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

export default function GhostCardManagePage() {
  const params = useParams();
  const cardId = params.id;

  // Real state from backend
  const [cardData, setCardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [simulationAmount, setSimulationAmount] = useState('');
  const [simulationMerchant, setSimulationMerchant] = useState('');
  const [simulationLoading, setSimulationLoading] = useState(false);
  const [showEditRulesModal, setShowEditRulesModal] = useState(false);
  const [editRulesData, setEditRulesData] = useState({
    expirationDate: '',
    expirationTime: '',
    alias: '',
    merchants: [],
    colorTheme: 'ocean'
  });

  // Fetch card data on load
  useEffect(() => {
    fetchCardData();
  }, [cardId]);

  // Fetch transactions when cardData is available
  useEffect(() => {
    if (cardData) {
      fetchTransactions();
    }
  }, [cardData]);

  const fetchCardData = async () => {
    const userId = localStorage.getItem('user_id');
    if (!userId) return;

    try {
      const res = await fetch(`http://localhost:8080/cards/ghost_cards?user_id=${userId}`);
      const data = await res.json();
      const card = data.cards.find(c => c.id === cardId);
      setCardData(card);
    } catch (err) {
      console.error('Error fetching card data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    if (!cardData) return;

    try {
      const res = await fetch(`http://localhost:8080/transactions/${cardData.id}/history`);
      const data = await res.json();

      if (data.success && data.transactions) {
        setTransactions(data.transactions);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setTransactions([]);
    }
  };

  const handleTransactionSimulation = async (e) => {
    e.preventDefault();
    if (!cardData) return;

    setSimulationLoading(true);
    try {
      const res = await fetch('http://localhost:8080/transactions/charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          card_id: cardData.stripe_card_id,
          amount: parseFloat(simulationAmount),
          merchant: simulationMerchant
        })
      });

      // No need to add to local state here!
      // Always fetch from backend after simulation

      // Reset form
      setSimulationAmount('');
      setSimulationMerchant('');

      // Refresh card data and transactions
      await fetchCardData();
      await fetchTransactions();

    } catch (err) {
      console.error('Transaction error:', err);
    } finally {
      setSimulationLoading(false);
    }
  };

  const handleEditRulesSubmit = async (e) => {
    e.preventDefault();
    if (!cardData) return;

    try {
      const expiryISO = new Date(
        `${editRulesData.expirationDate}T${editRulesData.expirationTime}:00`
      ).toISOString();

      const res = await fetch(`http://localhost:8080/cards/${cardData.stripe_card_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alias: editRulesData.alias,
          allowed_merchants: editRulesData.merchants,
          expires_at: expiryISO,
          color_theme: editRulesData.colorTheme
        })
      });

      if (!res.ok) throw new Error('Failed to update card rules');

      const data = await res.json();
      alert(data.message);

      // Close modal and refresh card data
      setShowEditRulesModal(false);
      fetchCardData();

    } catch (err) {
      console.error('Error updating card rules:', err);
      alert('Error updating card rules');
    }
  };

  if (loading) return <p>Loading card details...</p>;
  if (!cardData) return <p>Card not found</p>;

  // Extract card properties
  const alias = cardData.alias || `Ghost Card ${cardData.id.slice(-4)}`;
  const amount = cardData.balance || 0;
  // Update this line to match dashboard format
  const expiresAt = cardData.expires_at ? new Date(cardData.expires_at._seconds * 1000).toLocaleString() : 'N/A';
  const merchants = cardData.allowed_merchants ?
    cardData.allowed_merchants.map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(', ') :
    'No restrictions';
  const cardDetails = {
    stripe_card: {
      last4: cardData.last4 || '0000'
    }
  };

  // Get the card theme
  const cardTheme = CARD_THEMES.find(theme => theme.id === cardData.color_theme) || CARD_THEMES[0];

  return (
    <div className={styles.container}>
      <nav className={styles.nav}>
        <div className={styles.navLeft}>
          <h1>Ghost Card Management</h1>
        </div>
        <button
          className={styles.backBtn}
          onClick={() => window.location.href = '/dashboard'}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back to Dashboard
        </button>
      </nav>

      <main className={styles.dashboard}>
        <div className={styles.leftPanel}>
          <div className={styles.virtualCard} style={{ background: cardTheme.gradient }}>
            <div className={styles.cardHeader}>
              <h3>{alias}</h3>
              <div className={styles.balanceContainer}>
                <span className={styles.balanceLabel}>Balance</span>
                <span className={styles.balanceAmount}>
                  ${parseFloat(amount).toFixed(2)}
                </span>
              </div>
            </div>
            <div className={styles.cardNumber}>
              •••• •••• •••• {cardDetails.stripe_card.last4}
            </div>
            <div className={styles.cardFooter}>
              <span>Expires: {expiresAt}</span>
              <span className={styles.cardType}>VIRTUAL</span>
            </div>
          </div>

          <div className={styles.rulesSection}>
            <div className={styles.sectionHeader}>
              <h3>Card Rules</h3>
              <button className={styles.editButton} onClick={() => {
                // Pre-populate the form with current values
                const currentDate = new Date(cardData.expires_at._seconds * 1000);
                setEditRulesData({
                  expirationDate: currentDate.toISOString().split('T')[0],
                  expirationTime: currentDate.toTimeString().split(':').slice(0, 2).join(':'),
                  alias: cardData.alias || `Ghost Card ${cardData.id.slice(-4)}`,
                  merchants: cardData.allowed_merchants || [],
                  colorTheme: cardData.color_theme || 'ocean'
                });
                setShowEditRulesModal(true);
              }}>
                Edit Rules
              </button>
            </div>
            <div className={styles.rulesList}>
              <div className={styles.rule}>
                <span>🏪 Allowed Merchants</span>
                <p>{merchants}</p>
              </div>
              <div className={styles.rule}>
                <span>💰 Spending Limit</span>
                <p>${amount}</p>
              </div>
              <div className={styles.rule}>
                <span>⏱️ Expiration</span>
                <p>{expiresAt}</p>
              </div>
            </div>
          </div>

          <div className={styles.transactionsSection}>
            <h3>Recent Transactions</h3>
            <div className={styles.transactionsList}>
              {transactions.length === 0 ? (
                <p className={styles.noTransactions}>No transactions yet</p>
              ) : (
                transactions.map((transaction) => (
                  <div key={transaction.id} className={styles.transactionItem}>
                    <div className={styles.transactionInfo}>
                      <span className={styles.merchant}>
                        {transaction.merchant}
                      </span>
                      <span className={styles.amount}>
                        ${transaction.amount.toFixed(2)}
                      </span>
                    </div>
                    <div className={styles.transactionMeta}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className={`${styles.status} ${styles[transaction.status]}`}>
                          {transaction.status}
                        </span>
                        <span className={styles.timestamp}>
                          {transaction.timestamp?.toDate ? 
                            transaction.timestamp.toDate().toLocaleDateString() : 
                            new Date(transaction.timestamp).toLocaleDateString()
                          }
                        </span>
                      </div>
                      {transaction.status === 'rejected' && transaction.reason && (
                        <span className={styles.rejectionReason}>
                          ❌ {transaction.reason}
                        </span>
                      )}
                    </div>
                  </div>
                )))
              }
            </div>
          </div>
        </div>

        <div className={styles.rightPanel}>
          <div className={styles.simulationTool}>
            <h2>Transaction Simulator</h2>
            <form className={styles.simulationForm} onSubmit={handleTransactionSimulation}>
              <div className={styles.inputGroup}>
                <label>Card Number</label>
                <input
                  type="text"
                  value={cardData?.last4 ? `****${cardData.last4}` : '****----'}
                  disabled
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Amount (USD)</label>
                <div className={styles.amountContainer}>
                  <input
                    type="text"
                    value={`$${parseFloat(simulationAmount || 0).toFixed(2)}`}
                    onChange={(e) => {
                      // Strip non-numeric characters and convert to number
                      const value = parseFloat(e.target.value.replace(/[^0-9.]/g, ''));
                      if (!isNaN(value)) {
                        const clampedValue = Math.min(1000, Math.max(10, value));
                        setSimulationAmount(clampedValue.toString());
                      }
                    }}
                    required
                    className={styles.amountInput}
                  />
                  <input
                    type="range"
                    min="10"
                    max="1000"
                    step="10"
                    value={simulationAmount || 10}
                    onChange={(e) => setSimulationAmount(e.target.value)}
                    className={styles.amountSlider}
                  />
                  <div className={styles.sliderLabels}>
                    <span>$10.00</span>
                    <span>$1,000.00</span>
                  </div>
                </div>
              </div>
              
              <div className={styles.inputGroup}>
                <label>Merchant</label>
                <select
                  value={simulationMerchant}
                  onChange={(e) => setSimulationMerchant(e.target.value)}
                  required
                >
                  <option value="">Select merchant</option>
                  {MERCHANTS.map((merchant, index) => (
                    <option key={index} value={merchant}>
                      {merchant.charAt(0).toUpperCase() + merchant.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <button 
                type="submit" 
                className={styles.simulateBtn}
                disabled={simulationLoading || !simulationAmount || !simulationMerchant}
              >
                {simulationLoading ? 'Processing...' : 'Simulate Transaction'}
              </button>
            </form>
          </div>
        </div>
      </main>

      {showEditRulesModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>Edit Ghost Card Rules</h2>
            <form onSubmit={handleEditRulesSubmit}>
              <div className={styles.modalGroup}>
                <label>Expiration Date</label>
                <input
                  type="date"
                  value={editRulesData.expirationDate}
                  onChange={(e) => setEditRulesData({
                    ...editRulesData,
                    expirationDate: e.target.value
                  })}
                  required
                />
              </div>

              <div className={styles.modalGroup}>
                <label>Expiration Time</label>
                <input
                  type="time"
                  value={editRulesData.expirationTime}
                  onChange={(e) => setEditRulesData({
                    ...editRulesData,
                    expirationTime: e.target.value
                  })}
                  required
                />
              </div>

              <div className={styles.modalGroup}>
                <label>Alias/Nickname</label>
                <input
                  type="text"
                  value={editRulesData.alias}
                  onChange={(e) => setEditRulesData({
                    ...editRulesData,
                    alias: e.target.value
                  })}
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
                        name="editColorTheme"
                        value={theme.id}
                        checked={editRulesData.colorTheme === theme.id}
                        onChange={(e) => setEditRulesData({...editRulesData, colorTheme: e.target.value})}
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
                  value={editRulesData.merchants}
                  onChange={(e) => setEditRulesData({
                    ...editRulesData,
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
                        backgroundColor: editRulesData.merchants.includes(m) ? '#3182ce' : 'transparent',
                        color: editRulesData.merchants.includes(m) ? 'white' : 'inherit'
                      }}
                    >
                      {editRulesData.merchants.includes(m) ? '✓ ' : ''}{m.charAt(0).toUpperCase() + m.slice(1)}
                    </option>
                  ))}
                </select>
                <small className={styles.helpText}>
                  Current selections: {editRulesData.merchants.length > 0 ?
                    editRulesData.merchants.map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(', ') :
                    'None selected'
                  }
                  <br />Hold Ctrl (Cmd on Mac) to select multiple
                </small>
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setShowEditRulesModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.submitBtn}>
                  Update Rules
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

