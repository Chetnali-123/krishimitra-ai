import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { BackButton } from '../BackButton';
import { PageHeader } from '../PageHeader';
import { I18nProvider } from '../../../contexts/I18nContext';

function renderWithProviders(ui: ReactElement, { initialEntries = ['/some/page'] } = {}) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <I18nProvider>{ui}</I18nProvider>
    </MemoryRouter>,
  );
}

/**
 * React Router records an increasing `idx` on every history entry it pushes.
 * Simulating that is what tells BackButton whether a previous route exists,
 * so the tests drive it the same way the real router does.
 */
function setRouterIndex(idx: number | undefined) {
  window.history.replaceState(idx === undefined ? {} : { usr: null, key: 'k', idx }, '');
}

describe('BackButton', () => {
  beforeEach(() => setRouterIndex(1));
  afterEach(() => setRouterIndex(undefined));

  it('renders the translated label with a decorative arrow', () => {
    renderWithProviders(<BackButton />);
    const btn = screen.getByRole('button', { name: 'Go back' });
    expect(btn).toBeInTheDocument();
    // Decorative SVG only; accessible name comes from aria-label.
    expect(btn.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });

  it('honours a custom label', () => {
    renderWithProviders(<BackButton ariaLabel="Back to marketplace" />);
    expect(screen.getByRole('button', { name: 'Back to marketplace' })).toBeInTheDocument();
  });

  it('goes to the previous route when the router has history', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/market" element={<p>marketplace</p>} />
        <Route
          path="/some/page"
          element={
            <>
              <BackButton />
              <p>detail</p>
            </>
          }
        />
      </Routes>,
      { initialEntries: ['/market', '/some/page'] },
    );
    expect(screen.getByText('detail')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Go back' }));
    expect(screen.getByText('marketplace')).toBeInTheDocument();
  });

  it('falls back to the given route when there is no history', async () => {
    setRouterIndex(0);
    renderWithProviders(
      <Routes>
        <Route path="/" element={<p>home</p>} />
        <Route path="/market" element={<p>marketplace</p>} />
        <Route path="/some/page" element={<BackButton fallbackTo="/market" />} />
      </Routes>,
      { initialEntries: ['/some/page'] },
    );

    await userEvent.click(screen.getByRole('button', { name: 'Go back' }));
    expect(screen.getByText('marketplace')).toBeInTheDocument();
  });

  it('defaults the fallback to home when none is supplied', async () => {
    setRouterIndex(0);
    renderWithProviders(
      <Routes>
        <Route path="/" element={<p>home</p>} />
        <Route path="/some/page" element={<BackButton />} />
      </Routes>,
      { initialEntries: ['/some/page'] },
    );

    await userEvent.click(screen.getByRole('button', { name: 'Go back' }));
    expect(screen.getByText('home')).toBeInTheDocument();
  });

  it('treats a missing router index as no history', async () => {
    setRouterIndex(undefined);
    renderWithProviders(
      <Routes>
        <Route path="/" element={<p>home</p>} />
        <Route path="/some/page" element={<BackButton />} />
      </Routes>,
      { initialEntries: ['/some/page'] },
    );

    await userEvent.click(screen.getByRole('button', { name: 'Go back' }));
    expect(screen.getByText('home')).toBeInTheDocument();
  });
});

describe('PageHeader back slot', () => {
  beforeEach(() => setRouterIndex(1));
  afterEach(() => setRouterIndex(undefined));

  it('renders a back control above the title when back is true', () => {
    renderWithProviders(<PageHeader back title="Crops database" icon="🌱" />);
    expect(screen.getByRole('button', { name: 'Go back' })).toBeInTheDocument();
    expect(screen.getByText('Crops database')).toBeInTheDocument();
  });

  it('passes configuration through to BackButton', async () => {
    setRouterIndex(0);
    renderWithProviders(
      <Routes>
        <Route path="/" element={<p>home</p>} />
        <Route path="/market" element={<p>marketplace</p>} />
        <Route path="/some/page" element={<PageHeader back={{ fallbackTo: '/market' }} title="Product" />} />
      </Routes>,
      { initialEntries: ['/some/page'] },
    );

    await userEvent.click(screen.getByRole('button', { name: 'Go back' }));
    expect(screen.getByText('marketplace')).toBeInTheDocument();
  });

  it('omits the control entirely when back is not requested', () => {
    renderWithProviders(<PageHeader title="Dashboard" />);
    expect(screen.queryByRole('button', { name: 'Go back' })).not.toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('keeps the existing action slot working', () => {
    renderWithProviders(<PageHeader title="Orders" action={<button type="button">Export</button>} />);
    expect(screen.getByRole('button', { name: 'Export' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Back' })).not.toBeInTheDocument();
  });
});
