import { create } from 'zustand'
import { Toast } from '@/components/ui/toast'

type ToasterToast = {
  id: string
  title?: string
  description?: string
  action?: React.ReactNode
  variant?: "default" | "destructive"
}

type ToasterState = {
  toasts: ToasterToast[]
  addToast: (toast: ToasterToast) => void
  removeToast: (id: string) => void
}

export const useToast = create<ToasterState>((set) => ({
  toasts: [],
  addToast: (toast: ToasterToast) =>
    set((state) => ({
      toasts: [...state.toasts, toast],
    })),
  removeToast: (id: string) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}))

export function toast({
  title,
  description,
  action,
  variant,
}: Omit<ToasterToast, "id">) {
  const { addToast } = useToast.getState()

  addToast({
    id: Math.random().toString(36).substr(2, 9),
    title,
    description,
    action,
    variant,
  })
}