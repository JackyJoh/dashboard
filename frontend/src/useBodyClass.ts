// src/useBodyClass.ts
import { useEffect } from 'react';

export const useBodyClass = (className: string, shouldApply: boolean) => {
  useEffect(() => {
    if (shouldApply) {
      document.body.classList.add(className);
    } else {
      document.body.classList.remove(className);
    }

    // Clean up the class when the component unmounts
    return () => {
      document.body.classList.remove(className);
    };
  }, [className, shouldApply]);
};