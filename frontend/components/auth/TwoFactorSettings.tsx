'use client';

import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { QRCodeSVG } from 'qrcode.react';
import {
  generateTwoFactorSetup,
  enableTwoFactor,
  disableTwoFactor,
} from '../../lib/features/auth/authSlice';
import { AppDispatch, RootState } from '../../lib/store';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export default function TwoFactorSettings() {
  const dispatch = useDispatch<AppDispatch>();
  const { user, twoFactorSetup, isLoading, error } = useSelector(
    (state: RootState) => state.auth
  );
  const [code, setCode] = useState('');
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);

  const handleSetup = () => {
    dispatch(generateTwoFactorSetup());
  };

  const handleEnable = () => {
    dispatch(enableTwoFactor(code));
    setCode('');
  };

  const handleDisable = () => {
    dispatch(disableTwoFactor(code));
    setCode('');
    setShowDisableConfirm(false);
  };

  if (user?.isTwoFactorEnabled) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Two-Factor Authentication</h3>
        <p className="text-sm text-green-600 font-medium">Enabled</p>
        <p className="text-sm text-gray-500">
          Your account is secured with two-factor authentication.
        </p>

        {!showDisableConfirm ? (
          <Button
            variant="destructive"
            onClick={() => setShowDisableConfirm(true)}
            className="w-auto"
          >
            Disable 2FA
          </Button>
        ) : (
          <div className="space-y-4 border-t pt-4">
            <p className="text-sm text-gray-700">
              Enter your code to confirm disabling 2FA.
            </p>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="000000"
              maxLength={6}
              className="max-w-xs"
            />
            <div className="flex space-x-2">
              <Button
                variant="destructive"
                onClick={handleDisable}
                isLoading={isLoading}
                disabled={code.length !== 6}
                className="w-auto"
              >
                Confirm Disable
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowDisableConfirm(false)}
                className="w-auto"
              >
                Cancel
              </Button>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Two-Factor Authentication</h3>
      <p className="text-sm text-gray-500">
        Add an extra layer of security to your account.
      </p>

      {!twoFactorSetup ? (
        <Button onClick={handleSetup} isLoading={isLoading} className="w-auto">
          Setup 2FA
        </Button>
      ) : (
        <div className="space-y-6 border-t pt-4">
          <div className="flex flex-col items-center space-y-4">
            <p className="text-sm text-gray-700">
              Scan this QR code with your authenticator app (e.g., Google Authenticator, Authy).
            </p>
            <div className="p-4 bg-white border rounded-lg">
              <QRCodeSVG value={twoFactorSetup.otpauthUrl} size={200} />
            </div>
            <p className="text-xs text-gray-500">
              Secret: <span className="font-mono">{twoFactorSetup.secret}</span>
            </p>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              Enter the 6-digit code from your app to enable 2FA.
            </p>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="000000"
              maxLength={6}
              className="max-w-xs"
            />
            <div className="flex space-x-2">
              <Button
                onClick={handleEnable}
                isLoading={isLoading}
                disabled={code.length !== 6}
                className="w-auto"
              >
                Enable 2FA
              </Button>
              <Button
                variant="secondary"
                onClick={() => window.location.reload()} // Reset state simply
                className="w-auto"
              >
                Cancel
              </Button>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
