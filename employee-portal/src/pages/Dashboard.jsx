import { useSearchParams } from 'react-router-dom';
import Overview from '../views/Overview.jsx';
import Transactions from '../views/Transactions.jsx';
import Activity from '../views/Activity.jsx';
import CustomersList from '../views/CustomersList.jsx';
import CustomerProfile from '../views/CustomerProfile.jsx';
import StaffAccounts from '../views/StaffAccounts.jsx';
import SecurityPolicy from '../views/SecurityPolicy.jsx';

export default function Dashboard() {
  const [params] = useSearchParams();
  const view = params.get('view') || 'overview';
  const id = params.get('id');

  if (view === 'customers' && id) return <CustomerProfile customerId={id} />;

  switch (view) {
    case 'overview':   return <Overview />;
    case 'pending':
    case 'verified':
    case 'submitted':  return <Transactions status={view} />;
    case 'activity':   return <Activity />;
    case 'customers':  return <CustomersList />;
    case 'staff':      return <StaffAccounts />;
    case 'security':   return <SecurityPolicy />;
    default:           return <Overview />;
  }
}
