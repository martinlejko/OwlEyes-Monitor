import React from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  Alert
} from '@mui/material';

interface DeleteDialogProps {
  open: boolean;
  title: string;
  message: string;
  error: string | null;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Deletion confirmation dialog
 * Generic component for confirming deletion with error handling
 */
export const DeleteDialog: React.FC<DeleteDialogProps> = ({
  open,
  title,
  message,
  error,
  isDeleting,
  onCancel,
  onConfirm
}) => {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">
        {title}
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          {message}
        </DialogContentText>
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={isDeleting}>Cancel</Button>
        <Button 
          onClick={onConfirm} 
          color="error" 
          autoFocus
          disabled={isDeleting}
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 