import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface DeleteMessageDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: (deleteForEveryone: boolean) => void
  messageCount?: number
}

export function DeleteMessageDialog({
  open,
  onClose,
  onConfirm,
  messageCount = 1,
}: DeleteMessageDialogProps) {
  const isMultiple = messageCount > 1
  const title = isMultiple ? "Delete Messages" : "Delete Message"
  const description = isMultiple 
    ? `Are you sure you want to delete ${messageCount} messages?`
    : "Are you sure you want to delete this message?"

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => onConfirm(false)}
            className="bg-destructive hover:bg-destructive/90"
          >
            Delete for me
          </AlertDialogAction>
          <AlertDialogAction
            onClick={() => onConfirm(true)}
            className="bg-destructive hover:bg-destructive/90"
          >
            Delete for everyone
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}