import { useState } from 'react';
import { removeSuspension } from '@/actions/admin.action';
import toast from 'react-hot-toast';

export function useSuspension() {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSuspend = async (userId: string, duration: number) => {
    if (isProcessing) return;
    
    try {
      setIsProcessing(true);
      const result = await fetch('/api/admin/actions/suspend-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, duration }),
      });
      
      if (!result.ok) {
        throw new Error('Failed to suspend user');
      }

      toast.success('User has been suspended');
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || 'Failed to suspend user');
    } finally {
      setIsProcessing(false);
    }
  };

  const updateSuspensionDuration = async (userId: string, newDuration: number) => {
    if (isProcessing) return;
    
    try {
      setIsProcessing(true);
      const result = await fetch('/api/admin/actions/update-suspension', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, duration: newDuration }),
      });
      
      if (!result.ok) {
        throw new Error('Failed to update suspension duration');
      }

      toast.success('Suspension duration updated');
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update suspension duration');
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    handleSuspend,
    updateSuspensionDuration,
    isProcessing,
  };
}