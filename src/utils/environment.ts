import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Verifica se o aplicativo está sendo executado em um ambiente de produção (APK)
 * ou em um ambiente de desenvolvimento (Expo Go ou web)
 */
export const isProduction = (): boolean => {
  // No Android, verificamos se estamos em um APK de produção
  if (Platform.OS === 'android') {
    // Se estiver rodando em um APK, não estará no Expo Go
    return !Constants.appOwnership || Constants.appOwnership !== 'expo';
  }
  
  // No iOS, verificamos se estamos em um IPA de produção
  if (Platform.OS === 'ios') {
    return !Constants.appOwnership || Constants.appOwnership !== 'expo';
  }
  
  // Na web, consideramos produção se não for localhost
  if (Platform.OS === 'web') {
    return !(window.location.hostname === 'localhost' || 
             window.location.hostname === '127.0.0.1');
  }
  
  return false;
};

/**
 * Retorna informações sobre o ambiente de execução atual
 */
export const getEnvironmentInfo = () => {
  return {
    platform: Platform.OS,
    version: Platform.Version,
    isProduction: isProduction(),
    appOwnership: Constants.appOwnership,
    expoVersion: Constants.expoVersion,
    nativeAppVersion: Constants.nativeAppVersion,
    nativeBuildVersion: Constants.nativeBuildVersion,
  };
};

/**
 * Registra informações sobre o ambiente no console
 */
export const logEnvironmentInfo = () => {
  const info = getEnvironmentInfo();
  console.log('Ambiente de execução:', info);
  return info;
};