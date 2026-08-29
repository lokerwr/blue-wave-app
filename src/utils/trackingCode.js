import { supabase } from '../supabaseClient'

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no 0/O/1/I to avoid confusion

export function generateTrackingCode() {
  let code = 'BW'
  for (let i = 0; i < 6; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)]
  }
  return code // 8 characters total, e.g. BW4F7K9P
}

export async function generateUniqueTrackingCode() {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateTrackingCode()
    const { data } = await supabase
      .from('shipments')
      .select('id')
      .eq('tracking_code', code)
      .maybeSingle()
    if (!data) return code
  }
  throw new Error('Could not generate a unique tracking code. Please try again.')
}
