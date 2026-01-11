import { Wallet, HDNodeWallet } from 'ethers';

const WALLET_STORAGE_KEY = 'renaissance_embedded_wallet';

export interface EmbeddedWalletData {
  address: string;
  encryptedPrivateKey: string;
}

/**
 * Generate a new embedded wallet
 * Returns the wallet instance and public address
 */
export function generateWallet(): { wallet: HDNodeWallet; address: string } {
  const wallet = Wallet.createRandom();
  return {
    wallet,
    address: wallet.address,
  };
}

/**
 * Store wallet private key in localStorage
 * In production, consider using more secure storage methods
 */
export function storeWalletLocally(privateKey: string, address: string): void {
  if (typeof window === 'undefined') return;
  
  const walletData: EmbeddedWalletData = {
    address,
    encryptedPrivateKey: privateKey, // In production, encrypt this with a user-derived key
  };
  
  localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(walletData));
}

/**
 * Retrieve stored wallet from localStorage
 */
export function getStoredWallet(): EmbeddedWalletData | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(WALLET_STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as EmbeddedWalletData;
  } catch {
    return null;
  }
}

/**
 * Get wallet instance from stored private key
 */
export function getWalletFromStorage(): Wallet | null {
  const stored = getStoredWallet();
  if (!stored) return null;
  
  try {
    return new Wallet(stored.encryptedPrivateKey);
  } catch {
    return null;
  }
}

/**
 * Check if user has an embedded wallet stored
 */
export function hasStoredWallet(): boolean {
  return getStoredWallet() !== null;
}

/**
 * Clear stored wallet (for sign out)
 */
export function clearStoredWallet(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(WALLET_STORAGE_KEY);
}

/**
 * Get or create an embedded wallet
 * Returns existing wallet address if stored, otherwise generates new one
 */
export function getOrCreateWallet(): { address: string; privateKey: string; isNew: boolean } {
  const stored = getStoredWallet();
  
  if (stored) {
    return {
      address: stored.address,
      privateKey: stored.encryptedPrivateKey,
      isNew: false,
    };
  }
  
  const { wallet, address } = generateWallet();
  const privateKey = wallet.privateKey;
  
  storeWalletLocally(privateKey, address);
  
  return {
    address,
    privateKey,
    isNew: true,
  };
}
