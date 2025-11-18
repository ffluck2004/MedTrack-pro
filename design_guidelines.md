# MedTrack Pro - Design Guidelines

## Design Approach

**Selected Framework**: Material Design System (Data-rich productivity application)

**Rationale**: MedTrack Pro is a utility-focused healthcare management tool requiring clear data presentation, efficient workflows, and professional reliability. Material Design provides the structured approach needed for information-dense medical applications while maintaining accessibility and usability standards critical in healthcare contexts.

**Core Principles**:
- Clarity over decoration: Every element serves a functional purpose
- Scannable data hierarchy: Information must be quickly digestible
- Consistent patterns: Predictable interactions reduce cognitive load for busy clinic staff
- Professional restraint: Minimal animations, maximum reliability

---

## Typography System

**Font Stack**: 
- Primary: Inter or Roboto (high legibility for medical data)
- Monospace: JetBrains Mono or Roboto Mono (for codes, barcodes, invoice numbers)

**Type Scale**:
- Page Headings: text-2xl to text-3xl, font-semibold
- Section Headers: text-xl, font-semibold
- Card/Component Titles: text-lg, font-medium
- Body/Data Text: text-base, font-normal
- Labels/Metadata: text-sm, font-medium
- Captions/Timestamps: text-xs, font-normal

**Hierarchy Rules**:
- Dashboard metrics: Large bold numbers (text-3xl) with small labels (text-sm)
- Table headers: text-sm font-semibold uppercase tracking-wide
- Form labels: text-sm font-medium with required indicators
- Data cells: text-base for primary content, text-sm for secondary

---

## Layout System

**Spacing Primitives**: Use Tailwind units of **2, 4, 6, 8, 12, 16**

**Application Structure**:
- Sidebar: Fixed width 16 units (w-64) on desktop, collapsible on mobile
- Header: h-16 with consistent padding
- Main content: p-6 to p-8 for breathing room
- Component spacing: gap-6 between major sections, gap-4 within components

**Grid Patterns**:
- Dashboard cards: 4-column grid on xl screens, 3-col on lg, 2-col on md, 1-col on mobile
- Inventory tables: Full-width with horizontal scroll on mobile
- Forms: Single column max-w-2xl centered, with grouped field sets
- Billing layout: Two-column split (product selection left, invoice summary right fixed)

**Container Rules**:
- Dashboard: max-w-7xl with cards in grid
- Lists/Tables: Full width with internal max-width
- Forms: max-w-3xl centered
- Modal overlays: max-w-lg to max-w-4xl depending on content

---

## Component Library

### Navigation
**Sidebar Navigation**:
- Icons + text labels, active state with background accent
- Grouped sections (Inventory, Sales, Management, Settings)
- Collapse to icon-only on tablet/mobile
- Fixed position with subtle shadow

**Header Bar**:
- Page title left-aligned
- Action buttons right-aligned (theme toggle, notifications)
- Breadcrumb trail for nested views (optional for deeper navigation)

### Dashboard Components
**Metric Cards**:
- Large number display with descriptive label below
- Optional trend indicator (up/down arrow with percentage)
- Icon in corner for quick recognition
- Clickable to navigate to detailed view

**Quick Action Cards**:
- Prominent icon
- Action title
- Brief description
- Call-to-action button

**Alert Panels**:
- Color-coded severity (system alerts for expiry, low stock)
- Dismissible with clear action buttons
- Grouped by priority at page top

**Recent Activity/Notes**:
- Chronological list with timestamps
- Avatar or icon for entry type
- Expandable details
- Quick actions (delete, edit)

### Data Tables
**Structure**:
- Sticky header row with sort indicators
- Alternating row backgrounds for scannability
- Hover state highlighting entire row
- Action column right-aligned (Edit, Delete icons)
- Pagination footer with items-per-page selector

**Cell Design**:
- Text alignment: Left for text, right for numbers
- Status badges: Rounded pills with semantic colors
- Expiry dates: Highlight urgent items
- Stock levels: Visual indicator (badge) for low/out-of-stock

### Forms
**Input Fields**:
- Floating labels or top-aligned labels with consistent spacing
- Input height h-12 for comfortable touch targets
- Border on all states with focus ring
- Helper text below field (text-sm)
- Error states with icon and message

**Form Layouts**:
- Logical field grouping with subtle dividers
- Two-column layout for related fields on desktop
- Action buttons right-aligned (Cancel, Save)
- Required field indicators (asterisk or explicit label)

**Special Inputs**:
- Date pickers: Native or library with clear format
- Barcode scanner: Camera integration button with preview
- Autocomplete: Dropdown suggestions with keyboard navigation
- Number steppers: +/- buttons for quantity inputs

### Billing Interface
**Product Selection Panel**:
- Search bar at top with filter chips
- Product cards/rows with image, name, stock, price
- Add to cart button with quantity selector
- Running cart summary sticky

**Invoice Builder**:
- Line items table with remove capability
- Subtotal, discount, tax breakdown
- Grand total prominently displayed
- Customer selection/quick-add
- Payment method tabs/selector
- Print/Save actions

### Modals & Dialogs
**Dialog Types**:
- Confirmation: Small centered (max-w-md) with clear Yes/No
- Forms: Medium to large (max-w-2xl) for complex inputs
- Detail views: Large (max-w-4xl) for invoices, reports
- Overlay: Semi-transparent backdrop, click-outside to dismiss

**Modal Structure**:
- Header with title and close button
- Content area with internal scroll if needed
- Footer with action buttons right-aligned

### Reports & Analytics
**Chart Components**:
- Clean axis labels with gridlines
- Legend positioned top-right or bottom
- Tooltips on hover showing exact values
- Responsive sizing that maintains readability
- Export options (PDF, CSV) prominently placed

**Report Filters**:
- Date range selector (presets: Today, This Week, This Month, Custom)
- Category/type filters as chips or dropdown
- Apply/Reset buttons
- Saved filter presets for common reports

---

## Interaction Patterns

**Navigation Flow**:
- Sidebar click navigates directly
- Breadcrumbs for multi-level navigation
- Back buttons in edit/detail views
- Confirmation prompts for destructive actions

**Data Entry**:
- Auto-save for drafts (visual indicator)
- Clear success/error feedback
- Keyboard shortcuts for power users (Ctrl+S to save, Esc to cancel)
- Tab order follows logical flow

**Search & Filter**:
- Instant search with debouncing
- Filter chips display active filters
- Clear all filters option
- Results count displayed

**Bulk Actions**:
- Checkbox selection in tables
- Bulk action bar appears when items selected
- Select all/none options
- Confirmation for bulk operations

---

## Accessibility Standards

- Minimum touch target: 44x44px for buttons/interactive elements
- Color contrast ratios: 4.5:1 for normal text, 3:1 for large text
- Keyboard navigation: Full support with visible focus states
- Screen reader: Semantic HTML, ARIA labels for icons
- Form validation: Clear error messages with icons and explanatory text
- Status messages: Announce changes to screen readers

---

## Responsive Behavior

**Breakpoint Strategy**:
- Mobile (<640px): Single column, collapsible sidebar, stacked forms
- Tablet (640-1024px): 2-column grids, expanded sidebar with icons+text
- Desktop (>1024px): Full multi-column layouts, persistent sidebar

**Mobile Optimizations**:
- Bottom navigation bar for primary actions
- Swipe gestures for common actions (swipe-to-delete)
- Tap-friendly spacing (minimum p-4 for interactive areas)
- Simplified tables: Card view instead of wide tables

---

## Special Considerations for Healthcare Context

**Data Prominence**: Critical medical information (expiry dates, stock levels, patient data) uses bold weights and larger sizes

**Error Prevention**: Multi-step confirmations for irreversible actions (deleting medicines, returning invoices)

**Audit Trail**: Timestamp and user attribution for all actions visible in detail views

**Privacy**: Sensitive customer data masked by default with reveal option

**Professional Tone**: Conservative, trust-building visual language appropriate for medical settings