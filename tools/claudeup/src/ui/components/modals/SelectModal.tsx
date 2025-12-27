import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import type { SelectOption } from '../../state/types.js';

interface SelectModalProps {
  /** Modal title */
  title: string;
  /** Modal message */
  message: string;
  /** Select options */
  options: SelectOption[];
  /** Callback when option selected */
  onSelect: (value: string) => void;
  /** Callback when cancelled */
  onCancel: () => void;
}

export function SelectModal({
  title,
  message,
  options,
  onSelect,
  onCancel,
}: SelectModalProps): React.ReactElement {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useInput((input, key) => {
    if (key.return) {
      onSelect(options[selectedIndex].value);
    } else if (key.escape || input === 'q') {
      onCancel();
    } else if (key.upArrow || input === 'k') {
      setSelectedIndex((prev) => Math.max(0, prev - 1));
    } else if (key.downArrow || input === 'j') {
      setSelectedIndex((prev) => Math.min(options.length - 1, prev + 1));
    }
  });

  // Height: top padding(1) + title(1) + spacing(2) + message(1) + spacing(1) + options + spacing(1) + footer(1) + bottom padding(1) + border(2)
  const boxHeight = options.length + 11;
  const innerWidth = 46; // 50 - 2 (paddingX) - 2 (border)

  // Create background fill for each line
  const bgFill = ' '.repeat(innerWidth);
  const bg = '#1a1a1a';

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="cyan"
      paddingX={1}
      width={50}
      height={boxHeight}
    >
      {/* Top padding */}
      <Text backgroundColor={bg}>{bgFill}</Text>

      <Text bold backgroundColor={bg}>{` ${title}`.padEnd(innerWidth)}</Text>

      <Text backgroundColor={bg}>{bgFill}</Text>
      <Text backgroundColor={bg}>{` ${message}`.padEnd(innerWidth)}</Text>
      <Text backgroundColor={bg}>{bgFill}</Text>

      {options.map((option, idx) => {
        const isSelected = idx === selectedIndex;
        const label = isSelected ? ` > ${option.label}` : `   ${option.label}`;
        return (
          <Text
            key={option.value}
            backgroundColor={bg}
            color={isSelected ? 'cyan' : 'gray'}
            bold={isSelected}
          >
            {label.padEnd(innerWidth)}
          </Text>
        );
      })}

      <Text backgroundColor={bg}>{bgFill}</Text>
      <Text color="gray" backgroundColor={bg}>{' ↑↓ Select • Enter • Esc'.padEnd(innerWidth)}</Text>

      {/* Bottom padding */}
      <Text backgroundColor={bg}>{bgFill}</Text>
    </Box>
  );
}

export default SelectModal;
