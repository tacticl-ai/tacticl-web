import type { AgentAction } from '../../api/types';
import ConnectAccountCard from './ConnectAccountCard';
import GrantRepoCard from './GrantRepoCard';
import AddTokenCard from './AddTokenCard';
import ConnectDeviceCard from './ConnectDeviceCard';

interface ActionCardProps {
  action: AgentAction;
  onComplete: () => void;
}

export default function ActionCard({ action, onComplete }: ActionCardProps) {
  switch (action.type) {
    case 'connect_account':
      return <ConnectAccountCard action={action} onComplete={onComplete} />;
    case 'grant_repo':
      return <GrantRepoCard action={action} onComplete={onComplete} />;
    case 'add_token':
      return <AddTokenCard action={action} onComplete={onComplete} />;
    case 'connect_device':
      return <ConnectDeviceCard action={action} onComplete={onComplete} />;
    default:
      return null;
  }
}
