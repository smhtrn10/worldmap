import { useState, useEffect } from 'react';
import { Dimensions, Platform } from 'react-native';

export type DeviceType = 'phone' | 'tablet';

export interface DeviceInfo {
  type: DeviceType;
  isLandscape: boolean;
  width: number;
  height: number;
  isSmallTablet: boolean; // iPad mini
  isLargeTablet: boolean; // iPad Pro
}

export function useDeviceType(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => 
    getDeviceInfo()
  );

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', () => {
      setDeviceInfo(getDeviceInfo());
    });

    return () => subscription?.remove();
  }, []);

  return deviceInfo;
}

function getDeviceInfo(): DeviceInfo {
  const { width, height } = Dimensions.get('window');
  
  // iPad detection - iPadOS 26 compatible
  // Platform.isPad is deprecated in iOS 18+/iPadOS 26
  // Use screen dimensions only for reliable detection
  const minDimension = Math.min(width, height);
  const maxDimension = Math.max(width, height);
  
  const isTablet = Platform.OS === 'ios' 
    ? minDimension >= 768 // iPad minimum width is 768pt
    : minDimension >= 600; // Android tablet threshold

  const isLandscape = width > height;
  
  // iPad size categories
  const isSmallTablet = isTablet && minDimension < 834; // iPad mini (768-820)
  const isLargeTablet = isTablet && minDimension >= 1024; // iPad Pro (1024+)

  return {
    type: isTablet ? 'tablet' : 'phone',
    isLandscape,
    width,
    height,
    isSmallTablet,
    isLargeTablet,
  };
}

// Responsive values helper
export function useResponsiveValue<T>(phoneValue: T, tabletValue: T): T {
  const { type } = useDeviceType();
  return type === 'tablet' ? tabletValue : phoneValue;
}
