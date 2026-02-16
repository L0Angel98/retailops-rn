import { useEffect, useState } from "react";
import NetInfo from "@react-native-community/netinfo";

export function useConnectivity() {
  const [online, setOnline] = useState<boolean>(true);
  const [reachable, setReachable] = useState<boolean | null>(null);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      const isConn = !!state.isConnected;
      const isReach = state.isInternetReachable;

      setOnline(isConn && isReach !== false);
      setReachable(isReach ?? null);
    });

    return () => unsub();
  }, []);

  return { online, reachable };
}
