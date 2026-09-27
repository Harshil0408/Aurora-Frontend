import { renderWithProviders, screen, userEvent } from '@/test-utils';
import { Button } from '@mui/material';
import { Modal } from '../Modal';
import { ConfirmDialog } from '../ConfirmDialog';

describe('Modal', () => {
  it('renders title, subtitle, content, and actions; closes', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    renderWithProviders(
      <Modal
        open
        onClose={onClose}
        title="Create Admin"
        subtitle="Step 1 of 2"
        actions={<Button onClick={onClose}>Cancel</Button>}
      >
        <p>Body content</p>
      </Modal>,
    );
    expect(screen.getByRole('heading', { name: 'Create Admin' })).toBeInTheDocument();
    expect(screen.getByText('Step 1 of 2')).toBeInTheDocument();
    expect(screen.getByText('Body content')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders nothing actionable without actions', () => {
    renderWithProviders(
      <Modal open onClose={() => {}} title="Info">
        <p>Plain body</p>
      </Modal>,
    );
    expect(screen.getByText('Plain body')).toBeInTheDocument();
  });
});

describe('ConfirmDialog', () => {
  function Harness({ onConfirm }: { onConfirm: () => void }) {
    return (
      <ConfirmDialog
        open
        onClose={() => {}}
        onConfirm={onConfirm}
        title="Log out everywhere?"
        consequence={
          <>
            <b>Strong confirm.</b> This revokes <b>all 3 sessions</b>.
          </>
        }
        ackLabel="I understand all devices will be signed out"
        confirmWord="LOGOUT"
        confirmLabel="Revoke all sessions"
      />
    );
  }

  it('guards confirm behind checkbox + typed word, then fires', async () => {
    const user = userEvent.setup();
    const onConfirm = jest.fn();
    renderWithProviders(<Harness onConfirm={onConfirm} />);
    const confirm = screen.getByRole('button', { name: 'Revoke all sessions' });
    expect(confirm).toBeDisabled();
    expect(screen.getByText('Strong confirm.')).toBeInTheDocument();

    await user.click(screen.getByRole('checkbox'));
    expect(confirm).toBeDisabled();

    await user.type(screen.getByLabelText(/Type LOGOUT to confirm/i), 'LOGOU');
    expect(confirm).toBeDisabled();
    await user.type(screen.getByLabelText(/Type LOGOUT to confirm/i), 'T');
    expect(confirm).toBeEnabled();

    await user.click(confirm);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('confirms immediately when no proof is required', async () => {
    const user = userEvent.setup();
    const onConfirm = jest.fn();
    renderWithProviders(
      <ConfirmDialog
        open
        onClose={() => {}}
        onConfirm={onConfirm}
        title="Discard changes?"
        tone="info"
        consequence="Unsaved edits will be lost."
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('shows server errors and busy state', () => {
    renderWithProviders(
      <ConfirmDialog
        open
        onClose={() => {}}
        onConfirm={() => {}}
        title="Revoke?"
        consequence="One session signs out."
        error="Could not revoke that session."
        loading
        confirmLabel="Revoke session"
      />,
    );
    expect(screen.getByText('Could not revoke that session.')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Working…' })).toBeInTheDocument();
  });
});
