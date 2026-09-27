import { renderWithProviders, screen, userEvent } from '@/test-utils';
import { useState } from 'react';
import {
  DetailRow,
  GuideAccordion,
  HowRow,
  StepNum,
  TourDialog,
} from '@/components/ui/Guide';

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

describe('Guide UX primitives', () => {
  it('renders numbered steps and detail rows', () => {
    renderWithProviders(
      <>
        <StepNum n={3} />
        <HowRow n={1}>
          Do <b>this</b> first
        </HowRow>
        <DetailRow label="Status">
          <span>Active</span>
        </DetailRow>
      </>,
    );
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText(/Do/)).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('collapsed accordion shows inviting title, expands to guidance', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <GuideAccordion title="How it works — read first">
        <p>Guidance body</p>
      </GuideAccordion>,
    );
    expect(screen.getByText('How it works — read first')).toBeInTheDocument();
    const toggle = screen.getByRole('button', { name: /How it works/ });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Guidance body')).toBeVisible();
  });

  it('tour walks Back/Next, skips, and fires the start CTA on the last step', async () => {
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
