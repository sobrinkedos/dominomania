import { supabase } from '@/lib/supabase';

export interface WhatsappGroupLink {
  id: string;
  community_id: string;
  group_name: string;
  invite_link: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface CreateWhatsappGroupLinkDTO {
  community_id: string;
  group_name: string;
  invite_link: string;
}

export interface UpdateWhatsappGroupLinkDTO {
  group_name?: string;
  invite_link?: string;
  is_active?: boolean;
}

class WhatsappService {
  async getGroupLinksByCommunity(communityId: string) {
    try {
      const { data, error } = await supabase
        .from('whatsapp_group_links')
        .select('*')
        .eq('community_id', communityId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar links de grupos do WhatsApp:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar links de grupos do WhatsApp:', error);
      throw error;
    }
  }

  async createGroupLink(data: CreateWhatsappGroupLinkDTO) {
    try {
      const { data: newLink, error } = await supabase
        .from('whatsapp_group_links')
        .insert([
          {
            ...data,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar link de grupo do WhatsApp:', error);
        throw error;
      }

      return newLink;
    } catch (error) {
      console.error('Erro ao criar link de grupo do WhatsApp:', error);
      throw error;
    }
  }

  async updateGroupLink(id: string, updates: UpdateWhatsappGroupLinkDTO) {
    try {
      const { data, error } = await supabase
        .from('whatsapp_group_links')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar link de grupo do WhatsApp:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro ao atualizar link de grupo do WhatsApp:', error);
      throw error;
    }
  }

  async deleteGroupLink(id: string) {
    try {
      const { error } = await supabase
        .from('whatsapp_group_links')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao excluir link de grupo do WhatsApp:', error);
        throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('Erro ao excluir link de grupo do WhatsApp:', error);
      throw error;
    }
  }
}

export const whatsappService = new WhatsappService();