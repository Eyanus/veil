import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://example.supabase.co'
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'replace-with-your-anon-key'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

/** Track a newly deployed wallet. Fire-and-forget — never blocks the UI. */
export async function trackWalletCreated(
  contractAddress: string,
  feePayerAddress: string,
) {
  try {
    await supabase.from('wallets').insert({
      contract_address: contractAddress,
      fee_payer_address: feePayerAddress,
    })
  } catch {
    // Silent — analytics must never break the wallet flow
  }
}
