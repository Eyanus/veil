// @ts-ignore
import { test, expect, type Page } from '@playwright/test'

// ── WebAuthn virtual authenticator helpers ────────────────────────────────────

async function addVirtualAuthenticator(page: Page) {
  const cdpSession = await page.context().newCDPSession(page)
  await cdpSession.send('WebAuthn.enable', { enableUI: false })
  const { authenticatorId } = await cdpSession.send('WebAuthn.addVirtualAuthenticator', {
    options: {
      protocol: 'ctap2',
      transport: 'internal',
      hasResidentKey: true,
      hasUserVerification: true,
      isUserVerified: true,
      automaticPresenceSimulation: true,
    },
  })
  return { cdpSession, authenticatorId }
}

// ── Stub out network calls that require live testnet infra ────────────────────

async function stubNetworkCalls(page: Page) {
  // Friendbot — always succeed
  await page.route('**/friendbot.stellar.org/**', (route: any) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ result: 'funded', hash: 'a'.repeat(64) }),
    }),
  )

  // Horizon loadAccount — return a minimal funded account
  await page.route('**/horizon-testnet.stellar.org/accounts/**', (route: any) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'GTEST',
        account_id: 'GTEST',
        sequence: '123456789',
        subentry_count: 0,
        balances: [{ asset_type: 'native', balance: '10000.0000000', buying_liabilities: '0.0000000', selling_liabilities: '0.0000000' }],
        thresholds: { low_threshold: 0, med_threshold: 0, high_threshold: 0 },
        flags: { auth_required: false, auth_revocable: false, auth_immutable: false },
        signers: [{ weight: 1, key: 'GTEST', type: 'ed25519_public_key' }],
        data: {},
        paging_token: '',
        last_modified_ledger: 1000,
        last_modified_time: new Date().toISOString(),
      }),
    }),
  )

  // Soroban RPC — return the data needed for simulate -> assemble -> send -> poll.
  await page.route('**/soroban-testnet.stellar.org', (route: any) => {
    const body = route.request().postDataJSON() as { method?: string }
    if (body?.method === 'simulateTransaction') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          result: {
            transactionData: 'AAAAAAAAAAIAAAAGAAAAAem354u9STQWq5b3Ed1j9tOemvL7xV0NPwhn4gXg0AP8AAAAFAAAAAEAAAAH8dTto4AAAAAAAAAAAAAAAAAAAAA=',
            minResourceFee: '100',
            results: [{ xdr: 'AAAAAQAAAA==' }],
            latestLedger: 1000,
            cost: { cpuInsns: '0', memBytes: '0' },
          },
        }),
      })
    }
    if (body?.method === 'sendTransaction') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          result: {
            status: 'PENDING',
            hash: 'a'.repeat(64),
          },
        }),
      })
    }
    if (body?.method === 'getTransaction') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          result: {
            status: 'SUCCESS',
            latestLedger: 1000,
          },
        }),
      })
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, result: {} }),
    })
  })
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('Onboarding — new wallet creation', () => {
  test.beforeEach(async ({ page }) => {
    // Clear all storage so each test starts fresh
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
    await stubNetworkCalls(page)
  })

  test('landing page renders the Create wallet button', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('button', { name: /create wallet/i })).toBeVisible()
  })

  test('landing page renders the Recover existing wallet button', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('button', { name: /recover existing wallet/i })).toBeVisible()
  })

  test('shows biometric waiting state after clicking Create wallet', async ({ page, context }) => {
    // Register a virtual authenticator so WebAuthn doesn't block
    await addVirtualAuthenticator(page)
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await page.getByRole('button', { name: /create wallet/i }).click({ force: true })

    // Should show the "Waiting for biometric..." or "Deploying wallet on-chain..." card
    await expect(
      page.getByText(/waiting for biometric|deploying wallet on-chain/i),
    ).toBeVisible({ timeout: 10_000 })
  })

  test('full onboarding flow: create wallet → dashboard redirect', async ({ page, context }) => {
    await addVirtualAuthenticator(page)
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await page.getByRole('button', { name: /create wallet/i }).click({ force: true })

    const reachedDashboard = await page
      .waitForURL(/\/dashboard/, { timeout: 30_000 })
      .then(() => true)
      .catch(() => false)

    if (!reachedDashboard) {
      await expect(page.getByText(/wallet created/i)).toBeVisible({ timeout: 5_000 })
    }
  })
})

test.describe('Onboarding — existing wallet redirect', () => {
  test('redirects to /lock when wallet address is already in localStorage', async ({ page }) => {
    // Seed localStorage before the page loads so the effect fires immediately
    await page.addInitScript(() => {
      localStorage.setItem('invisible_wallet_address', 'CFAKEWALLET123FAKE456')
    })

    await page.goto('/')

    // Should land on /lock, not stay on /
    await expect(page).toHaveURL(/\/lock/, { timeout: 10_000 })
  })

  test('lock page renders when navigated directly', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('invisible_wallet_address', 'CFAKEWALLET123FAKE456')
    })
    await page.goto('/lock')
    // The lock page must have some visible UI (heading or button)
    await expect(page.locator('body')).not.toBeEmpty()
  })
})

test.describe('Onboarding — tutorial overlay', () => {
  test('tutorial is shown on first visit (no veil_seen_tutorial in storage)', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.removeItem('veil_seen_tutorial')
      localStorage.removeItem('invisible_wallet_address')
    })
    await page.reload()

    // The OnboardingTutorial component should be visible
    // It renders a full-screen overlay — assert some tutorial-specific text exists
    await expect(page.getByText(/no seed phrase/i)).toBeVisible()
  })
})
