'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function FirebaseErrorListener() {
  useEffect(() => {
    const handlePermissionError = (error: FirestorePermissionError) => {
      // This will be caught by the Next.js development error overlay
      throw error;
    };

    errorEmitter.on('permission-error', handlePermissionError);

    return () => {
      // Clean up the listener when the component unmounts
      errorEmitter.removeListener('permission-error', handlePermissionError);
    };
  }, []);

  return null; // This component does not render anything
}
