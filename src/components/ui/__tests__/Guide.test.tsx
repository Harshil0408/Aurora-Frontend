import { renderWithProviders, screen, userEvent } from '@/test-utils';
import {
  DetailRow,
  GuideAccordion,
  HowRow,
  StepNum,
} from '@/components/ui/Guide';

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
});
