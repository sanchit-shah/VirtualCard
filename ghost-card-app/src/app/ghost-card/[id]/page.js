'use client';
import { useState } from 'react';
import styles from './styles.module.css';

// Demo merchants list
const MERCHANTS = [
  'Amazon', 'Spotify', 'Netflix', 'Walmart', 'Target',
  'Apple', 'Google Play', 'Uber', 'DoorDash', 'Grubhub',
  'Best Buy', 'eBay', 'Etsy', 'Steam', 'PlayStation',
];

export default function GhostCardManagePage() {
  // Static demo data
  const [alias] = useState('Demo Ghost Card');
  const [amount] = useState('1000.00');
  const [expiresAt] = useState('12/31/2024');
  const [merchants] = useState('Amazon, Netflix, Spotify');
  const [cardDetails] = useState({
    stripe_card: {
      last4: '4242',
      status: 'active'
    }
  });
  const [simulationAmount, setSimulationAmount] = useState('');
  const [simulationMerchant, setSimulationMerchant] = useState('');
  const [transactions] = useState([]); // Empty for now

  return (
    <div className={styles.container}>
      <nav className={styles.nav}>
        <div className={styles.navLeft}>
          <h1>Ghost Card Management</h1>
        </div>
        <button className={styles.backBtn} onClick={() => window.location.href = '/dashboard'}>
          ← Back to Dashboard
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
              <button className={styles.editButton}>Edit Rules</button>
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
    </div>
  );
}