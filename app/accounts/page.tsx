import { fetchUpApi } from '../../lib/api';
import Account from '../../components/Account';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Account = {
  id: string;
  attributes: {
    displayName: string;
    balance: {
      value: string;
    };
  };
};

const AccountsPage = async () => {
  const data = await fetchUpApi('accounts');
  const accounts: Account[] = data.data;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">My Accounts</h1>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {accounts.map((account) => (
          <Account
            key={account.id}
            id={account.id}
            displayName={account.attributes.displayName}
            balance={account.attributes.balance.value}
          />
        ))}
      </div>
    </div>
  );
};

export default AccountsPage;
