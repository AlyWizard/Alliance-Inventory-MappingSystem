import React from 'react';

function AccountCreationConfirmation({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-xl p-6 w-[320px] shadow-xl border border-slate-700">
        <h2 className="text-2xl font-semibold text-white mb-2">Create New Account</h2>
        
        <p className="text-slate-300 mb-6">
          Are you sure you want to create this new account?
        </p>
        
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 rounded-lg bg-white text-slate-900 hover:bg-slate-100 transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

export default AccountCreationConfirmation;