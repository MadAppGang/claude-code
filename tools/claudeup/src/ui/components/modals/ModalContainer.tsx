import React from 'react';
import { Box } from 'ink';
import { useApp } from '../../state/AppContext.js';
import { ConfirmModal } from './ConfirmModal.js';
import { InputModal } from './InputModal.js';
import { SelectModal } from './SelectModal.js';
import { MessageModal } from './MessageModal.js';
import { LoadingModal } from './LoadingModal.js';

/**
 * Container that renders the active modal as an overlay
 */
export function ModalContainer(): React.ReactElement | null {
  const { state } = useApp();
  const { modal } = state;

  if (!modal) {
    return null;
  }

  const renderModal = () => {
    switch (modal.type) {
      case 'confirm':
        return (
          <ConfirmModal
            title={modal.title}
            message={modal.message}
            onConfirm={modal.onConfirm}
            onCancel={modal.onCancel}
          />
        );

      case 'input':
        return (
          <InputModal
            title={modal.title}
            label={modal.label}
            defaultValue={modal.defaultValue}
            onSubmit={modal.onSubmit}
            onCancel={modal.onCancel}
          />
        );

      case 'select':
        return (
          <SelectModal
            title={modal.title}
            message={modal.message}
            options={modal.options}
            onSelect={modal.onSelect}
            onCancel={modal.onCancel}
          />
        );

      case 'message':
        return (
          <MessageModal
            title={modal.title}
            message={modal.message}
            variant={modal.variant}
            onDismiss={modal.onDismiss}
          />
        );

      case 'loading':
        return <LoadingModal message={modal.message} />;

      default:
        return null;
    }
  };

  // Center the modal on screen
  return (
    <Box
      position="absolute"
      width="100%"
      height="100%"
      justifyContent="center"
      alignItems="center"
    >
      {renderModal()}
    </Box>
  );
}

export default ModalContainer;
