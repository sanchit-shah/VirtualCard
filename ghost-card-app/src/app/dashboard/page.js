'use client';
import styles from './styles.module.css';

export default function DashboardPage() {
  const accounts = [
    { type: 'Primary Checking', number: '*****1234', balance: 2543.21, recentTransactions: 12 },
    { type: 'High-Yield Savings', number: '*****5678', balance: 12750.84, recentTransactions: 5 },
    { type: 'Credit Card', number: '*****9012', balance: -450.32, recentTransactions: 8 }
  ];

  return (
    <div className={styles.container}>
      <nav className={styles.nav}>
        <div className={styles.navLeft}>
          <h1>SecureBank</h1>
          <div className={styles.navLinks}>
            <a href="#" className={styles.active}>Accounts</a>
            <a href="#">Transfer</a>
            <a href="#">Bill Pay</a>
            <a href="#">Investments</a>
          </div>
        </div>
        <div className={styles.navRight}>
          <button className={styles.notificationBtn}>
            <span className={styles.notificationDot}></span>
            🔔
          </button>
          <button className={styles.profileBtn}>
            <span className={styles.profileIcon}>JS</span>
            John Smith
          </button>
          <button className={styles.logoutBtn} onClick={() => window.location.href = '/login'}>
            Logout
          </button>
        </div>
      </nav>
      
      <main className={styles.main}>
        <div className={styles.welcomeBar}>
          <div>
            <h2>Welcome back, John</h2>
            <p className={styles.lastLogin}>Last login: Today, 2:15 PM</p>
          </div>
          <button className={styles.primaryBtn}>+ New Transaction</button>
        </div>

        <div className={styles.quickActions}>
          <button className={styles.actionBtn}>💸 Send Money</button>
          <button className={styles.actionBtn}>📱 Mobile Deposit</button>
          <button className={styles.actionBtn}>📄 Statements</button>
          <button className={styles.actionBtn}>⚙️ Settings</button>
        </div>
        
        <div className={styles.accountsGrid}>
          {accounts.map((account, index) => (
            <div key={index} className={styles.accountCard}>
              <div className={styles.accountHeader}>
                <h3>{account.type}</h3>
                <span className={styles.accountBadge}>Active</span>
              </div>
              <p className={styles.accountNumber}>Account: {account.number}</p>
              <p className={`${styles.balance} ${account.balance < 0 ? styles.negative : ''}`}>
                ${Math.abs(account.balance).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              <div className={styles.accountStats}>
                <span>Recent Transactions: {account.recentTransactions}</span>
                <a href="#" className={styles.viewAll}>View All →</a>
              </div>
              <div className={styles.actions}>
                <button className={styles.actionButton}>Transfer</button>
                <button className={styles.actionButton}>Pay Bills</button>
                <button className={styles.actionButton}>Details</button>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.bottomGrid}>
          <div className={styles.recentActivity}>
            <h3>Recent Activity</h3>
            <div className={styles.activityList}>
              <div className={styles.activityItem}>
                <span className={styles.merchant}>Amazon.com</span>
                <span className={styles.amount}>-$34.99</span>
              </div>
              <div className={styles.activityItem}>
                <span className={styles.merchant}>Direct Deposit - ACME Inc</span>
                <span className={`${styles.amount} ${styles.positive}`}>+$2,450.00</span>
              </div>
              <div className={styles.activityItem}>
                <span className={styles.merchant}>Starbucks</span>
                <span className={styles.amount}>-$5.65</span>
              </div>
            </div>
          </div>
          
          <div className={styles.quickLinks}>
            <h3>Quick Links</h3>
            <div className={styles.linksList}>
              <a href="#">📊 Spending Analysis</a>
              <a href="#">🎯 Budget Goals</a>
              <a href="#">📱 Mobile Banking</a>
              <a href="#">🔒 Security Settings</a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}