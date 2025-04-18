import React, { useState, useEffect } from 'react';
import { Alert, ActivityIndicator, View, Linking } from 'react-native';
import styled from 'styled-components/native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { TextInput } from 'react-native-paper';
import { whatsappService, WhatsappGroupLink } from '@/services/whatsappService';

interface WhatsappGroupManagerProps {
  communityId: string;
  isOrganizer: boolean;
  colors: any;
}

export default function WhatsappGroupManager({ communityId, isOrganizer, colors }: WhatsappGroupManagerProps) {
  const [groupLinks, setGroupLinks] = useState<WhatsappGroupLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    group_name: '',
    invite_link: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadGroupLinks();
  }, [communityId]);

  const loadGroupLinks = async () => {
    try {
      setLoading(true);
      const links = await whatsappService.getGroupLinksByCommunity(communityId);
      setGroupLinks(links);
    } catch (error) {
      console.error('Erro ao carregar links de grupos:', error);
      Alert.alert('Erro', 'Não foi possível carregar os grupos do WhatsApp');
    } finally {
      setLoading(false);
    }
  };

  const handleAddGroup = async () => {
    if (!formData.group_name.trim() || !formData.invite_link.trim()) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }

    // Validação básica do link do WhatsApp
    if (!formData.invite_link.includes('chat.whatsapp.com/')) {
      Alert.alert('Erro', 'O link de convite do WhatsApp parece inválido');
      return;
    }

    try {
      setSubmitting(true);
      await whatsappService.createGroupLink({
        community_id: communityId,
        group_name: formData.group_name.trim(),
        invite_link: formData.invite_link.trim()
      });

      // Limpa o formulário e recarrega os links
      setFormData({ group_name: '', invite_link: '' });
      setShowAddForm(false);
      await loadGroupLinks();
      
      Alert.alert('Sucesso', 'Grupo do WhatsApp adicionado com sucesso!');
    } catch (error) {
      console.error('Erro ao adicionar grupo:', error);
      Alert.alert('Erro', 'Não foi possível adicionar o grupo do WhatsApp');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveGroup = async (id: string) => {
    Alert.alert(
      'Confirmar exclusão',
      'Tem certeza que deseja remover este grupo do WhatsApp?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              await whatsappService.deleteGroupLink(id);
              await loadGroupLinks();
              Alert.alert('Sucesso', 'Grupo removido com sucesso!');
            } catch (error) {
              console.error('Erro ao remover grupo:', error);
              Alert.alert('Erro', 'Não foi possível remover o grupo');
            }
          }
        }
      ]
    );
  };

  const openWhatsappGroup = (link: string) => {
    Linking.openURL(link).catch(err => {
      console.error('Erro ao abrir link do WhatsApp:', err);
      Alert.alert('Erro', 'Não foi possível abrir o link do WhatsApp');
    });
  };

  if (loading) {
    return (
      <LoadingContainer>
        <ActivityIndicator size="large" color={colors.primary} />
      </LoadingContainer>
    );
  }

  return (
    <Container>
      <SectionHeader>
        <HeaderLeft>
          <MaterialCommunityIcons name="whatsapp" size={20} color={colors.success} />
          <SectionTitle colors={colors}>Grupos do WhatsApp</SectionTitle>
        </HeaderLeft>
        {isOrganizer && (
          <HeaderRight>
            <AddButton onPress={() => setShowAddForm(!showAddForm)}>
              {showAddForm ? (
                <Feather name="x" size={20} color={colors.text} />
              ) : (
                <Feather name="plus" size={20} color={colors.text} />
              )}
            </AddButton>
          </HeaderRight>
        )}
      </SectionHeader>

      {showAddForm && (
        <FormContainer>
          <FormGroup>
            <Label colors={colors}>Nome do grupo</Label>
            <TextInput
              mode="outlined"
              value={formData.group_name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, group_name: text }))}
              placeholder="Nome do grupo do WhatsApp"
              style={{
                backgroundColor: colors.backgroundDark,
              }}
              theme={{
                colors: {
                  primary: colors.primary,
                  text: colors.text,
                  placeholder: colors.gray300,
                  background: colors.backgroundDark,
                  surface: colors.backgroundDark,
                  onSurface: colors.text,
                  outline: colors.gray700,
                }
              }}
            />
          </FormGroup>

          <FormGroup>
            <Label colors={colors}>Link de convite</Label>
            <TextInput
              mode="outlined"
              value={formData.invite_link}
              onChangeText={(text) => setFormData(prev => ({ ...prev, invite_link: text }))}
              placeholder="https://chat.whatsapp.com/..."
              style={{
                backgroundColor: colors.backgroundDark,
              }}
              theme={{
                colors: {
                  primary: colors.primary,
                  text: colors.text,
                  placeholder: colors.gray300,
                  background: colors.backgroundDark,
                  surface: colors.backgroundDark,
                  onSurface: colors.text,
                  outline: colors.gray700,
                }
              }}
            />
          </FormGroup>

          <ButtonsContainer>
            <CancelButton colors={colors} onPress={() => setShowAddForm(false)}>
              <ButtonText colors={colors}>Cancelar</ButtonText>
            </CancelButton>
            <SaveButton colors={colors} disabled={submitting} onPress={handleAddGroup}>
              {submitting ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <ButtonText colors={colors} isWhite>Adicionar</ButtonText>
              )}
            </SaveButton>
          </ButtonsContainer>
        </FormContainer>
      )}

      {groupLinks.length === 0 ? (
        <EmptyContainer>
          <EmptyText colors={colors}>Nenhum grupo do WhatsApp vinculado</EmptyText>
        </EmptyContainer>
      ) : (
        <GroupsList>
          {groupLinks.map(group => (
            <GroupCard key={group.id} colors={colors}>
              <GroupInfo>
                <GroupName colors={colors}>{group.group_name}</GroupName>
                <GroupLink colors={colors}>{group.invite_link}</GroupLink>
              </GroupInfo>
              <GroupActions>
                <ActionButton onPress={() => openWhatsappGroup(group.invite_link)}>
                  <MaterialCommunityIcons name="open-in-new" size={20} color={colors.success} />
                </ActionButton>
                {isOrganizer && (
                  <ActionButton onPress={() => handleRemoveGroup(group.id)}>
                    <Feather name="trash-2" size={20} color={colors.red500} />
                  </ActionButton>
                )}
              </GroupActions>
            </GroupCard>
          ))}
        </GroupsList>
      )}
    </Container>
  );
}

const Container = styled.View`
  margin-top: 16px;
`;

const SectionHeader = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

const HeaderLeft = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 8px;
`;

const HeaderRight = styled.View`
  flex-direction: row;
  align-items: center;
`;

const SectionTitle = styled.Text<{ colors: any }>`
  color: ${props => props.colors.text};
  font-size: 16px;
  font-weight: bold;
`;

const AddButton = styled.TouchableOpacity`
  padding: 8px;
`;

const FormContainer = styled.View`
  background-color: ${props => props.theme.colors.gray800};
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
`;

const FormGroup = styled.View`
  margin-bottom: 16px;
`;

const Label = styled.Text<{ colors: any }>`
  color: ${props => props.colors.text};
  font-size: 14px;
  margin-bottom: 8px;
`;

const ButtonsContainer = styled.View`
  flex-direction: row;
  justify-content: flex-end;
  gap: 16px;
`;

const CancelButton = styled.TouchableOpacity<{ colors: any }>`
  background-color: ${props => props.colors.gray700};
  padding: 12px 16px;
  border-radius: 8px;
`;

const SaveButton = styled.TouchableOpacity<{ colors: any; disabled?: boolean }>`
  background-color: ${props => props.colors.success};
  padding: 12px 16px;
  border-radius: 8px;
  opacity: ${props => props.disabled ? 0.7 : 1};
`;

const ButtonText = styled.Text<{ colors: any; isWhite?: boolean }>`
  color: ${props => props.isWhite ? props.colors.white : props.colors.text};
  font-size: 14px;
  font-weight: bold;
`;

const LoadingContainer = styled.View`
  padding: 24px;
  align-items: center;
  justify-content: center;
`;

const EmptyContainer = styled.View`
  padding: 16px;
  align-items: center;
`;

const EmptyText = styled.Text<{ colors: any }>`
  color: ${props => props.colors.gray300};
  font-size: 14px;
`;

const GroupsList = styled.View`
  gap: 12px;
`;

const GroupCard = styled.View<{ colors: any }>`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background-color: ${props => props.colors.gray800};
  border-radius: 8px;
`;

const GroupInfo = styled.View`
  flex: 1;
`;

const GroupName = styled.Text<{ colors: any }>`
  color: ${props => props.colors.text};
  font-size: 16px;
  font-weight: bold;
`;

const GroupLink = styled.Text<{ colors: any }>`
  color: ${props => props.colors.gray300};
  font-size: 12px;
  margin-top: 4px;
`;

const GroupActions = styled.View`
  flex-direction: row;
  gap: 12px;
`;

const ActionButton = styled.TouchableOpacity`
  padding: 8px;
`;