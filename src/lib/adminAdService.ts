import { supabase } from './supabase';

export interface AdUnit {
  id: string;
  name: string;
  position: string;
  ad_code: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface AdUnitInput {
  name: string;
  position: string;
  ad_code: string;
  is_active: boolean;
}

export const AD_POSITIONS = {
  HOME_TOP: 'home_top',
  HOME_MIDDLE: 'home_middle',
  HOME_BOTTOM: 'home_bottom',
  CONTENT_TOP: 'content_top',
  CONTENT_MIDDLE: 'content_middle',
  CONTENT_BOTTOM: 'content_bottom',
  CONTENT_SIDEBAR: 'content_sidebar',
  PERSON_TOP: 'person_top',
  PERSON_MIDDLE: 'person_middle',
  PERSON_BOTTOM: 'person_bottom',
  FOOTER: 'footer',
} as const;

export const AD_POSITION_LABELS: Record<string, string> = {
  home_top: 'Homepage - Top',
  home_middle: 'Homepage - Middle',
  home_bottom: 'Homepage - Bottom',
  content_top: 'Content Page - Top',
  content_middle: 'Content Page - Middle',
  content_bottom: 'Content Page - Bottom',
  content_sidebar: 'Content Page - Sidebar',
  person_top: 'Person Page - Top',
  person_middle: 'Person Page - Middle',
  person_bottom: 'Person Page - Bottom',
  footer: 'Footer',
};

export class AdminAdService {
  async getAllAdUnits(): Promise<AdUnit[]> {
    const { data, error } = await supabase
      .from('ad_units')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching ad units:', error);
      throw error;
    }

    return data || [];
  }

  async getAdUnitById(id: string): Promise<AdUnit | null> {
    const { data, error } = await supabase
      .from('ad_units')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching ad unit:', error);
      throw error;
    }

    return data;
  }

  async createAdUnit(input: AdUnitInput, userId: string): Promise<AdUnit> {
    const { data, error } = await supabase
      .from('ad_units')
      .insert({
        ...input,
        created_by: userId,
        updated_by: userId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating ad unit:', error);
      throw error;
    }

    return data;
  }

  async updateAdUnit(id: string, input: AdUnitInput, userId: string): Promise<AdUnit> {
    const { data, error } = await supabase
      .from('ad_units')
      .update({
        ...input,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating ad unit:', error);
      throw error;
    }

    return data;
  }

  async deleteAdUnit(id: string): Promise<void> {
    const { error } = await supabase
      .from('ad_units')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting ad unit:', error);
      throw error;
    }
  }

  async toggleAdUnitStatus(id: string, isActive: boolean, userId: string): Promise<void> {
    const { error } = await supabase
      .from('ad_units')
      .update({
        is_active: isActive,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Error toggling ad unit status:', error);
      throw error;
    }
  }

  getPositionLabel(position: string): string {
    return AD_POSITION_LABELS[position] || position;
  }

  getAvailablePositions(): Array<{ value: string; label: string }> {
    return Object.entries(AD_POSITION_LABELS).map(([value, label]) => ({
      value,
      label,
    }));
  }
}

export const adminAdService = new AdminAdService();
