/**
 * useConnectivity — subscribes to network state changes.
 * Used to show offline banner and trigger sync.
 */

import { useEffect, useState } from 'react';
import * as Network from 'expo-network';

export function useConnectivity() {
  const [isOnline, setIsOnline] = useState(true);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Initial check
    Network.getNetworkStateAsync().then((state) => {
      if (isMounted) {
        setIsOnline(state.isConnected === true && state.isInternetReachable !== false);
        setIsChecking(false);
      }
    });

    // Poll every 5 seconds (expo-network doesn't have a listener API)
    const interval = setInterval(async () => {
      const state = await Network.getNetworkStateAsync();
      if (isMounted) {
        setIsOnline(state.isConnected === true && state.isInternetReachable !== false);
      }
    }, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return { isOnline, isChecking };
}
