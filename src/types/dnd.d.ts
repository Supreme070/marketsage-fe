// Type declarations for @hello-pangea/dnd
declare module '@hello-pangea/dnd' {
  import * as React from 'react';

  // DragDropContext
  export interface DragDropContextProps {
    onDragEnd: (result: DropResult) => void;
    onDragStart?: (initial: DragStart) => void;
    onDragUpdate?: (update: DragUpdate) => void;
    children: React.ReactNode;
  }

  export interface DragStart {
    draggableId: string;
    type: string;
    source: {
      droppableId: string;
      index: number;
    };
  }

  export interface DragUpdate extends DragStart {
    destination?: {
      droppableId: string;
      index: number;
    };
  }

  export interface DropResult extends DragUpdate {
    reason: 'DROP' | 'CANCEL';
  }

  export declare class DragDropContext extends React.Component<DragDropContextProps> {}

  // Droppable
  export interface DroppableProps {
    droppableId: string;
    type?: string;
    mode?: 'standard' | 'virtual';
    isDropDisabled?: boolean;
    isCombineEnabled?: boolean;
    direction?: 'horizontal' | 'vertical';
    ignoreContainerClipping?: boolean;
    renderClone?: any;
    getContainerForClone?: any;
    children: (provided: DroppableProvided, snapshot: DroppableStateSnapshot) => React.ReactElement;
  }

  export interface DroppableProvided {
    innerRef: (element: HTMLElement | null) => void;
    droppableProps: {
      // Used for shared global styles
      'data-rbd-droppable-context-id': string;
      // Used for lookup from DOM
      'data-rbd-droppable-id': string;
    };
    placeholder?: React.ReactElement | null;
  }

  export interface DroppableStateSnapshot {
    isDraggingOver: boolean;
    draggingOverWith?: string;
    draggingFromThisWith?: string;
    isUsingPlaceholder: boolean;
  }

  export declare class Droppable extends React.Component<DroppableProps> {}

  // Draggable
  export interface DraggableProps {
    draggableId: string;
    index: number;
    isDragDisabled?: boolean;
    disableInteractiveElementBlocking?: boolean;
    shouldRespectForcePress?: boolean;
    children: (provided: DraggableProvided, snapshot: DraggableStateSnapshot, rubric: DraggableRubric) => React.ReactElement;
  }

  export interface DraggableProvided {
    draggableProps: {
      // Used for shared global styles
      'data-rbd-draggable-context-id': string;
      // Used for lookup from DOM
      'data-rbd-draggable-id': string;
      // Used for improved focus management
      tabIndex: number;
      style?: React.CSSProperties;
    };
    dragHandleProps?: {
      // Used for shared global styles
      'data-rbd-drag-handle-context-id'?: string;
      // Used for lookup from DOM
      'data-rbd-drag-handle-draggable-id'?: string;
      // Aria role
      role?: string;
      // Aria label
      'aria-label'?: string;
      // Aria keyboard controls
      'aria-roledescription'?: string;
      // Aria controls
      'aria-describedby'?: string;
      // Aria pressed
      'aria-pressed'?: string;
      // Used for keyboard handling
      tabIndex: number;
      // Mouse event handlers
      onMouseDown?: (e: React.MouseEvent<HTMLElement>) => void;
      onKeyDown?: (e: React.KeyboardEvent<HTMLElement>) => void;
      draggable?: boolean;
      onDragStart?: (e: React.DragEvent<HTMLElement>) => void;
    };
    innerRef: (element: HTMLElement | null) => void;
  }

  export interface DraggableStateSnapshot {
    isDragging: boolean;
    isDropAnimating: boolean;
    dropAnimation?: {
      duration: number;
      curve: string;
      moveTo: {
        x: number;
        y: number;
      };
    };
    draggingOver?: string;
    combineWith?: string;
    combineTargetFor?: string;
    mode?: string;
  }

  export interface DraggableRubric {
    draggableId: string;
    type: string;
    source: {
      droppableId: string;
      index: number;
    };
  }

  export declare class Draggable extends React.Component<DraggableProps> {}
} 