import { StyleSheet, View } from 'react-native';

type RuledPaperProps = {
  lineColor: string;
  ruleColor: string;
  lineCount?: number;
  lineSpacing?: number;
  firstLineOffset?: number;
};

// Decorative index-card ruling: one header rule (the red line) followed by evenly spaced lines.
export function RuledPaper({
  lineColor,
  ruleColor,
  lineCount = 12,
  lineSpacing = 38,
  firstLineOffset = 62,
}: RuledPaperProps) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} importantForAccessibility="no-hide-descendants">
      <View style={[styles.line, { top: firstLineOffset, backgroundColor: ruleColor, height: 2 }]} />
      {Array.from({ length: lineCount }, (_, index) => (
        <View
          key={index}
          style={[styles.line, { top: firstLineOffset + lineSpacing * (index + 1), backgroundColor: lineColor }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  line: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth * 2,
  },
});
