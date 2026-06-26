# ClinicOS UI Components

All files match your existing `#0F6E56` green theme and CSS variable system.

## Files

```
components/
  Button.jsx          — Primary, Secondary, Outline, Danger, Ghost, Icon buttons
  Badge.jsx           — Status badges (green / red / amber / blue / purple)
  FormField.jsx       — FormField, SelectField, Toggle, RadioPills
  DataTable.jsx       — Searchable, paginated table with row actions
  Modal.jsx           — Overlay dialog with header / body / footer
  Avatar.jsx          — Initials avatar with auto-color from name
  DetailCard.jsx      — Patient/record detail view with 2-col grid

styles/
  index.css           — Drop-in replacement for your existing index.css
                        (adds DM Sans font + all component CSS classes)

PatientsPage_Example.jsx  — Full working example wiring all components together
```

## Setup

1. Copy `styles/index.css` → `client/src/index.css`  (replaces existing)
2. Copy `components/` folder → `client/src/components/`
3. Use `PatientsPage_Example.jsx` as a reference for your `pages/Patients.jsx`

## Quick usage

```jsx
import Button from '../components/Button';
import Badge from '../components/Badge';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import DetailCard from '../components/DetailCard';
import Avatar from '../components/Avatar';
import { FormField, SelectField, Toggle, RadioPills } from '../components/FormField';

// Button
<Button variant="primary" onClick={handleSave}>Save</Button>
<Button variant="danger" size="sm">Delete</Button>
<Button iconOnly icon={<EditIcon />} />

// Badge
<Badge color="green">Active</Badge>
<Badge color="red">Overdue</Badge>
<Badge color="amber">Pending</Badge>

// Table
<DataTable
  title="Patients"
  columns={columns}   // [{ key, label, render? }]
  rows={rows}         // [{ id, ...fields }]
  onAdd={() => setOpen(true)}
  searchKeys={['name', 'email']}
  actions={({ row }) => <Button iconOnly icon={<EyeIcon />} onClick={() => view(row)} />}
/>

// Modal
<Modal open={open} onClose={() => setOpen(false)} title="Add Patient" onConfirm={handleSubmit}>
  <FormField label="First Name" required>
    <input type="text" />
  </FormField>
</Modal>

// Detail Card
<DetailCard
  name="Arjun Sharma"
  subId="PT-00421"
  badgeColor="green"
  badgeLabel="Active"
  fields={[
    { label: 'Gender', value: 'Male' },
    { label: 'Doctor', value: 'Dr. Meena' },
  ]}
/>
```

## Color variants reference

| Variant   | Use case                     |
|-----------|------------------------------|
| `green`   | Active, paid, success        |
| `red`     | Overdue, error, deleted      |
| `amber`   | Pending, warning, draft      |
| `blue`    | Scheduled, info, new         |
| `purple`  | In review, special           |
