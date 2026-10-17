import { renderWithProviders, screen, userEvent } from '@/test-utils';
import { useState } from 'react';
import { TourDialog } from '@/components/ui/TourDialog';

const STEPS = [
  { title: 'First', body: 'First step body' },
  { title: 'Second', body: 'Second step body' },
];

function TourHarness({ onStart }: { onStart: () => void }) {
  const [step, setStep] = useState(0);
  const [closed, setClosed] = useState(false);
  if (closed) return <p>closed</p>;
  return (
    <TourDialog
      eyebrow="Admins tour"
      steps={STEPS}
      step={step}
      onStep={setStep}
      onClose={() => setClosed(true)}
      onStart={onStart}
      startLabel="Create admin"
    />
  );
}

describe('TourDialog', () => {
  it('walks Back/Next, skips, and fires the start CTA on the last step', async () => {
    const user = userEvent.setup();
    const onStart = jest.fn();
    renderWithProviders(<TourHarness onStart={onStart} />);
    expect(screen.getByText(/Admins tour · First/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText(/Admins tour · Second/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByText(/Admins tour · First/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Create admin' }));
    expect(onStart).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: /Skip tour/ }));
    expect(screen.getByText('closed')).toBeInTheDocument();
  });
});
