import React, { useState } from 'react';
import { Alert } from 'react-native';
import styled from 'styled-components/native';
import { colors } from '@/styles/colors';
import { playerService } from '@/services/playerService';
import { Header } from '@/components/Header';
import { useRouter } from 'expo-router';
import { TextInput } from '@/components/TextInput';
import { Button } from '@/components/Button';

export default function NewPlayer() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        nickname: '',
        phone: ''
    });

    const handleSubmit = async () => {
        try {
            setLoading(true);

            if (!formData.name.trim()) {
                Alert.alert('Erro', 'O nome é obrigatório');
                return;
            }

            if (!formData.phone.trim()) {
                Alert.alert('Erro', 'O celular é obrigatório');
                return;
            }

            await playerService.create({
                name: formData.name.trim(),
                nickname: formData.nickname.trim(),
                phone: formData.phone.trim()
            });

            Alert.alert('Sucesso', 'Jogador criado com sucesso');
            router.back();
        } catch (error: any) {
            console.error('Erro ao criar jogador:', error);
            Alert.alert('Erro', error.message || 'Erro ao criar jogador');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container>
            <Header title="Novo Jogador" />

            <Content>
                <Form>
                    <TextInput
                        label="Nome"
                        placeholder="Digite o nome do jogador"
                        value={formData.name}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                    />

                    <TextInput
                        label="Apelido"
                        placeholder="Digite o apelido do jogador"
                        value={formData.nickname}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, nickname: text }))}
                    />

                    <TextInput
                        label="Celular"
                        placeholder="Digite o celular do jogador"
                        value={formData.phone}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
                        keyboardType="phone-pad"
                        maxLength={11}
                    />

                    <Button
                        title="Criar Jogador"
                        onPress={handleSubmit}
                        loading={loading}
                    />
                </Form>
            </Content>
        </Container>
    );
}

const Container = styled.View`
    flex: 1;
    background-color: ${colors.backgroundDark};
`;

const Content = styled.ScrollView`
    flex: 1;
    padding: 20px;
`;

const Form = styled.View`
    gap: 16px;
`;
