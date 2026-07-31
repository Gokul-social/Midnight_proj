import { useCallback, useEffect, useState } from 'react';
import { detectLaceWallet, isLaceConnected } from '../lib/wallet';

/** Hook to monitor if the Lace wallet extension is installed and available */
export function useWalletDetection() {
  const [isLaceAvailable, setIsLaceAvailable] = useState(false);
  const [isAlreadyConnected, setIsAlreadyConnected] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const checkWallet = useCallback(async () => {
    setIsChecking(true);
    try {
      const connector = detectLaceWallet();
      setIsLaceAvailable(!!connector);

      if (connector) {
        const connected = await isLaceConnected();
        setIsAlreadyConnected(connected);
      }
    } catch {
      setIsLaceAvailable(false);
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    // Check immediately
    checkWallet();

    // Re-check when the window gains focus (user may have installed Lace)
    const handleFocus = () => checkWallet();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [checkWallet]);

  return { isLaceAvailable, isAlreadyConnected, isChecking, recheckWallet: checkWallet };
}
