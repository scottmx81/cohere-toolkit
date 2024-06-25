import { useLocalStorageValue } from '@react-hookz/web';
import { useMutation } from '@tanstack/react-query';
import { jwtDecode } from 'jwt-decode';
import { useRouter } from 'next/router';
import { useCallback, useMemo } from 'react';

import { useCohereClient } from '@/cohere-client';
import { LOCAL_STORAGE_KEYS } from '@/constants';
import { useServerAuthStrategies } from '@/hooks/authStrategies';

interface LoginParams {
  email: string;
  password: string;
}

interface RegisterParams {
  name: string;
  email: string;
  password: string;
}

interface UserSession {
  email: string;
  fullname: string;
  id: string;
}

export const useSession = () => {
  const router = useRouter();
  const { data: authStrategies } = useServerAuthStrategies();
  const {
    value: authToken,
    set: setAuthToken,
    remove: clearAuthToken,
  } = useLocalStorageValue<string | undefined>(LOCAL_STORAGE_KEYS.authToken, {
    defaultValue: undefined,
  });

  const isLoggedIn = useMemo(
    () =>
      (authStrategies && authStrategies.length > 0 && !!authToken) ||
      !authStrategies ||
      authStrategies.length === 0,
    [authToken, authStrategies]
  );

  const cohereClient = useCohereClient();
  const session = authToken ? (jwtDecode(authToken) as { context: UserSession }).context : null;

  const loginMutation = useMutation({
    mutationFn: async (params: LoginParams) => {
      return cohereClient.login(params);
    },
    onSuccess: (data: { token: string }) => {
      setAuthToken(data.token);
      return new Promise((resolve) => resolve(data.token));
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      clearAuthToken();
      return cohereClient.logout();
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (params: RegisterParams) => {
      return cohereClient.createUser(params);
    },
  });

  const redirectToLogin = useCallback(() => {
    router.push(`/login?redirect_uri=${encodeURIComponent(window.location.href)}`);
  }, [router]);

  const googleSSOMutation = useMutation({
    mutationFn: async (params: { code: string }) => {
      return cohereClient.googleSSOAuth(params);
    },
    onSuccess: (data: { token: string }) => {
      setAuthToken(data.token);
      return new Promise((resolve) => resolve(data.token));
    },
  });

  const oidcSSOMutation = useMutation({
    mutationFn: async (params: { code: string; strategy: string }) => {
      return cohereClient.oidcSSOAuth(params);
    },
    onSuccess: (data: { token: string }) => {
      setAuthToken(data.token);
      return new Promise((resolve) => resolve(data.token));
    },
  });

  return {
    session,
    userId: session && 'id' in session ? session.id : 'user-id',
    authToken,
    isLoggedIn,
    loginMutation,
    logoutMutation,
    registerMutation,
    redirectToLogin,
    googleSSOMutation,
    oidcSSOMutation,
  };
};
