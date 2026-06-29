'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { sendOtpAction, verifyOtpAction } from '@/app/actions/auth';

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendSeconds, setResendSeconds] = useState(0);

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = setTimeout(() => setResendSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendSeconds]);

  const sendOTP = async () => {
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await sendOtpAction('+91' + phone);
      if (res.error) throw new Error(res.error);
      
      setStep('otp');
      setResendSeconds(60);
    } catch (e: any) {
      setError(e.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = useCallback(async (otpValue: string) => {
    if (otpValue.length !== 6) return;
    setError(null);
    setLoading(true);
    try {
      const res = await verifyOtpAction('+91' + phone, otpValue);
      if (res.error) throw new Error(res.error);
      
      if (res.role === 'dealer') {
        router.push('/dealer');
      } else {
        router.push('/superadmin');
      }
    } catch (e: any) {
      setError(e.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [phone, router]);

  const handleOtpChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 6);
    setOtp(cleaned);
    if (cleaned.length === 6) {
      verifyOTP(cleaned);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-[#C3C6D4]/20 p-8">
      {step === 'phone' ? (
        <>
          <h2 className="text-xl font-bold text-[#1E1C0D] mb-1">Swagat Hai!</h2>
          <p className="text-sm text-[#434652] mb-6">
            Enter your mobile number to access the dashboard
          </p>

          <label className="block text-xs font-bold text-[#003178] tracking-wider uppercase mb-1.5 ml-1">
            Mobile Number
          </label>
          <div className="flex items-center gap-2 bg-[#E9E2CB] rounded-xl px-4 py-3 mb-4">
            <span className="text-sm font-semibold text-[#1E1C0D]">+91</span>
            <div className="w-px h-6 bg-[#C3C6D4]" />
            <input
              type="tel"
              maxLength={10}
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value.replace(/\D/g, ''));
                setError(null);
              }}
              placeholder="9876543210"
              className="flex-1 bg-transparent outline-none text-sm font-semibold text-[#1E1C0D] placeholder:text-[#737783]"
              disabled={loading}
            />
          </div>

          {error && (
            <p className="text-sm text-[#BA1A1A] mb-4">{error}</p>
          )}

          <button
            onClick={sendOTP}
            disabled={loading || phone.length !== 10}
            className="w-full py-3.5 rounded-xl text-white font-bold bg-gradient-to-r from-[#003178] to-[#0D47A1] hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>Send OTP →</>
            )}
          </button>
        </>
      ) : (
        <>
          <h2 className="text-xl font-bold text-[#1E1C0D] mb-1">Verify Your Number</h2>
          <p className="text-sm text-[#434652] mb-6">
            OTP sent to +91 XXXXXX{phone.slice(6)}
          </p>

          <label className="block text-xs font-bold text-[#003178] tracking-wider uppercase mb-1.5 ml-1">
            Enter OTP
          </label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={otp}
            onChange={(e) => handleOtpChange(e.target.value)}
            placeholder="------"
            className="w-full bg-[#E9E2CB] rounded-xl px-4 py-3 text-center text-2xl font-bold tracking-[0.5em] text-[#1E1C0D] placeholder:text-[#737783] outline-none focus:ring-2 focus:ring-[#003178] mb-4"
            disabled={loading}
            autoFocus
          />

          {error && (
            <p className="text-sm text-[#BA1A1A] mb-4">{error}</p>
          )}

          <button
            onClick={() => verifyOTP(otp)}
            disabled={loading || otp.length !== 6}
            className="w-full py-3.5 rounded-xl text-white font-bold bg-gradient-to-r from-[#003178] to-[#0D47A1] hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2 mb-4"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>Verify OTP →</>
            )}
          </button>

          <div className="text-center">
            {resendSeconds > 0 ? (
              <p className="text-sm text-[#434652]">
                Resend OTP in 0:{resendSeconds.toString().padStart(2, '0')}s
              </p>
            ) : (
              <button
                onClick={() => {
                  setOtp('');
                  sendOTP();
                }}
                className="text-sm font-bold text-[#003178] hover:underline"
              >
                Resend OTP
              </button>
            )}
          </div>

          <button
            onClick={() => {
              setStep('phone');
              setOtp('');
              setError(null);
            }}
            className="w-full mt-4 text-sm text-[#434652] hover:text-[#003178]"
          >
            ← Change Number
          </button>
        </>
      )}
    </div>
  );
}
