type Listener = (syncing: boolean) => void;

let isSyncing = false;
const listeners = new Set<Listener>();

export function getIsSyncing() {
  return isSyncing;
}

export function setIsSyncing(v: boolean) {
  isSyncing = v;
  listeners.forEach((l) => l(isSyncing));
}

export function subscribeSyncing(listener: Listener) {
  listeners.add(listener);
  listener(isSyncing);

  return () => {
    listeners.delete(listener);
  };
}
