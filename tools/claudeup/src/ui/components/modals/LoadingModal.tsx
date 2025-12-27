import React from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';

interface LoadingModalProps {
  /** Loading message */
  message: string;
}

export function LoadingModal({ message }: LoadingModalProps): React.ReactElement {
  return (
    <Box
      flexDirection="row"
      borderStyle="round"
      borderColor="cyan"
      paddingX={2}
      paddingY={1}
    >
      <Text color="cyan">
        <Spinner type="dots" />
      </Text>
      <Text> {message}</Text>
    </Box>
  );
}

export default LoadingModal;
