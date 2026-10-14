import React from 'react';
import { PurchaseModal } from './CreditPurchase';
// Compatibility wrapper for the former Donate entry point; no client-side unlock.
export const DonateModal: React.FC<{isOpen: boolean; onClose: () => void;
  onConfirmPayment?: () => void; isLimitReached?: boolean}> = ({ isOpen, onClose }) =>
  isOpen ? <PurchaseModal product="manual" onClose={onClose} /> : null;
