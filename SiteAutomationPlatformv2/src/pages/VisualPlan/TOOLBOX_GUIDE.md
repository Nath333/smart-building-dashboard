# Visual Plan Toolbox Guide

## Overview

The **PlanToolbox** component is a reusable, extensible action toolbox for Page 3 (Visual Plan). It provides a clean, external interface for adding tools and actions to the visual plan editor.

## Architecture

```
MultiImagePlanPage.jsx (Parent)
    ↓ (passes handler callback)
VisualPlanDragArea.jsx (Canvas)
    ↓ (exposes addCircle via callback)
PlanToolbox.jsx (External UI)
    → Calls handler to execute actions
```

## Current Features

### Available Tools

1. **Circle Tool (⭕)**
   - Add circular markers to the plan
   - Fixed size (24x24px)
   - Draggable
   - Double-click to delete

2. **Horizontal Gaine Tool (━)**
   - Add horizontal cable duct/conduit
   - Initial size: 100x30px
   - **Resizable horizontally** - drag right edge handle
   - Draggable
   - Double-click to delete
   - Auto-saves dimensions to SQL

3. **Vertical Gaine Tool (┃)**
   - Add vertical cable duct/conduit
   - Initial size: 30x100px
   - **Resizable vertically** - drag bottom edge handle
   - Draggable
   - Double-click to delete
   - Auto-saves dimensions to SQL

### UI Features

- **Active State**: Visual feedback when tool is selected
- **External Positioning**: Toolbox is outside the image area, not overlaid
- **Auto-clear**: Tool state resets after action
- **Hover Effects**: Better UX with visual feedback

## How to Add New Tools

### Step 1: Implement the action handler in `VisualPlanDragArea.jsx`

```javascript
// Add a new handler (e.g., for adding rectangles)
const handleAddRectangle = useCallback(() => {
  const id = `rect-${Date.now()}`;
  setCards(prev => [
    ...prev,
    {
      id,
      label: 'Rect',
      x: 150,
      y: 150,
      moduleType: 'rectangle',
      width: 50,
      height: 30,
    },
  ]);
  console.log('▭ Added rectangle from toolbox:', id);
}, []);
```

### Step 2: Expose the handler to parent via props

```javascript
// In VisualPlanDragArea.jsx component props
const DraggableCardList = ({
  imageNaturalWidth,
  imageDisplayedWidth,
  imageId = null,
  visibleIcons = null,
  onAddCircle = null,
  onAddRectangle = null // Add new prop
}) => {
```

### Step 3: Pass handler to parent in useEffect

```javascript
// Expose handlers to parent
useEffect(() => {
  if (onAddCircle) {
    onAddCircle(handleAddCircle);
  }
  if (onAddRectangle) {
    onAddRectangle(handleAddRectangle);
  }
}, [onAddCircle, handleAddCircle, onAddRectangle, handleAddRectangle]);
```

### Step 4: Add state in `MultiImagePlanPage.jsx`

```javascript
const [addCircleHandler, setAddCircleHandler] = useState(null);
const [addRectangleHandler, setAddRectangleHandler] = useState(null); // Add new state

// Create callback
const handleAddRectangleCallback = useCallback((handler) => {
  setAddRectangleHandler(() => handler);
}, []);
```

### Step 5: Pass to DraggableCardList

```javascript
<DraggableCardListComponent
  imageNaturalWidth={imageNaturalWidth}
  imageDisplayedWidth={imageDisplayedWidth}
  containerRef={imageRef}
  imageId={activeImage.id}
  visibleIcons={getActiveImageIcons()}
  onAddCircle={handleAddCircleCallback}
  onAddRectangle={handleAddRectangleCallback} // Add new callback
/>
```

### Step 6: Pass to PlanToolbox

```javascript
<PlanToolbox
  onAddCircle={addCircleHandler}
  onAddRectangle={addRectangleHandler} // Add new handler
/>
```

### Step 7: Add tool definition in `PlanToolbox.jsx`

```javascript
const tools = [
  {
    id: 'circle',
    label: 'Add Circle',
    icon: '⭕',
    description: 'Add a circle marker',
    action: onAddCircle
  },
  {
    id: 'rectangle',
    label: 'Add Rectangle',
    icon: '▭',
    description: 'Add a rectangle',
    action: onAddRectangle // Add new tool
  }
];
```

## Example: Adding a Text Tool

### 1. Handler in VisualPlanDragArea.jsx

```javascript
const handleAddText = useCallback(() => {
  const id = `text-${Date.now()}`;
  setCards(prev => [
    ...prev,
    {
      id,
      label: 'Text',
      x: 200,
      y: 200,
      moduleType: 'text',
      text: 'New Text',
    },
  ]);
}, []);
```

### 2. Update Props & useEffect

```javascript
const DraggableCardList = ({
  // ... existing props
  onAddText = null
}) => {
  // ... existing code

  useEffect(() => {
    if (onAddCircle) onAddCircle(handleAddCircle);
    if (onAddText) onAddText(handleAddText);
  }, [onAddCircle, handleAddCircle, onAddText, handleAddText]);
}
```

### 3. Update MultiImagePlanPage.jsx

```javascript
const [addTextHandler, setAddTextHandler] = useState(null);

const handleAddTextCallback = useCallback((handler) => {
  setAddTextHandler(() => handler);
}, []);

// In JSX:
<DraggableCardListComponent onAddText={handleAddTextCallback} />
<PlanToolbox onAddText={addTextHandler} />
```

### 4. Add to PlanToolbox.jsx

```javascript
const tools = [
  // ... existing tools
  {
    id: 'text',
    label: 'Add Text',
    icon: '📝',
    description: 'Add text label',
    action: onAddText
  }
];
```

## Styling Tips

- Toolbox uses horizontal layout by default
- Active tool gets blue highlight
- Hover effects for better UX
- Auto-width based on number of tools

## Benefits of This Architecture

✅ **Separation of Concerns**: Toolbox UI is separate from canvas logic
✅ **Extensible**: Easy to add new tools without touching existing code
✅ **Clean**: No overlays on the image, better UX
✅ **Reusable**: Can be used on other plan pages (GTB Plan, etc.)
✅ **State Management**: Clear flow of handlers via callbacks

## Notes

- Always expose handlers via `useEffect` with `onAddX` callback
- Keep tool definitions in `PlanToolbox.jsx` for easy discovery
- Test each new tool to ensure it adds items correctly
- Consider adding keyboard shortcuts for power users
