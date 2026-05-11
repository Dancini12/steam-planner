import { supabase } from './supabase.js'

export async function fetchProjectsExample() {
  if (supabase) {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .limit(5)

    console.log('Supabase projects response:', { data, error })

    return { data, error }
  }

  console.warn('Supabase indisponível')
  return { data: [], error: null }
}
