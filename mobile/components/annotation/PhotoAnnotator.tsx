/**
 * PhotoAnnotator — full-screen photo annotation editor.
 *
 * Renders the photo as a background image with an SVG canvas on top.
 * Supports freehand drawing, arrows, rectangles, and text labels.
 * Uses react-native-gesture-handler PanGestureHandler for smooth touch tracking.
 *
 * Props:
 *   photoUri      — local file URI of the photo to annotate
 *   initialAnnotations — existing annotations to pre-load (for editing)
 *   onSave        — called with the final annotations array when user taps Done
 *   onClose       — called when user taps Cancel
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  Dimensions,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  GestureHandlerRootView,
  PanGestureHandler,
  TapGestureHandler,
  State,
  type PanGestureHandlerGestureEvent,
  type TapGestureHandlerStateChangeEvent,
} from 'react-native-gesture-handler';
import Svg, {
  Path,
  Rect,
  Circle,
  Line,
  Defs,
  Marker,
  Text as SvgText,
  G,
} from 'react-native-svg';
import { Colors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import type { PhotoAnnotation } from '@sitewatch/types';
import 'react-native-get-random-values';

// ── Types ──────────────────────────────────────────────────────────────────────

type Tool = 'freehand' | 'arrow' | 'rect' | 'text';

const COLORS = ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6', '#FFFFFF', '#000000'];
const STROKE_WIDTHS = [2, 4, 7];

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ── Helpers ────────────────────────────────────────────────────────────────────

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

/** Convert an array of points into an SVG path `d` string. */
function pointsToPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return '';
  const [first, ...rest] = points;
  return `M${first.x},${first.y} ` + rest.map((p) => `L${p.x},${p.y}`).join(' ');
}

/** Arrow head as a short SVG path rotated toward the end point. */
function ArrowAnnotation({
  ann,
}: {
  ann: PhotoAnnotation;
}) {
  const dx = (ann.endX ?? ann.x) - ann.x;
  const dy = (ann.endY ?? ann.y) - ann.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const ux = dx / len;
  const uy = dy / len;

  const headLen = Math.max(12, ann.strokeWidth * 4);
  const headAngle = 0.45; // radians

  // Two lines forming the arrowhead
  const ax1 = ann.endX! - headLen * (ux * Math.cos(headAngle) - uy * Math.sin(headAngle));
  const ay1 = ann.endY! - headLen * (uy * Math.cos(headAngle) + ux * Math.sin(headAngle));
  const ax2 = ann.endX! - headLen * (ux * Math.cos(-headAngle) - uy * Math.sin(-headAngle));
  const ay2 = ann.endY! - headLen * (uy * Math.cos(-headAngle) + ux * Math.sin(-headAngle));

  return (
    <G>
      <Line
        x1={ann.x} y1={ann.y}
        x2={ann.endX} y2={ann.endY}
        stroke={ann.color}
        strokeWidth={ann.strokeWidth}
        strokeLinecap="round"
      />
      <Line
        x1={ann.endX} y1={ann.endY}
        x2={ax1} y2={ay1}
        stroke={ann.color}
        strokeWidth={ann.strokeWidth}
        strokeLinecap="round"
      />
      <Line
        x1={ann.endX} y1={ann.endY}
        x2={ax2} y2={ay2}
        stroke={ann.color}
        strokeWidth={ann.strokeWidth}
        strokeLinecap="round"
      />
    </G>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

interface Props {
  photoUri: string;
  initialAnnotations?: PhotoAnnotation[];
  onSave: (annotations: PhotoAnnotation[]) => void;
  onClose: () => void;
}

export function PhotoAnnotator({ photoUri, initialAnnotations = [], onSave, onClose }: Props) {
  const [annotations, setAnnotations] = useState<PhotoAnnotation[]>(initialAnnotations);
  const [activeTool, setActiveTool] = useState<Tool>('freehand');
  const [activeColor, setActiveColor] = useState(COLORS[0]);
  const [strokeWidth, setStrokeWidth] = useState(STROKE_WIDTHS[1]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [pendingTextPos, setPendingTextPos] = useState({ x: 0, y: 0 });
  const [textInputValue, setTextInputValue] = useState('');

  // Ref to the in-progress annotation while drawing
  const currentAnn = useRef<PhotoAnnotation | null>(null);
  const [liveAnn, setLiveAnn] = useState<PhotoAnnotation | null>(null);

  // ── Gesture handlers ─────────────────────────────────────────────────────────

  const onPanEvent = useCallback(
    (e: PanGestureHandlerGestureEvent) => {
      if (activeTool === 'text') return;

      const { x, y } = e.nativeEvent;

      if (!currentAnn.current) return;

      if (activeTool === 'freehand') {
        const updated = {
          ...currentAnn.current,
          points: [...(currentAnn.current.points ?? []), { x, y }],
        };
        currentAnn.current = updated;
        setLiveAnn({ ...updated });
      } else if (activeTool === 'arrow' || activeTool === 'rect') {
        const updated = { ...currentAnn.current, endX: x, endY: y };
        currentAnn.current = updated;
        setLiveAnn({ ...updated });
      }
    },
    [activeTool]
  );

  const onPanStateChange = useCallback(
    (e: PanGestureHandlerGestureEvent) => {
      const { state, x, y } = e.nativeEvent;

      if (activeTool === 'text') return;

      if (state === State.BEGAN) {
        const newAnn: PhotoAnnotation = {
          id: generateId(),
          type: activeTool,
          x,
          y,
          endX: x,
          endY: y,
          points: activeTool === 'freehand' ? [{ x, y }] : undefined,
          color: activeColor,
          strokeWidth,
        };
        currentAnn.current = newAnn;
        setIsDrawing(true);
        setLiveAnn(newAnn);
      } else if (state === State.END || state === State.CANCELLED) {
        if (currentAnn.current) {
          // Only save if the annotation has meaningful content
          const ann = currentAnn.current;
          const hasContent =
            (ann.type === 'freehand' && (ann.points?.length ?? 0) > 1) ||
            (ann.type !== 'freehand' &&
              (Math.abs((ann.endX ?? 0) - ann.x) > 5 ||
                Math.abs((ann.endY ?? 0) - ann.y) > 5));

          if (hasContent) {
            setAnnotations((prev) => [...prev, ann]);
          }
        }
        currentAnn.current = null;
        setIsDrawing(false);
        setLiveAnn(null);
      }
    },
    [activeTool, activeColor, strokeWidth]
  );

  // Tap handler for placing text annotations
  const onTapText = useCallback(
    (e: TapGestureHandlerStateChangeEvent) => {
      if (e.nativeEvent.state === State.END && activeTool === 'text') {
        setPendingTextPos({ x: e.nativeEvent.x, y: e.nativeEvent.y });
        setTextInputValue('');
        setShowTextInput(true);
      }
    },
    [activeTool]
  );

  function confirmText() {
    const trimmed = textInputValue.trim();
    if (trimmed) {
      setAnnotations((prev) => [
        ...prev,
        {
          id: generateId(),
          type: 'text',
          x: pendingTextPos.x,
          y: pendingTextPos.y,
          text: trimmed,
          color: activeColor,
          strokeWidth,
        },
      ]);
    }
    setShowTextInput(false);
  }

  function undo() {
    setAnnotations((prev) => prev.slice(0, -1));
  }

  function clear() {
    Alert.alert('Clear All', 'Remove all annotations from this photo?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => setAnnotations([]) },
    ]);
  }

  // ── Render annotations ───────────────────────────────────────────────────────

  function renderAnnotation(ann: PhotoAnnotation) {
    switch (ann.type) {
      case 'freehand':
        return (
          <Path
            key={ann.id}
            d={pointsToPath(ann.points ?? [])}
            stroke={ann.color}
            strokeWidth={ann.strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        );
      case 'arrow':
        return <ArrowAnnotation key={ann.id} ann={ann} />;
      case 'rect':
        return (
          <Rect
            key={ann.id}
            x={Math.min(ann.x, ann.endX ?? ann.x)}
            y={Math.min(ann.y, ann.endY ?? ann.y)}
            width={Math.abs((ann.endX ?? ann.x) - ann.x)}
            height={Math.abs((ann.endY ?? ann.y) - ann.y)}
            stroke={ann.color}
            strokeWidth={ann.strokeWidth}
            fill="none"
            strokeLinejoin="round"
          />
        );
      case 'text':
        return (
          <SvgText
            key={ann.id}
            x={ann.x}
            y={ann.y}
            fill={ann.color}
            fontSize={16 + ann.strokeWidth * 2}
            fontWeight="bold"
          >
            {ann.text}
          </SvgText>
        );
      default:
        return null;
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <Modal visible animationType="slide" statusBarTranslucent>
      <SafeAreaView style={styles.container}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onClose} style={styles.topBtn}>
            <Text style={styles.topBtnTextSecondary}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.topTitle}>Annotate Photo</Text>
          <TouchableOpacity onPress={() => onSave(annotations)} style={styles.topBtn}>
            <Text style={styles.topBtnTextPrimary}>Done</Text>
          </TouchableOpacity>
        </View>

        {/* Canvas */}
        <GestureHandlerRootView style={styles.canvasWrapper}>
          <TapGestureHandler onHandlerStateChange={onTapText}>
            <PanGestureHandler
              onGestureEvent={onPanEvent}
              onHandlerStateChange={onPanStateChange}
              minDist={0}
            >
              <View style={styles.canvas}>
                {/* Photo */}
                <Image
                  source={{ uri: photoUri }}
                  style={styles.photo}
                  resizeMode="contain"
                />

                {/* SVG overlay */}
                <Svg style={StyleSheet.absoluteFill}>
                  {annotations.map(renderAnnotation)}
                  {liveAnn && renderAnnotation(liveAnn)}
                </Svg>

                {/* Crosshair for text tool */}
                {activeTool === 'text' && !isDrawing && (
                  <View style={styles.textCursor} pointerEvents="none">
                    <Text style={styles.textCursorText}>Tap to add text</Text>
                  </View>
                )}
              </View>
            </PanGestureHandler>
          </TapGestureHandler>
        </GestureHandlerRootView>

        {/* Toolbar */}
        <AnnotationToolbar
          activeTool={activeTool}
          activeColor={activeColor}
          strokeWidth={strokeWidth}
          annotationCount={annotations.length}
          onToolChange={setActiveTool}
          onColorChange={setActiveColor}
          onStrokeWidthChange={setStrokeWidth}
          onUndo={undo}
          onClear={clear}
        />

        {/* Text input modal */}
        {showTextInput && (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.textInputOverlay}
          >
            <View style={styles.textInputCard}>
              <Text style={styles.textInputLabel}>Add label</Text>
              <TextInput
                style={styles.textInput}
                value={textInputValue}
                onChangeText={setTextInputValue}
                placeholder="Type annotation text..."
                placeholderTextColor={Colors.textSecondary}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={confirmText}
              />
              <View style={styles.textInputButtons}>
                <TouchableOpacity
                  style={styles.textInputCancel}
                  onPress={() => setShowTextInput(false)}
                >
                  <Text style={styles.textInputCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.textInputConfirm} onPress={confirmText}>
                  <Text style={styles.textInputConfirmText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        )}
      </SafeAreaView>
    </Modal>
  );
}

// ── Toolbar ────────────────────────────────────────────────────────────────────

interface ToolbarProps {
  activeTool: Tool;
  activeColor: string;
  strokeWidth: number;
  annotationCount: number;
  onToolChange: (t: Tool) => void;
  onColorChange: (c: string) => void;
  onStrokeWidthChange: (w: number) => void;
  onUndo: () => void;
  onClear: () => void;
}

const TOOLS: { value: Tool; icon: string; label: string }[] = [
  { value: 'freehand', icon: '✏️', label: 'Draw' },
  { value: 'arrow', icon: '➡️', label: 'Arrow' },
  { value: 'rect', icon: '⬜', label: 'Box' },
  { value: 'text', icon: '🔤', label: 'Text' },
];

function AnnotationToolbar({
  activeTool,
  activeColor,
  strokeWidth,
  annotationCount,
  onToolChange,
  onColorChange,
  onStrokeWidthChange,
  onUndo,
  onClear,
}: ToolbarProps) {
  return (
    <View style={toolbar.container}>
      {/* Tool selector */}
      <View style={toolbar.row}>
        {TOOLS.map((tool) => (
          <TouchableOpacity
            key={tool.value}
            style={[toolbar.toolBtn, activeTool === tool.value && toolbar.toolBtnActive]}
            onPress={() => onToolChange(tool.value)}
          >
            <Text style={toolbar.toolIcon}>{tool.icon}</Text>
            <Text
              style={[toolbar.toolLabel, activeTool === tool.value && toolbar.toolLabelActive]}
            >
              {tool.label}
            </Text>
          </TouchableOpacity>
        ))}

        <View style={toolbar.divider} />

        {/* Stroke width */}
        {STROKE_WIDTHS.map((w) => (
          <TouchableOpacity
            key={w}
            style={[toolbar.strokeBtn, strokeWidth === w && toolbar.strokeBtnActive]}
            onPress={() => onStrokeWidthChange(w)}
          >
            <View
              style={[
                toolbar.strokeDot,
                {
                  width: w + 4,
                  height: w + 4,
                  backgroundColor: strokeWidth === w ? Colors.white : Colors.gray[400],
                },
              ]}
            />
          </TouchableOpacity>
        ))}

        <View style={toolbar.divider} />

        {/* Undo */}
        <TouchableOpacity
          style={[toolbar.actionBtn, annotationCount === 0 && toolbar.actionBtnDisabled]}
          onPress={onUndo}
          disabled={annotationCount === 0}
        >
          <Text style={toolbar.actionIcon}>↩️</Text>
        </TouchableOpacity>

        {/* Clear */}
        <TouchableOpacity
          style={[toolbar.actionBtn, annotationCount === 0 && toolbar.actionBtnDisabled]}
          onPress={onClear}
          disabled={annotationCount === 0}
        >
          <Text style={toolbar.actionIcon}>🗑️</Text>
        </TouchableOpacity>
      </View>

      {/* Colour picker */}
      <View style={toolbar.colorRow}>
        {COLORS.map((color) => (
          <TouchableOpacity
            key={color}
            onPress={() => onColorChange(color)}
            style={[
              toolbar.colorSwatch,
              { backgroundColor: color },
              activeColor === color && toolbar.colorSwatchActive,
              color === '#FFFFFF' && toolbar.colorSwatchWhite,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: '#111',
  },
  topBtn: { paddingHorizontal: Spacing.sm, paddingVertical: 4 },
  topTitle: { color: Colors.white, fontWeight: FontWeight.semibold, fontSize: FontSize.base },
  topBtnTextPrimary: {
    color: Colors.primary[400],
    fontWeight: FontWeight.semibold,
    fontSize: FontSize.base,
  },
  topBtnTextSecondary: { color: Colors.gray[400], fontSize: FontSize.base },

  canvasWrapper: { flex: 1 },
  canvas: { flex: 1, position: 'relative' },
  photo: { flex: 1, width: '100%' },

  textCursor: {
    position: 'absolute',
    bottom: Spacing.xl,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
  },
  textCursorText: { color: Colors.white, fontSize: FontSize.sm },

  textInputOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  textInputCard: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  textInputLabel: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
  },
  textInputButtons: { flexDirection: 'row', gap: Spacing.md },
  textInputCancel: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textInputCancelText: { color: Colors.textSecondary, fontWeight: FontWeight.medium },
  textInputConfirm: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderRadius: 8,
    backgroundColor: Colors.primary[600],
  },
  textInputConfirmText: { color: Colors.white, fontWeight: FontWeight.semibold },
});

const toolbar = StyleSheet.create({
  container: {
    backgroundColor: '#111',
    paddingBottom: Spacing.base,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    gap: 4,
    marginBottom: Spacing.sm,
  },
  toolBtn: {
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 2,
  },
  toolBtnActive: { backgroundColor: Colors.primary[700] },
  toolIcon: { fontSize: 20 },
  toolLabel: { fontSize: 9, color: Colors.gray[400] },
  toolLabelActive: { color: Colors.primary[300] },

  divider: { width: 1, height: 32, backgroundColor: '#333', marginHorizontal: 4 },

  strokeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  strokeBtnActive: { borderColor: Colors.primary[400] },
  strokeDot: { borderRadius: 10 },

  actionBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  actionBtnDisabled: { opacity: 0.3 },
  actionIcon: { fontSize: 20 },

  colorRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    gap: Spacing.sm,
  },
  colorSwatch: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorSwatchActive: { borderColor: Colors.white, transform: [{ scale: 1.2 }] },
  colorSwatchWhite: { borderColor: '#555' },
});
