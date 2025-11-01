import { createClient } from 'npm:@supabase/supabase-js@2';

export async function loadAllProviders(): Promise<string> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      console.warn('⚠️ Supabase credentials missing, using fallback providers');
      return getFallbackProviders();
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: providers, error } = await supabase
      .from('providers')
      .select('id, name, provider_type')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('❌ Error loading providers:', error);
      return getFallbackProviders();
    }

    if (!providers || providers.length === 0) {
      console.warn('⚠️ No providers found, using fallback');
      return getFallbackProviders();
    }

    const providersByType = {
      streaming: [] as string[],
      network: [] as string[]
    };

    providers.forEach(p => {
      const entry = `${p.name.trim()} (ID: ${p.id})`;
      if (p.provider_type === 'streaming') {
        providersByType.streaming.push(entry);
      } else if (p.provider_type === 'network') {
        providersByType.network.push(entry);
      }
    });

    const result = `
## STREAMING PLATFORMS (${providersByType.streaming.length} total):
${providersByType.streaming.join(', ')}

## TV NETWORKS/CHANNELS (${providersByType.network.length} total):
${providersByType.network.join(', ')}

IMPORTANT: When user mentions ANY platform name (Netflix, Gain, BluTV, Disney+, etc.), use the ID from above list.
For watch providers, use: with_watch_providers parameter with the ID.
`.trim();

    console.log(`✅ Loaded ${providers.length} providers (${providersByType.streaming.length} streaming, ${providersByType.network.length} networks)`);

    return result;
  } catch (error) {
    console.error('❌ Failed to load providers:', error);
    return getFallbackProviders();
  }
}

function getFallbackProviders(): string {
  return `
## STREAMING PLATFORMS:
Netflix (ID: 8), Amazon Prime Video (ID: 9), Disney+ (ID: 337), HBO Max (ID: 384), Apple TV+ (ID: 350),
Hulu (ID: 15), Paramount+ (ID: 531), Gain/BluTV (ID: 526), Turkcell TV+ (ID: 332), beIN CONNECT (ID: 564),
Mubi (ID: 11), BBC iPlayer (ID: 38), Crunchyroll (ID: 283)

## TV NETWORKS:
ABC (ID: 2), NBC (ID: 6), CBS (ID: 16), Fox (ID: 19), The CW (ID: 71), TRT 1 (ID: 130),
Kanal D (ID: 69), Show TV (ID: 82), ATV (ID: 36), Star TV (ID: 112)

IMPORTANT: Use the ID numbers with with_watch_providers parameter.
`.trim();
}
