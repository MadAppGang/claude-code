import React from 'react';
import { Box, Text } from 'ink';

interface KeyHint {
  key: string;
  label: string;
}

interface FooterProps {
  /** Keyboard hints to display - either as string or structured array */
  hints?: string;
  /** Structured keyboard hints */
  keys?: KeyHint[];
}

export function Footer({ hints, keys }: FooterProps): React.ReactElement {
  // If using structured keys
  if (keys && keys.length > 0) {
    return (
      <Box
        borderStyle="single"
        borderColor="gray"
        borderTop
        borderLeft={false}
        borderRight={false}
        borderBottom={false}
        paddingX={1}
        marginTop={1}
      >
        {keys.map((hint, idx) => (
          <React.Fragment key={hint.key}>
            <Text color="yellow" bold>{hint.key}</Text>
            <Text color="gray"> {hint.label}</Text>
            {idx < keys.length - 1 && <Text color="gray">  ·  </Text>}
          </React.Fragment>
        ))}
      </Box>
    );
  }

  // Parse string hints like "↑↓ Navigate │ Enter Apply │ q Back"
  if (hints) {
    const parts = hints.split('│').map((s) => s.trim());

    return (
      <Box
        borderStyle="single"
        borderColor="gray"
        borderTop
        borderLeft={false}
        borderRight={false}
        borderBottom={false}
        paddingX={1}
        marginTop={1}
      >
        {parts.map((part, idx) => {
          // Split on first space to get key and label
          const spaceIdx = part.indexOf(' ');
          const key = spaceIdx > 0 ? part.substring(0, spaceIdx) : part;
          const label = spaceIdx > 0 ? part.substring(spaceIdx + 1) : '';

          return (
            <React.Fragment key={idx}>
              <Text color="yellow" bold>{key}</Text>
              <Text color="gray"> {label}</Text>
              {idx < parts.length - 1 && <Text color="gray">  ·  </Text>}
            </React.Fragment>
          );
        })}
      </Box>
    );
  }

  return <Box />;
}

export default Footer;
