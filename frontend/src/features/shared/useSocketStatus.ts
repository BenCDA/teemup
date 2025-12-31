import { useState, useEffect } from 'react';
import socketService, { ConnectionStatus } from './socket';

export function useSocketStatus(): ConnectionStatus {
  const [status, setStatus] = useState<ConnectionStatus>(socketService.getConnectionStatus());

  useEffect(() => {
    const unsubscribe = socketService.onStatusChange(setStatus);
    return unsubscribe;
  }, []);

  return status;
}
