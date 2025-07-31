'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import styles from './styles.module.css';

// Demo merchants list
const MERCHANTS = [
  'amazon', 'spotify', 'netflix', 'walmart', 'target',
  'apple', 'google play', 'uber', 'doordash', 'grubhub',
  'best buy', 'ebay', 'etsy', 'steam', 'playstation',
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
    merchants: []
  });

  // Fetch card data on load
  useEffect(() => {
    fetchCardData();
    fetchTransactions();
  }, [cardId]);

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
    // TODO: Add transaction history endpoint
    setTransactions([]);
  };

  const handleTransactionSimulation = async (e) => {
    e.preventDefault();
    if (!cardData) return;

    setSimulationLoading(true);
    try {
      const res = await fetch('http://localhost:8080/cards/charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          card_id: cardData.stripe_card_id,
          amount: parseFloat(simulationAmount),
          merchant: simulationMerchant
        })
      });

      const result = await res.json();

      // Add transaction to list (approved or rejected)
      const newTransaction = {
        id: Date.now(),
        amount: parseFloat(simulationAmount),
        merchant: simulationMerchant,
        status: result.approved ? 'approved' : 'rejected',
        reason: result.reason,
        timestamp: new Date().toISOString()
      };

      setTransactions(prev => [newTransaction, ...prev]);

      // Reset form
      setSimulationAmount('');
      setSimulationMerchant('');

      // Refresh card data to get updated balance
      fetchCardData();

    } catch (err) {
      console.error('Transaction error:', err);
    } finally {
      setSimulationLoading(false);
    }
  };

  const handleEditRulesSubmit = async (e) => {
    e.preventDefault();
    const userId = localStorage.getItem('user_id');
    if (!userId) return;

    try {
      const expiryISO = new Date(
        `${editRulesData.expirationDate}T${editRulesData.expirationTime}:00`
      ).toISOString();

      const res = await fetch(`http://localhost:8080/cards/update_ghost_card/${cardId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          allowed_merchants: editRulesData.merchants,
          expires_at: expiryISO,
          alias: editRulesData.alias
        })
      });

      if (!res.ok) throw new Error("Failed to update Ghost Card");

      setShowEditRulesModal(false);
      fetchCardData(); // Refresh card data
    } catch (err) {
      console.error(err);
      alert("Error updating Ghost Card");
    }
  };

  if (loading) return <p>Loading card details...</p>;
  if (!cardData) return <p>Card not found</p>;

  // Extract card properties
  const alias = `Ghost Card ${cardData.id.slice(-4)}`;
  const amount = cardData.balance || 0;
  // Update this line to match dashboard format
  const expiresAt = cardData.expires_at ? new Date(cardData.expires_at._seconds * 1000).toLocaleString() : 'N/A';
  const merchants = cardData.allowed_merchants ? cardData.allowed_merchants.join(', ') : 'No restrictions';
  const cardDetails = {
    stripe_card: {
      last4: cardData.last4 || '0000'
    }
  };

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
          <div className={styles.virtualCard}>
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
                  alias: alias,
                  merchants: cardData.allowed_merchants || []
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
              <p className={styles.noTransactions}>No transactions yet</p>
            </div>
          </div>
        </div>

        <div className={styles.rightPanel}>
          <div className={styles.simulationTool}>
            <h2>Transaction Simulator</h2>
            <div className={styles.simulationForm}>
              <div className={styles.inputGroup}>
                <label>Card Number</label>
                <input
                  type="text"
                  value={`****${cardDetails.stripe_card.last4}`}
                  disabled
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Amount (USD)</label>
                <input
                  type="number"
                  value={simulationAmount}
                  onChange={(e) => setSimulationAmount(e.target.value)}
                  placeholder="Enter amount"
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Merchant</label>
                <select
                  value={simulationMerchant}
                  onChange={(e) => setSimulationMerchant(e.target.value)}
                >
                  <option value="">Select merchant</option>
                  {MERCHANTS.map((merchant, index) => (
                    <option key={index} value={merchant}>
                      {merchant}
                    </option>
                  ))}
                </select>
              </div>
              <button className={styles.simulateBtn}>
                Simulate Transaction
              </button>
            </div>
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
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <small className={styles.helpText}>Hold Ctrl (Cmd on Mac) to select multiple</small>
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
