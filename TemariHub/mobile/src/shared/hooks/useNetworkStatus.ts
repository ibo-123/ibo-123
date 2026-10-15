import * as Network from 'expo-network';
import { NetworkStateType, type NetworkState } from 'expo-network';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

export type NetworkStatus = {
  /** Device has no connection, or Android airplane mode is on and nothing is connected. */
  isOffline: boolean;
  isConnected: boolean | null;
  type: NetworkStateType | null;
};

function isOfflineState(state: NetworkState, airplane: boolean): boolean {
  if (state.type === NetworkStateType.NONE || state.isConnected === false) {
    return true;
  }
  // Airplane mode can flip before the connection callback. Don't treat wifi-in-airplane as offline.
  return airplane && state.isConnected !== true;
}

/**
 * Live connection for the offline banner.
 * Unknown readings stay online so the banner doesn't flash on launch.
 */
export function useNetworkStatus(): NetworkStatus {
  const [state, setState] = useState<NetworkState>({});
  const [airplane, setAirplane] = useState(false);

  useEffect(() => {
    let active = true;

    const readAirplane = () => {
      if (Platform.OS !== 'android') return;
      Network.isAirplaneModeEnabledAsync()
        .then((enabled) => {
          if (active) setAirplane(enabled);
        })
        .catch(() => {
          if (active) setAirplane(false);
        });
    };

    Network.getNetworkStateAsync()
      .then((next) => {
        if (active) setState(next);
      })
      .catch(() => undefined);

    readAirplane();

    const subscription = Network.addNetworkStateListener((next) => {
      if (!active) return;
      setState(next);
      readAirplane();
    });

    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return {
    isOffline: isOfflineState(state, airplane),
    isConnected: state.isConnected ?? null,
    type: state.type ?? null,
  };
}
