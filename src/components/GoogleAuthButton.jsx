import React, { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { loginSuccess } from '../features/auth/authSlice';
import api from '../config/api';

// Google's own Identity Services script (loaded in index.html) opens a
// popup for the consent screen and hands back a one-time authorization
// `code` — this component never sees any Google token or credential
// itself, just that code, which the backend exchanges (with this app's
// own Google Client ID + Secret) for a verified identity. No third-party
// auth provider or separate session is involved.
//
// `termsAccepted` is only meaningful on the Register page: when passed,
// the button stays disabled until it's true, mirroring the same
// required-checkbox rule the regular signup form already enforces. On
// the Login page it's simply not passed, since signing in never creates
// a new account — an email with no matching account is treated as
// "you don't have an account yet" rather than silently creating one.
const GoogleAuthButton = ({ termsAccepted }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const codeClientRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  const requiresTerms = termsAccepted !== undefined;
  const gatedByTerms = requiresTerms && !termsAccepted;

  // initCodeClient's `callback` below is registered once, on mount (see the
  // setup effect's `[]` deps) — it must stay that way so checking the terms
  // box doesn't tear down and re-create Google's client mid-flow. But that
  // means handleCodeResponse, as a plain closure, would forever see whatever
  // `termsAccepted` was at mount time (always `false`, since the checkbox
  // starts unchecked) no matter what the user later checks. This ref is
  // kept current every render so handleCodeResponse can read the live value
  // instead of a stale one.
  const termsAcceptedRef = useRef(termsAccepted);
  useEffect(() => {
    termsAcceptedRef.current = termsAccepted;
  }, [termsAccepted]);

  useEffect(() => {
    if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) {
      // Google's own library throws synchronously (not a rejected
      // promise) if client_id is missing, which would otherwise crash
      // this whole page — fail soft instead of taking the app down.
      console.error('VITE_GOOGLE_CLIENT_ID is not set — Google sign-in is disabled.');
      return;
    }

    let cancelled = false;

    const setup = () => {
      if (cancelled) return;
      if (!window.google?.accounts?.oauth2) {
        // The script tag is `async defer`, so it may not have finished
        // loading yet on first render — poll briefly instead of assuming
        // it's ready.
        setTimeout(setup, 100);
        return;
      }
      codeClientRef.current = window.google.accounts.oauth2.initCodeClient({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        scope: 'openid email profile',
        ux_mode: 'popup',
        callback: handleCodeResponse,
      });
      setReady(true);
    };

    setup();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCodeResponse = async (response) => {
    if (response.error || !response.code) {
      setPending(false);
      // The user closing Google's popup themselves lands here too
      // (error: "popup_closed") — not worth showing as a scary error.
      if (response.error !== 'popup_closed') {
        setError('Could not sign in with Google. Please try again.');
      }
      return;
    }

    try {
      const { data } = await axios.post(api.endpoints.auth.google(), {
        code: response.code,
        ...(requiresTerms ? { termsAccepted: termsAcceptedRef.current } : {}),
      });

      dispatch(loginSuccess({
        user: data.data.user,
        token: data.token,
        refreshToken: data.refreshToken,
      }));
      navigate('/dashboard');
    } catch (err) {
      setError(
        err?.response?.data?.message || 'Could not sign in with Google. Please try again.'
      );
    } finally {
      setPending(false);
    }
  };

  const handleClick = () => {
    if (gatedByTerms) {
      setError('Please agree to the Terms of Service first.');
      return;
    }
    setError('');
    setPending(true);
    codeClientRef.current?.requestCode();
  };

  return (
    <>
      {error && <p className="text-error social-auth-error">{error}</p>}
      <button
        type="button"
        className="btn-google"
        onClick={handleClick}
        disabled={!ready || pending || gatedByTerms}
        aria-label="Continue with Google"
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31027 0 3.25527 2.69 1.28027 6.60998L5.27027 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z" />
          <path d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z" />
          <path d="M5.26498 14.295C5.02498 13.565 4.88501 12.795 4.88501 12C4.88501 11.205 5.01998 10.435 5.26498 9.705L1.275 6.60999C0.46 8.23 0 10.06 0 12C0 13.94 0.46 15.77 1.28 17.39L5.26498 14.295Z" />
          <path d="M5.27 17.39L1.28 20.485C3.255 24.405 7.31 27.09 12 27.09C15.235 27.09 17.94 26.045 19.945 24.255L16.08 21.255C15.005 21.985 13.615 22.4 12 22.4C8.87 22.4 6.215 20.29 5.27 17.39Z" />
        </svg>
        <span>Continue with Google</span>
      </button>
    </>
  );
};

export default GoogleAuthButton;
