import React from 'react';

const AccountSummary = () => {
    const accounts = [
        { type: 'Checking', balance: 1500.00 },
        { type: 'Savings', balance: 3000.00 }
    ];

    return (
        <div>
            <h2>Account Summary</h2>
            <ul>
                {accounts.map((account, index) => (
                    <li key={index}>
                        {account.type} Account: ${account.balance.toFixed(2)}
                    </li>
                ))}
            </ul>
            <button>Transfer Funds</button>
            <button>View Transactions</button>
        </div>
    );
};

export default AccountSummary;