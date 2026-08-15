import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mzesebmgmbhsdratfsqw.supabase.co'
const supabaseKey = 'sb_publishable_lqfKOzY0pvJq9CJjjnEX-w_oK8mCsSG'

export const supabase = createClient(supabaseUrl, supabaseKey)
