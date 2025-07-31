'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './styles.module.css';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1️⃣ Call backend to create user
      const res = await fetch('http://localhost:8080/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: username,
          total_balance: 1000 // default for demo
        })
      });

      if (!res.ok) {
        throw new Error('Failed to create user');
      }

      const data = await res.json();

      // 2️⃣ Store user details for later API calls
      localStorage.setItem('user_id', data.user_id);
      localStorage.setItem('stripe_cardholder_id', data.stripe_cardholder_id);

      // 3️⃣ Redirect to dashboard
      router.push('/dashboard');

    } catch (err) {
      console.error('Login error:', err);
      setError('Could not create user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginBox}>
        <h1>Enter Username</h1>
        <form onSubmit={handleLogin}>
          <div className={styles.inputGroup}>
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Enter your username"
            />
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <button className={styles.button} type="submit" disabled={loading}>
            {loading ? 'Creating User...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}