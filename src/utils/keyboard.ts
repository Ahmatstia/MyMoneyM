// File: src/utils/keyboard.ts
import { useState, useEffect } from "react";
import { Keyboard, Platform, KeyboardEvent } from "react-native";

/**
 * Hook to dynamically calculate bottom inset when soft keyboard appears.
 * Ensures form inputs near the bottom of ScrollViews are never covered by the keyboard.
 *
 * @param defaultPadding Bottom padding when keyboard is hidden (default: 120)
 * @param extraOffset Additional breathing room above keyboard when visible (default: 50)
 */
export const useKeyboardBottomInset = (
  defaultPadding = 24,
  extraOffset = 24
): number => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const onShow = (e: KeyboardEvent) => {
      if (e?.endCoordinates?.height) {
        setKeyboardHeight(e.endCoordinates.height);
      }
    };

    const onHide = () => {
      setKeyboardHeight(0);
    };

    const showSub = Keyboard.addListener(showEvent, onShow);
    const hideSub = Keyboard.addListener(hideEvent, onHide);

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return keyboardHeight > 0 ? keyboardHeight + extraOffset : defaultPadding;
};
