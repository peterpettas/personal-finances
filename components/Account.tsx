import React from 'react';

type AccountProps = {
  displayName: string;
  balance: string;
  id: string;
};

const Account: React.FC<AccountProps> = ({ displayName, balance, id }) => (
  <div id={id} className="p-4 bg-white rounded-lg shadow-md">
    <h2 className="text-xl font-bold">{displayName}</h2>
    <p className="text-gray-600">Balance: ${balance}</p>
  </div>
);

export default Account;
