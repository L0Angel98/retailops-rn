import { useEffect, useState } from "react";
import { subscribeSyncing } from "./syncState";

export function useSyncing() {
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    return subscribeSyncing(setSyncing);
  }, []);

  return syncing;
}
